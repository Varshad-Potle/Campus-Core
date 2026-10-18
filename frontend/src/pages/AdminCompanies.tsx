import { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { Badge } from '@/components/ui/Badge';
import { ToastContainer } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { Building2, Plus, ChevronDown, ChevronUp, Users } from 'lucide-react';

interface Company {
  id: number;
  name: string;
  description: string | null;
  visit_date: string | null;
  application_deadline: string | null;
  ctc_lakhs: string | null;
  internship_offered: boolean;
  internship_paid: boolean | null;
  internship_stipend: string | null;
  internship_duration_months: number | null;
  ppo_opportunity: boolean;
  service_bond_months: number | null;
  service_bond_amount: string | null;
  min_ssc_percentage: string | null;
  min_hsc_percentage: string | null;
  min_cgpa: string | null;
  note: string | null;
  is_active: boolean;
  applied_count: string;
  shortlisted_count: string;
  interview_count: string;
  selected_count: string;
  rejected_count: string;
}

interface Applicant {
  application_id: number;
  status: string;
  applied_at: string;
  student_id: string;
  name: string;
  email: string;
  roll_number: string;
  branch: string;
  year: number;
  ssc_percentage: string | null;
  hsc_diploma_percentage: string | null;
  cgpa: string | null;
}

const STATUS_OPTIONS = ['applied', 'shortlisted', 'interview', 'selected', 'rejected'];

const EMPTY_FORM = {
  name: '', description: '', visit_date: '', application_deadline: '',
  min_ssc_percentage: '', min_hsc_percentage: '', min_cgpa: '',
  ctc_lakhs: '',
  internship_offered: false, internship_paid: false,
  internship_stipend: '', internship_duration_months: '',
  ppo_opportunity: false,
  service_bond_months: '', service_bond_amount: '',
  note: '', is_active: true,
};

export default function AdminCompanies() {
  const { toasts, addToast, removeToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Applicants drawer
  const [drawerCompany, setDrawerCompany] = useState<Company | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Expanded company details
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies/admin/all');
      setCompanies(res.data.data);
    } catch {
      addToast('Failed to load companies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (c: Company) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      description: c.description || '',
      visit_date: c.visit_date ? c.visit_date.slice(0, 10) : '',
      application_deadline: c.application_deadline
        ? new Date(c.application_deadline).toISOString().slice(0, 16)
        : '',
      min_ssc_percentage: c.min_ssc_percentage || '',
      min_hsc_percentage: c.min_hsc_percentage || '',
      min_cgpa: c.min_cgpa || '',
      ctc_lakhs: c.ctc_lakhs || '',
      internship_offered: c.internship_offered,
      internship_paid: c.internship_paid ?? false,
      internship_stipend: c.internship_stipend || '',
      internship_duration_months: c.internship_duration_months?.toString() || '',
      ppo_opportunity: c.ppo_opportunity,
      service_bond_months: c.service_bond_months?.toString() || '',
      service_bond_amount: c.service_bond_amount || '',
      note: c.note || '',
      is_active: c.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Company name is required', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        min_ssc_percentage:         form.min_ssc_percentage         || null,
        min_hsc_percentage:         form.min_hsc_percentage         || null,
        min_cgpa:                   form.min_cgpa                   || null,
        ctc_lakhs:                  form.ctc_lakhs                  || null,
        internship_stipend:         form.internship_stipend         || null,
        internship_duration_months: form.internship_duration_months || null,
        service_bond_months:        form.service_bond_months        || null,
        service_bond_amount:        form.service_bond_amount        || null,
        visit_date:                 form.visit_date                 || null,
        application_deadline:       form.application_deadline       || null,
        description:                form.description                || null,
        note:                       form.note                       || null,
      };
      if (editId) {
        await api.patch(`/companies/admin/${editId}`, payload);
        addToast('Company updated', 'success');
      } else {
        await api.post('/companies/admin', payload);
        addToast('Company created', 'success');
      }
      setShowForm(false);
      fetchCompanies();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openApplicants = async (company: Company) => {
    setDrawerCompany(company);
    setApplicantsLoading(true);
    try {
      const res = await api.get(`/companies/admin/${company.id}/applicants`);
      setApplicants(res.data.data);
    } catch {
      addToast('Failed to load applicants', 'error');
    } finally {
      setApplicantsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.patch(`/companies/admin/${deleteTarget.id}`, { is_active: false });
      addToast('Company removed', 'success');
      setDeleteTarget(null);
      fetchCompanies();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (applicationId: number, status: string) => {
    setUpdatingStatus(applicationId);
    try {
      await api.patch(`/companies/admin/applications/${applicationId}/status`, { status });
      setApplicants(prev =>
        prev.map(a => a.application_id === applicationId ? { ...a, status } : a)
      );
      fetchCompanies();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const f = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-card border border-border rounded-3xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-2xl" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-14" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Companies</h1>
            <p className="text-sm text-muted-foreground mt-1">{companies.length} total</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>

        {/* Company list */}
        <div className="flex flex-col gap-3">
          {companies.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-3xl p-5 flex flex-col gap-3">

              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                    {c.visit_date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge label={c.is_active ? 'Active' : 'Inactive'} variant={c.is_active ? 'success' : 'neutral'} />
                  <button
                    onClick={() => openApplicants(c)}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {parseInt(c.applied_count) + parseInt(c.shortlisted_count) + parseInt(c.interview_count) + parseInt(c.selected_count) + parseInt(c.rejected_count)} applicants
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="h-8 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="h-8 px-3 rounded-xl border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Status counts */}
              <div className="flex flex-wrap gap-2">
                {c.ctc_lakhs && <Badge label={`₹${c.ctc_lakhs}L`} variant="success" />}
                {parseInt(c.applied_count) > 0     && <Badge label={`${c.applied_count} applied`}     variant="neutral" />}
                {parseInt(c.shortlisted_count) > 0 && <Badge label={`${c.shortlisted_count} shortlisted`} variant="warning" />}
                {parseInt(c.interview_count) > 0   && <Badge label={`${c.interview_count} interview`}  variant="warning" />}
                {parseInt(c.selected_count) > 0    && <Badge label={`${c.selected_count} selected`}   variant="success" />}
                {parseInt(c.rejected_count) > 0    && <Badge label={`${c.rejected_count} rejected`}   variant="danger" />}
              </div>

              {/* Expand */}
              <button
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                {expandedId === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expandedId === c.id ? 'Less' : 'Details'}
              </button>

              {expandedId === c.id && (
                <div className="border-t border-border pt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                  {c.min_ssc_percentage  && <p className="text-muted-foreground">SSC min: <span className="text-foreground font-medium">{c.min_ssc_percentage}%</span></p>}
                  {c.min_hsc_percentage  && <p className="text-muted-foreground">HSC min: <span className="text-foreground font-medium">{c.min_hsc_percentage}%</span></p>}
                  {c.min_cgpa            && <p className="text-muted-foreground">CGPA min: <span className="text-foreground font-medium">{c.min_cgpa}</span></p>}
                  {c.internship_offered  && <p className="text-muted-foreground">Internship: <span className="text-foreground font-medium">{c.internship_paid ? `Paid ₹${c.internship_stipend}/mo` : 'Unpaid'} · {c.internship_duration_months}mo</span></p>}
                  {c.ppo_opportunity     && <p className="text-muted-foreground">PPO: <span className="text-foreground font-medium">Yes</span></p>}
                  {c.service_bond_months && <p className="text-muted-foreground">Bond: <span className="text-foreground font-medium">{c.service_bond_months}mo</span></p>}
                  {c.note                && <p className="text-muted-foreground col-span-2">Note: <span className="text-foreground">{c.note}</span></p>}
                </div>
              )}
            </div>
          ))}

          {companies.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">No companies yet.</div>
          )}
        </div>
      </div>

      {/* ── Create / Edit form modal ──────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border border-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-foreground">{editId ? 'Edit Company' : 'Add Company'}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Company Name *</label>
                <input value={form.name} onChange={e => f('name', e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea value={form.description} onChange={e => f('description', e.target.value)}
                  rows={2} className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Visit Date</label>
                <input type="date" value={form.visit_date} onChange={e => f('visit_date', e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Application Deadline</label>
                <input
                  type="datetime-local"
                  value={form.application_deadline}
                  onChange={e => f('application_deadline', e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">CTC (Lakhs)</label>
                <input type="number" min={0} value={form.ctc_lakhs} onChange={e => f('ctc_lakhs', e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Min SSC %</label>
                <input type="number" min={0} value={form.min_ssc_percentage} onChange={e => f('min_ssc_percentage', e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Min HSC/Diploma %</label>
                <input type="number" min={0} value={form.min_hsc_percentage} onChange={e => f('min_hsc_percentage', e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Min CGPA</label>
                <input type="number" min={0} step="0.01" value={form.min_cgpa} onChange={e => f('min_cgpa', e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">PPO Opportunity</label>
                <select value={form.ppo_opportunity ? 'yes' : 'no'} onChange={e => f('ppo_opportunity', e.target.value === 'yes')}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Internship Offered</label>
                <select value={form.internship_offered ? 'yes' : 'no'} onChange={e => f('internship_offered', e.target.value === 'yes')}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              {form.internship_offered && (<>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Internship Paid?</label>
                  <select value={form.internship_paid ? 'yes' : 'no'} onChange={e => f('internship_paid', e.target.value === 'yes')}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="no">Unpaid</option>
                    <option value="yes">Paid</option>
                  </select>
                </div>
                {form.internship_paid && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Stipend (₹/month)</label>
                    <input type="number" min={0} value={form.internship_stipend} onChange={e => f('internship_stipend', e.target.value)}
                      className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Duration (months)</label>
                  <input type="number" min={0} value={form.internship_duration_months} onChange={e => f('internship_duration_months', e.target.value)}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </>)}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Service Bond (months)</label>
                <input type="number" min={0} value={form.service_bond_months} onChange={e => f('service_bond_months', e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Bond Amount (₹)</label>
                <input type="number" min={0} value={form.service_bond_amount} onChange={e => f('service_bond_amount', e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Note</label>
                <textarea value={form.note} onChange={e => f('note', e.target.value)}
                  rows={2} className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>

              {editId && (
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select value={form.is_active ? 'active' : 'inactive'} onChange={e => f('is_active', e.target.value === 'active')}
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Company'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Applicants drawer ─────────────────────────────────────────────────── */}
      {drawerCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border border-border rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{drawerCompany.name} — Applicants</h2>
              <button onClick={() => setDrawerCompany(null)}
                className="text-muted-foreground hover:text-foreground text-sm">Close</button>
            </div>

            {applicantsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : applicants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No applicants yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {applicants.map(a => (
                  <div key={a.application_id} className="border border-border rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-sm font-medium text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.roll_number} · {a.branch} · Year {a.year}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        {a.ssc_percentage        && <span>SSC {a.ssc_percentage}%</span>}
                        {a.hsc_diploma_percentage && <span>HSC {a.hsc_diploma_percentage}%</span>}
                        {a.cgpa                  && <span>CGPA {a.cgpa}</span>}
                      </div>
                    </div>
                    <select
                      value={a.status}
                      disabled={updatingStatus === a.application_id}
                      onChange={e => handleStatusChange(a.application_id, e.target.value)}
                      className="h-9 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 shrink-0"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border border-border rounded-3xl max-w-sm w-full p-6 flex flex-col gap-4">
            <p className="text-sm text-foreground">
              Remove <strong>{deleteTarget.name}</strong>? It will be marked inactive and hidden from students.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Removing…' : 'Remove'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}