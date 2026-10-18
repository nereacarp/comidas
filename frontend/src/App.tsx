import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { AcceptInvitationPage } from './pages/AcceptInvitationPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LegacyHouseholdRedirect } from './components/LegacyHouseholdRedirect';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './stores/auth.store';
import { registerUnauthorizedHandler } from './api/client';

registerUnauthorizedHandler(() => useAuthStore.getState().logout());

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const RecipesPage = lazy(() => import('./pages/RecipesPage').then((module) => ({ default: module.RecipesPage })));
const RecipeDetailPage = lazy(() => import('./pages/RecipeDetailPage').then((module) => ({ default: module.RecipeDetailPage })));
const CreateRecipePage = lazy(() => import('./pages/CreateRecipePage').then((module) => ({ default: module.CreateRecipePage })));
const EditRecipePage = lazy(() => import('./pages/EditRecipePage').then((module) => ({ default: module.EditRecipePage })));
const MealPlanPage = lazy(() => import('./pages/MealPlanPage').then((module) => ({ default: module.MealPlanPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((module) => ({ default: module.FavoritesPage })));
const ShoppingListPage = lazy(() => import('./pages/ShoppingListPage').then((module) => ({ default: module.ShoppingListPage })));
const ShoppingListDetailPage = lazy(() => import('./pages/ShoppingListDetailPage').then((module) => ({ default: module.ShoppingListDetailPage })));
const PantryPage = lazy(() => import('./pages/PantryPage').then((module) => ({ default: module.PantryPage })));
const HouseholdSettingsPage = lazy(() => import('./pages/HouseholdSettingsPage').then((module) => ({ default: module.HouseholdSettingsPage })));
const SharedShoppingListPage = lazy(() => import('./pages/SharedShoppingListPage').then((module) => ({ default: module.SharedShoppingListPage })));
const HealthPage = lazy(() => import('./pages/HealthPage').then((module) => ({ default: module.HealthPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((module) => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((module) => ({ default: module.TermsPage })));

function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export function App() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-page text-muted">Cargando...</div>}>
      <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/shared/:token" element={<SharedShoppingListPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
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
    </Suspense>
  );
}
