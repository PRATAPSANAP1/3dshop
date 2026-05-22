import { Request, Response } from 'express';
import GodownRack from '../models/GodownRack';
import Godown from '../models/Godown';

export const getRacks = async (req: Request, res: Response) => {
  try {
    const racks = await GodownRack.find({ godownId: req.params.godownId });
    res.json(racks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllRacks = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId || (req.user as any).shopId;
    // We need to find racks that belong to any godown in this shop
    const godowns = await Godown.find({ shopId });
    const godownIds = godowns.map(g => g._id);
    const racks = await GodownRack.find({ godownId: { $in: godownIds } }).populate('godownId', 'name');
    res.json(racks);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRack = async (req: Request, res: Response) => {
  try {
    const rack = new GodownRack({
      ...req.body,
      godownId: req.params.godownId,
    });
    const createdRack = await rack.save();
    res.status(201).json(createdRack);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRack = async (req: Request, res: Response) => {
  try {
    const rack = await GodownRack.findByIdAndUpdate(
      req.params.rackId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!rack) {
      return res.status(404).json({ message: 'Rack not found' });
    }
    res.json(rack);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRack = async (req: Request, res: Response) => {
  try {
    const rack = await GodownRack.findByIdAndDelete(req.params.rackId);
    if (!rack) {
      return res.status(404).json({ message: 'Rack not found' });
    }
    res.json({ message: 'Rack removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
