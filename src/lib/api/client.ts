/** biome-ignore-all lint/suspicious/useAwait: use class approach */
import { format } from 'date-fns';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: User;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  position?: string;
  photo?: {
    id: string;
    path: string;
  };
  role: {
    id: number;
    name: string;
  };
  status: {
    id: number;
    name: string;
  };
}

interface Attendance {
  id: number;
  userId: number;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'in' | 'out' | null;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceSummary {
  id: number;
  userId: number;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: 'in' | 'out' | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

class ApiClient {
  private baseURL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: () => void;
    reject: (reason?: Error) => void;
  }> = [];

  private getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('refreshToken');
  }

  private getTokenExpiration(): number | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const expires = localStorage.getItem('tokenExpires');
    return expires ? Number.parseInt(expires, 10) : null;
  }

  private isTokenExpired(): boolean {
    const expiration = this.getTokenExpiration();
    if (!expiration) {
      return false;
    }

    // Check if token expires within the next 5 minutes (300000ms)
    return Date.now() >= expiration - 300000;
  }

  private setTokens(
    token: string,
    refreshToken: string,
    tokenExpires: number,
  ): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('tokenExpires', tokenExpires.toString());
  }

  private clearTokens(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpires');
    localStorage.removeItem('user');
  }

  private processQueue(error: Error | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });

    this.failedQueue = [];
  }

  private async handleResponseData(response: Response) {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  private async handleUnauthorizedResponse<T>(
    endpoint: string,
    options: RequestInit,
  ): Promise<ApiResponse<T>> {
    try {
      await this.handleTokenRefresh();
      // Retry the original request with new token
      return this.request<T>(endpoint, options, true);
    } catch {
      // If refresh fails, clear tokens and return 401
      this.clearTokens();
      return {
        status: 401,
        error: 'Authentication failed. Please log in again.',
      };
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<ApiResponse<T>> {
    // Check if token is expired and refresh proactively
    if (!isRetry && this.isTokenExpired() && endpoint !== '/auth/refresh') {
      try {
        await this.handleTokenRefresh();
      } catch {
        // Ignore proactive refresh failures, let the request proceed
      }
    }

    const token = this.getToken();
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await this.handleResponseData(response);

      // Handle 401 errors with automatic token refresh and retry
      if (response.status === 401 && !isRetry && endpoint !== '/auth/refresh') {
        return this.handleUnauthorizedResponse<T>(endpoint, options);
      }

      if (!response.ok) {
        return {
          status: response.status,
          error: data?.message || `HTTP error! status: ${response.status}`,
        };
      }

      return { data, status: response.status };
    } catch (error) {
      return {
        status: 500,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async handleTokenRefresh(): Promise<void> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    if (this.isRefreshing) {
      // If already refreshing, wait for the current refresh to complete
      return new Promise<void>((resolve, reject) => {
        this.failedQueue.push({
          resolve: () => resolve(),
          reject,
        });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Refresh failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.token && data.refreshToken && data.tokenExpires) {
        this.setTokens(data.token, data.refreshToken, data.tokenExpires);
        this.processQueue(null);
      } else {
        throw new Error('Invalid refresh response format');
      }
    } catch (error) {
      const refreshError =
        error instanceof Error ? error : new Error('Unknown refresh error');
      this.processQueue(refreshError);
      throw refreshError;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Authentication methods
  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/email/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    const result = await this.request<void>('/auth/logout', {
      method: 'POST',
    });

    // Clear local storage regardless of response
    this.clearTokens();

    return result;
  }

  async refreshToken(): Promise<
    ApiResponse<{ token: string; refreshToken: string; tokenExpires: number }>
  > {
    try {
      await this.handleTokenRefresh();

      // Return the stored tokens after successful refresh
      const token = this.getToken();
      const refreshToken = this.getRefreshToken();
      const tokenExpires = this.getTokenExpiration();

      if (token && refreshToken && tokenExpires) {
        return {
          status: 200,
          data: { token, refreshToken, tokenExpires },
        };
      }

      return { status: 401, error: 'Failed to refresh tokens' };
    } catch (error) {
      return {
        status: 401,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  // Profile methods
  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile/me');
  }

  // File upload method
  async uploadFile(
    file: File,
  ): Promise<ApiResponse<{ file: { id: string; path: string } }>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken();
    return this.request<{ file: { id: string; path: string } }>(
      '/files/upload',
      {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData, but preserve Authorization
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      },
    );
  }

  async updateProfile(data: {
    phone?: string;
    password?: string;
    photo?: File;
  }): Promise<ApiResponse<User>> {
    let photoFileDto: { id: string } | undefined;

    // First, upload the photo if provided
    if (data.photo) {
      const uploadResponse = await this.uploadFile(data.photo);
      if (uploadResponse.error) {
        return {
          status: uploadResponse.status,
          error: uploadResponse.error,
        };
      }
      if (uploadResponse.data?.file?.id) {
        photoFileDto = { id: uploadResponse.data.file.id };
      }
    }

    // Now update the profile with all data
    const updateData: {
      phone?: string;
      password?: string;
      photo?: { id: string };
    } = {};

    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }
    if (data.password !== undefined) {
      updateData.password = data.password;
    }
    if (photoFileDto) {
      updateData.photo = photoFileDto;
    }

    return this.request<User>('/users/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  // Attendance methods
  async checkIn(): Promise<ApiResponse<Attendance>> {
    return this.request<Attendance>('/attendances/check-in', {
      method: 'POST',
    });
  }

  async checkOut(): Promise<ApiResponse<Attendance>> {
    return this.request<Attendance>('/attendances/check-out', {
      method: 'POST',
    });
  }

  async getAttendanceSummary(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ApiResponse<Array<AttendanceSummary>>> {
    const params = new URLSearchParams();
    if (dateFrom) {
      params.append('dateFrom', dateFrom);
    }
    if (dateTo) {
      params.append('dateTo', dateTo);
    }

    const queryString = params.toString();
    const endpoint = `/attendances/my-summary${queryString ? `?${queryString}` : ''}`;

    return this.request<Array<AttendanceSummary>>(endpoint);
  }

  async getTodayAttendance(): Promise<ApiResponse<Attendance | null>> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const result = await this.getAttendanceSummary(today, today);

    if (result.error) {
      return { status: result.status, error: result.error };
    }

    // The backend returns AttendanceSummary which matches Attendance structure
    return {
      data: result.data?.[0]
        ? {
            id: result.data[0].id,
            userId: result.data[0].userId,
            date: result.data[0].date,
            checkInTime: result.data[0].checkInTime,
            checkOutTime: result.data[0].checkOutTime,
            status: result.data[0].status,
            createdAt: result.data[0].createdAt,
            updatedAt: result.data[0].updatedAt,
          }
        : null,
      status: result.status,
    };
  }
}

export const apiClient = new ApiClient();
export type { User, Attendance, AttendanceSummary, LoginResponse };
