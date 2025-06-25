import { api } from './api.service';

const UserService = {
  getProfile() {
    return api.get('/users/profile/').then(response => response.data);
  },
  updateProfile(data) {
    return api.put('/users/profile/', data).then(response => response.data);
  },
  changePassword(data) {
    return api.post('/users/change-password/', data).then(response => response.data);
  }
};

export default UserService;
