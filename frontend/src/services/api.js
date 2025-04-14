import { API_BASE_URL } from '../config';
console.log('API_BASE_URL:', API_BASE_URL);

// Helper function to get headers with authentication
const getHeaders = (includeAuth = true) => {
  const headers = {};

  if (includeAuth) {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      console.error('No authentication token found');
      throw new Error('No token provided');
    }
    headers['Authorization'] = `Bearer ${token}`;
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

    // Always add /api prefix to the endpoint
    const fullEndpoint = `/api${endpoint}`;
    console.log('Making request to:', `${API_BASE_URL}${fullEndpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${fullEndpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        // Clear token and redirect to login on unauthorized
        localStorage.removeItem('firebaseToken');
        window.location.href = '/login';
      }
      throw new Error(errorData.message || 'Something went wrong');
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