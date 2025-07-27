import axios, { AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
};

// Initialize token from localStorage on client side
if (typeof window !== 'undefined') {
  const savedToken = localStorage.getItem('auth_token');
  if (savedToken) {
    setAuthToken(savedToken);
  }
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      setAuthToken(null);
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// Generic API method
const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  config?: any
): Promise<T> => {
  try {
    const response = await apiClient.request({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.message);
    }
    throw error;
  }
};

// API methods
export const api = {
  // Auth endpoints
  auth: {
    register: (data: any) => apiRequest<ApiResponse<any>>('POST', '/api/auth/register', data),
    login: (data: any) => apiRequest<ApiResponse<any>>('POST', '/api/auth/login', data),
    logout: () => apiRequest<ApiResponse<any>>('POST', '/api/auth/logout'),
    getProfile: () => apiRequest<ApiResponse<any>>('GET', '/api/auth/me'),
    updateProfile: (data: any) => apiRequest<ApiResponse<any>>('PUT', '/api/auth/me', data),
    changePassword: (data: any) => apiRequest<ApiResponse<any>>('POST', '/api/auth/change-password', data),
  },

  // Course endpoints
  courses: {
    getAll: (params?: any) => apiRequest<any>('GET', '/api/courses', null, { params }),
    getById: (id: string) => apiRequest<any>('GET', `/api/courses/${id}`),
    getFeatured: () => apiRequest<any>('GET', '/api/courses/featured'),
    getRecommendations: () => apiRequest<any>('GET', '/api/courses/recommendations'),
    enroll: (id: string) => apiRequest<any>('POST', `/api/courses/${id}/enroll`),
    updateProgress: (id: string, data: any) => apiRequest<any>('PATCH', `/api/courses/${id}/progress`, data),
    addReview: (id: string, data: any) => apiRequest<any>('POST', `/api/courses/${id}/review`, data),
    getCategories: () => apiRequest<any>('GET', '/api/courses/meta/categories'),
  },

  // Quiz endpoints
  quizzes: {
    getAll: (params?: any) => apiRequest<any>('GET', '/api/quizzes', null, { params }),
    getById: (id: string) => apiRequest<any>('GET', `/api/quizzes/${id}`),
    generate: (data: any) => apiRequest<any>('POST', '/api/quizzes/generate', data),
    submit: (id: string, data: any) => apiRequest<any>('POST', `/api/quizzes/${id}/submit`, data),
    getResults: (id: string, attemptIndex?: number) => 
      apiRequest<any>('GET', `/api/quizzes/${id}/results${attemptIndex !== undefined ? `/${attemptIndex}` : ''}`),
    getSubjects: () => apiRequest<any>('GET', '/api/quizzes/meta/subjects'),
  },

  // Research endpoints
  research: {
    analyze: (data: any) => apiRequest<any>('POST', '/api/research/analyze', data),
    getHistory: (params?: any) => apiRequest<any>('GET', '/api/research/history', null, { params }),
    getById: (id: string) => apiRequest<any>('GET', `/api/research/${id}`),
    delete: (id: string) => apiRequest<any>('DELETE', `/api/research/${id}`),
    updateVisibility: (id: string, data: any) => apiRequest<any>('PATCH', `/api/research/${id}/visibility`, data),
  },

  // Performance endpoints
  performance: {
    getDashboard: () => apiRequest<any>('GET', '/api/performance/dashboard'),
    getProgress: (params?: any) => apiRequest<any>('GET', '/api/performance/progress', null, { params }),
    getAchievements: () => apiRequest<any>('GET', '/api/performance/achievements'),
    getComparison: () => apiRequest<any>('GET', '/api/performance/comparison'),
  },

  // Mentor endpoints
  mentors: {
    getRecommendations: (params?: any) => apiRequest<any>('GET', '/api/mentors/recommendations', null, { params }),
    search: (params?: any) => apiRequest<any>('GET', '/api/mentors/search', null, { params }),
    getProfile: (id: string) => apiRequest<any>('GET', `/api/mentors/${id}/profile`),
    contact: (id: string, data: any) => apiRequest<any>('POST', `/api/mentors/${id}/contact`, data),
    getSubjects: () => apiRequest<any>('GET', '/api/mentors/meta/subjects'),
  },

  // Profile endpoints
  profiles: {
    getById: (id: string) => apiRequest<any>('GET', `/api/profiles/${id}`),
    update: (data: any) => apiRequest<any>('PUT', '/api/profiles/me', data),
    uploadAvatar: (data: any) => apiRequest<any>('POST', '/api/profiles/me/avatar', data),
    addExpertise: (data: any) => apiRequest<any>('POST', '/api/profiles/me/expertise', data),
    removeExpertise: (subject: string) => apiRequest<any>('DELETE', `/api/profiles/me/expertise/${subject}`),
    getSuggestions: () => apiRequest<any>('GET', '/api/profiles/suggestions'),
    search: (params?: any) => apiRequest<any>('GET', '/api/profiles/search', null, { params }),
  },
};

export { apiClient };
export default api;
