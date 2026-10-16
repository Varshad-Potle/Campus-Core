import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, FileText, Image, X } from 'lucide-react';

interface FileUploadProps {
  accept: string;
  maxSizeMB: number;
  label: string;
  hint?: string;
  onFile: (file: File | null) => void;
  type?: 'image' | 'pdf';
  className?: string;
  reset?: boolean;
}

export function FileUpload({
  accept,
  maxSizeMB,
  label,
  hint,
  onFile,
  type = 'pdf',
  className,
  reset,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (reset) {
      setSelected(null);
      setError('');
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [reset]);

  const handle = (file: File) => {
    const maxSize = maxSizeMB * 1024 * 1024;
    const acceptedTypes = accept.split(',').map((value) => value.trim()).filter(Boolean);
    const typeAccepted = acceptedTypes.some((acceptedType) => {
      if (acceptedType.startsWith('.')) {
        return file.name.toLowerCase().endsWith(acceptedType.toLowerCase());
      }
      if (acceptedType.endsWith('/*')) {
        return file.type.startsWith(acceptedType.slice(0, -1));
      }
      return file.type === acceptedType;
    });

    if (!typeAccepted) {
      setSelected(null);
      setError(`Invalid file type. Accepted: ${accept}`);
      onFile(null);
      return;
    }

    if (file.size > maxSize) {
      setSelected(null);
      setError(`File must be smaller than ${maxSizeMB}MB`);
      onFile(null);
      return;
    }

    setSelected(file);
    setError('');
    onFile(file);
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handle(file);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-colors',
          dragging
            ? 'border-primary bg-muted'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        {selected ? (
          <>
            {type === 'image'
              ? <Image className="w-8 h-8 text-primary" />
              : <FileText className="w-8 h-8 text-primary" />
            }
            <p className="text-sm font-medium text-foreground">{selected.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selected.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelected(null);
                setError('');
                onFile(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="mt-1 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <X className="w-3 h-3" /> Remove
            </button>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{hint || `Max ${maxSizeMB}MB`}</p>
          </>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
    </div>
  );
}