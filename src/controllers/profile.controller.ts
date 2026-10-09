import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { pool } from '../config/database';
import { setProfileCooldown, checkProfileCooldown } from '../services/cooldown.service';
import { redisClient } from '../config/redis';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role,
              sp.roll_number, sp.branch, sp.parent_name, sp.year,
              sp.phone, sp.permanent_address, sp.photo_url,
              sp.resume_url, sp.documents_url,
              sp.placement_status, sp.company_name, sp.job_role, sp.ctc_lakhs,
              sp.updated_at
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    const cooldown = await checkProfileCooldown(userId);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        cooldown: cooldown.blocked
          ? { blocked: true, remainingDays: cooldown.remainingDays, unlocksAt: cooldown.unlocksAt }
          : { blocked: false },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { phone, permanent_address, placement_status, company_name, job_role, ctc_lakhs } = req.body;

    if (placement_status && !['placed', 'unplaced'].includes(placement_status)) {
      res.status(400).json({ success: false, message: 'placement_status must be placed or unplaced' });
      return;
    }

    if (placement_status === 'placed' && (!company_name || !job_role || !ctc_lakhs)) {
      res.status(400).json({ success: false, message: 'company_name, job_role and ctc_lakhs are required when placed' });
      return;
    }

    await pool.query(
      `UPDATE student_profiles SET
        phone = COALESCE($1, phone),
        permanent_address = COALESCE($2, permanent_address),
        placement_status = COALESCE($3, placement_status),
        company_name = CASE WHEN $3 = 'unplaced' THEN NULL ELSE COALESCE($4, company_name) END,
        job_role = CASE WHEN $3 = 'unplaced' THEN NULL ELSE COALESCE($5, job_role) END,
        ctc_lakhs = CASE WHEN $3 = 'unplaced' THEN NULL ELSE COALESCE($6, ctc_lakhs) END,
        updated_at = NOW()
       WHERE user_id = $7`,
      [phone, permanent_address, placement_status, company_name, job_role, ctc_lakhs, userId]
    );

    await setProfileCooldown(userId);

    const windowOpen = await redisClient.get('admin:update-window');
    if (windowOpen) {
      const windowData = await redisClient.get('admin:update-window-id');
      if (windowData) {
        await pool.query(
          `INSERT INTO window_submissions (window_id, user_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [windowData, userId]
        );
      }
    }

    res.json({ success: true, message: 'Profile updated. Locked for 15 days.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Photo file is required' });
      return;
    }

    const photoUrl = `/uploads/photos/${req.file.filename}`;

    await pool.query(
      'UPDATE student_profiles SET photo_url = $1, updated_at = NOW() WHERE user_id = $2',
      [photoUrl, userId]
    );

    await setProfileCooldown(userId);

    res.json({ success: true, message: 'Photo uploaded. Profile locked for 15 days.', photoUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Resume PDF is required' });
      return;
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    await pool.query(
      'UPDATE student_profiles SET resume_url = $1, updated_at = NOW() WHERE user_id = $2',
      [resumeUrl, userId]
    );

    await setProfileCooldown(userId);

    res.json({ success: true, message: 'Resume uploaded. Profile locked for 15 days.', resumeUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Documents PDF is required' });
      return;
    }

    const documentsUrl = `/uploads/documents/${req.file.filename}`;

    await pool.query(
      'UPDATE student_profiles SET documents_url = $1, updated_at = NOW() WHERE user_id = $2',
      [documentsUrl, userId]
    );

    await setProfileCooldown(userId);

    res.json({ success: true, message: 'Documents uploaded. Profile locked for 15 days.', documentsUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCooldownStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cooldown = await checkProfileCooldown(req.user!.userId);
    res.json({ success: true, data: cooldown });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};