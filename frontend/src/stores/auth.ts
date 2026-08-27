import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '../api/client';
import type { UserAccount } from '../types/api';

const TOKEN_KEY = 'scoprevo_jwt';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const account = ref<UserAccount | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem(TOKEN_KEY, newToken);
  }

  function clearToken() {
    token.value = null;
    account.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  async function login(email: string, password: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await apiClient.auth.login({ email, password });
      setToken(response.token);
      account.value = response.account;
      return response;
    } catch (err: any) {
      error.value = err.message || 'Login failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(name: string, email: string, password: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await apiClient.auth.register({ name, email, password });
      setToken(response.token);
      account.value = response.account;
      return response;
    } catch (err: any) {
      error.value = err.message || 'Registration failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function logout() {
    clearToken();
  }

  return {
    token,
    account,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
  };
});
