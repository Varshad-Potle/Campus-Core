import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { Permissions } from '../utils/bitmask';
import { excelUpload } from '../config/multer';
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
  searchStudent,
  getStats,
  createStudentProfile,
  importStudentsExcel,
  getPasswordResetRequests,
  resetStudentPassword,
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
router.get('/students/search', authenticate, requirePermission(Permissions.ADMIN), searchStudent);
router.get('/stats', authenticate, requirePermission(Permissions.ADMIN), getStats);
router.post('/students/profile', authenticate, requirePermission(Permissions.ADMIN), createStudentProfile);
router.post(
  '/students/import',
  authenticate,
  requirePermission(Permissions.ADMIN),
  excelUpload.single('file'),
  importStudentsExcel
);
router.get(
  '/password-reset-requests',
  authenticate,
  requirePermission(Permissions.ADMIN),
  getPasswordResetRequests
);
router.post(
  '/students/:userId/reset-password',
  authenticate,
  requirePermission(Permissions.ADMIN),
  resetStudentPassword
);

export default router;