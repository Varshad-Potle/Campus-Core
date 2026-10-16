import { useEffect, useState } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { DataTable } from '@/components/ui/DataTable';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
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

export default function AdminAuditLog() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchLogs = async (off = 0) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-log?limit=${limit}&offset=${off}`);
      setLogs(res.data.data.logs);
      setTotal(res.data.data.total);
    } catch {
      addToast('Failed to load audit log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const columns = [
    {
      key: 'action',
      label: 'Action',
      render: (row: Log) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded-lg">{row.action}</span>
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
            <p className="text-sm text-muted-foreground mt-0.5">{total} total actions</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyMessage="No audit logs found"
        />

        {total > limit && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { const o = offset - limit; setOffset(o); fetchLogs(o); }}
                disabled={offset === 0}
                className="h-8 px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => { const o = offset + limit; setOffset(o); fetchLogs(o); }}
                disabled={offset + limit >= total}
                className="h-8 px-3 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}