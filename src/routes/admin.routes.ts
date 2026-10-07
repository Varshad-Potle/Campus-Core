import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { Permissions } from '../utils/bitmask';
import {
  applyBulkCooldown,
  clearBulkCooldown,
  setUserPermissions,
  openWindow,
  closeWindow,
  windowStatus,
  getAuditLog,
  getAllStudents,
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

router.post(
  '/window/open',
  authenticate,
  requirePermission(Permissions.ADMIN),
  openWindow
);

router.delete(
  '/window/close',
  authenticate,
  requirePermission(Permissions.ADMIN),
  closeWindow
);

router.get(
  '/window/status',
  authenticate,
  requirePermission(Permissions.ADMIN),
  windowStatus
);

router.get(
  '/audit-log',
  authenticate,
  requirePermission(Permissions.ADMIN),
  getAuditLog
);

router.get(
  '/students',
  authenticate,
  requirePermission(Permissions.ADMIN),
  getAllStudents
);

export default router;