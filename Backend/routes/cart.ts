import express from 'express';
import { getCart, addToCart, removeFromCart, updateCartQty, clearCart } from '../controllers/cartController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update-qty', updateCartQty);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

export default router;
