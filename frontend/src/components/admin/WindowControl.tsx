import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Timer, X, CheckCircle, Clock } from 'lucide-react';

interface WindowControlProps {
  onSuccess: () => void;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

interface ActiveWindow {
  open: boolean;
  ttl?: number;
  message?: string;
  fieldsToUpdate?: string[];
}

const FIELD_OPTIONS = [
  'phone',
  'permanent_address',
  'placement_status',
  'company_name',
  'job_role',
  'ctc_lakhs',
  'cgpa',
  'photo',
  'resume',
  'documents',
];

export function WindowControl({ onSuccess, addToast }: WindowControlProps) {
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(3600);
  const [fields, setFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeWindow, setActiveWindow] = useState<ActiveWindow | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/admin/window/status');
      setActiveWindow(res.data.data);
    } catch {
      // silently fail
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!activeWindow?.open || !activeWindow.ttl) return;
    setTimeLeft(activeWindow.ttl);
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [activeWindow]);

  const toggleField = (f: string) =>
    setFields((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  const handleOpen = async () => {
    if (!message.trim()) {
      addToast('Message is required', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/window/open', {
        message,
        durationSeconds: duration,
        fieldsToUpdate: fields,
      });
      addToast('Update window opened', 'success');
      setMessage('');
      setFields([]);
      await fetchStatus();
      onSuccess();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to open window', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMessage('');
    setFields([]);
    setDuration(3600);
  };

  const handleClose = async () => {
    setLoading(true);
    try {
      await api.delete('/admin/window/close');
      addToast('Update window closed', 'success');
      await fetchStatus();
      onSuccess();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to close window', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    if (secs <= 0) return 'Expiring…';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m remaining`;
    if (m > 0) return `${m}m ${s}s remaining`;
    return `${s}s remaining`;
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Timer className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-foreground">Update Window</h2>
      </div>

      {/* Active window detail — close button lives HERE only */}
      {!statusLoading && activeWindow?.open && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Window is Open</span>
            </div>
            <button
              onClick={() => setConfirmClose(true)}
              disabled={loading}
              className="h-8 px-3 rounded-xl border border-red-400/40 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              <X className="w-3 h-3" /> Close Window
            </button>
          </div>
          <p className="text-sm text-foreground">{activeWindow.message}</p>
          {activeWindow.fieldsToUpdate && activeWindow.fieldsToUpdate.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeWindow.fieldsToUpdate.map((f) => (
                <span key={f} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {f}
                </span>
              ))}
            </div>
          )}
          {activeWindow.ttl && activeWindow.ttl > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      )}

      {/* Creation form — shown always, "Cancel" instead of "Close" */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message to students (e.g. Please update your placement status before Oct 20)"
        rows={3}
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Duration
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value={1800}>30 minutes</option>
          <option value={3600}>1 hour</option>
          <option value={7200}>2 hours</option>
          <option value={86400}>24 hours</option>
          <option value={604800}>7 days</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fields to update
        </label>
        <div className="flex flex-wrap gap-2">
          {FIELD_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => toggleField(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                fields.includes(f)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleOpen}
          disabled={loading}
          className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Open Window
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Cancel
        </button>
      </div>

      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 w-80 flex flex-col gap-4 shadow-xl">
            <h3 className="font-semibold text-foreground">Close Update Window?</h3>
            <p className="text-sm text-muted-foreground">
              Students will no longer be able to submit updates. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmClose(false)}
                className="h-9 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirmClose(false); handleClose(); }}
                disabled={loading}
                className="h-9 px-4 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Yes, Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}