import { Request, Response } from 'express';
import User from '../models/User';
import ShopConfig from '../models/ShopConfig';
import { resolveShop, getAllShopNames } from '../utils/shopResolver';

export const getShopConfig = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || req.user._id;
    let config = await ShopConfig.findOne({ shopId });
    if (!config) {
      config = await ShopConfig.create({ shopId });
    }
    res.json(config);
  } catch (error) {
    console.error('[GET_SHOP_CONFIG_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const saveShopConfig = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || req.user._id;
    const config = await ShopConfig.findOneAndUpdate(
      { shopId },
      { ...req.body, shopId },
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (error) {
    console.error('[SAVE_SHOP_CONFIG_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicConfig = async (req: Request, res: Response) => {
  const { shopName } = req.params;
  if (!shopName || shopName === 'null' || shopName === 'undefined') {
    return res.status(404).json({ message: 'Invalid shop name' });
  }
  try {
    const resolved = await resolveShop(shopName);
    if (!resolved) return res.status(404).json({ message: 'Shop not found' });
    const config = await ShopConfig.findOne({ shopId: resolved.shopId });
    res.json(config);
  } catch (error) {
    console.error('[GET_PUBLIC_CONFIG_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getShopsList = async (req: Request, res: Response) => {
  try {
    const shopNames = await getAllShopNames();
    res.json(shopNames);
  } catch (error) {
    console.error('[GET_SHOPS_LIST_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
