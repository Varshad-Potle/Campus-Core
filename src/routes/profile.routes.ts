import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.middleware';
import { checkFieldCooldown } from '../middleware/cooldown.middleware';
import { Permissions } from '../utils/bitmask';
import { updateName } from '../controllers/profile.controller';
import { getStudentMarks } from '../controllers/marks.controller';

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

router.get(
  '/marks',
  authenticate,
  requirePermission(Permissions.READ_RESULTS),
  getStudentMarks
);
export default router;