/**
 * API Service
 * Axios-based HTTP client for ASTRAL_NOTES backend
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { apiConfig } from '@/config/api';

// Types for API responses
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Custom error class for API errors
export class ApiException extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ApiService {
  private instance: AxiosInstance;
  private refreshPromise: Promise<any> | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: apiConfig.baseURL,
      timeout: apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor for error handling and token refresh
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const token = this.getToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            this.handleAuthFailure();
            return Promise.reject(this.handleError(refreshError));
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  private removeToken(): void {
    localStorage.removeItem('authToken');
  }

  private async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.instance.post('/auth/refresh', {
      refreshToken: localStorage.getItem('refreshToken'),
    }).then((response) => {
      const { token, refreshToken } = response.data;
      this.setToken(token);
      localStorage.setItem('refreshToken', refreshToken);
      this.refreshPromise = null;
    }).catch((error) => {
      this.refreshPromise = null;
      throw error;
    });

    return this.refreshPromise;
  }

  private handleAuthFailure(): void {
    this.removeToken();
    localStorage.removeItem('refreshToken');
    // Redirect to login or dispatch logout action
    window.location.href = '/login';
  }

  private handleError(error: any): ApiException {
    try {
      if (error?.response) {
        const { status, statusText, data } = error.response;
        const serverMessage = data?.message || data?.error || statusText || 'Request failed';
        const code = data?.code || (status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : undefined);
        const details = data?.details;
        return new ApiException(serverMessage, status, code, details);
      }
      if (error?.request) {
        return new ApiException('Network error: unable to reach server', 0, 'NETWORK_ERROR');
      }
      return new ApiException(error?.message || 'Unknown client error', 0, 'UNKNOWN_ERROR');
    } catch (e) {
      return new ApiException('Unexpected error while handling request', 0, 'UNKNOWN_ERROR');
    }
  }

  // HTTP methods
  async get<T = any>(url: string, params?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.get(url, { params });
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(url, data, config);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.put(url, data, config);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.patch(url, data, config);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.instance.delete(url, config);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  // File upload
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    return this.post<T>(url, formData, config);
  }

  // Download file
  async download(url: string, filename?: string): Promise<Blob> {
    try {
      const response = await this.instance.get(url, {
        responseType: 'blob',
      });

      // Create download link if filename provided
      if (filename) {
        const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Set auth token
  setAuthToken(token: string, refreshToken?: string): void {
    this.setToken(token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  // Clear auth
  clearAuth(): void {
    this.removeToken();
    localStorage.removeItem('refreshToken');
  }

  // Get instance for advanced usage
  getInstance(): AxiosInstance {
    return this.instance;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }
}

// Export singleton instance
export const api = new ApiService();
export default api;
