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
  getActiveWindow,
  getAuditLog,
  getAllStudents,
  searchStudentByRoll,
  getStats,
  createStudentProfile,
} from '../controllers/admin.controller';

const router = Router();

router.post('/cooldown/apply', authenticate, requirePermission(Permissions.ADMIN), applyBulkCooldown);
router.post('/cooldown/clear', authenticate, requirePermission(Permissions.ADMIN), clearBulkCooldown);
router.post('/permissions', authenticate, requirePermission(Permissions.ADMIN), setUserPermissions);

router.post('/window/open', authenticate, requirePermission(Permissions.ADMIN), openWindow);
router.delete('/window/close', authenticate, requirePermission(Permissions.ADMIN), closeWindow);
router.get('/window/status', authenticate, requirePermission(Permissions.ADMIN), windowStatus);
router.get('/window/active', authenticate, getActiveWindow);

router.get('/audit-log', authenticate, requirePermission(Permissions.ADMIN), getAuditLog);
router.get('/students', authenticate, requirePermission(Permissions.ADMIN), getAllStudents);
router.get('/students/search', authenticate, requirePermission(Permissions.ADMIN), searchStudentByRoll);
router.get('/stats', authenticate, requirePermission(Permissions.ADMIN), getStats);
router.post('/students/profile', authenticate, requirePermission(Permissions.ADMIN), createStudentProfile);

export default router;