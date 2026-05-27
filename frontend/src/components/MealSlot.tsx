import { MealPlanRecipeLink, mealPlanItemRecipeId } from './meal-plan/MealPlanRecipeLink';
import type { MealPlanItem } from '../types';
import { UtensilsIcon } from './ui/Icons';

const EAT_OUT_NAME = 'Comer fuera';

interface MealSlotProps {
  item?: MealPlanItem;
  onAdd: () => void;
  onEatOut: () => void;
  onRemove?: (itemId: string) => void;
  canEdit?: boolean;
}

export function MealSlot({ item, onAdd, onEatOut, onRemove, canEdit = true }: Readonly<MealSlotProps>) {
  if (!item) {
    if (!canEdit) {
      return (
        <div
          className="h-[108px] rounded-2xl"
          style={{ background: 'color-mix(in oklab, var(--page-bg) 55%, var(--surface))' }}
        />
      );
    }
    return (
      <div className="min-h-[6.5rem] flex flex-col gap-1.5">
        <button type="button" onClick={onAdd} className="meal-plan-slot-empty-add" aria-label="Añadir comida">
          +
        </button>
        <button type="button" onClick={onEatOut} className="meal-plan-slot-empty-fuera">
          <span className="inline-flex items-center justify-center gap-1">
            <UtensilsIcon className="w-3.5 h-3.5" />
            Fuera
          </span>
        </button>
      </div>
    );
  }

  const isDeletedRecipe = !item.recipe && !item.recipeId && !item.customMealName;
  const label = item.recipe?.title || item.customMealName || (isDeletedRecipe ? 'Receta eliminada' : '?');
  const imageUrl = item.recipe?.imageUrl;
  const isEatOut = item.customMealName === EAT_OUT_NAME;

  let media = (
    <div
      className="w-full h-[52px] shrink-0 flex items-center justify-center"
      style={{ background: 'color-mix(in oklab, var(--pastel-cyan) 35%, var(--surface))' }}
    />
  );
  if (isEatOut) {
    media = (
      <div
        className="w-full h-[52px] shrink-0 flex items-center justify-center text-[var(--meal-plan-accent)]"
        style={{ background: 'color-mix(in oklab, var(--meal-plan-accent-soft) 45%, var(--surface))' }}
      >
        <UtensilsIcon className="w-5 h-5 text-[var(--meal-plan-accent)]" />
      </div>
    );
  } else if (imageUrl) {
    const recipeId = mealPlanItemRecipeId(item);
    const img = <img src={imageUrl} alt="" className="w-full h-[52px] shrink-0 object-cover" />;
    media = recipeId ? (
      <MealPlanRecipeLink
        recipeId={recipeId}
        title={label}
        className="meal-plan-slot-media-link block w-full shrink-0"
      >
        {img}
      </MealPlanRecipeLink>
    ) : (
      img
    );
  }

  return (
    <div className="meal-plan-slot-card">
      {media}
      <div className="px-2 py-1.5 flex-1 min-h-0 flex items-center">
        <span className="text-[11px] leading-snug text-ink font-semibold line-clamp-2 block">
          {label}
        </span>
      </div>
      {onRemove && canEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          className="meal-plan-slot-remove"
          aria-label="Eliminar"
        >
          Quitar
        </button>
      )}
    </div>
  );
}
