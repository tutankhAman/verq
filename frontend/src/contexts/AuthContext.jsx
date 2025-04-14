import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { isAuthenticated, login, register, logout, signInWithGoogle, signInWithGitHub } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug function to log auth state changes
  const logAuthState = (message, data = {}) => {
    console.log(`[AuthContext] ${message}`, {
      ...data,
      hasUser: !!user,
      hasToken: !!localStorage.getItem('firebaseToken'),
      loading,
      error: error?.message
    });
  };

  useEffect(() => {
    logAuthState('Initializing auth state listener');

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        logAuthState('Auth state changed', { firebaseUser: !!firebaseUser });

        if (firebaseUser) {
          logAuthState('Firebase user detected', { uid: firebaseUser.uid });
          
          try {
            const token = await firebaseUser.getIdToken();
            logAuthState('Got Firebase ID token', { tokenLength: token.length });
            localStorage.setItem('firebaseToken', token);
            
            const isAuth = await isAuthenticated();
            logAuthState('Authentication check result', { isAuth });
            
            if (isAuth) {
              setUser(firebaseUser);
              logAuthState('User authenticated successfully');
            } else {
              logAuthState('Authentication failed, clearing user');
              setUser(null);
              localStorage.removeItem('firebaseToken');
            }
          } catch (tokenError) {
            logAuthState('Error getting/verifying token', { error: tokenError.message });
            setError(tokenError);
            setUser(null);
            localStorage.removeItem('firebaseToken');
          }
        } else {
          logAuthState('No Firebase user, checking JWT');
          const token = localStorage.getItem('firebaseToken');
          
          if (token) {
            logAuthState('JWT token found', { tokenLength: token.length });
            try {
              const isAuth = await isAuthenticated();
              logAuthState('JWT authentication check result', { isAuth });
              
              if (isAuth) {
                setUser({ uid: 'jwt-user', email: 'jwt@user.com' });
                logAuthState('JWT user authenticated');
              } else {
                logAuthState('JWT authentication failed');
                setUser(null);
                localStorage.removeItem('firebaseToken');
              }
            } catch (jwtError) {
              logAuthState('Error verifying JWT', { error: jwtError.message });
              setError(jwtError);
              setUser(null);
              localStorage.removeItem('firebaseToken');
            }
          } else {
            logAuthState('No authentication tokens found');
            setUser(null);
          }
        }
      } catch (err) {
        logAuthState('Unexpected error in auth state change', { error: err.message });
        setError(err);
        setUser(null);
        localStorage.removeItem('firebaseToken');
      } finally {
        setLoading(false);
        logAuthState('Auth state update complete');
      }
    });

    return () => {
      logAuthState('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    login: async (email, password) => {
      logAuthState('Attempting login', { email });
      try {
        const result = await login(email, password);
        logAuthState('Login successful', { user: result });
        return result;
      } catch (err) {
        logAuthState('Login failed', { error: err.message });
        setError(err);
        throw err;
      }
    },
    register: async (displayName, email, password) => {
      logAuthState('Attempting registration', { email });
      try {
        const result = await register(displayName, email, password);
        logAuthState('Registration successful', { user: result });
        return result;
      } catch (err) {
        logAuthState('Registration failed', { error: err.message });
        setError(err);
        throw err;
      }
    },
    logout: async () => {
      logAuthState('Attempting logout');
      try {
        await logout();
        logAuthState('Logout successful');
        setUser(null);
      } catch (err) {
        logAuthState('Logout failed', { error: err.message });
        setError(err);
        throw err;
      }
    },
    signInWithGoogle: async () => {
      logAuthState('Attempting Google sign-in');
      try {
        const result = await signInWithGoogle();
        logAuthState('Google sign-in successful', { user: result });
        return result;
      } catch (err) {
        logAuthState('Google sign-in failed', { error: err.message });
        setError(err);
        throw err;
      }
    },
    signInWithGitHub: async () => {
      logAuthState('Attempting GitHub sign-in');
      try {
        const result = await signInWithGitHub();
        logAuthState('GitHub sign-in successful', { user: result });
        return result;
      } catch (err) {
        logAuthState('GitHub sign-in failed', { error: err.message });
        setError(err);
        throw err;
      }
    },
    isAuthenticated: async () => {
      logAuthState('Checking authentication status');
      try {
        const result = await isAuthenticated();
        logAuthState('Authentication check complete', { isAuthenticated: result });
        return result;
      } catch (err) {
        logAuthState('Authentication check failed', { error: err.message });
        setError(err);
        return false;
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 