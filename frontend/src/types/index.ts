export interface User {
  id: string;
  email: string;
  name: string;
  showCalories: boolean;
  createdAt: string;
}

export interface Household {
  id: string;
  name: string;
  accentKey?: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  members: HouseholdMember[];
  createdAt: string;
}

export interface HouseholdMember {
  id: string;
  userId: string;
  householdId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  user: { id: string; email: string; name: string };
}

export type HouseholdRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface HouseholdInvitation {
  id: string;
  householdId: string;
  email: string;
  role: HouseholdRole;
  status: InvitationStatus;
  invitedById: string;
  createdAt: string;
  respondedAt?: string | null;
  household: { id: string; name: string };
  invitedBy: { id: string; name: string; email: string };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserProfile extends User {
  households: Array<{
    id: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    household: { id: string; name: string };
  }>;
}

export type MealType = 'DESAYUNO' | 'COMIDA' | 'CENA' | 'SNACK' | 'POSTRE';

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  order: number;
}

export interface RecipeCategory {
  id: string;
  recipeId: string;
  mealType: MealType;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  householdId: string;
}

export interface RecipeTag {
  id: string;
  recipeId: string;
  tagId: string;
  tag: Tag;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  kcal?: number;
  householdId: string;
  ingredients: RecipeIngredient[];
  categories: RecipeCategory[];
  tags: RecipeTag[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeListResponse {
  recipes: Recipe[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateRecipeInput {
  title: string;
  description?: string;
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  kcal?: number;
  ingredients?: Array<{ name: string; quantity?: number; unit?: string; order?: number }>;
  categories?: MealType[];
  tagIds?: string[];
}

export interface MealPlanItem {
  id: string;
  date: string;
  mealType: MealType;
  recipeId?: string;
  customMealName?: string;
  householdId: string;
  recipe?: Recipe;
  createdAt: string;
}

export interface EstimateKcalInput {
  title?: string;
  servings?: number;
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
}

export interface EstimateKcalResult {
  kcal: number;
  explanation?: string;
}

export interface ImportedRecipe {
  title: string;
  description?: string;
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  categories?: MealType[];
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
  warnings?: string[];
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  checked: boolean;
  isManual: boolean;
  sourceRecipeId?: string;
  sourceRecipe?: { id: string; title: string };
}

export interface ShoppingList {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  accentKey?: string;
  shareToken?: string;
  householdId: string;
  items: ShoppingListItem[];
  createdAt: string;
}

export interface PantryAdditionResult {
  name: string;
  quantity: number;
  unit: string;
  locationId?: string;
}

export interface CheckGroupedShoppingItemsResult {
  items: ShoppingListItem[];
  pantryAdded: PantryAdditionResult | null;
}

export interface StorageLocation {
  id: string;
  name: string;
  icon: string;
  color?: string;
  order: number;
  layoutColumn: number;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  locationId?: string | null;
  location?: StorageLocation | null;
  householdId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PantrySubtraction {
  name: string;
  quantity: number;
  unit: string;
}

export interface GenerateShoppingListResponse extends ShoppingList {
  pantrySubtractions: PantrySubtraction[];
}
