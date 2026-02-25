import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: RegisterData) => api.post('/auth/register/', data),
  login: (data: LoginData) => api.post('/auth/login/', data),
  logout: (refreshToken: string) => api.post('/auth/logout/', { refresh: refreshToken }),
  getMe: () => api.get('/auth/me/'),
  updateProfile: (data: ProfileUpdateData) => api.patch('/auth/profile/', data),
  changePassword: (data: PasswordChangeData) => api.post('/auth/password/change/', data),
  checkUsername: (username: string, userId?: number) => 
    api.get('/auth/check-username/', { params: { username, user_id: userId } }),
  checkEmail: (email: string, userId?: number) =>
    api.get('/auth/check-email/', { params: { email, user_id: userId } }),
  validateUsername: (username: string) =>
    api.post('/auth/validate-username/', { username }),
  forgotPassword: (email: string, frontendUrl?: string) =>
    api.post('/auth/password/forgot/', { email, frontend_url: frontendUrl || window.location.origin }),
  resetPassword: (uid: string, token: string, newPassword: string, confirmPassword: string) =>
    api.post('/auth/password/reset/', { uid, token, new_password: newPassword, confirm_password: confirmPassword }),
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/auth/upload-resume/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('profile_picture', file);
    return api.post('/auth/upload-profile-picture/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteProfilePicture: () => api.delete('/auth/delete-profile-picture/'),
  deleteAccount: () => api.delete('/auth/delete-account/'),
  
  // Google OAuth
  getGoogleAuthUrl: (redirectUri?: string) => 
    api.get('/auth/google/url/', { params: { redirect_uri: redirectUri || `${window.location.origin}/auth/google/callback` } }),
  googleCallback: (code: string, redirectUri?: string) =>
    api.post('/auth/google/callback/', { code, redirect_uri: redirectUri || `${window.location.origin}/auth/google/callback` }),
  completeGoogleProfile: (data: GoogleProfileData) =>
    api.post('/auth/google/complete-profile/', data),
};

// Jobs API
export const jobsApi = {
  list: (params?: JobListParams) => api.get('/jobs/', { params }),
  detail: (id: number) => api.get(`/jobs/${id}/`),
  create: (data: JobCreateData) => api.post('/jobs/create/', data),
  update: (id: number, data: Partial<JobCreateData>) => api.patch(`/jobs/${id}/update/`, data),
  delete: (id: number) => api.delete(`/jobs/${id}/delete/`),
  myJobs: () => api.get('/jobs/my-jobs/'),
};

// Applications API
export const applicationsApi = {
  apply: (jobId: number, data: ApplicationCreateData) => {
    const formData = new FormData();
    formData.append('cover_letter', data.cover_letter);
    if (data.resume) {
      formData.append('resume', data.resume);
    }
    if (data.use_profile_resume) {
      formData.append('use_profile_resume', 'true');
    }
    return api.post(`/applications/apply/${jobId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  myApplications: () => api.get('/applications/my/'),
  detail: (id: number) => api.get(`/applications/${id}/`),
  withdraw: (id: number) => api.delete(`/applications/${id}/withdraw/`),
  jobApplications: (jobId: number) => api.get(`/applications/job/${jobId}/`),
  updateStatus: (id: number, status: string) => 
    api.patch(`/applications/${id}/status/`, { status: status }),
};

// Admin API
export const adminApi = {
  getDashboardStats: () => api.get('/auth/admin/dashboard/'),
  getUsers: (params?: { user_type?: string; search?: string }) => 
    api.get('/auth/admin/users/', { params }),
  updateUser: (userId: number, data: { user_type?: string; is_active?: boolean; username?: string; email?: string }) =>
    api.patch(`/auth/admin/users/${userId}/`, data),
  deleteUser: (userId: number) => api.delete(`/auth/admin/users/${userId}/delete/`),
  getJobs: (params?: { search?: string }) => api.get('/auth/admin/jobs/', { params }),
  deleteJob: (jobId: number) => api.delete(`/auth/admin/jobs/${jobId}/delete/`),
};

// Types
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  user_type: 'job_seeker' | 'employer';
  phone?: string;
  location?: string;
  employer_role?: string;
  organization_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface GoogleProfileData {
  user_type?: 'job_seeker' | 'employer';
  phone?: string;
  location?: string;
  employer_role?: string;
  organization_name?: string;
}

export interface ProfileUpdateData {
  username?: string;
  phone?: string;
  location?: string;
  employer_role?: string;
  organization_name?: string;
  profile?: {
    skills?: string;
    portfolio_url?: string;
    company_website?: string;
    company_description?: string;
  };
}

export interface PasswordChangeData {
  old_password: string;
  new_password: string;
}

export interface JobListParams {
  q?: string;
  type?: string[];
  min_salary?: number;
  max_salary?: number;
  page?: number;
}

export interface JobCreateData {
  title: string;
  description: string;
  location: string;
  salary_range: string;
  job_type: string;
}

export interface ApplicationCreateData {
  cover_letter: string;
  resume?: File;
  use_profile_resume?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'job_seeker' | 'employer' | 'admin';
  phone: string;
  location: string;
  employer_role?: string;
  organization_name?: string;
  profile_complete: boolean;
  profile?: {
    id: number;
    resume?: string;
    skills?: string;
    portfolio_url?: string;
    company_website?: string;
    company_description?: string;
    profile_picture_url?: string;
  };
}

export interface Job {
  id: number;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  job_type: string;
  job_type_display: string;
  posted_at: string;
  posted_by?: User;
  posted_by_name?: string;
  organization_name?: string;
  applications_count?: number;
}

export interface Application {
  id: number;
  job: Job;
  applicant: User;
  cover_letter: string;
  resume?: string;
  status: string;
  status_display: string;
  applied_at: string;
}

export default api;
