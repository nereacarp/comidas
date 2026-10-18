import { useEffect } from 'react';

interface UndoToastProps {
  message: string;
  onUndo: () => void | Promise<void>;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({ message, onUndo, onDismiss, duration = 7000 }: Readonly<UndoToastProps>) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" onClick={() => void onUndo()}>Deshacer</button>
      <button type="button" className="undo-toast__close" onClick={onDismiss} aria-label="Cerrar aviso">×</button>
    </div>
  );
}
