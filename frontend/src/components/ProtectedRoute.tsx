import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function ProtectedRoute() {
  const { isAuthenticated, user, isLoading, loadProfile } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      loadProfile();
    }
  }, [isAuthenticated, user, loadProfile]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || (!user && isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-text text-lg">Cargando...</div>
      </div>
    );
  }

  return <Outlet />;
}
