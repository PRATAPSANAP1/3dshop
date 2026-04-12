import { Request, Response } from 'express';
import Door from '../models/Door';
import User from '../models/User';

export const getDoors = async (req: Request, res: Response) => {
  try {
    const doors = await Door.find({ shopId: req.user._id });
    res.json(doors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDoor = async (req: Request, res: Response) => {
  try {
    const door = new Door({ ...req.body, shopId: req.user._id });
    await door.save();
    res.status(201).json(door);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteDoor = async (req: Request, res: Response) => {
  try {
    await Door.findOneAndDelete({ _id: req.params.id, shopId: req.user._id });
    res.json({ message: 'Door deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicDoors = async (req: Request, res: Response) => {
  const { shopName } = req.params;
  try {
    const user = await User.findOne({ shopName });
    if (!user) return res.status(404).json({ message: 'Shop not found' });
    const doors = await Door.find({ shopId: user._id });
    res.json(doors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
