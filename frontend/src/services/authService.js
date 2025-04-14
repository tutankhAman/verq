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

// Use the imported API_BASE_URL
const API_URL = API_BASE_URL;

const saveUserToMongoDB = async (user) => {
    try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/auth/firebase`, {
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
            throw new Error(errorData.message || 'Failed to save user data');
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving user to MongoDB:', error);
        if (error.message === 'Failed to fetch') {
            console.error('Backend server might not be running or accessible');
        }
        // Don't throw here, we still want to proceed with the sign-in
        return null;
    }
};

export const register = async (displayName, email, password) => {
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
            throw new Error(errorData.message || 'Registration failed');
        }

        const data = await response.json();
        if (data.token) {
            localStorage.setItem('firebaseToken', data.token);
            return data.data.user;
        } else {
            throw new Error('No token received from server');
        }
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

export const login = async (email, password) => {
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
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();
        if (data.token) {
            localStorage.setItem('firebaseToken', data.token);
            return data.data.user;
        } else {
            throw new Error('No token received from server');
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        localStorage.removeItem('firebaseToken');
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

export const signInWithGoogle = async () => {
    try {
        console.log('Starting Google Sign-In...');
        const result = await signInWithPopup(auth, googleProvider);
        const { user } = result;
        console.log('Firebase user:', user);
        
        // Get the Firebase ID token
        const token = await user.getIdToken();
        console.log('Firebase ID Token:', token);
        
        // Store token in localStorage
        localStorage.setItem('firebaseToken', token);
        console.log('Token stored in localStorage');
        
        // Verify token was stored
        const storedToken = localStorage.getItem('firebaseToken');
        console.log('Stored token verification:', storedToken ? 'Success' : 'Failed');
        
        console.log('Making Google auth request to:', `${API_URL}/auth/google`);
        const response = await fetch(`${API_URL}/auth/google`, {
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
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to authenticate with backend');
        }

        const data = await response.json();
        console.log('Backend response:', data);
        return data.data.user;
    } catch (error) {
        console.error('Google sign-in error:', error);
        // Clear token on error
        localStorage.removeItem('firebaseToken');
        throw error;
    }
};

export const signInWithGitHub = async () => {
    try {
        const result = await signInWithPopup(auth, githubProvider);
        const { user } = result;
        
        // Get the Firebase ID token
        const token = await user.getIdToken();
        
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
            if (errorData.message === 'Email already registered with different authentication method') {
                throw new Error('This email is already registered with a different authentication method. Please use the original method to sign in.');
            }
            throw new Error(errorData.message || 'Failed to authenticate with backend');
        }

        const data = await response.json();
        return data.data.user;
    } catch (error) {
        console.error('GitHub sign-in error:', error);
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

// Update isAuthenticated to check both token and current user
export const isAuthenticated = async () => {
    const token = localStorage.getItem('firebaseToken');
    const currentUser = auth.currentUser;
    
    if (!token || !currentUser) {
        return false;
    }
    
    // Verify token is still valid
    try {
        await currentUser.getIdToken(true);
        return true;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}; 