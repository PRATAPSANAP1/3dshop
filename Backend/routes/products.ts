import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, scanQR, getProductsByRack, getProductById, updateStockByQR, getReviews, createReview } from '../controllers/productController';
import { protect, admin, staff } from '../middleware/auth';


const router = express.Router();

router.get('/', protect, getProducts);
router.get('/rack/:rackId', protect, getProductsByRack);
router.get('/:id', protect, getProductById);
router.post('/', protect, admin, createProduct);
router.put('/update-stock-qr', protect, staff, updateStockByQR);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.post('/scan', protect, scanQR);
router.get('/:id/reviews', getReviews);
router.post('/:id/reviews', protect, createReview);


export default router;
