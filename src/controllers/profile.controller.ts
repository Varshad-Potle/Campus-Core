import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { pool } from '../config/database';
import { setCooldown } from '../services/cooldown.service';

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

    await setCooldown(userId, 'name');

    res.json({
      success: true,
      message: 'Name updated. Cooldown of 15 days applied.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};