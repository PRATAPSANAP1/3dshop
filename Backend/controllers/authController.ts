import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { createAuditLog } from '../middleware/audit';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'dev_secret_key_12345', {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_98765', {
    expiresIn: '7d',
  });
};

const setCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('jwt', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, shopName, mobile, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ name, email, password, shopName, mobile, role: role || 'customer' });

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.token = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    setCookies(res, accessToken, refreshToken);

    await createAuditLog(user, 'AUTH_REGISTER', 'User', 'New user registered');
    
    // Return user data + tokens (for mobile storage)
    res.status(201).json({ 
      _id: user._id, 
      name, 
      email, 
      shopName, 
      role: user.role,
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await (user as any).matchPassword(password))) {
      if (role && user.role !== role) {
        return res.status(401).json({ message: `Access denied. Account is not a ${role}` });
      }

      const accessToken = generateAccessToken(user._id.toString(), user.role);
      const refreshToken = generateRefreshToken(user._id.toString());

      user.token = accessToken;
      user.refreshToken = refreshToken;
      await user.save();

      setCookies(res, accessToken, refreshToken);

      await createAuditLog(user, 'AUTH_LOGIN', 'User', 'User logged in');
      
      // Return user data + tokens (for mobile storage)
      res.json({ 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        shopName: user.shopName, 
        role: user.role,
        accessToken,
        refreshToken
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Not authorized, no refresh token' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_98765') as any;
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Not authorized, invalid refresh token' });
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    user.token = accessToken;
    await user.save();

    res.json({ 
      message: 'Token refreshed',
      accessToken 
    });
  } catch (error) {
    res.status(401).json({ message: 'Refresh session expired. Please log in again.' });
  }
};

export const logout = async (req: Request, res: Response) => {
  if (req.user) {
    const user = await User.findById((req.user as any)._id);
    if (user) {
      await createAuditLog(user, 'AUTH_LOGOUT', 'User', 'User logged out');
      user.token = null;
      user.refreshToken = null;
      await user.save();
    }
  }
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0), secure: true, sameSite: 'none' });
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0), secure: true, sameSite: 'none' });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  if (req.user) {
    const user = await User.findById((req.user as any)._id).select('-password -token -refreshToken');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const { name, email, mobile, shopName, password } = req.body;
  const user = await User.findById((req.user as any)._id);

  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.shopName = shopName || user.shopName;
    if (password) user.password = password;

    const updatedUser = await user.save();
    res.json({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, shopName: updatedUser.shopName, role: updatedUser.role });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-password -token -refreshToken').sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error fetching users', error: error.message });
  }
};

export const blockUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    // Clear tokens if blocking
    if (user.isBlocked) {
      user.token = null;
      user.refreshToken = null;
    }
    await user.save();
    res.json({ message: user.isBlocked ? 'User blocked' : 'User unblocked', isBlocked: user.isBlocked });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!['admin', 'customer', 'staff'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password -token -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found with this email' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user with 10 min expiry
    user.resetPasswordToken = otp;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to your provider
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });

    const mailOptions = {
      from: `"3Dshop Security" <${process.env.EMAIL_USER || 'no-reply@3dshop.com'}>`,
      to: email,
      subject: 'Your Password Reset OTP',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #334155;">
          <h2 style="color: #EA580C;">Password Reset Request</h2>
          <p>You requested a password reset for your 3Dshop account. Use the 6-digit OTP below to proceed:</p>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #0f172a;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #64748b;">This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[PASS_RESET] OTP sent to ${email}`);
    
    res.json({ message: 'OTP sent to your email address' });
  } catch (error: any) {
    console.error('ForgotPassword Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ 
      email,
      resetPasswordToken: otp,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { email, name } = payload;
    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10);
      user = new User({
        name,
        email,
        password: randomPassword,
        role: 'customer'
      });
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    user.token = accessToken;
    user.refreshToken = refreshToken;
    await user.save();

    setCookies(res, accessToken, refreshToken);

    await createAuditLog(user, 'GOOGLE_AUTH_LOGIN', 'User', `User logged in via Google: ${email}`);
    res.json({ _id: user._id, name: user.name, email: user.email, shopName: user.shopName, role: user.role });
  } catch (error: any) {
    console.error('Google Login Error:', error);
    res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
};
