import express from 'express';
import { login, register, logout, getMe, updateProfile, refresh, getAllUsers, forgotPassword, resetPassword, blockUser, updateUserRole, googleLogin, requestProfilePasswordOtp, updateProfilePasswordWithOtp } from '../controllers/authController';
import { protect, admin } from '../middleware/auth';

import { joinAsEmployee } from '../controllers/employeeController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.post('/join', joinAsEmployee);  // Employee invite acceptance
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/profile/request-password-otp', protect, requestProfilePasswordOtp);
router.post('/profile/update-password-otp', protect, updateProfilePasswordWithOtp);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/block', protect, admin, blockUser);
router.put('/users/:id/role', protect, admin, updateUserRole);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
