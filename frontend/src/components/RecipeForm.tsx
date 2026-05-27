import { useRef, useState } from 'react';
import { useHouseholdId } from '../hooks/useHousehold';
import { useShowCalories } from '../hooks/useShowCalories';
import { createPantryApi } from '../api/pantry';
import { createRecipesApi } from '../api/recipes';
import { apiClient } from '../api/client';
import { Card } from './ui/Card';
import { MEAL_TYPES, mealTypeChipStyle } from '../utils/meal-type';
import type { CreateRecipeInput, MealType, Tag, Recipe } from '../types';
import { routes } from '../lib/routes';
import { getSectionBtnClass } from '../lib/section-accents';

const RECIPES_BTN = getSectionBtnClass(routes.recipes);
const pantryApi = createPantryApi(apiClient);
const recipesApi = createRecipesApi(apiClient);

const makeId = () => Math.random().toString(36).slice(2, 10);

interface IngredientInput {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

interface StepInput {
  id: string;
  text: string;
}

interface RecipeFormProps {
  initialData?: Recipe;
  tags: Tag[];
  onSubmit: (data: CreateRecipeInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RecipeForm(props: Readonly<RecipeFormProps>) {
  const { initialData, tags, onSubmit, onCancel, isLoading } = props;
  const showCalories = useShowCalories();
  const householdId = useHouseholdId();
  const [title, setTitle] = useState(initialData?.title || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [steps, setSteps] = useState<StepInput[]>(() => {
    const raw = initialData?.instructions || '';
    if (!raw) return [{ id: makeId(), text: '' }];
    const cleaned = raw.split('\n')
      .map((s) => s.replace(/^\d+[.\-)\s]+\s*/, '').trim())
      .filter((s) => s.length > 0);
    return cleaned.map((text) => ({ id: makeId(), text }));
  });
  const [prepTime, setPrepTime] = useState(initialData?.prepTime?.toString() || '');
  const [cookTime, setCookTime] = useState(initialData?.cookTime?.toString() || '');
  const [servings, setServings] = useState(initialData?.servings?.toString() || '');
  const [kcal, setKcal] = useState(initialData?.kcal?.toString() || '');
  const [categories, setCategories] = useState<MealType[]>(
    initialData?.categories.map((c) => c.mealType) || []
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags.map((t) => t.tagId) || []
  );
  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    initialData?.ingredients.map((i) => ({
      id: i.id || makeId(),
      name: i.name,
      quantity: i.quantity?.toString() || '',
      unit: i.unit || '',
    })) || [{ id: makeId(), name: '', quantity: '', unit: '' }]
  );
  const [error, setError] = useState('');
  const [isEstimatingKcal, setIsEstimatingKcal] = useState(false);
  const [kcalEstimateError, setKcalEstimateError] = useState('');
  const [kcalEstimateHint, setKcalEstimateHint] = useState('');
  const [ingSuggestions, setIngSuggestions] = useState<string[]>([]);
  const [activeIngIdx, setActiveIngIdx] = useState<number | null>(null);
  const ingDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleIngNameChange = (index: number, value: string) => {
    updateIngredient(index, 'name', value);
    if (ingDebounceRef.current) clearTimeout(ingDebounceRef.current);
    if (!householdId || value.trim().length < 2) {
      setIngSuggestions([]);
      setActiveIngIdx(null);
      return;
    }
    ingDebounceRef.current = setTimeout(async () => {
      try {
        const results = await pantryApi.ingredientNames(householdId, value.trim());
        setIngSuggestions(results.map((item) => item.name));
        setActiveIngIdx(results.length > 0 ? index : null);
      } catch {
        setIngSuggestions([]);
        setActiveIngIdx(null);
      }
    }, 250);
  };

  const selectIngSuggestion = (index: number, name: string) => {
    updateIngredient(index, 'name', name);
    setIngSuggestions([]);
    setActiveIngIdx(null);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { id: makeId(), name: '', quantity: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof IngredientInput, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addStep = () => setSteps([...steps, { id: makeId(), text: '' }]);

  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], text: value };
    setSteps(updated);
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    const updated = [...steps];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setSteps(updated);
  };

  const toggleCategory = (mt: MealType) => {
    setCategories(
      categories.includes(mt)
        ? categories.filter((c) => c !== mt)
        : [...categories, mt]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(
      selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId]
    );
  };

  const namedIngredients = ingredients.filter((i) => i.name.trim());

  const handleEstimateKcal = async () => {
    if (!householdId || namedIngredients.length === 0) return;
    setIsEstimatingKcal(true);
    setKcalEstimateError('');
    setKcalEstimateHint('');
    try {
      const result = await recipesApi.estimateKcal(householdId, {
        title: title.trim() || undefined,
        servings: servings ? Number.parseInt(servings, 10) : undefined,
        ingredients: namedIngredients.map((i) => ({
          name: i.name.trim(),
          quantity: i.quantity ? Number.parseFloat(i.quantity) : undefined,
          unit: i.unit.trim() || undefined,
        })),
      });
      setKcal(result.kcal.toString());
      setKcalEstimateHint(
        result.explanation
          ?? (servings
            ? `Estimación por ración (${servings} en total). Puedes editarla.`
            : 'Estimación del plato completo. Puedes editarla.')
      );
    } catch (err) {
      setKcalEstimateError(err instanceof Error ? err.message : 'No se pudieron estimar las calorías');
    } finally {
      setIsEstimatingKcal(false);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('El titulo es obligatorio');
      return;
    }

    const data: CreateRecipeInput = {
      title: title.trim(),
      imageUrl: imageUrl.trim() || undefined,
      description: description.trim() || undefined,
      instructions: steps.map((s) => s.text).filter((s) => s.trim()).join('\n') || undefined,
      prepTime: prepTime ? Number.parseInt(prepTime) : undefined,
      cookTime: cookTime ? Number.parseInt(cookTime) : undefined,
      servings: servings ? Number.parseInt(servings) : undefined,
      kcal: showCalories
        ? (kcal ? Number.parseInt(kcal) : undefined)
        : initialData?.kcal,
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i, idx) => ({
          name: i.name.trim(),
          quantity: i.quantity ? Number.parseFloat(i.quantity) : undefined,
          unit: i.unit.trim() || undefined,
          order: idx,
        })),
      categories: categories.length > 0 ? categories : undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    };

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="p-6 lg:col-span-8 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h3 className="text-base type-card-title">Detalles</h3>
                <p className="type-hint mt-1">Título, imagen y descripción.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="type-label block">Título *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="imageUrl" className="type-label block">Imagen</label>
                  <input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="URL de la imagen (opcional)"
                    className="input mt-1"
                  />
                </div>
                {showCalories && (
                  <div className="sm:col-span-1">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="kcal" className="type-label block">
                        Calorías (kcal)
                      </label>
                      <button
                        type="button"
                        onClick={handleEstimateKcal}
                        disabled={isEstimatingKcal || namedIngredients.length === 0}
                        className="text-xs font-semibold text-[var(--brand)] hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed shrink-0"
                      >
                        {isEstimatingKcal ? 'Calculando…' : 'Calcular con IA'}
                      </button>
                    </div>
                    <input
                      id="kcal"
                      type="number"
                      min="0"
                      value={kcal}
                      onChange={(e) => {
                        setKcal(e.target.value);
                        setKcalEstimateHint('');
                        setKcalEstimateError('');
                      }}
                      placeholder="ej. 450"
                      className="input mt-1 border-orange-200 focus:border-orange-300 focus:ring-1 focus:ring-orange-300"
                    />
                    {kcalEstimateError && (
                      <p className="text-xs text-[var(--danger-text)] mt-1">{kcalEstimateError}</p>
                    )}
                    {kcalEstimateHint && !kcalEstimateError && (
                      <p className="type-caption mt-1">{kcalEstimateHint}</p>
                    )}
                    {!kcalEstimateHint && !kcalEstimateError && namedIngredients.length > 0 && (
                      <p className="type-caption mt-1">
                        Estimación opcional según ingredientes. Siempre editable.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-40 w-full object-cover rounded-[var(--radius-card)] border border-[var(--border-subtle)]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                />
              )}

              <div>
                <label htmlFor="description" className="type-label block">Descripción</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="input mt-1 min-h-[96px]"
                />
              </div>
            </div>
        </Card>

        <div className="lg:col-span-4 space-y-5 min-w-0 lg:sticky lg:top-4 lg:self-start">
          <Card className="p-6">
            <h3 className="text-base type-card-title">Tiempos</h3>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label htmlFor="prepTime" className="type-caption block mb-1">Prep (min)</label>
                <input
                  id="prepTime"
                  type="number"
                  min="0"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="cookTime" className="type-caption block mb-1">Cocción (min)</label>
                <input
                  id="cookTime"
                  type="number"
                  min="0"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  className="input"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="servings" className="type-caption block mb-1">Raciones</label>
                <input
                  id="servings"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-base type-card-title">Categorías</h3>
            <div className="flex flex-wrap gap-2 mt-4">
              {MEAL_TYPES.map((mt) => {
                const selected = categories.includes(mt.value);
                return (
                  <button
                    key={mt.value}
                    type="button"
                    onClick={() => toggleCategory(mt.value)}
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border transition-colors cursor-pointer"
                    style={mealTypeChipStyle(mt.value, selected)}
                  >
                    {mt.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {tags.length > 0 && (
            <Card className="p-6">
              <h3 className="text-base type-card-title">Tags</h3>
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={selectedTagIds.includes(tag.id) ? 'chip-on' : 'chip-off'}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card className="p-6 lg:col-span-6 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base type-card-title">Instrucciones</h3>
                <p className="type-hint mt-1">Escribe pasos cortos y claros.</p>
              </div>
              <button
                type="button"
                onClick={addStep}
                className="btn-soft !px-4 !py-2"
              >
                + Añadir paso
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={step.id} className="flex gap-2 items-start">
                  <span className="step-index w-6 shrink-0 text-right tabular-nums">
                    {i + 1}
                  </span>
                  <textarea
                    value={step.text}
                    onChange={(e) => updateStep(i, e.target.value)}
                    rows={2}
                    placeholder={`Paso ${i + 1}`}
                    className="input flex-1 resize-none"
                    aria-label={`Paso ${i + 1}`}
                  />
                  <div className="flex flex-col gap-1 shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={() => moveStep(i, -1)}
                      disabled={i === 0}
                      className="icon-btn-ghost disabled:opacity-30 cursor-pointer text-xs"
                      aria-label={`Subir paso ${i + 1}`}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStep(i, 1)}
                      disabled={i === steps.length - 1}
                      className="icon-btn-ghost disabled:opacity-30 cursor-pointer text-xs"
                      aria-label={`Bajar paso ${i + 1}`}
                    >
                      ▼
                    </button>
                  </div>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="h-9 w-9 rounded-full btn-danger-soft !p-0 mt-1"
                      aria-label={`Eliminar paso ${i + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
        </Card>

        <Card className="p-6 lg:col-span-6 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base type-card-title">Ingredientes</h3>
                <p className="type-hint mt-1">Cantidad y unidad opcionales.</p>
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="btn-soft !px-4 !py-2 shrink-0"
              >
                + Añadir
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={ing.id} className="flex items-center gap-2 min-w-0">
                  <div className="relative min-w-0 flex-1">
                    <label className="sr-only" htmlFor={`ing-name-${ing.id}`}>Ingrediente {i + 1}</label>
                    <input
                      id={`ing-name-${ing.id}`}
                      placeholder="Ingrediente"
                      value={ing.name}
                      onChange={(e) => handleIngNameChange(i, e.target.value)}
                      onFocus={() => ingSuggestions.length > 0 && activeIngIdx === i && setActiveIngIdx(i)}
                      onBlur={() => setTimeout(() => setActiveIngIdx(null), 150)}
                      autoComplete="off"
                      className="input w-full"
                      aria-label={`Ingrediente ${i + 1}`}
                    />
                    {activeIngIdx === i && ingSuggestions.length > 0 && (
                      <div className="dropdown-panel max-h-44">
                        {ingSuggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onMouseDown={() => selectIngSuggestion(i, s)}
                            className="dropdown-item first:rounded-t-[var(--radius-card)] last:rounded-b-[var(--radius-card)]"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    placeholder="Cant."
                    type="number"
                    step="any"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                    className="input w-[4.5rem] shrink-0 tabular-nums"
                    aria-label={`Cantidad ingrediente ${i + 1}`}
                  />
                  <input
                    placeholder="Unidad"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                    className="input w-[5.5rem] shrink-0"
                    aria-label={`Unidad ingrediente ${i + 1}`}
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(i)}
                      className="h-10 w-10 rounded-full btn-danger-soft !p-0 shrink-0"
                      aria-label={`Eliminar ingrediente ${i + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
        </Card>
      </div>

      <div className="sticky bottom-2 z-10">
        <div className="flex items-center justify-end gap-2 form-sticky-bar">
          <button
            type="button"
            onClick={onCancel}
            className="btn-neutral"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`${RECIPES_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </form>
  );
}
