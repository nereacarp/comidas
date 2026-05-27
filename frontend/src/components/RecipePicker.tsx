import { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { createRecipesApi } from '../api/recipes';
import { apiClient } from '../api/client';
import { useShowCalories } from '../hooks/useShowCalories';
import { FlameIcon, UtensilsIcon } from './ui/Icons';
import { KCAL_RANGES } from '../lib/kcal-ranges';
import type { Recipe, MealType } from '../types';

const recipesApi = createRecipesApi(apiClient);

interface RecipePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipe: Recipe) => void;
  onCustomMeal: (name: string) => void;
  householdId: string;
  mealType?: MealType;
  date?: string;
}

export function RecipePicker({ isOpen, onClose, onSelect, onCustomMeal, householdId, mealType, date }: RecipePickerProps) {
  const showCalories = useShowCalories();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [kcalRangeIdx, setKcalRangeIdx] = useState(0);
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setLoadError(false);
    const controller = new AbortController();
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (mealType) params.mealType = mealType;
    recipesApi.list(householdId, params, controller.signal)
      .then((data) => setRecipes(data.recipes))
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setLoadError(true);
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [isOpen, householdId, search, mealType]);

  useEffect(() => {
    if (!isOpen || !mealType || !date) {
      setSuggestions([]);
      return;
    }
    recipesApi.suggestions(householdId, mealType, date)
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [isOpen, householdId, mealType, date]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName.trim()) {
      onCustomMeal(customName.trim());
      setCustomName('');
      onClose();
    }
  };

  const kcalRange = KCAL_RANGES[kcalRangeIdx];
  const filteredRecipes =
    !showCalories || kcalRangeIdx === 0
      ? recipes
      : recipes.filter((r) => {
          if (!r.kcal) return false;
          return r.kcal >= kcalRange.min && r.kcal < kcalRange.max;
        });

  const suggestionIds = new Set(suggestions.map((s) => s.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Elegir receta">
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => { onCustomMeal('Comer fuera'); onClose(); }}
          className="w-full flex items-center gap-3 surface-row cursor-pointer transition-colors hover:bg-[color-mix(in_oklab,var(--page-bg)_55%,var(--surface))]"
        >
          <span className="section-icon-box h-9 w-9">
            <UtensilsIcon className="w-5 h-5" />
          </span>
          <span className="font-semibold text-ink">Comer fuera</span>
        </button>

        {suggestions.length > 0 && !search && (
          <div>
            <p className="type-caption font-semibold mb-2 uppercase tracking-widest">Sugerencias</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => { onSelect(recipe); onClose(); }}
                  className="shrink-0 w-28 text-center p-2 surface-row cursor-pointer transition-colors hover:bg-[color-mix(in_oklab,var(--page-bg)_55%,var(--surface))]"
                >
                  {recipe.imageUrl ? (
                    <img src={recipe.imageUrl} alt="" className="w-full h-14 rounded-[var(--radius-control)] object-cover mb-1" />
                  ) : (
                    <div className="w-full h-14 rounded-[var(--radius-control)] mb-1 bg-[color-mix(in_oklab,var(--pastel-lavender)_35%,var(--surface))]" />
                  )}
                  <span className="text-[11px] font-semibold text-ink line-clamp-2 block">{recipe.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          type="text"
          placeholder="Buscar recetas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />

        {showCalories && (
          <div className="flex gap-1.5 flex-wrap">
            {KCAL_RANGES.map((range, i) => (
              <button
                key={range.label}
                type="button"
                onClick={() => setKcalRangeIdx(i)}
                className={kcalRangeIdx === i ? 'chip-on' : 'chip-off'}
              >
                <span className="inline-flex items-center gap-1.5">
                  <FlameIcon className="w-3.5 h-3.5" />
                  {range.label}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="max-h-64 overflow-y-auto space-y-1">
          {isLoading ? (
            <p className="type-hint py-2">Cargando...</p>
          ) : loadError ? (
            <p className="type-hint py-2 text-[var(--error)]">No se pudieron cargar las recetas.</p>
          ) : filteredRecipes.length === 0 ? (
            <p className="type-hint py-2">
              {showCalories && kcalRangeIdx !== 0 ? 'Sin recetas en este rango calórico' : 'No hay recetas'}
            </p>
          ) : (
            filteredRecipes.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => { onSelect(recipe); onClose(); }}
                className="dropdown-item flex items-center gap-3 !text-left rounded-[var(--radius-control)]"
              >
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt="" className="w-10 h-10 rounded-[var(--radius-control)] object-cover shrink-0 border border-[var(--border-subtle)]" />
                ) : (
                  <div className="w-10 h-10 rounded-[var(--radius-control)] shrink-0 border border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--pastel-lavender)_30%,var(--surface))]" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-ink block truncate">{recipe.title}</span>
                  {showCalories && recipe.kcal ? (
                    <span className="text-xs text-muted font-semibold inline-flex items-center gap-1">
                      <FlameIcon className="w-3.5 h-3.5" />
                      {recipe.kcal} kcal
                    </span>
                  ) : recipe.description ? (
                    <span className="text-xs text-muted block truncate">{recipe.description.slice(0, 60)}</span>
                  ) : null}
                </div>
                {suggestionIds.has(recipe.id) && (
                  <span className="role-badge role-badge--editor shrink-0">Sugerida</span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <p className="type-caption mb-2">O añade algo personalizado:</p>
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: Comer fuera, Sobras..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 input"
            />
            <button
              type="submit"
              disabled={!customName.trim()}
              className="btn-neutral disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Añadir
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
