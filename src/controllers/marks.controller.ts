import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { parseMarksExcel, uploadMarks } from '../services/marks.service';
import { pool } from '../config/database';

export const uploadMarksExcel = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { semester } = req.body;

    if (!semester || isNaN(parseInt(semester))) {
      res.status(400).json({ success: false, message: 'Valid semester (1-8) is required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Excel file is required' });
      return;
    }

    const semesterNum = parseInt(semester);
    if (semesterNum < 1 || semesterNum > 8) {
      res.status(400).json({ success: false, message: 'Semester must be between 1 and 8' });
      return;
    }

    const rows = await parseMarksExcel(req.file.buffer, semesterNum);

    if (rows.length === 0) {
      res.status(400).json({ success: false, message: 'No valid data found in Excel file' });
      return;
    }

    const result = await uploadMarks(rows, semesterNum, req.user!.userId);

    await pool.query(
      `INSERT INTO audit_log (admin_id, action, metadata, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        req.user!.userId,
        'MARKS_UPLOAD',
        JSON.stringify({ semester: semesterNum, ...result }),
        req.ip,
      ]
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentMarks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.userId || req.user!.userId;

    const result = await pool.query(
      `SELECT semester, subject, marks, grade, uploaded_at
       FROM marks
       WHERE user_id = $1
       ORDER BY semester ASC, subject ASC`,
      [userId]
    );

    const grouped = result.rows.reduce((acc: any, row: any) => {
      if (!acc[row.semester]) acc[row.semester] = [];
      acc[row.semester].push({
        subject: row.subject,
        marks: row.marks,
        grade: row.grade,
        uploaded_at: row.uploaded_at,
      });
      return acc;
    }, {});

    res.json({ success: true, data: grouped });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};