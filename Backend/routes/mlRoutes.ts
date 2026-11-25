import express from 'express';
import { protect, admin } from '../middleware/auth';
import { 
  getFrequentlyBoughtTogether, 
  getRecommendationsForUser, 
  getCustomerSegments, 
  predictNextProduct,
  getSmartProductSuggestions
} from '../controllers/mlController';

const router = express.Router();

// Public / Shopper
router.get('/recommendations/apriori/:productId', getFrequentlyBoughtTogether);
router.post('/recommendations/sequence', predictNextProduct);
router.get('/recommendations/suggestions', getSmartProductSuggestions);
router.post('/recommendations/suggestions', getSmartProductSuggestions);

// Protected Shopper
router.get('/recommendations/cf', protect, getRecommendationsForUser);

// Admin Only
router.get('/segmentation/k-means', protect, admin, getCustomerSegments);

export default router;
