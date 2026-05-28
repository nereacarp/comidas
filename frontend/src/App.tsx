import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecipesPage } from './pages/RecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { CreateRecipePage } from './pages/CreateRecipePage';
import { EditRecipePage } from './pages/EditRecipePage';
import { MealPlanPage } from './pages/MealPlanPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { ShoppingListDetailPage } from './pages/ShoppingListDetailPage';
import { PantryPage } from './pages/PantryPage';
import { HouseholdSettingsPage } from './pages/HouseholdSettingsPage';
import { SharedShoppingListPage } from './pages/SharedShoppingListPage';
import { HealthPage } from './pages/HealthPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LegacyHouseholdRedirect } from './components/LegacyHouseholdRedirect';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './stores/auth.store';
import { registerUnauthorizedHandler } from './api/client';

registerUnauthorizedHandler(() => useAuthStore.getState().logout());

function RootRedirect() {
  const token = useAuthStore((s) => s.token);
  return <Navigate to={token ? '/dashboard' : '/login'} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/shared/:token" element={<SharedShoppingListPage />} />
      <Route path="/households/:householdId/*" element={<LegacyHouseholdRedirect />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
          <Route path="/health" element={<ErrorBoundary><HealthPage /></ErrorBoundary>} />
          <Route path="/recipes" element={<ErrorBoundary><RecipesPage /></ErrorBoundary>} />
          <Route path="/recipes/new" element={<ErrorBoundary><CreateRecipePage /></ErrorBoundary>} />
          <Route path="/recipes/:recipeId" element={<ErrorBoundary><RecipeDetailPage /></ErrorBoundary>} />
          <Route path="/recipes/:recipeId/edit" element={<ErrorBoundary><EditRecipePage /></ErrorBoundary>} />
          <Route path="/meal-plan" element={<ErrorBoundary><MealPlanPage /></ErrorBoundary>} />
          <Route path="/favorites" element={<ErrorBoundary><FavoritesPage /></ErrorBoundary>} />
          <Route path="/shopping-lists" element={<ErrorBoundary><ShoppingListPage /></ErrorBoundary>} />
          <Route path="/shopping-lists/:listId" element={<ErrorBoundary><ShoppingListDetailPage /></ErrorBoundary>} />
          <Route path="/pantry" element={<ErrorBoundary><PantryPage /></ErrorBoundary>} />
          <Route path="/settings" element={<ErrorBoundary><HouseholdSettingsPage /></ErrorBoundary>} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
