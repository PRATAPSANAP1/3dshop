import express from 'express';
import { login, register, logout, getMe, updateProfile, refresh, getAllUsers, forgotPassword, resetPassword, blockUser, updateUserRole, googleLogin } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getAllUsers);
router.put('/users/:id/block', protect, blockUser);
router.put('/users/:id/role', protect, updateUserRole);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
