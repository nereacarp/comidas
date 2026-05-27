import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createRecipesApi } from '../api/recipes';
import { createTagsApi } from '../api/tags';
import { apiClient } from '../api/client';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeFilters } from '../components/RecipeFilters';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Card } from '../components/ui/Card';
import { BookOpenIcon } from '../components/ui/Icons';
import { SectionEmptyState } from '../components/ui/SectionEmptyState';
import { useHousehold, useHouseholdId } from '../hooks/useHousehold';
import { RECIPES_PER_PAGE } from '../lib/constants';
import { useShowCalories } from '../hooks/useShowCalories';
import { buildRecipeListParams } from '../lib/recipe-filters';
import { routes } from '../lib/routes';
import { getSectionBtnClass } from '../lib/section-accents';

const RECIPES_BTN = getSectionBtnClass(routes.recipes);
import { useRecipeListFiltersStore } from '../stores/recipe-list-filters.store';
import type { Recipe, Tag } from '../types';

const recipesApi = createRecipesApi(apiClient);
const tagsApi = createTagsApi(apiClient);

export function RecipesPage() {
  const showCalories = useShowCalories();
  const householdId = useHouseholdId();
  const { canEdit } = useHousehold();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const search = useRecipeListFiltersStore((state) => state.search);
  const mealType = useRecipeListFiltersStore((state) => state.mealType);
  const favoritesOnly = useRecipeListFiltersStore((state) => state.favoritesOnly);
  const selectedTagIds = useRecipeListFiltersStore((state) => state.selectedTagIds);
  const advancedFilters = useRecipeListFiltersStore((state) => state.advanced);
  const page = useRecipeListFiltersStore((state) => state.page);
  const setSearch = useRecipeListFiltersStore((state) => state.setSearch);
  const setMealType = useRecipeListFiltersStore((state) => state.setMealType);
  const setFavoritesOnly = useRecipeListFiltersStore((state) => state.setFavoritesOnly);
  const setSelectedTagIds = useRecipeListFiltersStore((state) => state.setSelectedTagIds);
  const setAdvancedFilters = useRecipeListFiltersStore((state) => state.setAdvanced);
  const setPage = useRecipeListFiltersStore((state) => state.setPage);
  const resetFilters = useRecipeListFiltersStore((state) => state.reset);

  const prevHouseholdIdRef = useRef(householdId);
  const filterSnapshotRef = useRef(
    JSON.stringify({ search, mealType, favoritesOnly, selectedTagIds, advanced: advancedFilters }),
  );

  const totalPages = Math.max(1, Math.ceil(total / RECIPES_PER_PAGE));

  const loadRecipes = useCallback(async (signal?: AbortSignal) => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      const params = buildRecipeListParams(
        page,
        RECIPES_PER_PAGE,
        {
          search,
          mealType,
          favoritesOnly,
          selectedTagIds,
          advanced: advancedFilters,
        },
        { showCalories },
      );
      const data = await recipesApi.list(householdId, params, signal);
      setRecipes(data.recipes);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setRecipes([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [householdId, search, mealType, favoritesOnly, selectedTagIds, advancedFilters, page, showCalories]);

  useEffect(() => {
    const controller = new AbortController();
    loadRecipes(controller.signal);
    return () => controller.abort();
  }, [loadRecipes]);

  useEffect(() => {
    const snapshot = JSON.stringify({ search, mealType, selectedTagIds, advanced: advancedFilters });
    if (filterSnapshotRef.current !== snapshot) {
      filterSnapshotRef.current = snapshot;
      setPage(1);
    }
  }, [search, mealType, favoritesOnly, selectedTagIds, advancedFilters, setPage]);

  useEffect(() => {
    if (!householdId) return;
    tagsApi.list(householdId).then(setTags).catch(() => {});
  }, [householdId]);

  useEffect(() => {
    if (prevHouseholdIdRef.current !== householdId) {
      resetFilters();
      prevHouseholdIdRef.current = householdId;
    }
  }, [householdId, resetFilters]);

  return (
    <div className="page-shell">
      <PageHeader
        title="Recetas"
        actions={
          canEdit ? (
            <Link to={routes.recipeNew} className={RECIPES_BTN}>
              + Nueva receta
            </Link>
          ) : undefined
        }
      />

      <RecipeFilters
        householdId={householdId}
        search={search}
        onSearchChange={setSearch}
        mealType={mealType}
        onMealTypeChange={setMealType}
        favoritesOnly={favoritesOnly}
        onFavoritesOnlyChange={setFavoritesOnly}
        selectedTagIds={selectedTagIds}
        onTagsChange={setSelectedTagIds}
        tags={tags}
        advanced={advancedFilters}
        onAdvancedChange={setAdvancedFilters}
      />

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted">Cargando recetas...</p>
        </Card>
      ) : recipes.length === 0 ? (
        <SectionEmptyState
          sectionPath={routes.recipes}
          icon={<BookOpenIcon />}
          title="No hay recetas"
          description={
            canEdit
              ? 'Prueba otros filtros o crea la primera con el botón de arriba.'
              : 'Aún no hay recetas en este hogar con estos filtros.'
          }
        />
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
            itemLabel="recetas"
          />
        </>
      )}
    </div>
  );
}
