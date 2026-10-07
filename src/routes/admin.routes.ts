import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { Permissions } from '../utils/bitmask';
import {
  applyBulkCooldown,
  clearBulkCooldown,
  setUserPermissions,
} from '../controllers/admin.controller';

const router = Router();

router.post(
  '/cooldown/apply',
  authenticate,
  requirePermission(Permissions.ADMIN),
  applyBulkCooldown
);

router.post(
  '/cooldown/clear',
  authenticate,
  requirePermission(Permissions.ADMIN),
  clearBulkCooldown
);

router.post(
  '/permissions',
  authenticate,
  requirePermission(Permissions.ADMIN),
  setUserPermissions
);

export default router;