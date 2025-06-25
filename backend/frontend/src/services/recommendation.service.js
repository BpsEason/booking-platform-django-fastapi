import { recommendationApi } from './api.service';

const RecommendationService = {
  getRecommendedMerchants() {
    // This is an example endpoint for getting recommendations
    return recommendationApi.get('/get-recommendations/').then(response => response.data);
  }
};

export default RecommendationService;
