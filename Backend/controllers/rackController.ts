import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Rack from '../models/Rack';
import Product from '../models/Product';

export const getRacks = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || req.user?._id;
    const query = shopId ? { shopId } : {};
    const racks = await Rack.find(query).lean();
    
    const racksWithStatus = await Promise.all(racks.map(async (rack) => {
      const products = await Product.find({ rackId: rack._id, ...query });
      
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
    console.error('[GET_RACKS_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createRack = async (req: Request, res: Response) => {
  try {
    const rawShopId = (req as any).shopId || req.user?.shopId || req.user?._id;
    if (!rawShopId) return res.status(400).json({ message: 'Shop ID is required' });

    let shopId = rawShopId;
    if (typeof rawShopId === 'string' && mongoose.Types.ObjectId.isValid(rawShopId)) {
      shopId = new mongoose.Types.ObjectId(rawShopId);
    }
    
    const rackName = req.body.rackName && req.body.rackName.trim() ? req.body.rackName.trim() : `Rack ${Date.now().toString().slice(-4)}`;
    
    const rackData = {
      ...req.body,
      rackName,
      shopId,
      positionX: Number(req.body.positionX) || 0,
      positionY: Number(req.body.positionY) || 1.5,
      positionZ: Number(req.body.positionZ) || 0,
      rotation: Number(req.body.rotation) || 0,
      width: Number(req.body.width) || 2,
      height: Number(req.body.height) || 3,
      shelves: Number(req.body.shelves) || 4,
      columns: Number(req.body.columns) || 3,
    };
    
    const rack = new Rack(rackData);
    await rack.save();
    res.status(201).json(rack);
  } catch (error) {
    console.error('[CREATE_RACK_ERROR]:', error);
    res.status(400).json({ message: 'Failed to create rack', details: (error as Error).message });
  }
};

export const updateRack = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || req.user?._id;
    const rack = await Rack.findOneAndUpdate(
      { _id: req.params.id, shopId },
      req.body,
      { new: true }
    );
    res.json(rack);
  } catch (error) {
    console.error('[UPDATE_RACK_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRack = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || req.user?._id;
    await Rack.findOneAndDelete({ _id: req.params.id, shopId });
    res.json({ message: 'Rack deleted' });
  } catch (error) {
    console.error('[DELETE_RACK_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicRacks = async (req: Request, res: Response) => {
  const { shopName } = req.params;
  if (!shopName || shopName === 'null' || shopName === 'undefined') {
    return res.status(404).json({ message: 'Invalid shop name' });
  }
  try {
    const User = require('../models/User').default;
    const shop = await User.findOne({ shopName });
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const racks = await Rack.find({ shopId: shop._id });
    res.json(racks);
  } catch (error) {
    console.error('[GET_PUBLIC_RACKS_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
