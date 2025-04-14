import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GithubAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebase';
import { API_BASE_URL } from '../config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Updated to use environment variable

// Debug function to log auth service operations
const logAuthService = (operation, data = {}) => {
    console.log(`[AuthService] ${operation}`, {
        ...data,
        hasToken: !!localStorage.getItem('firebaseToken'),
        currentUser: auth.currentUser?.uid
    });
};

const saveUserToMongoDB = async (user) => {
    logAuthService('Saving user to MongoDB', { uid: user.uid });
    try {
        const token = await user.getIdToken();
        logAuthService('Got Firebase ID token for MongoDB save', { tokenLength: token.length });

        const response = await fetch(`${API_URL}/api/users/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }),
            credentials: 'include' // Include cookies if needed
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Network response was not ok' }));
            logAuthService('Failed to save user to MongoDB', { 
                status: response.status,
                error: errorData.message 
            });
            throw new Error(errorData.message || 'Failed to save user data');
        }

        const result = await response.json();
        logAuthService('Successfully saved user to MongoDB', { userId: result._id });
        return result;
    } catch (error) {
        logAuthService('Error in saveUserToMongoDB', { 
            error: error.message,
            stack: error.stack
        });
        if (error.message === 'Failed to fetch') {
            console.error('Backend server might not be running or accessible');
        }
        // Don't throw here, we still want to proceed with the sign-in
        return null;
    }
};

export const register = async (displayName, email, password) => {
    logAuthService('Starting registration', { email });
    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                displayName,
                email,
                password
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            logAuthService('Registration failed', { 
                status: response.status,
                error: errorData.message 
            });
            throw new Error(errorData.message || 'Registration failed');
        }

        const data = await response.json();
        if (data.token) {
            logAuthService('Registration successful, storing token');
            localStorage.setItem('firebaseToken', data.token);
            return data.data.user;
        } else {
            logAuthService('Registration response missing token');
            throw new Error('No token received from server');
        }
    } catch (error) {
        logAuthService('Registration error', { 
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Helper function to determine auth type
const getAuthType = (token) => {
    if (!token) {
        logAuthService('No token provided for auth type check');
        return null;
    }

    // Firebase tokens are typically longer than 1000 characters
    // JWT tokens are typically shorter and have a specific format
    if (token.length > 1000) {
        logAuthService('Token identified as Firebase (long length)', { tokenLength: token.length });
        return 'firebase';
    }

    // Check for JWT format (three parts separated by dots)
    const parts = token.split('.');
    if (parts.length === 3) {
        try {
            // Try to decode the JWT header
            const header = JSON.parse(atob(parts[0]));
            if (header.typ === 'JWT') {
                logAuthService('Token identified as JWT (valid format)', { tokenLength: token.length });
                return 'jwt';
            }
        } catch (e) {
            logAuthService('Error decoding JWT header', { error: e.message });
        }
    }

    logAuthService('Token type could not be determined', { tokenLength: token.length });
    return null;
};

// Update isAuthenticated to handle both JWT and Firebase authentication
export const isAuthenticated = async () => {
    logAuthService('Checking authentication status');
    const token = localStorage.getItem('firebaseToken');
    
    if (!token) {
        logAuthService('No token found in localStorage');
        return false;
    }
    
    const authType = getAuthType(token);
    
    if (authType === 'firebase') {
        logAuthService('Checking Firebase authentication');
        if (auth.currentUser) {
            try {
                await auth.currentUser.getIdToken(true);
                logAuthService('Firebase user authenticated');
                return true;
            } catch (error) {
                logAuthService('Firebase token validation failed', { 
                    error: error.message,
                    stack: error.stack
                });
                return false;
            }
        }
        logAuthService('No Firebase current user');
        return false;
    } else if (authType === 'jwt') {
        logAuthService('Checking JWT authentication', { hasToken: true });
        try {
            // Verify JWT token with backend
            const response = await fetch(`${API_URL}/api/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                logAuthService('JWT token validated successfully', { hasToken: true });
                
                // Fetch user details after successful authentication
                const userResponse = await fetch(`${API_URL}/api/users/me`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    logAuthService('User details fetched successfully', { 
                        userId: userData._id,
                        email: userData.email 
                    });
                    
                    // Store user details in localStorage
                    localStorage.setItem('user', JSON.stringify(userData));
                    return true;
                } else {
                    logAuthService('Failed to fetch user details', { 
                        status: userResponse.status,
                        statusText: userResponse.statusText
                    });
                    return false;
                }
            } else {
                logAuthService('JWT token validation failed', { 
                    status: response.status,
                    statusText: response.statusText,
                    hasToken: true
                });
                return false;
            }
        } catch (error) {
            logAuthService('Error verifying JWT token', { 
                error: error.message,
                stack: error.stack,
                hasToken: true
            });
            return false;
        }
    } else {
        logAuthService('Unknown token type, authentication failed', { hasToken: !!token });
        return false;
    }
};

// Add a helper function to get current user
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (error) {
            logAuthService('Error parsing user data from localStorage', { error: error.message });
            return null;
        }
    }
    return null;
};

// Update login function to handle JWT
export const login = async (email, password) => {
    logAuthService('Starting login', { email });
    try {
        console.log('Making login request to:', `${API_URL}/api/auth/login`);
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            logAuthService('Login failed', { 
                status: response.status,
                error: errorData.message 
            });
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();
        if (data.token) {
            logAuthService('Login successful, storing token');
            localStorage.setItem('firebaseToken', data.token);
            return data.data.user;
        } else {
            logAuthService('Login response missing token');
            throw new Error('No token received from server');
        }
    } catch (error) {
        logAuthService('Login error', { 
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

export const logout = async () => {
    logAuthService('Starting logout');
    try {
        await signOut(auth);
        localStorage.removeItem('firebaseToken');
        logAuthService('Logout successful');
    } catch (error) {
        logAuthService('Logout error', { 
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};

export const signInWithGoogle = async () => {
    logAuthService('Starting Google sign-in');
    try {
        console.log('Starting Google Sign-In...');
        const result = await signInWithPopup(auth, googleProvider);
        const { user } = result;
        logAuthService('Google sign-in successful', { uid: user.uid });
        
        // Store the Firebase ID token
        const token = await user.getIdToken();
        logAuthService('Got Firebase ID token', { tokenLength: token.length });
        
        // Store token in localStorage
        localStorage.setItem('firebaseToken', token);
        
        // Save user to MongoDB
        console.log('Making Google auth request to:', `${API_URL}/api/auth/google`);
        const response = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            logAuthService('Failed to save Google user to backend', { 
                status: response.status,
                error: errorData.message 
            });
            throw new Error(errorData.message || 'Failed to authenticate with backend');
        }

        const data = await response.json();
        logAuthService('Google sign-in complete', { userId: data._id });
        return data.data.user;
    } catch (error) {
        logAuthService('Google sign-in error', { 
            error: error.message,
            stack: error.stack
        });
        // Clear token on error
        localStorage.removeItem('firebaseToken');
        throw error;
    }
};

export const signInWithGitHub = async () => {
    logAuthService('Starting GitHub sign-in');
    try {
        const result = await signInWithPopup(auth, githubProvider);
        const { user } = result;
        logAuthService('GitHub sign-in successful', { uid: user.uid });
        
        // Get the Firebase ID token
        const token = await user.getIdToken();
        logAuthService('Got Firebase ID token', { tokenLength: token.length });
        
        // Store token in localStorage
        localStorage.setItem('firebaseToken', token);
        
        // Check if the user exists in our MongoDB database
        console.log('Making GitHub auth request to:', `${API_URL}/auth/github`);
        const response = await fetch(`${API_URL}/auth/github`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL,
                providerData: user.providerData
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            logAuthService('Failed to save GitHub user to backend', { 
                status: response.status,
                error: errorData.message 
            });
            if (errorData.message === 'Email already registered with different authentication method') {
                throw new Error('This email is already registered with a different authentication method. Please use the original method to sign in.');
            }
            throw new Error(errorData.message || 'Failed to authenticate with backend');
        }

        const data = await response.json();
        logAuthService('GitHub sign-in complete', { userId: data._id });
        return data.data.user;
    } catch (error) {
        logAuthService('GitHub sign-in error', { 
            error: error.message,
            stack: error.stack
        });
        if (error.code === 'auth/account-exists-with-different-credential') {
            throw new Error('This email is already registered with a different authentication method. Please use the original method to sign in.');
        }
        throw error;
    }
};

// Add a function to check and refresh the token if needed
export const checkAndRefreshToken = async () => {
    try {
        const currentUser = auth.currentUser;
        if (currentUser) {
            const token = await currentUser.getIdToken(true); // Force refresh
            localStorage.setItem('firebaseToken', token);
            return token;
        }
        return null;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
    }
}; 