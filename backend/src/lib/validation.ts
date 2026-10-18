import { z } from 'zod';

const trimmed = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} es obligatorio`).max(max, `${label} es demasiado largo`);

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max, 'El texto es demasiado largo').optional();

const email = z.string().trim().toLowerCase().email('Email no válido').max(254);

const isoDate = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, 'La fecha debe tener formato AAAA-MM-DD y ser válida');

const httpUrl = z.string().url('URL no válida').refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === 'http:' || protocol === 'https:';
}, 'Solo se permiten URLs http o https');

export const registerSchema = z.object({
  email,
  password: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres').max(128),
  name: trimmed('El nombre', 100),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'La contraseña es obligatoria').max(128),
});

export const updateUserPreferencesSchema = z.object({ showCalories: z.boolean() });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'La contraseña es obligatoria').max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria').max(128),
  newPassword: z.string().min(10, 'La nueva contraseña debe tener al menos 10 caracteres').max(128),
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser distinta de la actual',
  path: ['newPassword'],
});

export const createHouseholdSchema = z.object({ name: trimmed('El nombre', 100) });

export const addMemberSchema = z.object({
  email,
  role: z.enum(['EDITOR', 'VIEWER']).optional(),
});

export const updateMemberRoleSchema = z.object({ role: z.enum(['EDITOR', 'VIEWER']) });

export const transferOwnershipSchema = z.object({
  newOwnerUserId: z.string().trim().min(1, 'Selecciona el nuevo propietario'),
});

export const emailOnlySchema = z.object({ email });

export const tokenSchema = z.object({
  token: z.string().trim().min(32, 'El enlace no es válido').max(512),
});

export const resetPasswordSchema = tokenSchema.extend({
  newPassword: z.string().min(10, 'La nueva contraseña debe tener al menos 10 caracteres').max(128),
});

export const createUserInvitationSchema = z.object({
  email,
  name: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().max(100, 'El nombre es demasiado largo').optional(),
  ),
  householdId: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().min(1).optional(),
  ),
  role: z.enum(['EDITOR', 'VIEWER']).optional(),
});

export const inspectUserInvitationSchema = tokenSchema;

export const acceptUserInvitationSchema = tokenSchema.extend({
  name: trimmed('El nombre', 100),
  password: z.string().min(10, 'La contraseña debe tener al menos 10 caracteres').max(128),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar las condiciones de uso' }),
  }),
});

export const createRecipeSchema = z.object({
  title: trimmed('El título', 200),
  description: optionalTrimmed(5000),
  instructions: optionalTrimmed(30000),
  prepTime: z.number().int().min(0).max(10080).optional(),
  cookTime: z.number().int().min(0).max(10080).optional(),
  servings: z.number().int().min(1).max(1000).optional(),
  imageUrl: z.preprocess((v) => v === '' ? undefined : v, httpUrl.optional()),
  kcal: z.number().int().min(0).max(100000).optional(),
  ingredients: z.array(z.object({
    name: trimmed('El ingrediente', 200),
    quantity: z.number().positive().max(1_000_000).optional(),
    unit: optionalTrimmed(50),
    order: z.number().int().min(0).max(10000).optional(),
  })).max(500).optional(),
  categories: z.array(z.enum(['DESAYUNO', 'COMIDA', 'CENA', 'SNACK', 'POSTRE'])).max(5).optional(),
  tagIds: z.array(z.string().trim().min(1)).max(100).optional(),
});

export const createTagSchema = z.object({
  name: trimmed('El nombre', 100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color no válido').optional(),
});

export const toggleFavoriteSchema = z.object({ recipeId: z.string().trim().min(1) });

export const createMealPlanItemSchema = z.object({
  date: isoDate,
  mealType: z.enum(['DESAYUNO', 'COMIDA', 'CENA', 'SNACK']),
  recipeId: z.string().trim().min(1).optional(),
  customMealName: z.string().trim().min(1).max(200).optional(),
}).refine((data) => Boolean(data.recipeId) !== Boolean(data.customMealName), {
  message: 'Indica una receta o un nombre manual, pero no ambos',
});

export const updateMealPlanItemSchema = z.object({
  recipeId: z.string().trim().min(1).nullable().optional(),
  customMealName: z.string().trim().min(1).max(200).nullable().optional(),
}).refine((data) => !(data.recipeId && data.customMealName), {
  message: 'No se puede indicar una receta y un nombre manual a la vez',
});

export const dateRangeSchema = z.object({ startDate: isoDate, endDate: isoDate })
  .refine((d) => d.startDate <= d.endDate, { message: 'Rango de fechas no válido', path: ['endDate'] });

export const copyDaySchema = z.object({ sourceDate: isoDate, targetDate: isoDate });
export const clearDaySchema = z.object({ date: isoDate });

export const generateShoppingListSchema = z.object({
  name: trimmed('El nombre', 200),
  startDate: isoDate,
  endDate: isoDate,
}).refine((d) => d.startDate <= d.endDate, {
  message: 'La fecha de inicio no puede ser posterior a la de fin',
  path: ['endDate'],
});

export const addManualItemSchema = z.object({
  name: trimmed('El nombre', 200),
  quantity: z.number().positive().max(1_000_000).optional(),
  unit: optionalTrimmed(50),
});

export const importRecipeSchema = z.object({ url: httpUrl });

export const estimateKcalSchema = z.object({
  title: optionalTrimmed(200),
  servings: z.number().int().positive().max(1000).optional(),
  ingredients: z.array(z.object({
    name: trimmed('El nombre del ingrediente', 200),
    quantity: z.number().positive().max(1_000_000).optional(),
    unit: optionalTrimmed(50),
  })).min(1, 'Se necesita al menos un ingrediente').max(500),
});

export const suggestRecipesSchema = z.object({
  mealType: z.enum(['DESAYUNO', 'COMIDA', 'CENA', 'SNACK']),
  date: isoDate,
});

export const copyWeekSchema = z.object({ sourceStartDate: isoDate, targetStartDate: isoDate });

export const addPantryItemSchema = z.object({
  name: trimmed('El nombre', 200),
  quantity: z.number().positive('La cantidad debe ser positiva').max(1_000_000),
  unit: trimmed('La unidad', 50),
  locationId: z.string().trim().min(1).optional(),
});

export const updatePantryItemSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  quantity: z.number().positive().max(1_000_000).optional(),
  unit: z.string().trim().min(1).max(50).optional(),
  locationId: z.string().trim().min(1).nullable().optional(),
});

export const checkItemSchema = z.object({
  purchasedQuantity: z.number().positive().max(1_000_000).optional(),
  locationId: z.string().trim().min(1).nullable().optional(),
});

export const checkGroupedItemsSchema = z.object({
  itemIds: z.array(z.string().trim().min(1)).min(1).max(500),
  purchasedQuantity: z.number().positive().max(1_000_000).optional(),
  locationId: z.string().trim().min(1).nullable().optional(),
});
