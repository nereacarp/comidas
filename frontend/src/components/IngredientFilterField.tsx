import { useRef, useState, type KeyboardEvent } from 'react';
import { createPantryApi } from '../api/pantry';
import { apiClient } from '../api/client';
import type { IngredientNameSuggestion } from '../types/ingredient-suggestion';

const pantryApi = createPantryApi(apiClient);

export interface IngredientFilterSelection {
  name: string;
  inPantry: boolean;
}

interface IngredientFilterFieldProps {
  householdId: string | null;
  selected: IngredientFilterSelection[];
  onChange: (items: IngredientFilterSelection[]) => void;
  inputId: string;
}

function chipClassFor(inPantry: boolean): string {
  return inPantry
    ? 'chip-on min-h-9 gap-1.5'
    : 'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold border min-h-9 gap-1.5 border-[color-mix(in_oklab,var(--pastel-peach)_55%,var(--border-subtle))] bg-[color-mix(in_oklab,var(--pastel-peach)_28%,var(--surface))] text-ink';
}

function statusLabel(inPantry: boolean): string {
  return inPantry ? 'En despensa' : 'Por comprar';
}

function suggestionBadge(suggestion: IngredientNameSuggestion): string {
  return suggestion.inPantry ? 'En despensa' : 'En recetas';
}

function groupSuggestions(suggestions: IngredientNameSuggestion[]) {
  const pantry = suggestions.filter((item) => item.inPantry);
  const recipes = suggestions.filter((item) => !item.inPantry);
  return { pantry, recipes };
}

function SuggestionButton({
  suggestion,
  onPick,
}: Readonly<{ suggestion: IngredientNameSuggestion; onPick: (item: IngredientNameSuggestion) => void }>) {
  const hoverClass = suggestion.inPantry
    ? 'hover:bg-[color-mix(in_oklab,var(--pastel-mint)_45%,var(--surface))]'
    : 'hover:bg-[color-mix(in_oklab,var(--pastel-peach)_35%,var(--surface))]';

  return (
    <button
      type="button"
      onMouseDown={() => onPick(suggestion)}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-ink cursor-pointer transition-colors ${hoverClass}`}
    >
      <span>{suggestion.name}</span>
      <span
        className={`text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
          suggestion.inPantry ? 'text-[var(--pastel-mint-icon)]' : 'text-[var(--pastel-peach-icon)]'
        }`}
      >
        {suggestionBadge(suggestion)}
      </span>
    </button>
  );
}

export function IngredientFilterField({
  householdId,
  selected,
  onChange,
  inputId,
}: Readonly<IngredientFilterFieldProps>) {
  const [draft, setDraft] = useState('');
  const [suggestions, setSuggestions] = useState<IngredientNameSuggestion[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadSuggestions = async (query: string) => {
    if (!householdId) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await pantryApi.ingredientNames(householdId, query);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
  };

  const removeIngredient = (name: string) => {
    const key = name.toLowerCase();
    onChange(selected.filter((item) => item.name.toLowerCase() !== key));
  };

  const addIngredient = (suggestion: IngredientNameSuggestion | string) => {
    const item =
      typeof suggestion === 'string'
        ? { name: suggestion.trim(), inPantry: false }
        : { name: suggestion.name.trim(), inPantry: suggestion.inPantry };

    if (!item.name) return;
    const key = item.name.toLowerCase();
    if (selected.some((entry) => entry.name.toLowerCase() === key)) return;

    onChange([...selected, item]);
    setDraft('');
    setSuggestions([]);
    setListOpen(false);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!householdId) {
      setSuggestions([]);
      return;
    }
    if (value.trim().length > 0) setListOpen(true);
    debounceRef.current = setTimeout(() => {
      void loadSuggestions(value.trim());
    }, value.trim().length >= 2 ? 250 : 0);
  };

  const handleInputClick = () => {
    if (!householdId) return;
    setListOpen(true);
    void loadSuggestions(draft.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[0]) addIngredient(suggestions[0]);
      else if (draft.trim()) {
        const match = suggestions.find(
          (item) => item.name.toLowerCase() === draft.trim().toLowerCase(),
        );
        addIngredient(match ?? { name: draft.trim(), inPantry: false });
      }
    }
  };

  const { pantry: pantrySuggestions, recipes: recipeSuggestions } = groupSuggestions(suggestions);
  const showDropdown = listOpen && suggestions.length > 0;

  return (
    <fieldset className="min-w-0">
      <legend className="text-xs font-semibold text-ink mb-2">Ingredientes</legend>
      <p className="text-xs text-muted mb-2">
        Recomendaciones de tu despensa y de tus recetas. Al elegir uno verás si lo tienes o hay que comprarlo.
      </p>
      <div className="relative">
        <input
          id={inputId}
          type="search"
          placeholder="Ej. pollo, tomate, salmón..."
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={handleInputClick}
          onBlur={() => setTimeout(() => setListOpen(false), 150)}
          autoComplete="off"
          className="input w-full"
          aria-describedby={selected.length > 0 ? `${inputId}-selected` : undefined}
        />
        {showDropdown && (
          <div className="dropdown-panel max-h-52">
            {pantrySuggestions.length > 0 && (
              <div>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                  Tu despensa
                </p>
                {pantrySuggestions.map((suggestion) => (
                  <SuggestionButton key={suggestion.name} suggestion={suggestion} onPick={addIngredient} />
                ))}
              </div>
            )}
            {recipeSuggestions.length > 0 && (
              <div className={pantrySuggestions.length > 0 ? 'border-t border-[var(--border-subtle)]' : ''}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted">
                  Tus recetas
                </p>
                {recipeSuggestions.map((suggestion) => (
                  <SuggestionButton key={suggestion.name} suggestion={suggestion} onPick={addIngredient} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div id={`${inputId}-selected`} className="flex flex-wrap gap-2 mt-2">
          {selected.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => removeIngredient(item.name)}
              className={chipClassFor(item.inPantry)}
              aria-label={`Quitar filtro ${item.name}, ${statusLabel(item.inPantry)}`}
            >
              <span>{item.name}</span>
              <span
                className={
                  item.inPantry
                    ? 'text-[10px] font-semibold opacity-80'
                    : 'text-[10px] font-semibold text-[var(--pastel-peach-icon)]'
                }
              >
                {statusLabel(item.inPantry)}
              </span>
              <span aria-hidden className="opacity-70">
                ×
              </span>
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
}
