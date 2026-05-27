import type { ReactNode } from 'react';
import {
  BookOpenIcon,
  CalendarIcon,
  HealthIcon,
  HomeIcon,
  PantryIcon,
  SettingsIcon,
  ShoppingCartIcon,
} from './ui/Icons';
import { routes } from '../lib/routes';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  match?: (pathname: string) => boolean;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    path: routes.dashboard,
    label: 'Inicio',
    match: (p) => p === routes.dashboard,
    icon: <HomeIcon />,
  },
  {
    path: routes.recipes,
    label: 'Recetas',
    match: (p) => p.startsWith('/recipes'),
    icon: <BookOpenIcon />,
  },
  {
    path: routes.mealPlan,
    label: 'Plan semanal',
    match: (p) => p === routes.mealPlan,
    icon: <CalendarIcon />,
  },
  {
    path: routes.pantry,
    label: 'Despensa',
    match: (p) => p === routes.pantry,
    icon: <PantryIcon />,
  },
  {
    path: routes.shoppingLists,
    label: 'Lista de compra',
    match: (p) => p.startsWith('/shopping-lists'),
    icon: <ShoppingCartIcon />,
  },
  {
    path: routes.health,
    label: 'Salud',
    match: (p) => p === routes.health,
    icon: <HealthIcon />,
  },
  {
    path: routes.settings,
    label: 'Ajustes',
    match: (p) => p === routes.settings,
    icon: <SettingsIcon />,
  },
];
