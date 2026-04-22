import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Shop from '../models/Shop';

const EMPLOYEE_PERMISSIONS = [
  'VIEW_ORDERS', 'UPDATE_DELIVERY_STATUS', 'USE_SCANNER',
  'VIEW_PRODUCTS', 'VIEW_DASHBOARD_STATS', 'MANAGE_INVENTORY_STOCK'
];

// GET /api/shops/:shopId/employees — list employees
export const listEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await User.find({
      shopId: req.params.shopId,
      role: 'employee'
    }).select('-password -token -refreshToken').sort({ createdAt: -1 });
    res.json(employees);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to list employees', error: error.message });
  }
};

// POST /api/shops/:shopId/employees/invite — invite employee
export const inviteEmployee = async (req: Request, res: Response) => {
  try {
    const { email, permissions } = req.body;
    const { shopId } = req.params;

    // Validate permissions
    const invalidPerms = (permissions || []).filter((p: string) => !EMPLOYEE_PERMISSIONS.includes(p));
    if (invalidPerms.length > 0) {
      return res.status(400).json({ message: `Invalid permissions: ${invalidPerms.join(', ')}` });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    // Generate invite token (48h expiry)
    const inviteToken = jwt.sign(
      { shopId, email, permissions },
      process.env.JWT_SECRET || 'dev_secret_key_12345',
      { expiresIn: '48h' }
    );

    // Optionally create a pending user record or just return the token
    // For now, return the invite link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join?token=${inviteToken}`;

    res.json({
      message: 'Invite generated successfully',
      inviteLink,
      inviteToken,
      email,
      permissions
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to invite employee', error: error.message });
  }
};

// POST /api/auth/join — accept invite token, create/update user as employee
export const joinAsEmployee = async (req: Request, res: Response) => {
  try {
    const { token, name, password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key_12345') as any;
    const { shopId, email, permissions } = decoded;

    const shop = await Shop.findById(shopId);
    if (!shop || !shop.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive shop' });
    }

    let user = await User.findOne({ email });

    if (user) {
      // Update existing user to employee of this shop
      if (user.role === 'employee' && user.shopId?.toString() === shopId) {
        return res.status(400).json({ message: 'Already joined this shop' });
      }
      user.role = 'employee';
      user.shopId = shopId;
      user.employeePermissions = permissions;
      if (name) user.name = name;
      if (password) user.password = password;
      await user.save();
    } else {
      // Create new user
      if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required for new accounts' });
      }
      user = new User({
        name,
        email,
        password,
        role: 'employee',
        shopId,
        employeePermissions: permissions
      });
      await user.save();
    }

    res.status(201).json({
      message: 'Successfully joined the shop as employee',
      _id: user._id,
      name: user.name,
      email: user.email,
      role: 'employee',
      shopId,
      employeePermissions: permissions
    });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Invite link has expired' });
    }
    res.status(500).json({ message: 'Failed to join', error: error.message });
  }
};

// PATCH /api/shops/:shopId/employees/:userId/permissions — update permissions
export const updatePermissions = async (req: Request, res: Response) => {
  try {
    const { permissions } = req.body;
    const { shopId, userId } = req.params;

    const invalidPerms = (permissions || []).filter((p: string) => !EMPLOYEE_PERMISSIONS.includes(p));
    if (invalidPerms.length > 0) {
      return res.status(400).json({ message: `Invalid permissions: ${invalidPerms.join(', ')}` });
    }

    const user = await User.findOne({ _id: userId, shopId, role: 'employee' });
    if (!user) return res.status(404).json({ message: 'Employee not found in this shop' });

    user.employeePermissions = permissions;
    await user.save();

    res.json({ message: 'Permissions updated', employeePermissions: user.employeePermissions });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update permissions', error: error.message });
  }
};

// DELETE /api/shops/:shopId/employees/:userId — remove employee
export const removeEmployee = async (req: Request, res: Response) => {
  try {
    const { shopId, userId } = req.params;

    const user = await User.findOne({ _id: userId, shopId, role: 'employee' });
    if (!user) return res.status(404).json({ message: 'Employee not found in this shop' });

    // Revoke access — change to shopper, remove shopId
    user.role = 'shopper';
    user.shopId = undefined as any;
    user.employeePermissions = [];
    user.token = null;
    user.refreshToken = null;
    await user.save();

    res.json({ message: 'Employee removed from shop' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to remove employee', error: error.message });
  }
};
