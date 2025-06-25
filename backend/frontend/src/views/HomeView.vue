<script setup>
import { onMounted, ref } from 'vue';
import RecommendationService from '@/services/recommendation.service';
import { useRouter } from 'vue-router';

const recommendedMerchants = ref([]);
const isLoading = ref(true);
const error = ref(null);
const router = useRouter();

const fetchRecommendedMerchants = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const data = await RecommendationService.getRecommendedMerchants();
    recommendedMerchants.value = data;
  } catch (err) {
    console.error("Error fetching recommended merchants:", err);
    error.value = "Failed to load recommendations.";
  } finally {
    isLoading.value = false;
  }
};

const viewMerchantDetail = (merchantId) => {
  router.push({ name: 'merchant-detail', params: { id: merchantId } });
};

onMounted(fetchRecommendedMerchants);
</script>

<template>
  <div class="home-view">
    <div class="jumbotron text-center bg-light p-5 rounded shadow-sm mb-5">
      <h1 class="display-4">Welcome to Our Booking Platform!</h1>
      <p class="lead">Discover and book services from local merchants effortlessly.</p>
      <hr class="my-4">
      <p>Find the perfect service for your needs, from salons to workshops.</p>
      <router-link to="/merchants" class="btn btn-primary btn-lg mt-3">Explore Merchants</router-link>
    </div>

    <h2 class="text-center mb-4">Recommended for You</h2>
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading recommendations...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    <div v-else-if="recommendedMerchants.length > 0" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
      <div class="col" v-for="merchant in recommendedMerchants" :key="merchant.id">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ merchant.name }}</h5>
            <p class="card-text text-muted">{{ merchant.address }}</p>
            <p class="card-text">{{ merchant.description?.substring(0, 100) }}...</p>
            <button @click="viewMerchantDetail(merchant.id)" class="btn btn-outline-primary mt-auto">View Details</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="alert alert-info text-center">
      No recommendations available right now. Explore all merchants!
    </div>
  </div>
</template>

<style scoped>
.jumbotron {
  background-color: #f8f9fa;
  padding: 3rem;
}
</style>
