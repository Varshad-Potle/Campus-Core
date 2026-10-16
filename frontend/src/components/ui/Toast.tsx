import { cn } from '@/lib/utils';
import { Toast as ToastType } from '@/hooks/useToast';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastType[];
  removeToast: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="w-4 h-4 text-green-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
};

const styles = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
};

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg text-sm font-medium min-w-[280px]',
            styles[toast.type]
          )}
        >
          {icons[toast.type]}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)}>
            <X className="w-3.5 h-3.5 opacity-50 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  );
}