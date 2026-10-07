import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { checkCooldown } from '../services/cooldown.service';
import { isUpdateWindowOpen } from '../services/updateWindow.service';

export const checkFieldCooldown = (fieldName: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const windowOpen = await isUpdateWindowOpen();
    if (windowOpen) {
      next();
      return;
    }

    const cooldown = await checkCooldown(req.user.userId, fieldName);

    if (cooldown.blocked) {
      const remainingDays = Math.ceil(cooldown.remainingMs! / (1000 * 60 * 60 * 24));
      res.status(429).json({
        success: false,
        message: `Field '${fieldName}' is on cooldown`,
        unlocksAt: cooldown.unlocksAt,
        remainingDays,
      });
      return;
    }

    next();
  };
};