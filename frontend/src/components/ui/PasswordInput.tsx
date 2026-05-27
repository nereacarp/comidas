import { useEffect, useId, useState } from 'react';

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  required?: boolean;
  placeholder?: string;
  minLength?: number;
  disabled?: boolean;
}

function EyeOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path
        fillRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function EyeClosedIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69 6.275 5.214A9.956 9.956 0 0 0 10 5c3.256 0 6.043 1.5 7.336 3.59.253.37.253.85 0 1.22-.303.47-.7.9-1.175 1.275l-1.47-1.47a4 4 0 0 0-5.94-5.94Zm8.214 8.214-1.47-1.47a4 4 0 0 1-5.94 5.94l-1.47 1.47a10.03 10.03 0 0 0 3.3 4.38c.47.303 1.053.303 1.523 0a10.004 10.004 0 0 0 6.41-9.336 1.651 1.651 0 0 0 0-1.186 10.03 10.03 0 0 0-2.354-3.905Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function PasswordInput({
  id: idProp,
  value,
  onChange,
  autoComplete,
  required,
  placeholder,
  minLength,
  disabled,
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (disabled) setVisible(false);
  }, [disabled]);

  return (
    <div className="relative">
      <input
        id={inputId}
        type={visible ? 'text' : 'password'}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        disabled={disabled}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="input pr-11"
      />
      <button
        type="button"
        disabled={disabled}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-controls={inputId}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? (
          <EyeClosedIcon className="h-5 w-5" />
        ) : (
          <EyeOpenIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
