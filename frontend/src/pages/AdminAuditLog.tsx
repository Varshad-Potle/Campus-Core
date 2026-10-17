import { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { DataTable } from '@/components/ui/DataTable';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Log {
  id: string;
  action: string;
  admin_name: string;
  admin_email: string;
  target_name: string | null;
  metadata: Record<string, any>;
  ip_address: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  UPDATE_WINDOW_OPEN: 'bg-green-100 text-green-800',
  UPDATE_WINDOW_CLOSE: 'bg-gray-100 text-gray-700',
  BULK_COOLDOWN_APPLY: 'bg-orange-100 text-orange-800',
  BULK_COOLDOWN_CLEAR: 'bg-blue-100 text-blue-800',
  UPDATE_PERMISSIONS: 'bg-purple-100 text-purple-800',
  STUDENT_IMPORT: 'bg-teal-100 text-teal-800',
  PASSWORD_RESET: 'bg-red-100 text-red-800',
  MARKS_UPLOAD: 'bg-yellow-100 text-yellow-800',
};

const LIMIT = 10;

export default function AdminAuditLog() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchLogs = async (p: number) => {
    setLoading(true);
    try {
      const offset = (p - 1) * LIMIT;
      const res = await api.get(`/admin/audit-log?limit=${LIMIT}&offset=${offset}`);
      setLogs(res.data.data.logs);
      setTotal(res.data.data.total);
    } catch {
      addToast('Failed to load audit log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(page); }, [page]);

  const goTo = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  // Build page number array with ellipsis
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const columns = [
    {
      key: 'action',
      label: 'Action',
      render: (row: Log) => (
        <span className={`font-mono text-xs px-2 py-1 rounded-lg ${ACTION_COLORS[row.action] || 'bg-muted text-muted-foreground'}`}>
          {row.action}
        </span>
      ),
    },
    { key: 'admin_name', label: 'Admin' },
    {
      key: 'target_name',
      label: 'Target',
      render: (row: Log) => (
        <span className="text-muted-foreground">{row.target_name || '—'}</span>
      ),
    },
    {
      key: 'metadata',
      label: 'Details',
      render: (row: Log) => (
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px] block">
          {JSON.stringify(row.metadata)}
        </span>
      ),
    },
    { key: 'ip_address', label: 'IP' },
    {
      key: 'created_at',
      label: 'Time',
      render: (row: Log) => formatDateTime(row.created_at),
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
            <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total} total actions · Page {page} of {totalPages}
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyMessage="No audit logs found"
        />

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="h-8 w-8 flex items-center justify-center text-muted-foreground text-sm">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p as number)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}