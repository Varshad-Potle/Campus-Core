import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { hasPermission } from '../utils/bitmask';
import { getCachedPermissions } from '../services/permission.service';
import { JwtPayload } from '../types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const permissionMask = await getCachedPermissions(decoded.userId);
    decoded.permissionMask = permissionMask.toString();

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requirePermission = (requiredMask: bigint) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const userMask = BigInt(req.user.permissionMask);

    if (!hasPermission(userMask, requiredMask)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  };
};