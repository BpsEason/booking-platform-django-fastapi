<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import UserService from '@/services/user.service';

const authStore = useAuthStore();
const currentUser = computed(() => authStore.user);

const profileData = ref({
  full_name: '',
  email: '',
});

const passwordChangeData = ref({
  old_password: '',
  new_password: '',
  new_password2: '',
});

const errorMessage = ref('');
const successMessage = ref('');
const isLoadingProfile = ref(true);
const isLoadingPasswordChange = ref(false);

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const fetchProfile = async () => {
  isLoadingProfile.value = true;
  clearMessages();
  try {
    const data = await UserService.getProfile();
    profileData.value.full_name = data.full_name;
    profileData.value.email = data.email;
  } catch (err) {
    console.error("Error fetching profile:", err);
    errorMessage.value = "Failed to load profile.";
  } finally {
    isLoadingProfile.value = false;
  }
};

const updateProfile = async () => {
  clearMessages();
  try {
    await UserService.updateProfile(profileData.value);
    successMessage.value = "Profile updated successfully!";
    // Optionally update the user in the auth store if the name changed
    authStore.decodeAndSetUser(authStore.accessToken); // Re-decode JWT to update user info
  } catch (err) {
    console.error("Error updating profile:", err);
    errorMessage.value = "Failed to update profile.";
  }
};

const changePassword = async () => {
  clearMessages();
  isLoadingPasswordChange.value = true;

  if (passwordChangeData.value.new_password !== passwordChangeData.value.new_password2) {
    errorMessage.value = 'New passwords do not match.';
    isLoadingPasswordChange.value = false;
    return;
  }

  try {
    await UserService.changePassword({
      old_password: passwordChangeData.value.old_password,
      new_password: passwordChangeData.value.new_password,
    });
    successMessage.value = "Password changed successfully! Please log in again with your new password.";
    authStore.logout(); // Force re-login after password change for security
  } catch (err) {
    console.error("Error changing password:", err);
    if (err.response && err.response.data && err.response.data.detail) {
      errorMessage.value = err.response.data.detail;
    } else if (err.response && err.response.data.old_password) {
      errorMessage.value = `Old password: ${err.response.data.old_password.join(', ')}`;
    } else if (err.response && err.response.data.new_password) {
      errorMessage.value = `New password: ${err.response.data.new_password.join(', ')}`;
    }
    else {
      errorMessage.value = "Failed to change password.";
    }
  } finally {
    isLoadingPasswordChange.value = false;
    // Clear password fields regardless of success/failure
    passwordChangeData.value = { old_password: '', new_password: '', new_password2: '' };
  }
};

onMounted(fetchProfile);
</script>

<template>
  <div class="profile-view col-md-8 offset-md-2">
    <h2 class="mb-4">User Profile</h2>

    <div v-if="isLoadingProfile" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading profile...</p>
    </div>

    <div v-else class="card p-4 shadow-sm">
      <h3 class="mb-3">Account Information</h3>

      <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
      <div v-if="successMessage" class="alert alert-success" role="alert">{{ successMessage }}</div>

      <form @submit.prevent="updateProfile">
        <div class="mb-3">
          <label for="username" class="form-label">Username:</label>
          <input type="text" class="form-control" id="username" :value="currentUser?.username" disabled>
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">Email:</label>
          <input type="email" class="form-control" id="email" v-model="profileData.email" required>
        </div>
        <div class="mb-3">
          <label for="fullName" class="form-label">Full Name:</label>
          <input type="text" class="form-control" id="fullName" v-model="profileData.full_name">
        </div>
        <button type="submit" class="btn btn-primary">Update Profile</button>
      </form>

      <hr class="my-4">

      <h3 class="mb-3">Change Password</h3>
      <form @submit.prevent="changePassword">
        <div class="mb-3">
          <label for="oldPassword" class="form-label">Old Password</label>
          <input type="password" class="form-control" id="oldPassword" v-model="passwordChangeData.old_password" required>
        </div>
        <div class="mb-3">
          <label for="newPassword" class="form-label">New Password</label>
          <input type="password" class="form-control" id="newPassword" v-model="passwordChangeData.new_password" required>
        </div>
        <div class="mb-3">
          <label for="confirmNewPassword" class="form-label">Confirm New Password</label>
          <input type="password" class="form-control" id="confirmNewPassword" v-model="passwordChangeData.new_password2" required>
        </div>
        <button type="submit" class="btn btn-warning" :disabled="isLoadingPasswordChange">
          <span v-if="isLoadingPasswordChange" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          <span v-else>Change Password</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  padding-bottom: 30px;
}
</style>
