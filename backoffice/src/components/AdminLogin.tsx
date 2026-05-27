import { useState } from 'react';

interface Props {
  onLogin: (secret: string) => void;
}

export function AdminLogin({ onLogin }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError('Introduce el secreto de administrador');
      return;
    }
    setError('');
    onLogin(value.trim());
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-xl font-bold text-gray-900">Comidas Admin</h1>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Secreto de administrador</span>
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          Acceder
        </button>
      </form>
    </div>
  );
}
