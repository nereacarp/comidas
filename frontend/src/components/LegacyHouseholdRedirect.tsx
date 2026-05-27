import { Navigate, useLocation, useParams } from 'react-router-dom';
import { routes } from '../lib/routes';

export function LegacyHouseholdRedirect() {
  const { householdId } = useParams<{ householdId: string }>();
  const location = useLocation();

  if (!householdId) {
    return <Navigate to={routes.dashboard} replace />;
  }

  const prefix = ``;
  const suffix = location.pathname.startsWith(prefix)
    ? location.pathname.slice(prefix.length) || '/recipes'
    : '/recipes';

  return <Navigate to={`${suffix}${location.search}${location.hash}`} replace />;
}
