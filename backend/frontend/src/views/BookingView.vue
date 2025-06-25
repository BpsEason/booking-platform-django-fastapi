<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MerchantService from '@/services/merchant.service';
import BookingService from '@/services/booking.service';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  merchantId: {
    type: [String, Number],
    required: true
  },
  serviceId: {
    type: [String, Number],
    required: true
  }
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const merchant = ref(null);
const service = ref(null);
const selectedDate = ref('');
const selectedTime = ref('');
const notes = ref('');
const availableSlots = ref([]);
const isLoading = ref(true);
const isBooking = ref(false);
const error = ref(null);
const bookingSuccess = ref(false);

const today = new Date().toISOString().split('T')[0];
const minDate = today;
const maxDate = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]; // Up to 3 months in advance

const fetchMerchantAndService = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const merchantData = await MerchantService.getMerchantDetail(props.merchantId);
    merchant.value = merchantData;
    service.value = merchantData.services.find(s => s.id == props.serviceId);

    if (!service.value) {
      error.value = "Service not found for this merchant.";
    }
  } catch (err) {
    console.error("Error fetching merchant or service:", err);
    error.value = "Failed to load merchant or service details.";
  } finally {
    isLoading.value = false;
  }
};

const fetchAvailableSlots = async () => {
  availableSlots.value = [];
  selectedTime.value = ''; // Reset selected time when date changes or slots are fetched
  if (!selectedDate.value || !service.value) {
    return;
  }
  try {
    // For simplicity, fetch for just the selected date. For a full calendar, fetch a range.
    const data = await BookingService.getAvailableSlots(
      props.merchantId,
      props.serviceId,
      selectedDate.value,
      selectedDate.value // Fetch only for the selected day
    );
    // Filter for available slots on the selected date
    availableSlots.value = data.filter(slot =>
      slot.is_available && slot.date === selectedDate.value
    );
    if (availableSlots.value.length === 0) {
        error.value = "No available slots for this date. Please choose another date or service.";
    } else {
      error.value = null; // Clear previous errors if slots are found
    }
  } catch (err) {
    console.error("Error fetching available slots:", err);
    error.value = "Failed to load available slots.";
  }
};

const handleBooking = async () => {
  if (!selectedDate.value || !selectedTime.value) {
    error.value = "Please select a date and time.";
    return;
  }

  if (!authStore.isAuthenticated) {
    alert("You must be logged in to make a booking.");
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }

  isBooking.value = true;
  error.value = null;
  bookingSuccess.value = false;

  const bookingData = {
    merchant: props.merchantId,
    service: props.serviceId,
    appointment_date: selectedDate.value,
    appointment_time: selectedTime.value,
    notes: notes.value,
    // customer is set by the backend based on the authenticated user
  };

  try {
    await BookingService.createBooking(bookingData);
    bookingSuccess.value = true;
    // Optionally clear form or redirect
    selectedDate.value = '';
    selectedTime.value = '';
    notes.value = '';
    availableSlots.value = []; // Clear slots after successful booking
    alert("Booking successful! Redirecting to your bookings.");
    router.push('/my-bookings');
  } catch (err) {
    console.error("Error creating booking:", err);
    if (err.response && err.response.data) {
      if (err.response.data.non_field_errors) {
        error.value = err.response.data.non_field_errors.join(', ');
      } else if (err.response.data.detail) {
        error.value = err.response.data.detail;
      } else {
        error.value = "Booking failed. " + JSON.stringify(err.response.data);
      }
    } else {
      error.value = "An unexpected error occurred during booking.";
    }
  } finally {
    isBooking.value = false;
  }
};

onMounted(fetchMerchantAndService);

// Watch for changes in selectedDate to fetch new slots
watch(selectedDate, (newDate) => {
  if (newDate) {
    fetchAvailableSlots();
  }
});
</script>

<template>
  <div class="booking-view col-md-8 offset-md-2">
    <h2 class="mb-4">Book Your Service</h2>

    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading service details...</p>
    </div>

    <div v-else-if="error && !bookingSuccess" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <div v-else-if="!merchant || !service" class="alert alert-warning" role="alert">
      Merchant or Service not found.
    </div>

    <div v-else class="card p-4 shadow-sm">
      <h3 class="mb-3">{{ merchant.name }} - {{ service.name }}</h3>
      <p><strong>Description:</strong> {{ service.description }}</p>
      <p><strong>Price:</strong> ${{ service.price }}</p>
      <p><strong>Duration:</strong> {{ service.duration_minutes }} minutes</p>

      <hr>

      <form @submit.prevent="handleBooking">
        <div class="mb-3">
          <label for="bookingDate" class="form-label">Select Date:</label>
          <input type="date" class="form-control" id="bookingDate" v-model="selectedDate"
                  :min="minDate" :max="maxDate" required>
        </div>

        <div class="mb-3">
          <label for="bookingTime" class="form-label">Select Time:</label>
          <select class="form-select" id="bookingTime" v-model="selectedTime" required
                   :disabled="availableSlots.length === 0 || !selectedDate">
            <option value="" disabled>-- Select a Time Slot --</option>
            <option v-for="slot in availableSlots" :key="slot.date + slot.time" :value="slot.time">
              {{ slot.time }}
            </option>
          </select>
          <small v-if="selectedDate && availableSlots.length === 0" class="form-text text-danger">
            No available slots for the selected date.
          </small>
        </div>

        <div class="mb-3">
          <label for="notes" class="form-label">Notes (Optional):</label>
          <textarea class="form-control" id="notes" rows="3" v-model="notes"></textarea>
        </div>

        <button type="submit" class="btn btn-success w-100" :disabled="isBooking || !selectedDate || !selectedTime">
          <span v-if="isBooking" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          <span v-else>Confirm Booking</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.booking-view {
  max-width: 800px;
  margin: 50px auto;
}
</style>
