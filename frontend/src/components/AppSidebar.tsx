import type { CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MAIN_NAV_ITEMS } from './nav-items';
import { useHousehold } from '../hooks/useHousehold';
import { useAuthStore } from '../stores/auth.store';
import { routes } from '../lib/routes';
import { getNavAccent, navActiveStyle } from '../lib/section-accents';
import { BrandMarkIcon } from './ui/Icons';
import { SidebarUserFooter } from './SidebarUserFooter';

export function AppSidebar() {
  const location = useLocation();
  const { household } = useHousehold();
  const { user, logout } = useAuthStore();

  return (
    <aside
      className="app-sidebar hidden md:flex w-60 shrink-0 flex-col sticky top-0 h-screen py-6 px-4"
      aria-label="Navegación principal"
    >
      <Link to={routes.dashboard} className="flex items-center gap-2 px-2 mb-4">
        <span className="brand-logo-mark flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)]">
          <BrandMarkIcon className="w-5 h-5" />
        </span>
        <span className="type-display-sm">Comidas</span>
      </Link>

      {household && (
        <p className="px-3 mb-4 text-xs font-medium text-muted truncate" title={household.name}>
          {household.name}
        </p>
      )}

      <nav className="flex-1 overflow-y-auto min-h-0">
        <ul className="space-y-0.5">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = item.match
              ? item.match(location.pathname)
              : location.pathname === item.path;
            const accent = getNavAccent(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                  style={isActive ? (navActiveStyle(accent) as CSSProperties) : undefined}
                >
                  <span className="shrink-0 opacity-80">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] shrink-0 px-0.5">
        <SidebarUserFooter name={user?.name} email={user?.email} onLogout={logout} />
      </div>
    </aside>
  );
}
