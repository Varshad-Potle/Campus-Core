import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { bulkApplyCooldown, bulkClearCooldown } from '../services/bulk.service';
import { updateUserPermissions } from '../services/permission.service';
import { pool } from '../config/database';
import {
  openUpdateWindow,
  closeUpdateWindow,
  getUpdateWindowStatus,
} from '../services/updateWindow.service';

export const applyBulkCooldown = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { fieldName, studentIds } = req.body;

    if (!fieldName) {
      res.status(400).json({ success: false, message: 'fieldName is required' });
      return;
    }

    const result = await bulkApplyCooldown(fieldName, studentIds);

    await pool.query(
      `INSERT INTO audit_log (admin_id, action, metadata, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user!.userId,
        'BULK_COOLDOWN_APPLY',
        JSON.stringify(result),
        req.ip,
      ]
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearBulkCooldown = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { fieldName, studentIds } = req.body;

    if (!fieldName) {
      res.status(400).json({ success: false, message: 'fieldName is required' });
      return;
    }

    const result = await bulkClearCooldown(fieldName, studentIds);

    await pool.query(
      `INSERT INTO audit_log (admin_id, action, metadata, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user!.userId,
        'BULK_COOLDOWN_CLEAR',
        JSON.stringify(result),
        req.ip,
      ]
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setUserPermissions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, permissionMask } = req.body;

    if (!userId || permissionMask === undefined) {
      res.status(400).json({ success: false, message: 'userId and permissionMask are required' });
      return;
    }

    await updateUserPermissions(userId, BigInt(permissionMask));

    await pool.query(
      `INSERT INTO audit_log (admin_id, action, target_user_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user!.userId,
        'UPDATE_PERMISSIONS',
        userId,
        JSON.stringify({ permissionMask }),
        req.ip,
      ]
    );

    res.json({ success: true, message: 'Permissions updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const openWindow = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { durationSeconds = 3600 } = req.body;

    await openUpdateWindow(durationSeconds);

    await pool.query(
      `INSERT INTO audit_log (admin_id, action, metadata, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user!.userId,
        'UPDATE_WINDOW_OPEN',
        JSON.stringify({ durationSeconds }),
        req.ip,
      ]
    );

    res.json({
      success: true,
      message: `Update window opened for ${durationSeconds} seconds`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const closeWindow = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await closeUpdateWindow();

    await pool.query(
      `INSERT INTO audit_log (admin_id, action, metadata, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user!.userId,
        'UPDATE_WINDOW_CLOSE',
        JSON.stringify({}),
        req.ip,
      ]
    );

    res.json({ success: true, message: 'Update window closed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const windowStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const status = await getUpdateWindowStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};