import { useState } from 'react';
import api from '@/lib/api';
import { Timer, X } from 'lucide-react';

interface WindowControlProps {
  onSuccess: () => void;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

const FIELD_OPTIONS = [
  'phone',
  'permanent_address',
  'placement_status',
  'company_name',
  'job_role',
  'ctc_lakhs',
  'photo',
  'resume',
  'documents',
];

export function WindowControl({ onSuccess, addToast }: WindowControlProps) {
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(3600);
  const [fields, setFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
      onSuccess();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to open window', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setLoading(true);
    try {
      await api.delete('/admin/window/close');
      addToast('Update window closed', 'success');
      onSuccess();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to close window', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Timer className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-foreground">Update Window</h2>
      </div>

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
          onClick={handleClose}
          disabled={loading}
          className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" /> Close
        </button>
      </div>
    </div>
  );
}