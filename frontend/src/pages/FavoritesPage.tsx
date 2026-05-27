import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createFavoritesApi } from '../api/favorites';
import { apiClient } from '../api/client';
import { RecipeCard } from '../components/RecipeCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Card } from '../components/ui/Card';
import { HeartIcon } from '../components/ui/Icons';
import { SectionEmptyState } from '../components/ui/SectionEmptyState';
import { RECIPES_PER_PAGE } from '../lib/constants';
import { routes } from '../lib/routes';
import { getSectionBtnClass } from '../lib/section-accents';

const FAVORITES_BTN = getSectionBtnClass(routes.favorites);
import type { Recipe } from '../types';

const favoritesApi = createFavoritesApi(apiClient);

export function FavoritesPage() {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    favoritesApi.list()
      .then(setAllRecipes)
      .catch(() => setAllRecipes([]))
      .finally(() => setIsLoading(false));
  }, []);

  const total = allRecipes.length;
  const totalPages = Math.max(1, Math.ceil(total / RECIPES_PER_PAGE));

  const recipes = useMemo(() => {
    const start = (page - 1) * RECIPES_PER_PAGE;
    return allRecipes.slice(start, start + RECIPES_PER_PAGE);
  }, [allRecipes, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="page-shell">
      <PageHeader title="Favoritos" />

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted">Cargando...</p>
        </Card>
      ) : allRecipes.length === 0 ? (
        <SectionEmptyState
          sectionPath={routes.recipes}
          icon={<HeartIcon />}
          title="Aún no tienes favoritos"
          description="Marca recetas desde tu colección."
        >
          <Link to={routes.recipes} className={`${FAVORITES_BTN} mt-4`}>
            Ir a recetas
          </Link>
        </SectionEmptyState>
      ) : (
        <>
          <div className="recipe-grid">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={RECIPES_PER_PAGE}
            onPageChange={setPage}
            itemLabel="favoritos"
          />
        </>
      )}
    </div>
  );
}
