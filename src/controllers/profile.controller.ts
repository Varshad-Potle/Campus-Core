import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { pool } from '../config/database';
import { checkCooldown, setCooldown } from '../services/cooldown.service';
import { isUpdateWindowOpen } from '../services/updateWindow.service';

export const getMyProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.id AS user_id, u.name, u.email, u.role,
              sp.roll_number, sp.branch, sp.parent_name, sp.phone,
              sp.permanent_address, sp.photo_url, sp.resume_url
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Profile not found' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfileUpdateStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const fields = ['name', 'phone', 'permanent_address'] as const;
    const updateWindowOpen = await isUpdateWindowOpen();
    const profileCooldown = await checkCooldown(userId, 'profile');
    const cooldowns = fields.map((field) => [field, {
      blocked: updateWindowOpen ? false : profileCooldown.blocked,
      unlocksAt: profileCooldown.unlocksAt,
      remainingDays: updateWindowOpen || !profileCooldown.blocked
        ? 0
        : Math.ceil(profileCooldown.remainingMs! / (1000 * 60 * 60 * 24)),
    }] as const);

    res.json({
      success: true,
      data: {
        updateWindowOpen,
        fields: Object.fromEntries(cooldowns),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, phone, permanentAddress } = req.body ?? {};
    const updates: string[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
        res.status(400).json({ success: false, message: 'Name must be between 1 and 100 characters' });
        return;
      }
      updates.push('name');
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string' || phone.length > 15) {
        res.status(400).json({ success: false, message: 'Phone must be 15 characters or fewer' });
        return;
      }
      updates.push('phone');
    }

    if (permanentAddress !== undefined) {
      if (typeof permanentAddress !== 'string' || permanentAddress.length > 2000) {
        res.status(400).json({ success: false, message: 'Address is too long' });
        return;
      }
      updates.push('permanent_address');
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: 'No editable fields provided' });
      return;
    }

    if (!(await isUpdateWindowOpen())) {
      const cooldown = await checkCooldown(userId, 'profile');
      if (cooldown.blocked) {
        const remainingDays = Math.ceil(cooldown.remainingMs! / (1000 * 60 * 60 * 24));
        res.status(429).json({
          success: false,
          message: 'Profile updates are on cooldown',
          unlocksAt: cooldown.unlocksAt,
          remainingDays,
        });
        return;
      }
    }

    if (name !== undefined) {
      await pool.query('UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2', [name.trim(), userId]);
    }

    if (phone !== undefined || permanentAddress !== undefined) {
      await pool.query(
        `UPDATE student_profiles
         SET phone = COALESCE($1, phone),
             permanent_address = COALESCE($2, permanent_address),
             updated_at = NOW()
         WHERE user_id = $3`,
        [phone === undefined ? null : phone.trim(), permanentAddress === undefined ? null : permanentAddress.trim(), userId]
      );
    }

    if (!(await isUpdateWindowOpen())) await setCooldown(userId, 'profile');

    res.json({ success: true, message: 'Profile updated successfully', fields: updates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateName = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body;
    const name = body?.name;
    const userId = req.user!.userId;

    if (!name) {
      res.status(400).json({ success: false, message: 'name is required' });
      return;
    }

    await pool.query(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
      [name, userId]
    );

    await setCooldown(userId, 'profile');

    res.json({
      success: true,
      message: 'Name updated. Cooldown of 15 days applied.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};