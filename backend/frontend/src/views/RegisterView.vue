<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const formData = ref({
  username: '',
  email: '',
  password: '',
  password2: '', // Confirmation password
  full_name: '',
  user_type: 'customer', // Default to customer
});

const errorMessage = ref('');
const isLoading = ref(false);

const handleRegister = async () => {
  errorMessage.value = '';
  isLoading.value = true;

  if (formData.value.password !== formData.value.password2) {
    errorMessage.value = 'Passwords do not match.';
    isLoading.value = false;
    return;
  }

  try {
    // Extract relevant data for registration API
    const registrationData = {
      username: formData.value.username,
      email: formData.value.email,
      password: formData.value.password,
      password2: formData.value.password2,
      full_name: formData.value.full_name,
      user_type: formData.value.user_type,
    };
    
    await authStore.register(registrationData);
    alert('Registration successful! Please login.');
    router.push({ name: 'login' });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.response && error.response.data) {
      // Handle Django REST Framework validation errors
      const errors = error.response.data;
      let errorMessages = [];
      for (const key in errors) {
        if (Array.isArray(errors[key])) {
          errorMessages.push(`${key}: ${errors[key].join(', ')}`);
        } else {
          errorMessages.push(`${key}: ${errors[key]}`);
        }
      }
      errorMessage.value = errorMessages.join('\n');
    } else {
      errorMessage.value = 'An unexpected error occurred during registration.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="register-view col-md-6 offset-md-3">
    <h2 class="mb-4 text-center">Register</h2>
    <form @submit.prevent="handleRegister" class="p-4 border rounded shadow-sm bg-light">
      <div v-if="errorMessage" class="alert alert-danger" role="alert">
        {{ errorMessage }}
      </div>

      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input type="text" class="form-control" id="username" v-model="formData.username" required>
      </div>

      <div class="mb-3">
        <label for="email" class="form-label">Email address</label>
        <input type="email" class="form-control" id="email" v-model="formData.email" required>
      </div>

      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" class="form-control" id="password" v-model="formData.password" required>
      </div>

      <div class="mb-3">
        <label for="password2" class="form-label">Confirm Password</label>
        <input type="password" class="form-control" id="password2" v-model="formData.password2" required>
      </div>

      <div class="mb-3">
        <label for="fullName" class="form-label">Full Name (Optional)</label>
        <input type="text" class="form-control" id="fullName" v-model="formData.full_name">
      </div>

      <div class="mb-3">
        <label for="userType" class="form-label">Register as:</label>
        <select class="form-select" id="userType" v-model="formData.user_type">
          <option value="customer">Customer</option>
          <option value="merchant_admin">Merchant Admin</option>
        </select>
      </div>

      <button type="submit" class="btn btn-primary w-100" :disabled="isLoading">
        <span v-if="isLoading" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        <span v-else>Register</span>
      </button>

      <p class="text-center mt-3">
        Already have an account? <router-link to="/login">Login here</router-link>
      </p>
    </form>
  </div>
</template>

<style scoped>
.register-view {
  padding-top: 50px;
  padding-bottom: 50px;
}
</style>
