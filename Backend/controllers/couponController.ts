import { Request, Response } from 'express';
import Coupon from '../models/Coupon';

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { code, discountPercentage, validFrom, validUntil } = req.body;
    const coupon = new Coupon({ 
      code: code.toUpperCase(), 
      discountPercentage, 
      validFrom: validFrom ? new Date(validFrom) : undefined, 
      validUntil: validUntil ? new Date(validUntil) : undefined,
      shopId: (req as any).shopId 
    });
    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
  } catch (error: any) {
    if (error.code === 11000) return res.status(400).json({ message: 'Coupon code already exists' });
    res.status(500).json({ message: 'Failed to create coupon' });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const shopId = (req as any).shopId;
    const query = shopId ? { shopId } : {};
    const coupons = await Coupon.find(query);
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch coupons' });
  }
};

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    // We should ideally check shopId here as well, but for checkout validation, the coupon must match the shop.
    // For now, let's just find the coupon. If we have shopId in req from auth, we could use it, but checkout might be public.
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (coupon) {
      const now = new Date();
      if (coupon.validFrom && now < coupon.validFrom) {
        return res.status(400).json({ message: 'Coupon is not yet valid' });
      }
      if (coupon.validUntil && now > coupon.validUntil) {
        return res.status(400).json({ message: 'Coupon has expired' });
      }
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
