import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface JwtPayload {
  id: string;
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.cookies.jwt) {
    try {
      token = req.cookies.jwt;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key_12345') as JwtPayload;

      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.token === token) {
        req.user = user;
        next();
      } else {
        res.status(401).json({ message: 'Not authorized, token invalidated' });
      }
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
export const admin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && (req.user as any).role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};
