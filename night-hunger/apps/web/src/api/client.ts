import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '../store';
import { getApiErrorMessage } from './error';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT_MS = Number.parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '10000', 10);

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshSubscriber {
  onSuccess: (token: string) => void;
  onFailure: (error: Error) => void;
}

class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: RefreshSubscriber[] = [];

  constructor() {
    this.instance = axios.create({
      baseURL: API_URL,
      timeout: API_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useUserStore.getState().accessToken;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401 and refresh token
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<{ message?: string }>) => {
        const originalRequest = error.config as RetriableRequestConfig;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.refreshSubscribers.push({
                onSuccess: (token: string) => {
                  if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                  }
                  resolve(this.instance(originalRequest));
                },
                onFailure: (refreshError: Error) => {
                  reject(refreshError);
                },
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = useUserStore.getState().refreshToken;
            if (!refreshToken) {
              throw new Error('Сессия истекла. Войдите снова.');
            }

            const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { timeout: API_TIMEOUT_MS });

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            useUserStore.getState().setTokens(accessToken, newRefreshToken);

            this.isRefreshing = false;
            this.refreshSubscribers.forEach((subscriber) => subscriber.onSuccess(accessToken));
            this.refreshSubscribers = [];

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.instance(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            const normalizedError = new Error(
              getApiErrorMessage(refreshError, 'Сессия истекла. Войдите снова.'),
            );
            this.refreshSubscribers.forEach((subscriber) => subscriber.onFailure(normalizedError));
            this.refreshSubscribers = [];
            useUserStore.getState().logout();
            return Promise.reject(normalizedError);
          }
        }

        return Promise.reject(new Error(getApiErrorMessage(error)));
      }
    );
  }

  getInstance(): AxiosInstance {
    return this.instance;
  }
}

export const apiClient = new ApiClient();
export default apiClient.getInstance();
