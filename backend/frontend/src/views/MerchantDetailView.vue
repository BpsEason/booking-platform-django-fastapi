<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MerchantService from '@/services/merchant.service';

const route = useRoute();
const router = useRouter();
const merchant = ref(null);
const isLoading = ref(true);
const error = ref(null);

const merchantId = route.params.id;

const fetchMerchantDetail = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const data = await MerchantService.getMerchantDetail(merchantId);
    merchant.value = data;
  } catch (err) {
    console.error("Error fetching merchant detail:", err);
    error.value = "Failed to load merchant details.";
  } finally {
    isLoading.value = false;
  }
};

const bookService = (serviceId) => {
  router.push({ name: 'book', params: { merchantId: merchantId, serviceId: serviceId } });
};

onMounted(fetchMerchantDetail);
</script>

<template>
  <div class="merchant-detail">
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading merchant details...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <div v-else-if="merchant">
      <div class="card mb-4 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">{{ merchant.name }}</h2>
          <p class="card-subtitle mb-2 text-muted">{{ merchant.address }} | {{ merchant.phone_number }}</p>
          <p class="card-text">{{ merchant.description || 'No description available.' }}</p>
          <p v-if="merchant.website" class="card-text">
            <a :href="merchant.website" target="_blank" class="text-decoration-none">Visit Website</a>
          </p>
        </div>
      </div>

      <h3 class="mb-3">Services Offered</h3>
      <div v-if="merchant.services && merchant.services.length > 0" class="row row-cols-1 row-cols-md-2 g-4">
        <div class="col" v-for="service in merchant.services" :key="service.id">
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">{{ service.name }}</h5>
              <p class="card-text">{{ service.description || 'No description available.' }}</p>
              <p class="card-text"><strong>Price:</strong> ${{ service.price }}</p>
              <p class="card-text"><strong>Duration:</strong> {{ service.duration_minutes }} minutes</p>
              <button @click="bookService(service.id)" class="btn btn-success mt-auto">Book Now</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="alert alert-info" role="alert">
        This merchant currently has no services listed.
      </div>
    </div>
  </div>
</template>

<style scoped>
.merchant-detail {
  padding-bottom: 30px;
}
</style>
