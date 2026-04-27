import { Request, Response } from 'express';
import Rack from '../models/Rack';
import Product from '../models/Product';

export const getRacks = async (req: Request, res: Response) => {
  try {
    const racks = await Rack.find({ shopId: (req as any).shopId }).lean();
    
    const racksWithStatus = await Promise.all(racks.map(async (rack) => {
      const products = await Product.find({ rackId: rack._id, shopId: (req as any).shopId });
      
      let status = 'normal';
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const hasLowStock = products.some(p => p.quantity < 10);
      const hasExpiring = products.some(p => p.expiryDate && p.expiryDate <= nextWeek);

      if (hasLowStock) status = 'lowStock';
      else if (hasExpiring) status = 'expiring';

      return { ...rack, status };
    }));

    res.json(racksWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createRack = async (req: Request, res: Response) => {
  try {
    const rack = new Rack({ ...req.body, shopId: (req as any).shopId });
    await rack.save();
    res.status(201).json(rack);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRack = async (req: Request, res: Response) => {
  try {
    const rack = await Rack.findOneAndUpdate(
      { _id: req.params.id, shopId: (req as any).shopId },
      req.body,
      { new: true }
    );
    res.json(rack);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRack = async (req: Request, res: Response) => {
  try {
    await Rack.findOneAndDelete({ _id: req.params.id, shopId: (req as any).shopId });
    res.json({ message: 'Rack deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicRacks = async (req: Request, res: Response) => {
  const { shopName } = req.params;
  try {
    const User = require('../models/User').default;
    const shop = await User.findOne({ shopName });
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const racks = await Rack.find({ shopId: shop._id });
    res.json(racks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
