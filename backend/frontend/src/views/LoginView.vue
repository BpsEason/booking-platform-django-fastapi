<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute(); // To get redirect query param

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    await authStore.login(username.value, password.value);
    const redirectPath = route.query.redirect || '/'; // Redirect to original path or home
    router.push(redirectPath);
  } catch (error) {
    console.error('Login error:', error);
    if (error.response && error.response.data && error.response.data.detail) {
      errorMessage.value = error.response.data.detail;
    } else {
      errorMessage.value = 'Invalid username or password. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-view col-md-6 offset-md-3">
    <h2 class="mb-4 text-center">Login</h2>
    <form @submit.prevent="handleLogin" class="p-4 border rounded shadow-sm bg-light">
      <div v-if="errorMessage" class="alert alert-danger" role="alert">
        {{ errorMessage }}
      </div>
      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input type="text" class="form-control" id="username" v-model="username" required>
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" class="form-control" id="password" v-model="password" required>
      </div>
      <button type="submit" class="btn btn-primary w-100" :disabled="isLoading">
        <span v-if="isLoading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        <span v-else>Login</span>
      </button>
      <p class="text-center mt-3">
        Don't have an account? <router-link to="/register">Register here</router-link>
      </p>
    </form>
  </div>
</template>

<style scoped>
.login-view {
  padding-top: 50px;
  padding-bottom: 50px;
}
</style>
