import { api } from './api.service';

const BookingService = {
  createBooking(data) {
    return api.post('/appointments/', data).then(response => response.data);
  },
  getMyBookings() {
    // For customers to view their own bookings
    return api.get('/appointments/my_appointments/').then(response => response.data);
  },
  getMerchantAppointments() {
    // For merchant admins to view appointments for their merchants
    return api.get('/appointments/merchant_appointments/').then(response => response.data);
  },
  updateAppointmentStatus(id, data) {
    // Allows merchant admin to change status
    return api.patch(`/appointments/${id}/`, data).then(response => response.data);
  },
  cancelBooking(id) {
    // Allows customer to cancel their own booking
    return api.post(`/appointments/${id}/cancel/`).then(response => response.data);
  },
  getAvailableSlots(merchantId, serviceId, startDate, endDate) {
    // This assumes an endpoint to get available slots for a given merchant and service
    // You might need to adjust query parameters based on your backend implementation
    return api.get(`/merchants/${merchantId}/services/${serviceId}/available_slots/`, {
      params: {
        start_date: startDate,
        end_date: endDate,
      }
    }).then(response => response.data);
  },
};

export default BookingService;
