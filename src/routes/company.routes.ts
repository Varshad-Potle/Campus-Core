import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { Permissions } from '../utils/bitmask';
import { checkCooldown } from '../middleware/cooldown.middleware';
import {
  createCompany,
  updateCompany,
  adminListCompanies,
  getCompanyApplicants,
  updateApplicationStatus,
  studentListCompanies,
  applyToCompany,
  myApplications,
} from '../controllers/company.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ── Student routes ─────────────────────────────────────────────────────────────
// List active companies with per-student eligibility flag
router.get('/', requirePermission(Permissions.READ_PROFILE), studentListCompanies);

// Apply to a company
router.post('/:companyId/apply', requirePermission(Permissions.READ_PROFILE), applyToCompany);

// View own application history
router.get('/my-applications', requirePermission(Permissions.READ_PROFILE), myApplications);

// ── Admin routes ───────────────────────────────────────────────────────────────
// List all companies with applicant counts
router.get('/admin/all', requirePermission(Permissions.ADMIN), adminListCompanies);

// Create a new company
router.post('/admin', requirePermission(Permissions.ADMIN), createCompany);

// Update a company
router.patch('/admin/:id', requirePermission(Permissions.ADMIN), updateCompany);

// Get all applicants for a specific company
router.get('/admin/:id/applicants', requirePermission(Permissions.ADMIN), getCompanyApplicants);

// Update an application's status (applied → shortlisted → interview → selected/rejected)
router.patch(
  '/admin/applications/:applicationId/status',
  requirePermission(Permissions.ADMIN),
  updateApplicationStatus
);

export default router;