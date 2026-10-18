import { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { HouseholdProvider } from '../providers/HouseholdProvider';
import { AppSidebar } from '../components/AppSidebar';
import { BottomNav } from '../components/BottomNav';
import { useResetRecipeListFiltersOnLeave } from '../hooks/useResetRecipeListFiltersOnLeave';
import { useAuthStore } from '../stores/auth.store';
import { useHealthStore } from '../stores/health.store';
import { routes } from '../lib/routes';

function AppLayoutContent() {
  useResetRecipeListFiltersOnLeave();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const activeHealthUserId = useHealthStore((state) => state.activeUserId);
  const setActiveHealthUser = useHealthStore((state) => state.setActiveUser);

  useEffect(() => {
    setActiveHealthUser(userId);
  }, [userId, setActiveHealthUser]);

  if (!userId || activeHealthUserId !== userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="loading-text text-lg">Cargando tus datos de salud...</div>
      </div>
    );
  }

  return (
      <div className="app-shell min-h-screen min-h-dvh bg-page flex">
        <AppSidebar />

        <div className="main-scroll flex min-h-0 flex-1 flex-col md:min-h-screen md:min-h-dvh">
          <main className="main-scroll__content mx-auto w-full min-w-0 max-w-7xl py-4 sm:py-6 md:py-8">
            <Outlet />
          </main>
          <footer className="mx-auto flex w-full max-w-7xl justify-center gap-4 px-4 pb-4 text-xs text-muted">
            <Link className="underline hover:text-ink" to={routes.privacy}>Privacidad</Link>
            <Link className="underline hover:text-ink" to={routes.terms}>Condiciones</Link>
          </footer>
          <div className="main-scroll__nav-spacer" aria-hidden />
        </div>

        <BottomNav />
      </div>
  );
}

export function AppLayout() {
  return (
    <HouseholdProvider>
      <AppLayoutContent />
    </HouseholdProvider>
  );
}
