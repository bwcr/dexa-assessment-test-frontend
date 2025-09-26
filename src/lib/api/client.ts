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

  private getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
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

      // biome-ignore lint/suspicious/noImplicitAnyLet: acceptable here
      let data;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          status: response.status,
          error: data?.message || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        status: 500,
        error: error instanceof Error ? error.message : 'Network error',
      };
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }

    return result;
  }

  async refreshToken(): Promise<
    ApiResponse<{ token: string; refreshToken: string; tokenExpires: number }>
  > {
    const refreshToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;

    if (!refreshToken) {
      return { status: 401, error: 'No refresh token available' };
    }

    return this.request<{
      token: string;
      refreshToken: string;
      tokenExpires: number;
    }>('/auth/refresh', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
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
