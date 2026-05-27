import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHouseholdId } from '../hooks/useHousehold';
import { routes } from '../lib/routes';
import { createRecipesApi } from '../api/recipes';
import { createTagsApi } from '../api/tags';
import { apiClient } from '../api/client';
import { RecipeForm } from '../components/RecipeForm';
import { PageHeader } from '../components/ui/PageHeader';
import type { Recipe, Tag } from '../types';

const recipesApi = createRecipesApi(apiClient);
const tagsApi = createTagsApi(apiClient);

export function EditRecipePage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const householdId = useHouseholdId();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!householdId || !recipeId) return;
    Promise.all([
      recipesApi.getById(householdId, recipeId),
      tagsApi.list(householdId),
    ]).then(([r, t]) => {
      setRecipe(r);
      setTags(t);
    }).catch(() => {
      navigate(routes.recipes);
    }).finally(() => {
      setIsFetching(false);
    });
  }, [householdId, recipeId, navigate]);

  if (isFetching) return <p className="loading-text">Cargando...</p>;
  if (!recipe) return null;

  return (
    <div className="page-shell">
      <PageHeader title="Editar receta" />
      <RecipeForm
        initialData={recipe}
        tags={tags}
        isLoading={isLoading}
        onCancel={() => navigate(`/recipes/${recipeId}`)}
        onSubmit={async (data) => {
          if (!householdId || !recipeId) return;
          setIsLoading(true);
          try {
            await recipesApi.update(householdId, recipeId, data);
            navigate(`/recipes/${recipeId}`);
          } finally {
            setIsLoading(false);
          }
        }}
      />
    </div>
  );
}
