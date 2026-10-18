import type { ApiClient } from './client';
import type { AuthResponse, RegistrationPendingResponse, UserInvitationInfo, UserProfile } from '../types';

export function createAuthApi(client: ApiClient) {
  return {
    register: (data: { email: string; password: string; name: string }) =>
      client.post<AuthResponse | RegistrationPendingResponse>('/auth/register', data),

    login: (data: { email: string; password: string }) =>
      client.post<AuthResponse>('/auth/login', data),

    logout: () => client.post<void>('/auth/logout'),

    getProfile: () => client.get<UserProfile>('/auth/profile'),

    updatePreferences: (data: { showCalories: boolean }) =>
      client.patch<{ user: UserProfile }>('/auth/preferences', data),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      client.post<void>('/auth/change-password', data),

    verifyEmail: (token: string) => client.post<void>('/auth/verify-email', { token }),

    resendVerification: (email: string) => client.post<void>('/auth/resend-verification', { email }),

    forgotPassword: (email: string) => client.post<void>('/auth/forgot-password', { email }),

    resetPassword: (token: string, newPassword: string) =>
      client.post<void>('/auth/reset-password', { token, newPassword }),

    inspectUserInvitation: (token: string) =>
      client.post<UserInvitationInfo>('/auth/user-invitation/inspect', { token }),

    acceptUserInvitation: (data: { token: string; name: string; password: string; acceptedTerms: true }) =>
      client.post<AuthResponse>('/auth/user-invitation/accept', data),

    exportData: () => client.get<unknown>('/auth/export'),

    deleteAccount: (data: { password: string }) =>
      client.delete<void>('/auth/account', data),
  };
}
