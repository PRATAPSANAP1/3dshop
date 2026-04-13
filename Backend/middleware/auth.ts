import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
  id: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token;

  // 1. Check Cookies (Primary for Web)
  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } 
  // 2. Check Authorization Header (Primary for Mobile)
  else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key_12345') as JwtPayload;
    const user = await User.findById(decoded.id).select('-password');
    
    // Safety check: Token must match what is stored on user (allows remote invalidation)
    if (!user || (user.token && user.token !== token)) {
      res.status(401).json({ message: 'Token is outdated or user no longer exists.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ message: 'This account has been suspended.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH_ERROR]:', error);
    res.status(401).json({ message: 'Invalid or expired session. Please re-authenticate.' });
  }
};
export const admin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && (req.user as any).role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Restricted Access: Administrative privileges required.' });
  }
};
