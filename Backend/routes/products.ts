import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, scanQR, getProductsByRack, getProductById, updateStockByQR, getReviews, createReview } from '../controllers/productController';
import { protect, admin } from '../middleware/auth';


const router = express.Router();

router.get('/', protect, getProducts);
router.get('/rack/:rackId', protect, getProductsByRack);
router.get('/:id', protect, getProductById);
router.post('/', protect, createProduct);
router.put('/update-stock-qr', protect, updateStockByQR);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/scan', protect, scanQR);
router.get('/:id/reviews', getReviews);
router.post('/:id/reviews', protect, createReview);


export default router;
