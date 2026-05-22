import express from 'express';
import { protect } from '../middleware/auth';
import Order from '../models/Order';
import Product from '../models/Product';

const router = express.Router();

// GET /api/employee/stats — scoped to the employee's shopId
router.get('/stats', protect, async (req, res) => {
  try {
    const shopId = (req.user as any)?.shopId;
    if (!shopId) return res.status(400).json({ message: 'No shop associated with this account' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, pendingDelivery, lowStock] = await Promise.all([
      Order.countDocuments({ shopId, createdAt: { $gte: today } }),
      Order.countDocuments({ shopId, 'delivery.status': { $in: ['Assigned', 'OutForDelivery'] } }),
      Product.countDocuments({ shopId, $expr: { $lte: ['$quantity', '$minStockLevel'] } }),
    ]);

    res.json({ todayOrders, pendingDelivery, lowStock });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

export default router;
