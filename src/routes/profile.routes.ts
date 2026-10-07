import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.middleware';
import { Permissions } from '../utils/bitmask';

const router = Router();

router.get(
  '/me',
  authenticate,
  requirePermission(Permissions.READ_PROFILE),
  (req: AuthRequest, res: Response) => {
    res.json({ success: true, data: req.user });
  }
);

export default router;