import { Response, Router } from 'express';
import { authenticate, AuthRequest, requirePermission } from '../middleware/auth.middleware';
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
  finalSubmit,
} from '../controllers/profile.controller';

const router = Router();

router.get(
  '/rbac-bench',
  authenticate,
  requirePermission(Permissions.READ_PROFILE),
  (req: AuthRequest, res: Response) => {
    res.json({ success: true, ts: Date.now() });
  }
);

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
  '/photo/temp',
  authenticate,
  requirePermission(Permissions.UPLOAD_FILES),
  photoUpload.single('photo'),
  uploadPhoto
);

router.post(
  '/resume/temp',
  authenticate,
  requirePermission(Permissions.UPLOAD_FILES),
  resumeUpload.single('resume'),
  uploadResume
);

router.post(
  '/documents/temp',
  authenticate,
  requirePermission(Permissions.UPLOAD_FILES),
  documentsUpload.single('documents'),
  uploadDocuments
);

router.post(
  '/submit',
  authenticate,
  requirePermission(Permissions.UPDATE_PROFILE),
  checkCooldown,
  finalSubmit
);

export default router;