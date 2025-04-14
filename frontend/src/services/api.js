const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper function to determine auth type
const getAuthType = (token) => {
    if (!token) return null;
    // Firebase tokens are longer and contain dots
    return token.includes('.') && token.split('.').length === 3 ? 'firebase' : 'jwt';
};

// Helper function to handle authentication errors
const handleAuthError = (error) => {
    console.error('Authentication error:', error);
    
    // Clear token on any auth error
    localStorage.removeItem('firebaseToken');
    
    // Redirect to login with error message
    const errorMessage = error.message || 'Authentication failed';
    window.location.href = `/login?error=${encodeURIComponent(errorMessage)}`;
    throw error;
};

// Helper function to get headers with authentication
const getHeaders = (includeAuth = true) => {
    const headers = {};

    if (includeAuth) {
        const token = localStorage.getItem('firebaseToken');
        if (!token) {
            console.error('No authentication token found');
            throw new Error('No token provided');
        }

        const authType = getAuthType(token);
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Auth-Type'] = authType;
    }

    return headers;
};

// Generic fetch function
const fetchData = async (endpoint, options = {}) => {
    try {
        // Don't set Content-Type for FormData, let the browser set it automatically
        const headers = {
            ...getHeaders(options.includeAuth !== false),
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...options.headers,
        };

        // Remove Content-Type if it's multipart/form-data as it needs the boundary
        if (headers['Content-Type'] === 'multipart/form-data') {
            delete headers['Content-Type'];
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            
            // Handle specific error cases
            if (response.status === 401) {
                if (errorData.message.includes('Token has expired')) {
                    handleAuthError(new Error('Your session has expired. Please log in again.'));
                } else if (errorData.message.includes('Invalid token')) {
                    handleAuthError(new Error('Invalid authentication. Please log in again.'));
                } else {
                    handleAuthError(new Error(errorData.message || 'Authentication failed'));
                }
            } else if (response.status === 403) {
                throw new Error('You do not have permission to perform this action');
            } else if (response.status === 404) {
                throw new Error('Resource not found');
            } else if (response.status >= 500) {
                throw new Error('Server error. Please try again later.');
            } else {
                throw new Error(errorData.message || 'Something went wrong');
            }
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Specific API methods
export const api = {
  // Auth
  login: (credentials) => 
    fetchData('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      includeAuth: false,
    }),

  register: (userData) => 
    fetchData('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      includeAuth: false,
    }),

  // User
  getUserProfile: () => 
    fetchData('/user/profile'),

  updateUserProfile: (userData) => 
    fetchData('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  // Interviews
  getInterviews: () => 
    fetchData('/interview'),

  getInterviewById: (id) => 
    fetchData(`/interview/${id}`),

  generateQuestion: (interviewId) =>
    fetchData(`/interview/${interviewId}/generate-question`, {
      method: 'POST'
    }),

  createInterview: async (formData) => {
    try {
      const response = await fetchData('/interview/start', {
        method: 'POST',
        body: formData
      });
      
      if (response.status !== 'success' || !response.data || !response.data.interviewId) {
        throw new Error('Invalid response from server');
      }
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  submitAnswer: async (interviewId, formData) => {
    return await fetchData(`/interview/${interviewId}/answer`, {
      method: 'POST',
      body: formData
    });
  },

  generateFollowUpQuestion: async (interviewId) => {
    return await fetchData(`/interview/${interviewId}/follow-up`, {
      method: 'POST'
    });
  },

  // Generic methods for custom endpoints
  get: (endpoint) => fetchData(endpoint),
  post: (endpoint, data, options = {}) => 
    fetchData(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options
    }),
  put: (endpoint, data) => 
    fetchData(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (endpoint) => 
    fetchData(endpoint, {
      method: 'DELETE',
    }),
}; 