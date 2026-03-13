import { client } from './client';
import type { LoginDto, RegisterDto, AuthResponse, User } from '../types';

export const login = (data: LoginDto): Promise<AuthResponse> =>
  client.post('/auth/login', data).then((r) => r.data);

export const register = (data: RegisterDto): Promise<AuthResponse> =>
  client.post('/auth/register', data).then((r) => r.data);

export const refreshToken = (): Promise<{ accessToken: string }> =>
  client.post('/auth/refresh').then((r) => r.data);

export const logout = (): Promise<void> =>
  client.post('/auth/logout').then((r) => r.data);

export const forgotPassword = (email: string): Promise<{ message: string }> =>
  client.post('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (token: string, password: string): Promise<{ message: string }> =>
  client.post('/auth/reset-password', { token, password }).then((r) => r.data);

export const getMe = (): Promise<User> =>
  client.get('/users/me').then((r) => r.data);

export const updateMe = (data: Partial<User & { password?: string }>): Promise<User> =>
  client.patch('/users/me', data).then((r) => r.data);

export const deleteMe = (): Promise<void> =>
  client.delete('/users/me').then((r) => r.data);
