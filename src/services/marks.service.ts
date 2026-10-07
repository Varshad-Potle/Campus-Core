import ExcelJS from 'exceljs';
import { pool } from '../config/database';

export interface MarksRow {
  roll_number: string;
  subject: string;
  marks: number;
  grade: string;
}

export const parseMarksExcel = async (
  buffer: Buffer,
  semester: number
): Promise<MarksRow[]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in Excel file');
  }

  const rows: MarksRow[] = [];
  const headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        headers.push(cell.value?.toString().toLowerCase().trim() || '');
      });
      return;
    }

    const values = row.values as any[];
    const rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = values[index + 1];
    });

    if (rowData.roll_number && rowData.subject && rowData.marks !== undefined) {
      rows.push({
        roll_number: rowData.roll_number.toString().trim(),
        subject: rowData.subject.toString().trim(),
        marks: parseFloat(rowData.marks),
        grade: rowData.grade?.toString().trim() || calculateGrade(parseFloat(rowData.marks)),
      });
    }
  });

  return rows;
};

const calculateGrade = (marks: number): string => {
  if (marks >= 90) return 'O';
  if (marks >= 80) return 'A+';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'B+';
  if (marks >= 50) return 'B';
  if (marks >= 40) return 'C';
  return 'F';
};

export const uploadMarks = async (
  rows: MarksRow[],
  semester: number,
  adminId: string
): Promise<{ inserted: number; updated: number; errors: string[] }> => {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const userResult = await pool.query(
        'SELECT user_id FROM student_profiles WHERE roll_number = $1',
        [row.roll_number]
      );

      if (userResult.rows.length === 0) {
        errors.push(`Roll number ${row.roll_number} not found`);
        continue;
      }

      const userId = userResult.rows[0].user_id;

      const existing = await pool.query(
        'SELECT id FROM marks WHERE user_id = $1 AND semester = $2 AND subject = $3',
        [userId, semester, row.subject]
      );

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE marks SET marks = $1, grade = $2, uploaded_by = $3, uploaded_at = NOW()
           WHERE user_id = $4 AND semester = $5 AND subject = $6`,
          [row.marks, row.grade, adminId, userId, semester, row.subject]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO marks (user_id, semester, subject, marks, grade, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, semester, row.subject, row.marks, row.grade, adminId]
        );
        inserted++;
      }
    } catch (error: any) {
      errors.push(`Error processing ${row.roll_number}: ${error.message}`);
    }
  }

  return { inserted, updated, errors };
};