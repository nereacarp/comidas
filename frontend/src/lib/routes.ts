export const routes = {
  dashboard: '/dashboard',
  health: '/health',
  recipes: '/recipes',
  recipeNew: '/recipes/new',
  recipe: (id: string) => `/recipes/${id}`,
  recipeEdit: (id: string) => `/recipes/${id}/edit`,
  mealPlan: '/meal-plan',
  favorites: '/favorites',
  shoppingLists: '/shopping-lists',
  shoppingList: (id: string) => `/shopping-lists/${id}`,
  pantry: '/pantry',
  settings: '/settings',
} as const;
