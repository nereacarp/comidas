import { useState } from 'react';
import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/react-router';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { AdminLogin } from './components/AdminLogin';
import { createAdminDataProvider } from './lib/adminDataProvider';
import { initAdminClient } from './lib/adminClient';
import { AuditLogPage } from './pages/AuditLogPage';
import { DashboardPage } from './pages/DashboardPage';
import { HouseholdDetailPage } from './pages/HouseholdDetailPage';
import { HouseholdList } from './pages/HouseholdList';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipeList } from './pages/RecipeList';
import { TagList } from './pages/TagList';
import { UserDetailPage } from './pages/UserDetailPage';
import { UserList } from './pages/UserList';
import { UserInvitePage } from './pages/UserInvitePage';

const API_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? '/api' : 'http://localhost:3001');
const SECRET_KEY = 'admin_secret';
const ACTOR_KEY = 'admin_actor';

const NAV_LINKS = [
  { to: '/', label: 'Resumen', end: true },
  { to: '/users', label: 'Usuarios' },
  { to: '/households', label: 'Hogares' },
  { to: '/recipes', label: 'Recetas' },
  { to: '/tags', label: 'Tags' },
  { to: '/audit', label: 'Auditoría' },
];

function Layout({ actor, onLogout }: { actor: string; onLogout: () => void }) {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header__inner">
          <NavLink to="/" className="admin-brand">Comidas <small>Admin</small></NavLink>
          <nav className="admin-nav" aria-label="Administración">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="admin-session">
            <span title="Administrador actual">{actor}</span>
            <button type="button" onClick={onLogout}>Salir</button>
          </div>
        </div>
      </header>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}

export function App() {
  const [credentials, setCredentials] = useState(() => ({
    actor: sessionStorage.getItem(ACTOR_KEY) ?? '',
    secret: sessionStorage.getItem(SECRET_KEY) ?? '',
  }));

  if (credentials.actor && credentials.secret) {
    initAdminClient(`${API_URL}/admin`, credentials.actor, credentials.secret);
  }

  function handleLogin(actor: string, secret: string) {
    sessionStorage.setItem(ACTOR_KEY, actor);
    sessionStorage.setItem(SECRET_KEY, secret);
    initAdminClient(`${API_URL}/admin`, actor, secret);
    setCredentials({ actor, secret });
  }

  function handleLogout() {
    sessionStorage.removeItem(ACTOR_KEY);
    sessionStorage.removeItem(SECRET_KEY);
    setCredentials({ actor: '', secret: '' });
  }

  if (!credentials.actor || !credentials.secret) {
    return <AdminLogin apiUrl={API_URL} onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Refine
        routerProvider={routerProvider}
        dataProvider={createAdminDataProvider(`${API_URL}/admin`, credentials.actor, credentials.secret)}
        resources={[
          { name: 'users', list: '/users', show: '/users/:id' },
          { name: 'households', list: '/households', show: '/households/:id' },
          { name: 'recipes', list: '/recipes', show: '/recipes/:id' },
          { name: 'tags', list: '/tags' },
          { name: 'audit-logs', list: '/audit' },
        ]}
        options={{ syncWithLocation: false }}
      >
        <Routes>
          <Route element={<Layout actor={credentials.actor} onLogout={handleLogout} />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UserList />} />
            <Route path="users/invite" element={<UserInvitePage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="households" element={<HouseholdList />} />
            <Route path="households/:id" element={<HouseholdDetailPage />} />
            <Route path="recipes" element={<RecipeList />} />
            <Route path="recipes/:id" element={<RecipeDetailPage />} />
            <Route path="tags" element={<TagList />} />
            <Route path="audit" element={<AuditLogPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}
