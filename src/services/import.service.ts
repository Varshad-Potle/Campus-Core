import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { DEFAULT_STUDENT_MASK } from '../utils/bitmask';

export interface ImportRow {
  name: string;
  email: string;
  roll_number: string;
  branch: string;
  parent_name: string;
  ssc_percentage?: number;
  hsc_diploma_percentage?: number;
}

export const parseImportExcel = async (buffer: Buffer): Promise<ImportRow[]> => {
  const workbook = new ExcelJS.Workbook();
  type ExcelBuffer = Parameters<typeof workbook.xlsx.load>[0];
  await workbook.xlsx.load(buffer as unknown as ExcelBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('No worksheet found');

  const rows: ImportRow[] = [];
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
      rowData[header] = values[index + 1]?.toString().trim() || '';
    });

    if (
      rowData['name'] &&
      rowData['email'] &&
      rowData['roll number'] &&
      rowData['branch'] &&
      rowData['parent name']
    ) {
      rows.push({
        name: rowData['name'],
        email: rowData['email'],
        roll_number: rowData['roll number'],
        branch: rowData['branch'],
        parent_name: rowData['parent name'],
        ssc_percentage: rowData['ssc %'] ? parseFloat(rowData['ssc %']) : undefined,
        hsc_diploma_percentage: rowData['hsc/diploma %']
          ? parseFloat(rowData['hsc/diploma %'])
          : undefined,
      });
    }
  });

  return rows;
};

export const importStudents = async (
  rows: ImportRow[],
  adminId: string
): Promise<{ imported: number; skipped: number; errors: string[] }> => {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existing = await client.query(
        'SELECT id FROM users WHERE email = $1', [row.email]
      );
      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE student_profiles
           SET ssc_percentage = $1,
               hsc_diploma_percentage = $2,
               updated_at = NOW()
           WHERE user_id = $3`,
          [row.ssc_percentage ?? null, row.hsc_diploma_percentage ?? null, existing.rows[0].id]
        );
        imported++;
        await client.query('COMMIT');
        continue;
      }

      const rollExists = await client.query(
        'SELECT id FROM student_profiles WHERE roll_number = $1', [row.roll_number]
      );
      if (rollExists.rows.length > 0) {
        skipped++;
        await client.query('ROLLBACK');
        continue;
      }

      const defaultPassword = `GCOEA@${row.roll_number}`;
      const hashed = await bcrypt.hash(defaultPassword, 12);

      const userResult = await client.query(
        `INSERT INTO users (name, email, password, role, permission_mask, is_first_login)
         VALUES ($1, $2, $3, 'student', $4, true)
         RETURNING id`,
        [row.name, row.email, hashed, DEFAULT_STUDENT_MASK.toString()]
      );

      const userId = userResult.rows[0].id;

      await client.query(
        `INSERT INTO student_profiles
           (user_id, roll_number, branch, parent_name, year,
            ssc_percentage, hsc_diploma_percentage)
         VALUES ($1, $2, $3, $4, 4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           ssc_percentage = EXCLUDED.ssc_percentage,
           hsc_diploma_percentage = EXCLUDED.hsc_diploma_percentage,
           updated_at = NOW()`,
        [
          userId,
          row.roll_number,
          row.branch,
          row.parent_name,
          row.ssc_percentage ?? null,
          row.hsc_diploma_percentage ?? null,
        ]
      );

      await client.query(
        `INSERT INTO audit_log (admin_id, action, target_user_id, metadata, ip_address)
         VALUES ($1, 'STUDENT_IMPORT', $2, $3, 'system')`,
        [adminId, userId, JSON.stringify({ roll_number: row.roll_number, email: row.email })]
      );

      await client.query('COMMIT');
      imported++;
    } catch (error: any) {
      await client.query('ROLLBACK');
      errors.push(`${row.roll_number}: ${error.message}`);
    } finally {
      client.release();
    }
  }

  return { imported, skipped, errors };
};
