import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createRecipesApi } from '../api/recipes';
import { apiClient } from '../api/client';
import { Badge } from '../components/ui/Badge';
import { MealTypeBadge } from '../components/ui/MealTypeBadge';
import { FavoriteButton } from '../components/FavoriteButton';
import { useHousehold, useHouseholdId } from '../hooks/useHousehold';
import { useShowCalories } from '../hooks/useShowCalories';
import { routes } from '../lib/routes';
import { getSectionSoftBtnClass } from '../lib/section-accents';

const RECIPES_SOFT_BTN = getSectionSoftBtnClass(routes.recipes);
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import type { Recipe } from '../types';

const recipesApi = createRecipesApi(apiClient);

function formatQuantity(qty: number): string {
  if (Number.isInteger(qty)) return qty.toString();
  const rounded = Math.round(qty * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < 0.01) return Math.round(rounded).toString();
  return rounded.toString();
}

export function RecipeDetailPage() {
  const showCalories = useShowCalories();
  const { recipeId } = useParams<{ recipeId: string }>();
  const householdId = useHouseholdId();
  const navigate = useNavigate();
  const { canEdit } = useHousehold();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customServings, setCustomServings] = useState<number | null>(null);

  useEffect(() => {
    if (!householdId || !recipeId) return;
    setIsLoading(true);
    recipesApi.getById(householdId, recipeId)
      .then((data) => {
        setRecipe(data);
        setCustomServings(null);
      })
      .catch(() => navigate(routes.recipes))
      .finally(() => setIsLoading(false));
  }, [householdId, recipeId, navigate]);

  const handleDelete = async () => {
    if (!householdId || !recipeId) return;
    if (!globalThis.confirm('Eliminar esta receta?')) return;
    await recipesApi.delete(householdId, recipeId);
    navigate(routes.recipes);
  };

  if (isLoading) return <p className="loading-text">Cargando...</p>;
  if (!recipe) return null;

  const originalServings = recipe.servings || 1;
  const activeServings = customServings ?? originalServings;
  const scale = activeServings / originalServings;

  return (
    <div className="page-shell">
      <PageHeader
        title={recipe.title}
        titleAddon={<FavoriteButton recipeId={recipe.id} compact />}
        actions={
          canEdit ? (
            <>
              <Link
                to={`/recipes/${recipeId}/edit`}
                className={RECIPES_SOFT_BTN}
              >
                Editar
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                className="btn-danger-soft"
              >
                Eliminar
              </button>
            </>
          ) : undefined
        }
        bottom={(
          <div className="flex flex-wrap gap-2">
            {recipe.categories.map((cat) => (
              <MealTypeBadge key={cat.id} mealType={cat.mealType} />
            ))}
            {recipe.tags.map((rt) => (
              <Badge key={rt.id} color={rt.tag.color || undefined}>{rt.tag.name}</Badge>
            ))}
          </div>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {recipe.imageUrl && (
            <Card className="overflow-hidden">
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full max-h-[420px] object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </Card>
          )}

          {recipe.instructions && (
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <div className="section-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                      <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75ZM2 10a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="type-card-title">Instrucciones</h3>
                </div>
              </div>

              {(() => {
                const rawSteps = recipe.instructions
                  .split('\n')
                  .map((line) => line.replace(/^\d+[.\-)\s]+\s*/, '').trim())
                  .filter((line) => line.length > 0);

                const counts = new Map<string, number>();
                const keyed = rawSteps.map((text) => {
                  const seen = counts.get(text) ?? 0;
                  counts.set(text, seen + 1);
                  return { key: `${text}__${seen}`, text };
                });

                return (
                  <ol className="space-y-4">
                    {keyed.map(({ key, text }, stepNo) => (
                      <li key={key} className="flex gap-4">
                        <span className="step-number">{stepNo + 1}</span>
                        <p className="text-sm text-ink leading-relaxed pt-1">{text}</p>
                      </li>
                    ))}
                  </ol>
                );
              })()}
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 space-y-5">
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {showCalories && recipe.kcal != null && (
                <div className="metric-tile metric-tile--peach">
                  <p className="type-metric-label">Calorías</p>
                  <p className="type-metric-value mt-1">
                    {recipe.kcal} <span className="text-sm font-medium text-muted">kcal</span>
                  </p>
                </div>
              )}
              {(recipe.prepTime != null || recipe.cookTime != null) && (
                <div className="metric-tile metric-tile--cyan">
                  <p className="type-metric-label">Tiempo total</p>
                  <p className="type-metric-value mt-1">
                    {(recipe.prepTime || 0) + (recipe.cookTime || 0)}{' '}
                    <span className="text-sm font-medium text-muted">min</span>
                  </p>
                </div>
              )}
              {recipe.servings != null && (
                <div className="recipe-servings-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="recipe-servings-card__label">Raciones</p>
                      <p className="recipe-servings-card__value">{activeServings}</p>
                    </div>
                    <div className="recipe-servings-card__controls">
                      <button
                        type="button"
                        onClick={() => setCustomServings(Math.max(1, activeServings - 1))}
                        className="recipe-servings-step-btn"
                        disabled={activeServings <= 1}
                        aria-label="Menos raciones"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomServings(activeServings + 1)}
                        className="recipe-servings-step-btn"
                        aria-label="Más raciones"
                      >
                        +
                      </button>
                      {customServings !== null && customServings !== recipe.servings && (
                        <button
                          type="button"
                          onClick={() => setCustomServings(null)}
                          className="recipe-servings-card__restore"
                        >
                          Restaurar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {recipe.ingredients.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0">
                  <h3 className="type-card-title">Ingredientes</h3>
                  <p className="type-caption mt-1">{recipe.ingredients.length} ingredientes</p>
                </div>
                <span className="scale-badge">x{scale.toFixed(2)}</span>
              </div>

              <ul className="list-divider">
                {recipe.ingredients.map((ing) => {
                  const scaledQty = ing.quantity ? ing.quantity * scale : undefined;
                  return (
                    <li key={ing.id} className="py-2.5 flex items-baseline justify-between gap-4">
                      <span className="text-sm text-ink">{ing.name}</span>
                      {(scaledQty || ing.unit) && (
                        <span className="text-sm text-muted shrink-0 tabular-nums">
                          {scaledQty && <span className="font-semibold text-ink">{formatQuantity(scaledQty)}</span>}
                          {ing.unit && <span> {ing.unit}</span>}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
