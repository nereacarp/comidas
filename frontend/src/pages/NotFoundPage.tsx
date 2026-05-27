import { Link } from 'react-router-dom';
import { routes } from '../lib/routes';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-xl text-gray-600">Página no encontrada</p>
      <Link to={routes.dashboard} className="mt-2 text-teal-600 underline hover:text-teal-700">
        Volver al inicio
      </Link>
    </div>
  );
}
