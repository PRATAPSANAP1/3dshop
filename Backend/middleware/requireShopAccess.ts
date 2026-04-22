import { Request, Response, NextFunction } from 'express';

/**
 * Checks that the authenticated user's shopId matches the shopId
 * from the route params (req.params.shopId) or body (req.body.shopId).
 * Superadmin bypasses this check entirely.
 */
export const requireShopAccess = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as any;
  if (!user) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  // Superadmin can access any shop
  if (user.role === 'superadmin') {
    return next();
  }

  const targetShopId = req.params.shopId || req.body?.shopId || user.shopId?.toString();

  if (!targetShopId) {
    res.status(400).json({ message: 'Shop context required.' });
    return;
  }

  if (user.shopId?.toString() !== targetShopId.toString()) {
    res.status(403).json({ message: 'Access denied: You do not belong to this shop.' });
    return;
  }

  // Attach shopId to request for downstream use
  (req as any).shopId = targetShopId;
  next();
};
