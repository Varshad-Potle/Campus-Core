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

export const getAuditLog = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT 
        a.id,
        a.action,
        a.metadata,
        a.ip_address,
        a.created_at,
        u.name as admin_name,
        u.email as admin_email,
        t.name as target_name,
        t.email as target_email
       FROM audit_log a
       LEFT JOIN users u ON a.admin_id = u.id
       LEFT JOIN users t ON a.target_user_id = t.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM audit_log');

    res.json({
      success: true,
      data: {
        logs: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit,
        offset,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllStudents = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, permission_mask, created_at
       FROM users
       WHERE role = 'student'
       ORDER BY created_at DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};