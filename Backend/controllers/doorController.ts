import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Door from '../models/Door';
import User from '../models/User';

export const getDoors = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || req.user?._id;
    if (!shopId) return res.status(400).json({ message: 'Shop ID required' });
    const doors = await Door.find({ shopId });
    res.json(doors);
  } catch (error) {
    console.error('[GET_DOORS_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDoor = async (req: Request, res: Response) => {
  try {
    const rawShopId = (req as any).shopId || req.user?.shopId || req.user?._id;
    if (!rawShopId) return res.status(400).json({ message: 'Shop ID is required' });

    let shopId = rawShopId;
    if (typeof rawShopId === 'string' && mongoose.Types.ObjectId.isValid(rawShopId)) {
      shopId = new mongoose.Types.ObjectId(rawShopId);
    }

    const doorType = (req.body.doorType || '').toLowerCase() === 'exit' ? 'exit' : 'entry';

    const doorData = {
      doorType,
      shopId,
      positionX: Number(req.body.positionX) || 0,
      positionZ: Number(req.body.positionZ) || 0,
      rotation: Number(req.body.rotation) || 0,
      width: Number(req.body.width) || 1.5,
      height: Number(req.body.height) || 2.5,
    };

    const door = new Door(doorData);
    await door.save();
    res.status(201).json(door);
  } catch (error: any) {
    console.error('[CREATE_DOOR_ERROR]:', error);
    res.status(500).json({ message: 'Failed to create door', details: error.message || String(error) });
  }
};

export const deleteDoor = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || req.user?._id;
    if (!shopId) return res.status(400).json({ message: 'Shop ID required' });
    await Door.findOneAndDelete({ _id: req.params.id, shopId });
    res.json({ message: 'Door deleted' });
  } catch (error) {
    console.error('[DELETE_DOOR_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicDoors = async (req: Request, res: Response) => {
  const { shopName } = req.params;
  if (!shopName || shopName === 'null' || shopName === 'undefined') {
    return res.status(404).json({ message: 'Invalid shop name' });
  }
  try {
    const user = await User.findOne({ shopName });
    if (!user) return res.status(404).json({ message: 'Shop not found' });
    const doors = await Door.find({ shopId: user._id });
    res.json(doors);
  } catch (error) {
    console.error('[GET_PUBLIC_DOORS_ERROR]:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
