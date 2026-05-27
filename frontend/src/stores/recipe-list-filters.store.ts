import { create } from 'zustand';
import {
  EMPTY_ADVANCED_FILTERS,
  type RecipeAdvancedFilters,
} from '../components/RecipeFilters';
import type { MealType } from '../types';

interface RecipeListFiltersSnapshot {
  search: string;
  mealType: MealType | '';
  favoritesOnly: boolean;
  selectedTagIds: string[];
  advanced: RecipeAdvancedFilters;
  page: number;
}

interface RecipeListFiltersState extends RecipeListFiltersSnapshot {
  setSearch: (search: string) => void;
  setMealType: (mealType: MealType | '') => void;
  setFavoritesOnly: (favoritesOnly: boolean) => void;
  setSelectedTagIds: (selectedTagIds: string[]) => void;
  setAdvanced: (advanced: RecipeAdvancedFilters) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

const initialState: RecipeListFiltersSnapshot = {
  search: '',
  mealType: '',
  favoritesOnly: false,
  selectedTagIds: [],
  advanced: EMPTY_ADVANCED_FILTERS,
  page: 1,
};

export const useRecipeListFiltersStore = create<RecipeListFiltersState>((set) => ({
  ...initialState,
  setSearch: (search) => set({ search }),
  setMealType: (mealType) => set({ mealType }),
  setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly }),
  setSelectedTagIds: (selectedTagIds) => set({ selectedTagIds }),
  setAdvanced: (advanced) => set({ advanced }),
  setPage: (page) => set({ page }),
  reset: () => set(initialState),
}));
