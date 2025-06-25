<script setup>
import { ref, onMounted } from 'vue';
import MerchantService from '@/services/merchant.service';
import { useRouter } from 'vue-router';

const merchants = ref([]);
const isLoading = ref(true);
const error = ref(null);
const router = useRouter();

const fetchMerchants = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const data = await MerchantService.getMerchantList();
    merchants.value = data;
  } catch (err) {
    console.error("Error fetching merchants:", err);
    error.value = "Failed to load merchants.";
  } finally {
    isLoading.value = false;
  }
};

const viewMerchantDetail = (merchantId) => {
  router.push({ name: 'merchant-detail', params: { id: merchantId } });
};

onMounted(fetchMerchants);
</script>

<template>
  <div class="merchant-list-view">
    <h1 class="mb-4 text-center">Our Merchants</h1>
    
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading merchants...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <div v-else-if="merchants.length > 0" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      <div class="col" v-for="merchant in merchants" :key="merchant.id">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ merchant.name }}</h5>
            <p class="card-text text-muted">{{ merchant.address }}</p>
            <p class="card-text">{{ merchant.description || 'No description available.' }}</p>
            <button @click="viewMerchantDetail(merchant.id)" class="btn btn-primary mt-auto">View Details</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="alert alert-info text-center">
      No merchants available yet. Please check back later!
    </div>
  </div>
</template>

<style scoped>
.merchant-list-view {
  padding-bottom: 30px;
}
</style>
