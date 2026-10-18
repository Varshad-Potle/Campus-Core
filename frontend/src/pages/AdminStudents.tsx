import { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { FileUpload } from '@/components/ui/FileUpload';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { Search, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: string;
  name: string;
  email: string;
  roll_number: string;
  branch: string;
  year: number;
  placement_status: string;
  company_name: string | null;
  job_role: string | null;
  ctc_lakhs: string | null;
  created_at: string;
  photo_url: string | null;
  phone: string | null;
  permanent_address: string | null;
  cgpa: string | null;
  parent_name: string | null;
  resume_url: string | null;
  documents_url: string | null;
}

export default function AdminStudents() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollSearch, setRollSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [resetRequests, setResetRequests] = useState<any[]>([]);
  const [showResetRequests, setShowResetRequests] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data.data);
    } catch {
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchResetRequests = async () => {
    try {
      const res = await api.get('/admin/password-reset-requests');
      setResetRequests(res.data.data);
    } catch {
      addToast('Failed to load reset requests', 'error');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await api.post(`/admin/students/${userId}/reset-password`);
      addToast('Password reset successfully', 'success');
      fetchResetRequests();
      fetchStudents();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Reset failed', 'error');
    }
  };

  const searchStudents = async () => {
    if (!rollSearch.trim() && !companySearch.trim()) {
      fetchStudents();
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (rollSearch.trim()) params.append('rollNo', rollSearch.trim());
      if (companySearch.trim()) params.append('company', companySearch.trim());
      const res = await api.get(`/admin/students/search?${params.toString()}`);
      setStudents(Array.isArray(res.data.data) ? res.data.data : [res.data.data]);
    } catch {
      addToast('No students found', 'error');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', importFile);
      const res = await api.post('/admin/students/import', form);
      setImportResult(res.data.data);
      fetchStudents();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => { fetchStudents(); fetchResetRequests(); }, []);

  const columns = [
    { key: 'roll_number', label: 'Roll No' },
    { key: 'name', label: 'Name' },
    { key: 'branch', label: 'Branch' },
    {
      key: 'placement_status',
      label: 'Status',
      render: (row: Student) => (
        <Badge
          label={row.placement_status === 'placed' ? 'Placed' : 'Unplaced'}
          variant={row.placement_status === 'placed' ? 'success' : 'neutral'}
        />
      ),
    },
    {
      key: 'company_name',
      label: 'Company',
      render: (row: Student) => (
        <span className="text-muted-foreground">{row.company_name || '—'}</span>
      ),
    },
    {
      key: 'ctc_lakhs',
      label: 'CTC',
      render: (row: Student) => (
        <span>{row.ctc_lakhs ? `₹${row.ctc_lakhs}L` : '—'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (row: Student) => formatDate(row.created_at),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Students</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{students.length} registered</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={rollSearch}
              onChange={(e) => setRollSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
              placeholder="Search by roll number..."
              className="h-10 w-48 rounded-xl border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
              placeholder="Search by company..."
              className="h-10 w-48 rounded-xl border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={searchStudents}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
          {(rollSearch || companySearch) && (
            <button
              onClick={() => { setRollSearch(''); setCompanySearch(''); fetchStudents(); }}
              className="h-10 px-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => { setShowImport(true); setImportResult(null); }}
            className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Import Excel
          </button>
          <button
            onClick={() => setShowResetRequests(true)}
            className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors relative"
          >
            Reset Requests
            {resetRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {resetRequests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        <DataTable
          columns={columns}
          data={students}
          loading={loading}
          emptyMessage="No students found"
          onRowClick={(row) => setSelected(row)}
        />
      </div>

      {showImport && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-3xl border border-border p-6 max-w-md w-full mx-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">Import Students</h2>
              <button onClick={() => setShowImport(false)}>
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="bg-muted rounded-2xl p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Required Excel columns:</p>
              <p className="font-mono">name, email, roll_number, branch, parent_name</p>
              <p className="mt-2">
                Default password will be{' '}
                <span className="font-mono font-semibold text-foreground">
                  GCOEA@{'<roll_number>'}
                </span>
              </p>
            </div>

            {importResult ? (
              <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                  <div className="flex-1 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-800">{importResult.imported}</p>
                    <p className="text-xs text-green-600 mt-1">Imported</p>
                  </div>
                  <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-800">{importResult.skipped}</p>
                    <p className="text-xs text-yellow-600 mt-1">Skipped</p>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
                    <p className="text-xs font-semibold text-red-800 mb-1">Errors:</p>
                    {importResult.errors.map((error, index) => (
                      <p key={`${error}-${index}`} className="text-xs text-red-600">{error}</p>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowImport(false)}
                  className="h-10 w-full rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <FileUpload
                  accept=".xlsx,.xls"
                  maxSizeMB={10}
                  label="Upload Student Excel"
                  hint=".xlsx file with required columns"
                  type="pdf"
                  onFile={setImportFile}
                />
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="h-10 w-full rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Import Students'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Student profile drawer */}
      {selected && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-background border-l border-border overflow-y-auto p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-foreground">Student Profile</h2>
                {resetRequests.find((r) => r.user_id === selected.id && r.status === 'pending') && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                    Password Reset Pending
                  </span>
                )}
              </div>
              <button onClick={() => setSelected(null)}>
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            {selected.photo_url && (
              <img
                src={selected.photo_url}
                alt="Student"
                className="w-20 h-20 rounded-2xl object-cover border border-border"
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Name', value: selected.name },
                { label: 'Roll No', value: selected.roll_number },
                { label: 'Email', value: selected.email },
                { label: 'Branch', value: selected.branch },
                { label: 'Year', value: selected.year },
                { label: 'Parent', value: selected.parent_name },
                { label: 'Phone', value: selected.phone || '—' },
                { label: 'Address', value: selected.permanent_address || '—' },
                { label: 'CGPA', value: selected.cgpa || '—' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-sm text-foreground mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-muted rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Placement
              </p>
              <Badge
                label={selected.placement_status === 'placed' ? 'Placed' : 'Unplaced'}
                variant={selected.placement_status === 'placed' ? 'success' : 'neutral'}
              />
              {selected.placement_status === 'placed' && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium">{selected.company_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium">{selected.job_role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CTC</p>
                    <p className="text-sm font-medium">₹{selected.ctc_lakhs}L</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documents
              </p>
              {selected.resume_url ? (
                <a
                  href={selected.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
                >
                  <span>📄</span> View Resume
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No resume uploaded</p>
              )}
              {selected.documents_url ? (
                <a
                  href={selected.documents_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
                >
                  <span>📋</span> View Documents
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              )}
              {resetRequests.find((r) => r.user_id === selected?.id && r.status === 'pending') && (
                <button
                  onClick={() => selected && handleResetPassword(selected.id)}
                  className="h-10 w-full rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  Reset Password → GCOEA@{selected?.roll_number}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showResetRequests && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-3xl border border-border p-6 max-w-lg w-full mx-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">Password Reset Requests</h2>
              <button onClick={() => setShowResetRequests(false)}>
                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            {resetRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No requests yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {resetRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.roll_number} · {r.branch}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Requested {formatDate(r.requested_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status === 'pending' ? (
                        <button
                          onClick={() => handleResetPassword(r.user_id)}
                          className="h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          Reset
                        </button>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}