import { Request, Response } from 'express';
import User from '../models/User';
import ShopConfig from '../models/ShopConfig';

export const getShopConfig = async (req: Request, res: Response) => {
  try {
    let config = await ShopConfig.findOne({ shopId: req.user._id });
    if (!config) {
      config = await ShopConfig.create({ shopId: req.user._id });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const saveShopConfig = async (req: Request, res: Response) => {
  try {
    const config = await ShopConfig.findOneAndUpdate(
      { shopId: req.user._id },
      { ...req.body, shopId: req.user._id },
      { upsert: true, new: true }
    );
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicConfig = async (req: Request, res: Response) => {
  const { shopName } = req.params;
  try {
    const user = await User.findOne({ shopName });
    if (!user) return res.status(404).json({ message: 'Shop not found' });
    const config = await ShopConfig.findOne({ shopId: user._id });
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getShopsList = async (req: Request, res: Response) => {
  try {
    const shops = await User.find({}, 'shopName');
    res.json(shops.map(s => s.shopName));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
