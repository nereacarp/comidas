import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isRecipesSectionPath } from '../lib/recipe-list-routes';
import { useRecipeListFiltersStore } from '../stores/recipe-list-filters.store';

/** Limpia filtros del listado al salir de /recipes/* hacia otra sección de la app. */
export function useResetRecipeListFiltersOnLeave() {
  const { pathname } = useLocation();
  const reset = useRecipeListFiltersStore((state) => state.reset);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const previous = prevPathRef.current;
    if (isRecipesSectionPath(previous) && !isRecipesSectionPath(pathname)) {
      reset();
    }
    prevPathRef.current = pathname;
  }, [pathname, reset]);
}
