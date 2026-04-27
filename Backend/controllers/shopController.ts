import { Request, Response } from 'express';
import Shop from '../models/Shop';
import User from '../models/User';

// POST /api/shops — create shop (superadmin only)
export const createShop = async (req: Request, res: Response) => {
  try {
    const { name, displayName, ownerEmail, plan, settings } = req.body;

    const existing = await Shop.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Shop slug already taken' });

    // Find or validate the owner
    const owner = await User.findOne({ email: ownerEmail });
    if (!owner) return res.status(404).json({ message: 'Owner user not found' });

    const shop = await Shop.create({
      name,
      displayName: displayName || name,
      ownerUserId: owner._id,
      plan: plan || 'free',
      settings: settings || {}
    });

    // Update owner to admin role with shopId
    owner.role = 'admin';
    owner.shopId = shop._id as any;
    await owner.save();

    res.status(201).json(shop);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create shop', error: error.message });
  }
};

// GET /api/shops — list all shops (superadmin only)
export const listShops = async (_req: Request, res: Response) => {
  try {
    const shops = await Shop.find().populate('ownerUserId', 'name email').sort({ createdAt: -1 });
    res.json(shops);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to list shops', error: error.message });
  }
};

// GET /api/shops/:shopId — get shop details
export const getShop = async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findById(req.params.shopId).populate('ownerUserId', 'name email');
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to get shop', error: error.message });
  }
};

// PATCH /api/shops/:shopId — update shop settings (owner only)
export const updateShop = async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const user = req.user as any;
    if (user.role !== 'admin' && shop.ownerUserId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only the shop owner or an administrator can update settings' });
    }

    const { displayName, settings, logoUrl } = req.body;
    if (displayName) shop.displayName = displayName;
    if (logoUrl !== undefined) shop.logoUrl = logoUrl;
    if (settings) {
      shop.settings = { ...shop.settings, ...settings };
    }

    await shop.save();
    res.json(shop);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update shop', error: error.message });
  }
};

// DELETE /api/shops/:shopId — deactivate shop (superadmin only)
export const deactivateShop = async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    shop.isActive = false;
    await shop.save();
    res.json({ message: 'Shop deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to deactivate shop', error: error.message });
  }
};

// GET /api/public/shops — public list of active shop slugs
export const publicListShops = async (_req: Request, res: Response) => {
  try {
    const shops = await Shop.find({ isActive: true }).select('name displayName logoUrl');
    res.json(shops);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to list shops', error: error.message });
  }
};

// GET /api/public/shops/:slug — public shop config for shopper entry
export const publicGetShop = async (req: Request, res: Response) => {
  try {
    const shop = await Shop.findOne({ name: req.params.slug, isActive: true })
      .select('name displayName logoUrl settings.currency settings.timezone settings.gstRate');
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to get shop', error: error.message });
  }
};
