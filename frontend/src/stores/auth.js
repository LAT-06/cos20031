import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";
import { useRouter } from "vue-router";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const token = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === "admin");
  const isRecorder = computed(
    () => user.value?.role === "recorder" || user.value?.role === "admin"
  );
  const isArcher = computed(() => !!user.value);

  // Initialize auth state from localStorage
  function initializeAuth() {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      token.value = storedToken;
      user.value = JSON.parse(storedUser);
    }
  }

  // Login
  async function login(credentials) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post("/auth/login", credentials);

      token.value = response.data.token;
      user.value = response.data.user;

      // Store in localStorage
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      return response.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Signup
  async function signup(userData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post("/auth/signup", userData);

      token.value = response.data.token;
      user.value = response.data.user;

      // Store in localStorage
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      return response.data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Logout
  function logout() {
    token.value = null;
    user.value = null;

    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }

  // Get current user
  async function fetchCurrentUser() {
    try {
      const response = await api.get("/auth/me");
      user.value = response.data.user;
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response.data.user;
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isRecorder,
    isArcher,
    initializeAuth,
    login,
    signup,
    logout,
    fetchCurrentUser,
  };
});
