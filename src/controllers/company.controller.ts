import { Request, Response } from 'express';
import { pool } from '../config/database';

// ─── Admin: Create company ────────────────────────────────────────────────────
export const createCompany = async (req: Request, res: Response) => {
  const adminId = (req as any).user.userId;
  const {
    name, description, visit_date,
    application_deadline,
    min_ssc_percentage, min_hsc_percentage, min_cgpa,
    ctc_lakhs,
    internship_offered, internship_paid, internship_stipend, internship_duration_months,
    ppo_opportunity,
    service_bond_months, service_bond_amount,
    note,
  } = req.body;

  if (!name) return res.status(400).json({ success: false, message: 'Company name is required' });

  try {
    const result = await pool.query(
      `INSERT INTO companies
        (name, description, visit_date, application_deadline,
         min_ssc_percentage, min_hsc_percentage, min_cgpa,
         ctc_lakhs, internship_offered, internship_paid,
         internship_stipend, internship_duration_months,
         ppo_opportunity, service_bond_months, service_bond_amount,
         note, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        name,
        description || null,
        visit_date || null,
        application_deadline || null,
        min_ssc_percentage || null,
        min_hsc_percentage || null,
        min_cgpa || null,
        ctc_lakhs || null,
        internship_offered ?? false,
        internship_offered ? (internship_paid ?? null) : null,
        internship_offered ? (internship_stipend || null) : null,
        internship_offered ? (internship_duration_months || null) : null,
        ppo_opportunity ?? false,
        service_bond_months || null,
        service_bond_amount || null,
        note || null,
        adminId,
      ]
    );
    const company = result.rows[0];
    await pool.query(
      `INSERT INTO audit_log (admin_id, action, metadata, ip_address)
       VALUES ($1, 'COMPANY_CREATED', $2, $3)`,
      [
        adminId,
        JSON.stringify({
          company_id: company.id,
          name: company.name,
          ctc_lakhs: company.ctc_lakhs,
        }),
        req.ip || 'system',
      ]
    );
    res.status(201).json({ success: true, data: company });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: Update company ────────────────────────────────────────────────────
export const updateCompany = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name, description, visit_date,
    application_deadline,
    min_ssc_percentage, min_hsc_percentage, min_cgpa,
    ctc_lakhs,
    internship_offered, internship_paid, internship_stipend, internship_duration_months,
    ppo_opportunity,
    service_bond_months, service_bond_amount,
    note, is_active,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE companies SET
        name                       = COALESCE($1, name),
        description                = COALESCE($2, description),
        visit_date                 = COALESCE($3, visit_date),
        min_ssc_percentage         = $4,
        min_hsc_percentage         = $5,
        min_cgpa                   = $6,
        ctc_lakhs                  = $7,
        internship_offered         = COALESCE($8, internship_offered),
        internship_paid            = $9,
        internship_stipend         = $10,
        internship_duration_months = $11,
        ppo_opportunity            = COALESCE($12, ppo_opportunity),
        service_bond_months        = $13,
        service_bond_amount        = $14,
        note                       = $15,
        is_active                  = COALESCE($16, is_active),
        application_deadline       = $18,
        updated_at                 = NOW()
       WHERE id = $17 RETURNING *`,
      [
        name || null, description, visit_date || null,
        min_ssc_percentage ?? null, min_hsc_percentage ?? null, min_cgpa ?? null,
        ctc_lakhs ?? null,
        internship_offered,
        internship_paid ?? null, internship_stipend ?? null, internship_duration_months ?? null,
        ppo_opportunity,
        service_bond_months ?? null, service_bond_amount ?? null,
        note ?? null,
        is_active,
        id,
        application_deadline ?? null,
      ]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: List all companies with applicant counts ─────────────────────────
export const adminListCompanies = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        COUNT(a.id) FILTER (WHERE a.status = 'applied')     AS applied_count,
        COUNT(a.id) FILTER (WHERE a.status = 'shortlisted') AS shortlisted_count,
        COUNT(a.id) FILTER (WHERE a.status = 'interview')   AS interview_count,
        COUNT(a.id) FILTER (WHERE a.status = 'selected')    AS selected_count,
        COUNT(a.id) FILTER (WHERE a.status = 'rejected')    AS rejected_count
       FROM companies c
       LEFT JOIN applications a ON a.company_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
  console.error('adminListCompanies error:', err);
  res.status(500).json({ success: false, message: err.message });
}
};

// ─── Admin: Get applicants for one company ────────────────────────────────────
export const getCompanyApplicants = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT
        a.id AS application_id, a.status, a.applied_at, a.updated_at,
        u.id AS student_id, u.email, u.name,
        sp.roll_number, sp.branch, sp.year, sp.phone,
        sp.ssc_percentage, sp.hsc_diploma_percentage, sp.cgpa
       FROM applications a
       JOIN users u ON u.id = a.student_id
       JOIN student_profiles sp ON sp.user_id = a.student_id
       WHERE a.company_id = $1
       ORDER BY a.applied_at DESC`,
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: Update application status ────────────────────────────────────────
export const updateApplicationStatus = async (req: Request, res: Response) => {
  const { applicationId } = req.params;
  const { status } = req.body;
  const adminId = (req as any).user.userId;

  const allowed = ['applied', 'shortlisted', 'interview', 'selected', 'rejected'];
  if (!allowed.includes(status))
    return res.status(400).json({ success: false, message: 'Invalid status' });

  try {
    const result = await pool.query(
      `UPDATE applications SET status = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3 RETURNING *`,
      [status, adminId, applicationId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Student: List active companies with eligibility flag ─────────────────────
export const studentListCompanies = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  try {
    const result = await pool.query(
      `SELECT
        c.*,
        COALESCE(
          (
            (c.min_ssc_percentage IS NULL OR sp.ssc_percentage >= c.min_ssc_percentage) AND
            (c.min_hsc_percentage  IS NULL OR sp.hsc_diploma_percentage >= c.min_hsc_percentage) AND
            (c.min_cgpa            IS NULL OR sp.cgpa >= c.min_cgpa)
          ), false
        ) AS is_eligible,
        CASE
          WHEN c.min_ssc_percentage IS NOT NULL
            AND (sp.ssc_percentage IS NULL OR sp.ssc_percentage < c.min_ssc_percentage)
            THEN 'SSC ' || c.min_ssc_percentage || '% required'
          WHEN c.min_hsc_percentage IS NOT NULL
            AND (sp.hsc_diploma_percentage IS NULL OR sp.hsc_diploma_percentage < c.min_hsc_percentage)
            THEN 'HSC/Diploma ' || c.min_hsc_percentage || '% required'
          WHEN c.min_cgpa IS NOT NULL
            AND (sp.cgpa IS NULL OR sp.cgpa < c.min_cgpa)
            THEN 'CGPA ' || c.min_cgpa || ' required'
          ELSE NULL
        END AS ineligibility_reason,
        a.id     AS application_id,
        a.status AS application_status,
        a.applied_at
       FROM companies c
       CROSS JOIN student_profiles sp
       LEFT JOIN applications a ON a.company_id = c.id AND a.student_id = $1
       WHERE c.is_active = TRUE AND sp.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Student: Apply to a company ──────────────────────────────────────────────
export const applyToCompany = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { companyId } = req.params;

  try {
    // 1. Company exists and active?
    const companyRes = await pool.query(
      'SELECT * FROM companies WHERE id = $1 AND is_active = TRUE',
      [companyId]
    );
    if (companyRes.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Company not found or inactive' });
    const company = companyRes.rows[0];

    if (company.application_deadline && new Date() > new Date(company.application_deadline)) {
      return res.status(403).json({ success: false, message: 'Application deadline has passed' });
    }

    // 2. Check eligibility
    const profileRes = await pool.query(
      'SELECT * FROM student_profiles WHERE user_id = $1',
      [userId]
    );
    if (profileRes.rows.length === 0)
      return res.status(400).json({ success: false, message: 'Profile not found' });
    const sp = profileRes.rows[0];

    const eligible =
      (company.min_ssc_percentage === null || (sp.ssc_percentage !== null && parseFloat(sp.ssc_percentage) >= parseFloat(company.min_ssc_percentage))) &&
      (company.min_hsc_percentage === null || (sp.hsc_diploma_percentage !== null && parseFloat(sp.hsc_diploma_percentage) >= parseFloat(company.min_hsc_percentage))) &&
      (company.min_cgpa === null || (sp.cgpa !== null && parseFloat(sp.cgpa) >= parseFloat(company.min_cgpa)));

    if (!eligible)
      return res.status(403).json({ success: false, message: 'You do not meet the eligibility criteria for this company' });

    // 3. Already applied?
    const existingApp = await pool.query(
      'SELECT id FROM applications WHERE student_id = $1 AND company_id = $2',
      [userId, companyId]
    );
    if (existingApp.rows.length > 0)
      return res.status(409).json({ success: false, message: 'Already applied to this company' });

    // 4. Selection restriction: if selected anywhere, new CTC must be >= 2x best offer
    const selectionRes = await pool.query(
      `SELECT c.ctc_lakhs
       FROM applications a
       JOIN companies c ON c.id = a.company_id
       WHERE a.student_id = $1 AND a.status = 'selected'
       ORDER BY c.ctc_lakhs DESC NULLS LAST
       LIMIT 1`,
      [userId]
    );

    if (selectionRes.rows.length > 0) {
      const bestCTC = parseFloat(selectionRes.rows[0].ctc_lakhs) || 0;
      const newCTC  = parseFloat(company.ctc_lakhs) || 0;
      if (newCTC < bestCTC * 2) {
        return res.status(403).json({
          success: false,
          message: `Already selected at ₹${bestCTC}L. New company must offer ≥₹${(bestCTC * 2).toFixed(2)}L (100% hike).`,
        });
      }
    }

    // 5. Insert
    const result = await pool.query(
      'INSERT INTO applications (student_id, company_id) VALUES ($1, $2) RETURNING *',
      [userId, companyId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Student: My applications ─────────────────────────────────────────────────
export const myApplications = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  try {
    const result = await pool.query(
      `SELECT a.id, a.status, a.applied_at, a.updated_at,
              c.name AS company_name, c.ctc_lakhs, c.visit_date,
              c.internship_offered, c.ppo_opportunity, c.note
       FROM applications a
       JOIN companies c ON c.id = a.company_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};