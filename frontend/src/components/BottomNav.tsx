import type { CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MAIN_NAV_ITEMS } from './nav-items';
import { routes } from '../lib/routes';
import { getNavAccent } from '../lib/section-accents';
import { HomeIcon } from './ui/Icons';

const SHORT_LABELS: Record<string, string> = {
  [routes.dashboard]: 'Inicio',
  [routes.recipes]: 'Recetas',
  [routes.mealPlan]: 'Plan',
  [routes.pantry]: 'Despensa',
  [routes.shoppingLists]: 'Compra',
  [routes.health]: 'Salud',
  [routes.settings]: 'Ajustes',
};

const LEFT_PATHS: readonly string[] = [routes.recipes, routes.mealPlan];
const RIGHT_PATHS: readonly string[] = [
  routes.pantry,
  routes.shoppingLists,
  routes.health,
  routes.settings,
];

function isNavActive(
  pathname: string,
  path: string,
  match?: (pathname: string) => boolean,
): boolean {
  if (match) return match(pathname);
  return pathname === path;
}

function SideNavLink({
  path,
  label,
  icon,
  match,
  pathname,
}: Readonly<{
  path: string;
  label: string;
  icon: React.ReactNode;
  match?: (pathname: string) => boolean;
  pathname: string;
}>) {
  const isActive = isNavActive(pathname, path, match);
  const accent = getNavAccent(path);

  return (
    <Link
      to={path}
      aria-current={isActive ? 'page' : undefined}
      className={`app-bottom-nav__link ${isActive ? 'app-bottom-nav__link--active' : ''}`}
      style={isActive ? { color: accent.text } : undefined}
    >
      <span
        className="app-bottom-nav__icon"
        style={
          isActive
            ? ({ background: accent.bg, color: accent.text } as CSSProperties)
            : undefined
        }
      >
        {icon}
      </span>
      <span className="app-bottom-nav__label">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  const homeItem = MAIN_NAV_ITEMS.find((item) => item.path === routes.dashboard)!;
  const leftItems = MAIN_NAV_ITEMS.filter((item) => LEFT_PATHS.includes(item.path));
  const rightItems = MAIN_NAV_ITEMS.filter((item) => RIGHT_PATHS.includes(item.path));
  const homeActive = isNavActive(pathname, homeItem.path, homeItem.match);

  return (
    <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-50 md:hidden" aria-label="Navegación principal">
      <div className="app-bottom-nav__inner">
        <div className="app-bottom-nav__side">
          {leftItems.map((item) => (
            <SideNavLink
              key={item.path}
              path={item.path}
              label={SHORT_LABELS[item.path] ?? item.label}
              icon={item.icon}
              match={item.match}
              pathname={pathname}
            />
          ))}
        </div>

        <div className="app-bottom-nav__fab-slot">
          <Link
            to={routes.dashboard}
            aria-current={homeActive ? 'page' : undefined}
            aria-label="Inicio"
            className={`app-bottom-nav__fab ${homeActive ? 'app-bottom-nav__fab--active' : ''}`}
          >
            <HomeIcon />
          </Link>
        </div>

        <div className="app-bottom-nav__side">
          {rightItems.map((item) => (
            <SideNavLink
              key={item.path}
              path={item.path}
              label={SHORT_LABELS[item.path] ?? item.label}
              icon={item.icon}
              match={item.match}
              pathname={pathname}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
