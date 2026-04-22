import express from 'express';
import { protect, admin, superadmin } from '../middleware/auth';
import { requireShopAccess } from '../middleware/requireShopAccess';
import {
  createShop, listShops, getShop, updateShop, deactivateShop,
  publicListShops, publicGetShop
} from '../controllers/shopController';
import {
  listEmployees, inviteEmployee, updatePermissions, removeEmployee
} from '../controllers/employeeController';

const router = express.Router();

// ── Public shop endpoints ──
router.get('/public', publicListShops);
router.get('/public/:slug', publicGetShop);

// ── Protected shop CRUD ──
router.post('/', protect, superadmin, createShop);
router.get('/', protect, superadmin, listShops);
router.get('/:shopId', protect, requireShopAccess, getShop);
router.patch('/:shopId', protect, requireShopAccess, updateShop);
router.delete('/:shopId', protect, superadmin, deactivateShop);

// ── Employee management (admin only) ──
router.get('/:shopId/employees', protect, admin, requireShopAccess, listEmployees);
router.post('/:shopId/employees/invite', protect, admin, requireShopAccess, inviteEmployee);
router.patch('/:shopId/employees/:userId/permissions', protect, admin, requireShopAccess, updatePermissions);
router.delete('/:shopId/employees/:userId', protect, admin, requireShopAccess, removeEmployee);

export default router;
