import { useEffect, useId, useState } from 'react';
import { Modal } from '../ui/Modal';

interface ConfirmPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  expectedPhrase: string;
  phraseLabel: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmPhraseModal({
  isOpen,
  onClose,
  title,
  description,
  expectedPhrase,
  phraseLabel,
  confirmLabel = 'Confirmar',
  busy = false,
  error = '',
  onConfirm,
}: Readonly<ConfirmPhraseModalProps>) {
  const inputId = useId();
  const [phrase, setPhrase] = useState('');

  useEffect(() => {
    if (!isOpen) setPhrase('');
  }, [isOpen]);

  const matches = phrase.trim() === expectedPhrase.trim();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!matches || busy) return;
    void onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="type-hint space-y-2">{description}</div>
        <div>
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
            {phraseLabel}
          </label>
          <input
            id={inputId}
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            className="input w-full"
            autoComplete="off"
            disabled={busy}
            placeholder={expectedPhrase}
          />
        </div>
        {error && (
          <p className="text-sm font-semibold text-[var(--danger-text)]" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="btn-neutral" disabled={busy}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-danger disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!matches || busy}
          >
            {busy ? 'Eliminando…' : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
