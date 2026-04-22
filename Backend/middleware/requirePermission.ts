import { Request, Response, NextFunction } from 'express';

export type EmployeePermission =
  | 'VIEW_ORDERS'
  | 'UPDATE_DELIVERY_STATUS'
  | 'USE_SCANNER'
  | 'VIEW_PRODUCTS'
  | 'VIEW_DASHBOARD_STATS'
  | 'MANAGE_INVENTORY_STOCK';

/**
 * Returns middleware that checks whether the user has a specific permission.
 * - admin & superadmin roles pass automatically.
 * - employee role must have the permission in their employeePermissions array.
 * - shopper role is always denied.
 */
export const requirePermission = (perm: EmployeePermission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    if (!user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    // admin and superadmin always pass
    if (user.role === 'admin' || user.role === 'superadmin') {
      return next();
    }

    // employee must have the specific permission
    if (user.role === 'employee') {
      if (user.employeePermissions?.includes(perm)) {
        return next();
      }
      res.status(403).json({ message: `Permission denied: ${perm} is required.` });
      return;
    }

    res.status(403).json({ message: 'Access denied.' });
  };
};
