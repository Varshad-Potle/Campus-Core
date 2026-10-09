import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { checkProfileCooldown } from '../services/cooldown.service';
import { isUpdateWindowOpen } from '../services/updateWindow.service';

export const checkCooldown = async (
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

  const cooldown = await checkProfileCooldown(req.user.userId);

  if (cooldown.blocked) {
    res.status(429).json({
      success: false,
      message: 'Profile is on cooldown',
      unlocksAt: cooldown.unlocksAt,
      remainingDays: cooldown.remainingDays,
    });
    return;
  }

  next();
};