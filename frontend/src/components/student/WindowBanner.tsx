import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Sparkles } from 'lucide-react';

interface WindowData {
  open: boolean;
  message?: string;
  fieldsToUpdate?: string[];
  ttl?: number;
}

export function WindowBanner() {
  const [window, setWindow] = useState<WindowData | null>(null);

  useEffect(() => {
    api.get('/admin/window/active').then((res) => {
      setWindow(res.data.data);
    }).catch(() => {});
  }, []);

  if (!window?.open) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-yellow-400 bg-yellow-50 p-6">
      {/* Shining border animation */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none">
        <div className="absolute inset-0 rounded-3xl animate-pulse bg-yellow-300/10" />
      </div>

      <div className="relative z-10 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-yellow-900 text-sm mb-1">
            Update Window is Active
          </p>
          <p className="text-yellow-800 text-sm">{window.message}</p>
          {window.fieldsToUpdate && window.fieldsToUpdate.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {window.fieldsToUpdate.map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-0.5 rounded-full bg-yellow-200 text-yellow-900 text-xs font-medium"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
          {window.ttl && (
            <p className="text-yellow-700 text-xs mt-2">
              Closes in {Math.ceil(window.ttl / 60)} minutes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}