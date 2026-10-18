import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/shared/Navbar';
import { StatsBento } from '@/components/admin/StatsBento';
import { WindowControl } from '@/components/admin/WindowControl';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { Users, ScrollText } from 'lucide-react';

interface Stats {
  totalStudents: number;
  windows: { id: string; submissions: string; opened_at: string; closed_at: string | null }[];
}

function WindowHistory({ windows }: { windows: Stats['windows'] }) {
  const PAGE_SIZE = 3;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(windows.length / PAGE_SIZE);
  const slice = windows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="bg-card border border-border rounded-3xl p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Windows
        </p>
        <span className="text-xs text-muted-foreground">{windows.length} total</span>
      </div>
      <div className="flex flex-col gap-2">
        {slice.map((w) => (
          <div key={w.id} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {new Date(w.opened_at).toLocaleDateString('en-IN')}
            </span>
            <span className="font-medium text-foreground">{w.submissions} submissions</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              w.closed_at ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-800'
            }`}>
              {w.closed_at ? 'Closed' : 'Active'}
            </span>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [placedCount, setPlacedCount] = useState(0);

  const fetchStats = async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/students'),
      ]);
      setStats(statsRes.data.data);
      const placed = studentsRes.data.data.filter(
        (s: any) => s.placement_status === 'placed'
      ).length;
      setPlacedCount(placed);
    } catch {
      addToast('Failed to load stats', 'error');
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const totalSubmissions = stats?.windows.reduce(
    (acc, w) => acc + parseInt(w.submissions), 0
  ) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">

        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of CampusCore activity
          </p>
        </div>

        <StatsBento
          totalStudents={stats?.totalStudents ?? 0}
          placedStudents={placedCount}
          totalWindows={stats?.windows.length ?? 0}
          totalSubmissions={totalSubmissions}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WindowControl onSuccess={fetchStats} addToast={addToast} />

          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate('/admin/students')}
              className="flex items-center gap-4 bg-card border border-border rounded-3xl p-6 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                <Users className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Manage Students</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  View profiles, search by roll number, manage permissions
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/audit')}
              className="flex items-center gap-4 bg-card border border-border rounded-3xl p-6 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                <ScrollText className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Audit Log</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Track all admin actions and window activity
                </p>
              </div>
            </button>

            {stats?.windows && stats.windows.length > 0 && (
              <WindowHistory windows={stats.windows} />
            )}
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}