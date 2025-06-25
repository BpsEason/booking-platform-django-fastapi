<script setup>
import { ref, onMounted } from 'vue';
import BookingService from '@/services/booking.service';

const myBookings = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchMyBookings = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const data = await BookingService.getMyBookings();
    // Sort by appointment date and time, most recent first
    myBookings.value = data.sort((a, b) => {
      const dateTimeA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateTimeB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return dateTimeB - dateTimeA;
    });
  } catch (err) {
    console.error("Error fetching my bookings:", err);
    error.value = "Failed to load your bookings.";
  } finally {
    isLoading.value = false;
  }
};

const cancelBooking = async (bookingId) => {
  if (confirm("Are you sure you want to cancel this booking? This cannot be undone.")) {
    try {
      await BookingService.cancelBooking(bookingId);
      alert("Booking cancelled successfully!");
      fetchMyBookings(); // Refresh the list
    } catch (err) {
      console.error("Error cancelling booking:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        alert("Failed to cancel booking: " + err.response.data.detail);
      } else {
        alert("Failed to cancel booking.");
      }
    }
  }
};

onMounted(fetchMyBookings);
</script>

<template>
  <div class="my-bookings-view col-md-10 offset-md-1">
    <h2 class="mb-4 text-center">My Bookings</h2>

    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading your bookings...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <div v-else-if="myBookings.length > 0">
      <div class="card mb-3 shadow-sm" v-for="booking in myBookings" :key="booking.id">
        <div class="card-body">
          <h5 class="card-title">{{ booking.merchant_info?.name }} - {{ booking.service_info?.name }}</h5>
          <p class="card-text">
            <i class="bi bi-calendar"></i>
            {{ new Date(booking.appointment_date).toLocaleDateString() }}
            at
            <i class="bi bi-clock"></i>
            {{ booking.appointment_time }}
          </p>
          <p class="card-text">
            <span :class="['badge', {
              'bg-warning text-dark': booking.status === 'pending',
              'bg-success': booking.status === 'confirmed' || booking.status === 'completed',
              'bg-danger': booking.status === 'cancelled' || booking.status === 'no_show'
            }]">Status: {{ booking.status }}</span>
          </p>
          <p v-if="booking.notes" class="card-text text-muted">Notes: {{ booking.notes }}</p>
          <p class="card-text text-muted">Booked On: {{ new Date(booking.created_at).toLocaleString() }}</p>

          <button v-if="booking.status === 'pending' || booking.status === 'confirmed'"
                  @click="cancelBooking(booking.id)" class="btn btn-danger btn-sm mt-2">
            Cancel Booking
          </button>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-info text-center" role="alert">
      You have no active bookings. Start by exploring our <router-link to="/merchants">merchants</router-link>!
    </div>
  </div>
</template>

<style scoped>
.my-bookings-view {
  padding-bottom: 30px;
}
.badge {
  text-transform: capitalize;
}
</style>
