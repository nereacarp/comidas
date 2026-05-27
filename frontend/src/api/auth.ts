import type { ApiClient } from './client';
import type { AuthResponse, UserProfile } from '../types';

export function createAuthApi(client: ApiClient) {
  return {
    register: (data: { email: string; password: string; name: string }) =>
      client.post<AuthResponse>('/auth/register', data),

    login: (data: { email: string; password: string }) =>
      client.post<AuthResponse>('/auth/login', data),

    getProfile: () => client.get<UserProfile>('/auth/profile'),

    updatePreferences: (data: { showCalories: boolean }) =>
      client.patch<{ user: UserProfile }>('/auth/preferences', data),

    deleteAccount: (data: { password: string }) =>
      client.delete<void>('/auth/account', data),
  };
}

