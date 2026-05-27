import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHouseholdId } from '../hooks/useHousehold';
import { routes } from '../lib/routes';
import { getSectionBtnClass } from '../lib/section-accents';

const RECIPES_BTN = getSectionBtnClass(routes.recipes);
import { createRecipesApi } from '../api/recipes';
import { createTagsApi } from '../api/tags';
import { apiClient } from '../api/client';
import { RecipeForm } from '../components/RecipeForm';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import type { Tag, ImportedRecipe, Recipe } from '../types';

const recipesApi = createRecipesApi(apiClient);
const tagsApi = createTagsApi(apiClient);

export function CreateRecipePage() {
  const householdId = useHouseholdId();
  const navigate = useNavigate();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importedData, setImportedData] = useState<Partial<Recipe> | undefined>();
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!householdId) return;
    tagsApi.list(householdId).then(setTags).catch(() => {});
  }, [householdId]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdId || !importUrl.trim()) return;
    setIsImporting(true);
    setImportError('');
    setImportWarnings([]);
    try {
      const data: ImportedRecipe = await recipesApi.importFromUrl(householdId, importUrl.trim());
      if (data.warnings) setImportWarnings(data.warnings);
      setImportedData({
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        imageUrl: data.imageUrl,
        ingredients: data.ingredients.map((ing, i) => ({
          id: `imported-${i}`,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          order: i,
        })),
        categories: (data.categories || []).map((mealType) => ({
          id: '',
          recipeId: '',
          mealType,
        })),
        tags: [],
      } as Partial<Recipe>);
      setImportUrl('');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader title="Nueva receta" />

      {!importedData && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="type-card-title">Importar desde URL</h3>
            <p className="type-hint mt-1">
              Pega el enlace de una web de recetas y rellenamos el formulario por ti.
            </p>
          </div>
          <form onSubmit={handleImport} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="url"
              placeholder="https://www.ejemplo.com/receta..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="input flex-1 min-w-0"
            />
            <button
              type="submit"
              disabled={isImporting || !importUrl.trim()}
              className={`${RECIPES_BTN} whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed shrink-0`}
            >
              {isImporting ? 'Importando...' : 'Importar'}
            </button>
          </form>
          {importError && (
            <div className="mt-3 rounded-2xl border alert-error border-0 p-3">
              <p className="text-sm font-semibold text-[var(--danger-text)]">{importError}</p>
              <p className="text-xs text-[var(--danger-text)] mt-1">
                Prueba con otra URL o completa la receta manualmente abajo.
              </p>
            </div>
          )}
          {!importError && (
            <p className="type-caption mt-2">
              Funciona con la mayoría de webs de recetas.
            </p>
          )}
        </Card>
      )}

      {importWarnings.length > 0 && (
        <Card className="p-4 alert-warning border-0">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[var(--danger-text)] mt-0.5 shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-[var(--danger-text)]">
                No se pudo leer toda la receta de esta página
              </p>
              <ul className="mt-1 text-sm text-[var(--danger-text)] list-disc list-inside">
                {importWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-[var(--danger-text)]">
                Completa los datos que faltan manualmente en el formulario
              </p>
            </div>
          </div>
        </Card>
      )}

      <RecipeForm
        key={importedData ? 'imported' : 'empty'}
        initialData={importedData as Recipe | undefined}
        tags={tags}
        isLoading={isLoading}
        onCancel={() => navigate(routes.recipes)}
        onSubmit={async (data) => {
          setIsLoading(true);
          try {
            await recipesApi.create(householdId, data);
            navigate(routes.recipes);
          } finally {
            setIsLoading(false);
          }
        }}
      />
    </div>
  );
}
