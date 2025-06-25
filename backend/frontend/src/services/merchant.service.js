import { api } from './api.service';

const MerchantService = {
  getMerchantList() {
    return api.get('/merchants/').then(response => response.data);
  },
  getMerchantDetail(id) {
    return api.get(`/merchants/${id}/`).then(response => response.data);
  },
  getMerchantAdminList() {
    // This assumes an endpoint for merchant admins to view their own merchants
    // You might need to adjust this endpoint based on your backend implementation
    return api.get('/merchants/my_merchants/').then(response => response.data);
  },
  createMerchant(data) {
    return api.post('/merchants/', data).then(response => response.data);
  },
  updateMerchant(id, data) {
    return api.put(`/merchants/${id}/`, data).then(response => response.data);
  },
  deleteMerchant(id) {
    return api.delete(`/merchants/${id}/`).then(response => response.data);
  },
  // Service management for merchants
  createService(merchantId, data) {
    return api.post(`/merchants/${merchantId}/services/`, data).then(response => response.data);
  },
  updateService(merchantId, serviceId, data) {
    return api.put(`/merchants/${merchantId}/services/${serviceId}/`, data).then(response => response.data);
  },
  deleteService(merchantId, serviceId) {
    return api.delete(`/merchants/${merchantId}/services/${serviceId}/`).then(response => response.data);
  }
};

export default MerchantService;
