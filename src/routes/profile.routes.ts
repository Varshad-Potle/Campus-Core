import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.middleware';
import { checkFieldCooldown } from '../middleware/cooldown.middleware';
import { Permissions } from '../utils/bitmask';
import { getMyProfile, getProfileUpdateStatus, updateName, updateProfile } from '../controllers/profile.controller';
import { getStudentMarks } from '../controllers/marks.controller';

const router = Router();

router.get(
  '/me',
  authenticate,
  requirePermission(Permissions.READ_PROFILE),
  getMyProfile
);

router.patch(
  '/update',
  authenticate,
  requirePermission(Permissions.UPDATE_PROFILE),
  updateProfile
);

router.get(
  '/update/status',
  authenticate,
  requirePermission(Permissions.READ_PROFILE),
  getProfileUpdateStatus
);

router.patch(
  '/update/name',
  authenticate,
  requirePermission(Permissions.UPDATE_PROFILE),
  checkFieldCooldown('profile'),
  updateName
);

router.get(
  '/marks',
  authenticate,
  requirePermission(Permissions.READ_RESULTS),
  getStudentMarks
);
export default router;