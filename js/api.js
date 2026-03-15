const API_URL = 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  
  // Add auth token if exists
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth API
const authAPI = {
  login: (username, password) => apiCall('/auth/login', {
    method: 'POST',
    body: { username, password }
  }),
  
  getMe: () => apiCall('/auth/me')
};

// Participant API
const participantAPI = {
  register: (data) => apiCall('/participants', {
    method: 'POST',
    body: data
  }),
  
  search: (query) => apiCall(`/participants/search?q=${query}`),
  
  getAll: (params = '') => apiCall(`/participants?${params}`),
  
  getStats: () => apiCall('/participants/stats'),
  
  updatePayment: (id, data) => apiCall(`/participants/${id}/payment`, {
    method: 'PUT',
    body: data
  }),
  
  delete: (id) => apiCall(`/participants/${id}`, {
    method: 'DELETE'
  })
};

// Race API
const raceAPI = {
  getInfo: () => apiCall('/races'),
  
  toggleRegistration: (id) => apiCall(`/races/${id}/toggle-registration`, {
    method: 'PUT'
  })
};

// Results API
const resultAPI = {
  getAll: (params = '') => apiCall(`/results?${params}`),
  
  create: (data) => apiCall('/results', {
    method: 'POST',
    body: data
  }),
  
  bulkUpload: (data) => apiCall('/results/bulk', {
    method: 'POST',
    body: { results: data }
  }),
  
  export: (category) => apiCall(`/results/export?category=${category || ''}`)
};