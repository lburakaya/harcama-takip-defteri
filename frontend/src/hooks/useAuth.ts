import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../api/auth.api';
import type { LoginDto, RegisterDto } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth, logout: clearAuth, updateUser } = useAuthStore();

  const login = useCallback(async (data: LoginDto) => {
    const response = await authApi.login(data);
    setAuth(response.user, response.accessToken);
    navigate('/dashboard');
  }, [setAuth, navigate]);

  const register = useCallback(async (data: RegisterDto) => {
    const response = await authApi.register(data);
    setAuth(response.user, response.accessToken);
    navigate('/dashboard');
  }, [setAuth, navigate]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  const updateProfile = useCallback(async (data: Parameters<typeof authApi.updateMe>[0]) => {
    const updatedUser = await authApi.updateMe(data);
    updateUser(updatedUser);
    return updatedUser;
  }, [updateUser]);

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };
}
