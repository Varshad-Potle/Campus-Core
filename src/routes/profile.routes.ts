import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.middleware';
import { checkFieldCooldown } from '../middleware/cooldown.middleware';
import { Permissions } from '../utils/bitmask';
import { updateName } from '../controllers/profile.controller';

const router = Router();

router.get(
  '/me',
  authenticate,
  requirePermission(Permissions.READ_PROFILE),
  (req: AuthRequest, res: Response) => {
    res.json({ success: true, data: req.user });
  }
);

router.patch(
  '/update/name',
  authenticate,
  requirePermission(Permissions.UPDATE_PROFILE),
  checkFieldCooldown('name'),
  updateName
);

export default router;