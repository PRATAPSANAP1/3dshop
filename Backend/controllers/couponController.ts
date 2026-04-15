import { Request, Response } from 'express';
import Coupon from '../models/Coupon';

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { code, discountPercentage } = req.body;
    const coupon = new Coupon({ code: code.toUpperCase(), discountPercentage });
    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
  } catch (error: any) {
    if (error.code === 11000) return res.status(400).json({ message: 'Coupon code already exists' });
    res.status(500).json({ message: 'Failed to create coupon' });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find({});
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch coupons' });
  }
};

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (coupon) {
      res.json({ valid: true, discountPercentage: coupon.discountPercentage });
    } else {
      res.status(404).json({ message: 'Invalid or inactive coupon code' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error validating coupon' });
  }
};

export const toggleCouponStatus = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (coupon) {
      coupon.isActive = !coupon.isActive;
      await coupon.save();
      res.json(coupon);
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating coupon' });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (coupon) {
      await coupon.deleteOne();
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon' });
  }
};
