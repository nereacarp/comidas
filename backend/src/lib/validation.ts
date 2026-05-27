import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email no valido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(1, 'El nombre es obligatorio'),
});

export const loginSchema = z.object({
  email: z.string().email('Email no valido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const updateUserPreferencesSchema = z.object({
  showCalories: z.boolean(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const createHouseholdSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});

export const addMemberSchema = z.object({
  email: z.string().email('Email no valido'),
  role: z.enum(['EDITOR', 'VIEWER']).optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['EDITOR', 'VIEWER']),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1, 'El titulo es obligatorio'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prepTime: z.number().int().nonnegative().optional(),
  cookTime: z.number().int().nonnegative().optional(),
  servings: z.number().int().positive().optional(),
  imageUrl: z.preprocess(v => v === '' ? undefined : v, z.string().url().optional()),
  kcal: z.number().int().nonnegative().optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().positive().optional(),
    unit: z.string().optional(),
    order: z.number().int().optional(),
  })).optional(),
  categories: z.array(z.enum(['DESAYUNO', 'COMIDA', 'CENA', 'SNACK', 'POSTRE'])).optional(),
  tagIds: z.array(z.string()).optional(),
});

export const createTagSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  color: z.string().optional(),
});

export const recipeFiltersSchema = z.object({
  search: z.string().optional(),
  mealType: z.enum(['DESAYUNO', 'COMIDA', 'CENA', 'SNACK', 'POSTRE']).optional(),
  tagIds: z.string().optional(),
  maxKcal: z.coerce.number().int().positive().optional(),
  minKcal: z.coerce.number().int().nonnegative().optional(),
  minTotalTime: z.coerce.number().int().nonnegative().optional(),
  maxTotalTime: z.coerce.number().int().positive().optional(),
  ingredient: z.string().optional(),
  ingredients: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const toggleFavoriteSchema = z.object({
  recipeId: z.string().min(1, 'El ID de la receta es obligatorio'),
});

export const createMealPlanItemSchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria'),
  mealType: z.enum(['DESAYUNO', 'COMIDA', 'CENA', 'SNACK']),
  recipeId: z.string().optional(),
  customMealName: z.string().optional(),
});

export const updateMealPlanItemSchema = z.object({
  recipeId: z.string().nullable().optional(),
  customMealName: z.string().nullable().optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().min(1, 'La fecha de fin es obligatoria'),
});

export const copyDaySchema = z.object({
  sourceDate: z.string().min(1, 'La fecha de origen es obligatoria'),
  targetDate: z.string().min(1, 'La fecha de destino es obligatoria'),
});

export const clearDaySchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria'),
});

export const generateShoppingListSchema = z
  .object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
    endDate: z.string().min(1, 'La fecha de fin es obligatoria'),
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: 'La fecha de inicio no puede ser posterior a la de fin',
    path: ['endDate'],
  });

export const addManualItemSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
});

export const importRecipeSchema = z.object({
  url: z.string().url('URL no valida'),
});

export const estimateKcalSchema = z.object({
  title: z.string().optional(),
  servings: z.number().int().positive().optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'El nombre del ingrediente es obligatorio'),
        quantity: z.number().positive().optional(),
        unit: z.string().optional(),
      })
    )
    .min(1, 'Se necesita al menos un ingrediente'),
});

export const suggestRecipesSchema = z.object({
  mealType: z.enum(['DESAYUNO', 'COMIDA', 'CENA', 'SNACK']),
  date: z.string().min(1, 'La fecha es obligatoria'),
});

export const copyWeekSchema = z.object({
  sourceStartDate: z.string().min(1, 'La fecha de origen es obligatoria'),
  targetStartDate: z.string().min(1, 'La fecha de destino es obligatoria'),
});

export const addPantryItemSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unit: z.string().min(1, 'La unidad es obligatoria'),
  locationId: z.string().optional(),
});

export const updatePantryItemSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  locationId: z.string().nullable().optional(),
});

export const checkItemSchema = z.object({
  purchasedQuantity: z.number().positive().optional(),
  locationId: z.string().nullable().optional(),
});

export const checkGroupedItemsSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1),
  purchasedQuantity: z.number().positive().optional(),
  locationId: z.string().nullable().optional(),
});
