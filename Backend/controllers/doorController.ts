import { Request, Response } from 'express';
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
    const shopId = (req as any).shopId || req.user?._id;
    if (!shopId) return res.status(400).json({ message: 'Shop ID is required' });
    const door = new Door({ ...req.body, shopId });
    await door.save();
    res.status(201).json(door);
  } catch (error) {
    console.error('[CREATE_DOOR_ERROR]:', error);
    res.status(500).json({ message: 'Server error', details: (error as Error).message });
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
