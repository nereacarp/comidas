interface AuthFormErrorProps {
  message: string;
  onDismiss: () => void;
}

export function AuthFormError({ message, onDismiss }: Readonly<AuthFormErrorProps>) {
  return (
    <div className="auth-form-error" role="alert">
      <p className="min-w-0 flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="auth-form-error__dismiss"
        aria-label="Cerrar mensaje de error"
      >
        ×
      </button>
    </div>
  );
}
