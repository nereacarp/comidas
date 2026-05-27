import { Outlet } from 'react-router-dom';
import { HouseholdProvider } from '../providers/HouseholdProvider';
import { AppSidebar } from '../components/AppSidebar';
import { BottomNav } from '../components/BottomNav';
import { useResetRecipeListFiltersOnLeave } from '../hooks/useResetRecipeListFiltersOnLeave';

function AppLayoutContent() {
  useResetRecipeListFiltersOnLeave();

  return (
      <div className="app-shell min-h-screen min-h-dvh bg-page flex">
        <AppSidebar />

        <div className="main-scroll flex min-h-0 flex-1 flex-col md:min-h-screen md:min-h-dvh">
          <main className="main-scroll__content mx-auto w-full min-w-0 max-w-7xl py-4 sm:py-6 md:py-8">
            <Outlet />
          </main>
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
