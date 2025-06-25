<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import MerchantService from '@/services/merchant.service';
import BookingService from '@/services/booking.service';
import { Modal } from 'bootstrap'; // Import Bootstrap's Modal

const authStore = useAuthStore();
const currentUser = computed(() => authStore.user);

const merchants = ref([]);
const appointments = ref([]);
const selectedMerchant = ref(null);
const currentService = ref({}); // For add/edit service modal
const serviceModal = ref(null);
const serviceModalInstance = ref(null);

const isLoadingMerchants = ref(true);
const isLoadingAppointments = ref(true);
const isLoadingServices = ref(true);

const errorMessage = ref('');
const successMessage = ref('');

// Form for new/edit merchant
const merchantForm = ref({
  id: null,
  name: '',
  description: '',
  address: '',
  phone_number: '',
  email: '',
  website: '',
  is_active: true
});
const isEditingMerchant = ref(false);
const merchantModal = ref(null);
const merchantModalInstance = ref(null);

// --- General Functions ---
const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const showAlert = (message, type = 'success') => {
  clearMessages();
  if (type === 'success') {
    successMessage.value = message;
  } else {
    errorMessage.value = message;
  }
  setTimeout(clearMessages, 5000); // Clear message after 5 seconds
};

// --- Merchant Management ---
const fetchMerchants = async () => {
  isLoadingMerchants.value = true;
  clearMessages();
  try {
    const data = await MerchantService.getMerchantAdminList();
    merchants.value = data;
    if (data.length > 0) {
      selectedMerchant.value = data[0]; // Auto-select the first merchant
      fetchAppointments();
    }
  } catch (err) {
    console.error("Error fetching merchants for admin:", err);
    showAlert("Failed to load your merchant(s).", 'error');
  } finally {
    isLoadingMerchants.value = false;
  }
};

const selectMerchant = (merchant) => {
  selectedMerchant.value = merchant;
  fetchAppointments();
};

const openMerchantModal = (merchant = null) => {
  clearMessages();
  if (merchant) {
    isEditingMerchant.value = true;
    merchantForm.value = { ...merchant };
  } else {
    isEditingMerchant.value = false;
    merchantForm.value = {
      id: null, name: '', description: '', address: '',
      phone_number: '', email: '', website: '', is_active: true
    };
  }
  merchantModalInstance.value.show();
};

const saveMerchant = async () => {
  clearMessages();
  try {
    if (isEditingMerchant.value) {
      await MerchantService.updateMerchant(merchantForm.value.id, merchantForm.value);
      showAlert("Merchant updated successfully!");
    } else {
      await MerchantService.createMerchant(merchantForm.value);
      showAlert("Merchant created successfully!");
    }
    merchantModalInstance.value.hide();
    fetchMerchants(); // Re-fetch merchants to update the list
  } catch (err) {
    console.error("Error saving merchant:", err);
    showAlert("Failed to save merchant.", 'error');
  }
};

const deleteMerchant = async (id) => {
  if (confirm("Are you sure you want to delete this merchant? This action cannot be undone.")) {
    clearMessages();
    try {
      await MerchantService.deleteMerchant(id);
      showAlert("Merchant deleted successfully!");
      fetchMerchants();
    } catch (err) {
      console.error("Error deleting merchant:", err);
      showAlert("Failed to delete merchant.", 'error');
    }
  }
};


// --- Service Management ---
const openServiceModal = (service = null) => {
  clearMessages();
  if (!selectedMerchant.value) {
    showAlert("Please select a merchant first.", 'error');
    return;
  }
  if (service) {
    currentService.value = { ...service }; // Copy for editing
  } else {
    currentService.value = {
      id: null,
      name: '',
      description: '',
      price: 0.00,
      duration_minutes: 30,
      is_active: true
    };
  }
  serviceModalInstance.value.show();
};

const saveService = async () => {
  clearMessages();
  if (!selectedMerchant.value || !currentService.value.name || !currentService.value.price) {
    showAlert("Please fill in all required service fields.", 'error');
    return;
  }
  try {
    if (currentService.value.id) {
      await MerchantService.updateService(selectedMerchant.value.id, currentService.value.id, currentService.value);
      showAlert("Service updated successfully!");
    } else {
      await MerchantService.createService(selectedMerchant.value.id, currentService.value);
      showAlert("Service added successfully!");
    }
    serviceModalInstance.value.hide();
    fetchMerchants(); // Re-fetch merchants to update the service list
  } catch (err) {
    console.error("Error saving service:", err);
    showAlert("Failed to save service.", 'error');
  }
};

const deleteService = async (serviceId) => {
  if (confirm("Are you sure you want to delete this service? This action cannot be undone and will affect associated bookings.")) {
    clearMessages();
    try {
      await MerchantService.deleteService(selectedMerchant.value.id, serviceId);
      showAlert("Service deleted successfully!", 'success');
      fetchMerchants(); // Re-fetch to update
    } catch (err) {
      console.error("Error deleting service:", err);
      showAlert("Failed to delete service.", 'error');
    }
  }
};

// --- Appointment Management ---
const fetchAppointments = async () => {
  if (!selectedMerchant.value) {
    appointments.value = [];
    return;
  }
  isLoadingAppointments.value = true;
  clearMessages();
  try {
    const data = await BookingService.getMerchantAppointments();
    // Filter appointments relevant to the selected merchant
    appointments.value = data.filter(app => app.merchant === selectedMerchant.value.id);
  } catch (err) {
    console.error("Error fetching appointments for merchant admin:", err);
    showAlert("Failed to load appointments.", 'error');
  } finally {
    isLoadingAppointments.value = false;
  }
};

const updateAppointmentStatus = async (appointment, newStatus) => {
  clearMessages();
  try {
    await BookingService.updateMerchantAppointment(appointment.id, { status: newStatus });
    showAlert(`Appointment ${appointment.id} status updated to ${newStatus}.`, 'success');
    fetchAppointments(); // Re-fetch to ensure data consistency
  } catch (err) {
    console.error("Error updating appointment status:", err);
    showAlert("Failed to update appointment status.", 'error');
  }
};

// --- On Mount ---
onMounted(() => {
  if (currentUser.value && currentUser.value.user_type === 'merchant_admin') {
    fetchMerchants();
  }
  // Initialize Bootstrap Modals
  serviceModalInstance.value = new Modal(serviceModal.value);
  merchantModalInstance.value = new Modal(merchantModal.value);
});
</script>

<template>
  <div class="merchant-admin-dashboard">
    <h2 class="mb-4">Merchant Admin Dashboard</h2>

    <div v-if="errorMessage" class="alert alert-danger" role="alert">{{ errorMessage }}</div>
    <div v-if="successMessage" class="alert alert-success" role="alert">{{ successMessage }}</div>

    <div class="row">
      <div class="col-md-4">
        <div class="card mb-4 shadow-sm">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5>Your Merchants</h5>
            <button class="btn btn-sm btn-primary" @click="openMerchantModal()">+ Add New Merchant</button>
          </div>
          <div class="card-body">
            <div v-if="isLoadingMerchants" class="text-center">Loading merchants...</div>
            <div v-else-if="merchants.length === 0" class="alert alert-info">No merchants found. Add one!</div>
            <ul v-else class="list-group">
              <li v-for="merchant in merchants" :key="merchant.id"
                  :class="['list-group-item', 'd-flex', 'justify-content-between', 'align-items-center', { 'active': selectedMerchant?.id === merchant.id }]"
                  @click="selectMerchant(merchant)">
                {{ merchant.name }}
                <div>
                    <button class="btn btn-sm btn-outline-info me-2" @click.stop="openMerchantModal(merchant)">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" @click.stop="deleteMerchant(merchant.id)">Delete</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <div v-if="selectedMerchant" class="card shadow-sm">
          <div class="card-header">
            <h3>{{ selectedMerchant.name }} Overview</h3>
          </div>
          <div class="card-body">
            <p><strong>Address:</strong> {{ selectedMerchant.address }}</p>
            <p><strong>Contact:</strong> {{ selectedMerchant.phone_number }} | {{ selectedMerchant.email }}</p>
            <p><strong>Website:</strong> <a :href="selectedMerchant.website" target="_blank">{{ selectedMerchant.website }}</a></p>

            <hr>

            <h4>Services</h4>
            <button class="btn btn-sm btn-success mb-3" @click="openServiceModal()">+ Add New Service</button>
            <div v-if="isLoadingServices" class="text-center">Loading services...</div>
            <div v-else-if="!selectedMerchant.services || selectedMerchant.services.length === 0" class="alert alert-info">
              No services listed for this merchant.
            </div>
            <ul v-else class="list-group mb-4">
              <li v-for="service in selectedMerchant.services" :key="service.id" class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <h6>{{ service.name }}</h6>
                  <small>{{ service.description }}</small><br>
                  <small>Price: ${{ service.price }} | Duration: {{ service.duration_minutes }} mins</small>
                </div>
                <div>
                  <button class="btn btn-sm btn-outline-info me-2" @click="openServiceModal(service)">Edit</button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteService(service.id)">Delete</button>
                </div>
              </li>
            </ul>

            <h4>Appointments</h4>
            <div v-if="isLoadingAppointments" class="text-center">Loading appointments...</div>
            <div v-else-if="appointments.length === 0" class="alert alert-info">
              No appointments for this merchant.
            </div>
            <ul v-else class="list-group">
              <li v-for="appointment in appointments" :key="appointment.id" class="list-group-item mb-2 shadow-sm rounded">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                  <strong>{{ appointment.service_info?.name }}</strong> with {{ appointment.customer_info?.full_name || appointment.customer_info?.email }}
                  on {{ new Date(appointment.appointment_date).toLocaleDateString() }} at {{ appointment.appointment_time }}
                  </div>
                  <div>
                    <span :class="['badge', {
                      'bg-warning text-dark': appointment.status === 'pending',
                      'bg-success': appointment.status === 'confirmed' || appointment.status === 'completed',
                      'bg-danger': appointment.status === 'cancelled' || appointment.status === 'no_show'
                    }]">{{ appointment.status }}</span>
                  </div>
                </div>
                <div class="mt-2">
                  <small>Notes: {{ appointment.notes || 'N/A' }}</small><br>
                  <small>Booked: {{ new Date(appointment.created_at).toLocaleString() }}</small>
                </div>
                <div class="mt-2">
                  <button v-if="appointment.status === 'pending'" @click="updateAppointmentStatus(appointment, 'confirmed')" class="btn btn-sm btn-success me-2">Confirm</button>
                  <button v-if="appointment.status === 'pending' || appointment.status === 'confirmed'" @click="updateAppointmentStatus(appointment, 'cancelled')" class="btn btn-sm btn-danger me-2">Cancel</button>
                  <button v-if="appointment.status === 'confirmed'" @click="updateAppointmentStatus(appointment, 'completed')" class="btn btn-sm btn-info">Mark as Completed</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div v-else class="alert alert-info mt-4">
          Select a merchant from the left panel to manage, or add a new merchant.
        </div>
      </div>
    </div>

    <div class="modal fade" id="serviceModal" tabindex="-1" aria-labelledby="serviceModalLabel" aria-hidden="true" ref="serviceModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="serviceModalLabel">{{ currentService.id ? 'Edit Service' : 'Add New Service' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveService">
              <div class="mb-3">
                <label for="serviceName" class="form-label">Service Name</label>
                <input type="text" class="form-control" id="serviceName" v-model="currentService.name" required>
              </div>
              <div class="mb-3">
                <label for="serviceDescription" class="form-label">Description</label>
                <textarea class="form-control" id="serviceDescription" v-model="currentService.description"></textarea>
              </div>
              <div class="mb-3">
                <label for="servicePrice" class="form-label">Price</label>
                <input type="number" step="0.01" class="form-control" id="servicePrice" v-model="currentService.price" required>
              </div>
              <div class="mb-3">
                <label for="serviceDuration" class="form-label">Duration (minutes)</label>
                <input type="number" class="form-control" id="serviceDuration" v-model="currentService.duration_minutes" required>
              </div>
              <div class="form-check mb-3">
                <input type="checkbox" class="form-check-input" id="serviceIsActive" v-model="currentService.is_active">
                <label class="form-check-label" for="serviceIsActive">Active</label>
              </div>
              <button type="submit" class="btn btn-primary">Save Service</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" id="merchantModal" tabindex="-1" aria-labelledby="merchantModalLabel" aria-hidden="true" ref="merchantModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="merchantModalLabel">{{ isEditingMerchant ? 'Edit Merchant' : 'Add New Merchant' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveMerchant">
              <div class="mb-3">
                <label for="merchantName" class="form-label">Merchant Name</label>
                <input type="text" class="form-control" id="merchantName" v-model="merchantForm.name" required>
              </div>
              <div class="mb-3">
                <label for="merchantDescription" class="form-label">Description</label>
                <textarea class="form-control" id="merchantDescription" v-model="merchantForm.description"></textarea>
              </div>
              <div class="mb-3">
                <label for="merchantAddress" class="form-label">Address</label>
                <input type="text" class="form-control" id="merchantAddress" v-model="merchantForm.address" required>
              </div>
              <div class="mb-3">
                <label for="merchantPhone" class="form-label">Phone Number</label>
                <input type="tel" class="form-control" id="merchantPhone" v-model="merchantForm.phone_number">
              </div>
              <div class="mb-3">
                <label for="merchantEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="merchantEmail" v-model="merchantForm.email">
              </div>
              <div class="mb-3">
                <label for="merchantWebsite" class="form-label">Website</label>
                <input type="url" class="form-control" id="merchantWebsite" v-model="merchantForm.website">
              </div>
              <div class="form-check mb-3">
                <input type="checkbox" class="form-check-input" id="merchantIsActive" v-model="merchantForm.is_active">
                <label class="form-check-label" for="merchantIsActive">Active</label>
              </div>
              <button type="submit" class="btn btn-primary">Save Merchant</button>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.merchant-admin-dashboard {
  padding-bottom: 30px;
}
.list-group-item.active {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}
.list-group-item.active button {
  color: white !important;
  border-color: white !important;
}
</style>
