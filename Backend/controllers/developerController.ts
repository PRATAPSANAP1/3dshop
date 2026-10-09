import { Request, Response } from 'express';
import User from '../models/User';
import Shop from '../models/Shop';
import Product from '../models/Product';
import Order from '../models/Order';

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const totalShops = await Shop.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalShoppers = await User.countDocuments({ role: 'shopper' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { $or: [{ isPaid: true }, { paymentMethod: 'COD', orderStatus: 'Delivered' }] } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const activeShops = await Shop.countDocuments({ isActive: true });

    res.json({
      totalShops,
      activeShops,
      totalUsers,
      totalAdmins,
      totalEmployees,
      totalShoppers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch system stats' });
  }
};

export const getAllShopsDev = async (req: Request, res: Response) => {
  try {
    const shops = await Shop.find().populate('ownerUserId', 'name email').sort({ createdAt: -1 });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch shops' });
  }
};

export const getAllUsersDev = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password -token -refreshToken').populate('shopId', 'name displayName').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const updateUserRoleDev = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['developer', 'admin', 'employee', 'shopper'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.role = role;
    await user.save();
    res.json({ message: `User role updated to ${role}`, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role' });
  }
};

export const assignUserToShop = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (shopId) {
      const shop = await Shop.findById(shopId);
      if (!shop) return res.status(404).json({ message: 'Shop not found' });
      user.shopId = shopId;
    } else {
      user.shopId = null as any;
    }
    await user.save();
    res.json({ message: 'User shop assignment updated', user: { _id: user._id, name: user.name, shopId: user.shopId } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign shop' });
  }
};

export const toggleShopStatus = async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    shop.isActive = !shop.isActive;
    await shop.save();
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle shop status' });
  }
};

export const deleteShopDev = async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    await shop.deleteOne();
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete shop' });
  }
};

export const blockUserDev = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: user.isBlocked ? 'User blocked' : 'User unblocked', user: { _id: user._id, isBlocked: user.isBlocked } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle block status' });
  }
};
