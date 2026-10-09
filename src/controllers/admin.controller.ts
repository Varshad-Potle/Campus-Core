import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { bulkApplyCooldown, bulkClearCooldown } from '../services/bulk.service';
import { updateUserPermissions } from '../services/permission.service';
import {
  openUpdateWindow,
  closeUpdateWindow,
  getUpdateWindowStatus,
} from '../services/updateWindow.service';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export const applyBulkCooldown = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fieldName, studentIds } = req.body;
    if (!fieldName) {
      res.status(400).json({ success: false, message: 'fieldName is required' });
      return;
    }
    const result = await bulkApplyCooldown(fieldName, studentIds);
    await pool.query(
      `INSERT INTO audit_log (admin_id, action, metadata, ip_address) VALUES ($1, $2, $3, $4)`,
      [req.user!.userId, 'BULK_COOLDOWN_APPLY', JSON.stringify(result), req.ip]
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearBulkCooldown = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fieldName, studentIds } = req.body;
    if (!fieldName) {
      res.status(400).json({ success: false, message: 'fieldName is required' });
      return;
    }
    const result = await bulkClearCooldown(fieldName, studentIds);
    await pool.query(
      `INSERT INTO audit_log (admin_id, action, metadata, ip_address) VALUES ($1, $2, $3, $4)`,
      [req.user!.userId, 'BULK_COOLDOWN_CLEAR', JSON.stringify(result), req.ip]
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setUserPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, permissionMask } = req.body;
    if (!userId || permissionMask === undefined) {
      res.status(400).json({ success: false, message: 'userId and permissionMask are required' });
      return;
    }
    await updateUserPermissions(userId, BigInt(permissionMask));
    await pool.query(
      `INSERT INTO audit_log (admin_id, action, target_user_id, metadata, ip_address) VALUES ($1, $2, $3, $4, $5)`,
      [req.user!.userId, 'UPDATE_PERMISSIONS', userId, JSON.stringify({ permissionMask }), req.ip]
    );
    res.json({ success: true, message: 'Permissions updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const openWindow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { durationSeconds = 3600, message, fieldsToUpdate = [] } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'message is required' });
      return;
    }

    const windowId = uuidv4();

    await pool.query(
      `INSERT INTO update_windows (id, message, fields_to_update, duration_seconds, opened_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [windowId, message, fieldsToUpdate, durationSeconds, req.user!.userId]
    );

    await openUpdateWindow(windowId, durationSeconds, message, fieldsToUpdate);

    await pool.query(
      `INSERT INTO audit_log (admin_id, action, metadata, ip_address) VALUES ($1, $2, $3, $4)`,
      [req.user!.userId, 'UPDATE_WINDOW_OPEN', JSON.stringify({ durationSeconds, message, fieldsToUpdate }), req.ip]
    );

    res.json({ success: true, message: `Update window opened for ${durationSeconds} seconds`, windowId });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const closeWindow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query(
      `UPDATE update_windows SET closed_at = NOW()
       WHERE id = (
         SELECT id FROM update_windows
         WHERE closed_at IS NULL
         ORDER BY opened_at DESC
         LIMIT 1
       )`
    );
    await closeUpdateWindow();
    await pool.query(
      `INSERT INTO audit_log (admin_id, action, metadata, ip_address) VALUES ($1, $2, $3, $4)`,
      [req.user!.userId, 'UPDATE_WINDOW_CLOSE', JSON.stringify({}), req.ip]
    );
    res.json({ success: true, message: 'Update window closed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const windowStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = await getUpdateWindowStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveWindow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = await getUpdateWindowStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(
      `SELECT a.id, a.action, a.metadata, a.ip_address, a.created_at,
              u.name as admin_name, u.email as admin_email,
              t.name as target_name, t.email as target_email
       FROM audit_log a
       LEFT JOIN users u ON a.admin_id = u.id
       LEFT JOIN users t ON a.target_user_id = t.id
       ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM audit_log');

    res.json({
      success: true,
      data: { logs: result.rows, total: parseInt(countResult.rows[0].count), limit, offset },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              sp.roll_number, sp.branch, sp.year, sp.placement_status,
              sp.company_name, sp.job_role, sp.ctc_lakhs, sp.photo_url
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.role = 'student'
       ORDER BY sp.roll_number ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchStudentByRoll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rollNo } = req.query;

    if (!rollNo) {
      res.status(400).json({ success: false, message: 'rollNo query param is required' });
      return;
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              sp.roll_number, sp.branch, sp.parent_name, sp.year,
              sp.phone, sp.permanent_address, sp.photo_url,
              sp.resume_url, sp.documents_url,
              sp.placement_status, sp.company_name, sp.job_role, sp.ctc_lakhs
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       WHERE sp.roll_number ILIKE $1`,
      [`%${rollNo}%`]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'No student found with that roll number' });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [studentsResult, windowsResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE role = 'student'`),
      pool.query(`
        SELECT uw.id, uw.message, uw.opened_at, uw.closed_at,
               COUNT(ws.id) as submissions
        FROM update_windows uw
        LEFT JOIN window_submissions ws ON ws.window_id = uw.id
        GROUP BY uw.id
        ORDER BY uw.opened_at DESC
        LIMIT 10
      `),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents: parseInt(studentsResult.rows[0].count),
        windows: windowsResult.rows,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStudentProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, rollNumber, branch, parentName } = req.body;

    if (!userId || !rollNumber || !branch || !parentName) {
      res.status(400).json({
        success: false,
        message: 'userId, rollNumber, branch and parentName are required',
      });
      return;
    }

    await pool.query(
      `INSERT INTO student_profiles (user_id, roll_number, branch, parent_name, year)
       VALUES ($1, $2, $3, $4, 4)`,
      [userId, rollNumber, branch, parentName]
    );

    res.status(201).json({ success: true, message: 'Student profile created' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};