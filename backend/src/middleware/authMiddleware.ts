
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

// Extend Express's Request type to include our user payload
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  // Check for the token in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };

      // Attach user to the request object
      req.user = decoded;

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Alias for protect to maintain compatibility
export const authenticateToken = protect;

export const authorizeTeacher = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Access denied. Teacher role required.' });
  }
  next();
};
