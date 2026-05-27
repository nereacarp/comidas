import { useState } from 'react';
import { Refine } from '@refinedev/core';
import routerProvider from '@refinedev/react-router';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { UserList } from './pages/UserList';
import { HouseholdList } from './pages/HouseholdList';
import { RecipeList } from './pages/RecipeList';
import { TagList } from './pages/TagList';
import { AdminLogin } from './components/AdminLogin';
import { createAdminDataProvider } from './lib/adminDataProvider';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'admin_secret';

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-6">
            <span className="font-bold text-gray-900">Comidas Admin</span>
            <Link to="/users" className="text-sm text-gray-600 hover:text-gray-900">Usuarios</Link>
            <Link to="/households" className="text-sm text-gray-600 hover:text-gray-900">Hogares</Link>
            <Link to="/recipes" className="text-sm text-gray-600 hover:text-gray-900">Recetas</Link>
            <Link to="/tags" className="text-sm text-gray-600 hover:text-gray-900">Tags</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function App() {
  const [secret, setSecret] = useState<string | null>(
    () => sessionStorage.getItem(STORAGE_KEY)
  );

  function handleLogin(value: string) {
    sessionStorage.setItem(STORAGE_KEY, value);
    setSecret(value);
  }

  if (!secret) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Refine
        routerProvider={routerProvider}
        dataProvider={createAdminDataProvider(`${API_URL}/admin`, secret)}
        resources={[
          { name: 'users', list: '/users' },
          { name: 'households', list: '/households' },
          { name: 'recipes', list: '/recipes' },
          { name: 'tags', list: '/tags' },
        ]}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path="/users" element={<UserList />} />
            <Route path="/households" element={<HouseholdList />} />
            <Route path="/recipes" element={<RecipeList />} />
            <Route path="/tags" element={<TagList />} />
          </Route>
          <Route path="*" element={<Navigate to="/users" replace />} />
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}
