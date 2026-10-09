import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { checkCooldown } from '../middleware/cooldown.middleware';
import { Permissions } from '../utils/bitmask';
import { photoUpload, resumeUpload, documentsUpload } from '../config/multer';
import {
  getProfile,
  updateProfile,
  uploadPhoto,
  uploadResume,
  uploadDocuments,
  getCooldownStatus,
} from '../controllers/profile.controller';

const router = Router();

router.get('/me', authenticate, requirePermission(Permissions.READ_PROFILE), getProfile);

router.get('/cooldown', authenticate, getCooldownStatus);

router.patch(
  '/update',
  authenticate,
  requirePermission(Permissions.UPDATE_PROFILE),
  checkCooldown,
  updateProfile
);

router.post(
  '/photo',
  authenticate,
  requirePermission(Permissions.UPLOAD_FILES),
  checkCooldown,
  photoUpload.single('photo'),
  uploadPhoto
);

router.post(
  '/resume',
  authenticate,
  requirePermission(Permissions.UPLOAD_FILES),
  checkCooldown,
  resumeUpload.single('resume'),
  uploadResume
);

router.post(
  '/documents',
  authenticate,
  requirePermission(Permissions.UPLOAD_FILES),
  checkCooldown,
  documentsUpload.single('documents'),
  uploadDocuments
);

export default router;