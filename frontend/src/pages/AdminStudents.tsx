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
  parent_name: string | null;
  resume_url: string | null;
  documents_url: string | null;
}

export default function AdminStudents() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
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

  const searchByRoll = async () => {
    if (!search.trim()) { fetchStudents(); return; }
    setLoading(true);
    try {
      const res = await api.get(`/admin/students/search?rollNo=${search}`);
      setStudents([res.data.data]);
    } catch {
      addToast('No student found with that roll number', 'error');
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

  useEffect(() => { fetchStudents(); }, []);

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
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchByRoll()}
              placeholder="Search by roll number..."
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={searchByRoll}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              onClick={() => { setSearch(''); fetchStudents(); }}
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
              <h2 className="font-bold text-lg text-foreground">Student Profile</h2>
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
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}