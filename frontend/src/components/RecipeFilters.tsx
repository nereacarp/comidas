import { useId, useState } from 'react';
import { useShowCalories } from '../hooks/useShowCalories';
import { FlameIcon, ClockIcon, HeartIcon, HeartOutlineIcon } from './ui/Icons';
import { IngredientFilterField, type IngredientFilterSelection } from './IngredientFilterField';
import { MEAL_TYPES, mealTypeChipStyle } from '../utils/meal-type';
import { KCAL_RANGES } from '../lib/kcal-ranges';
import { TIME_RANGES } from '../lib/time-ranges';
import type { MealType, Tag } from '../types';

export type { IngredientFilterSelection };

export interface RecipeAdvancedFilters {
  kcalRangeIdx: number;
  timeRangeIdx: number;
  ingredientFilters: IngredientFilterSelection[];
}

export const EMPTY_ADVANCED_FILTERS: RecipeAdvancedFilters = {
  kcalRangeIdx: 0,
  timeRangeIdx: 0,
  ingredientFilters: [],
};

interface RecipeFiltersProps {
  householdId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  mealType: MealType | '';
  onMealTypeChange: (value: MealType | '') => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
  selectedTagIds: string[];
  onTagsChange: (ids: string[]) => void;
  tags: Tag[];
  advanced: RecipeAdvancedFilters;
  onAdvancedChange: (value: RecipeAdvancedFilters) => void;
}

export function hasActiveAdvancedFilters(
  advanced: RecipeAdvancedFilters,
  options?: { showCalories?: boolean; selectedTagIds?: string[] },
): boolean {
  return (
    (options?.showCalories !== false && advanced.kcalRangeIdx > 0) ||
    advanced.timeRangeIdx > 0 ||
    advanced.ingredientFilters.length > 0 ||
    (options?.selectedTagIds?.length ?? 0) > 0
  );
}

function selectRangeIndex(current: number, next: number): number {
  return current === next ? 0 : next;
}

export function RecipeFilters({
  householdId,
  search,
  onSearchChange,
  mealType,
  onMealTypeChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  selectedTagIds,
  onTagsChange,
  tags,
  advanced,
  onAdvancedChange,
}: Readonly<RecipeFiltersProps>) {
  const showCalories = useShowCalories();
  const filterOptions = { showCalories, selectedTagIds };
  const advancedPanelId = useId();
  const ingredientInputId = useId();
  const [showAdvanced, setShowAdvanced] = useState(() => hasActiveAdvancedFilters(advanced, filterOptions));

  const toggleTag = (tagId: string) => {
    onTagsChange(
      selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId]
    );
  };

  const setAdvancedField = <K extends keyof RecipeAdvancedFilters>(
    key: K,
    value: RecipeAdvancedFilters[K]
  ) => {
    onAdvancedChange({ ...advanced, [key]: value });
  };

  const clearAdvanced = () => {
    onAdvancedChange(EMPTY_ADVANCED_FILTERS);
    onTagsChange([]);
  };

  const advancedActive = hasActiveAdvancedFilters(advanced, filterOptions);

  return (
    <div className="card recipe-filters p-3 sm:p-4 space-y-3 min-w-0">
      <input
        type="search"
        placeholder="Buscar recetas..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="input w-full"
        aria-label="Buscar recetas"
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        <button
          type="button"
          onClick={() => onMealTypeChange('')}
          className={`${mealType === '' ? 'chip-on' : 'chip-off'} shrink-0 min-h-9`}
        >
          Todas
        </button>
        {MEAL_TYPES.map((mt) => (
          <button
            key={mt.value}
            type="button"
            onClick={() => onMealTypeChange(mealType === mt.value ? '' : mt.value)}
            className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer shrink-0 min-h-9"
            style={mealTypeChipStyle(mt.value, mealType === mt.value)}
          >
            {mt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
          className={`${favoritesOnly ? 'chip-on' : 'chip-off'} shrink-0 min-h-9 inline-flex items-center gap-1.5`}
          aria-pressed={favoritesOnly}
        >
          {favoritesOnly ? (
            <HeartIcon className="w-3.5 h-3.5" />
          ) : (
            <HeartOutlineIcon className="w-3.5 h-3.5" />
          )}
          Favoritos
        </button>
      </div>

      <div className="pt-1 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-ink min-h-10"
          aria-expanded={showAdvanced}
          aria-controls={advancedPanelId}
          onClick={() => setShowAdvanced((open) => !open)}
        >
          <span className="flex items-center gap-2">
            Más filtros
            {advancedActive && (
              <span className="recipe-filters__badge-active inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </span>
          <span className="text-muted text-xs font-medium shrink-0 pr-1 sm:pr-2" aria-hidden>
            {showAdvanced ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {showAdvanced && (
          <div id={advancedPanelId} className="mt-3 space-y-4">
            {showCalories && (
              <fieldset className="min-w-0">
                <legend className="text-xs font-semibold text-ink mb-2">Calorías</legend>
                <div className="flex gap-1.5 flex-wrap">
                  {KCAL_RANGES.map((range, i) => (
                    <button
                      key={range.label}
                      type="button"
                      onClick={() =>
                        setAdvancedField('kcalRangeIdx', selectRangeIndex(advanced.kcalRangeIdx, i))
                      }
                      className={`${advanced.kcalRangeIdx === i ? 'chip-on' : 'chip-off'} min-h-9`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {i > 0 && <FlameIcon className="w-3.5 h-3.5" />}
                        {range.label}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="min-w-0">
              <legend className="text-xs font-semibold text-ink mb-2">Tiempo total</legend>
              <div className="flex gap-1.5 flex-wrap">
                {TIME_RANGES.map((range, i) => (
                  <button
                    key={range.label}
                    type="button"
                    onClick={() =>
                      setAdvancedField('timeRangeIdx', selectRangeIndex(advanced.timeRangeIdx, i))
                    }
                    className={`${advanced.timeRangeIdx === i ? 'chip-on' : 'chip-off'} min-h-9`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {i > 0 && <ClockIcon className="w-3.5 h-3.5" />}
                      {range.label}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {tags.length > 0 && (
              <fieldset className="min-w-0">
                <legend className="text-xs font-semibold text-ink mb-2">Etiquetas</legend>
                <div className="flex gap-1.5 flex-wrap">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`${selectedTagIds.includes(tag.id) ? 'chip-on' : 'chip-off'} min-h-9`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <IngredientFilterField
              householdId={householdId}
              selected={advanced.ingredientFilters}
              onChange={(ingredientFilters) => setAdvancedField('ingredientFilters', ingredientFilters)}
              inputId={ingredientInputId}
            />

            {advancedActive && (
              <button type="button" onClick={clearAdvanced} className="btn-ghost text-sm min-h-9">
                Quitar filtros avanzados
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
