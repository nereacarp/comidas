import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function ProtectedRoute() {
  const { token, user, isLoading, loadProfile } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      loadProfile();
    }
  }, [token, user, loadProfile]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || (!user && token)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-text text-lg">Cargando...</div>
      </div>
    );
  }

  return <Outlet />;
}
