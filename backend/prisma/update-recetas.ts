import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL = 'nereacarpinterob@gmail.com';

type MealType = 'DESAYUNO' | 'COMIDA' | 'CENA' | 'SNACK';

// Categorías a actualizar en recetas existentes
const categoryUpdates: Record<string, MealType[]> = {
  'Overnight oats de chocolate':    ['DESAYUNO'],
  'Yogur griego + miel + fruta':    ['SNACK', 'DESAYUNO'],
  'Porridge frío con chocolate':    ['DESAYUNO'],
  'Tortitas proteicas':             ['DESAYUNO', 'SNACK'],
  'Salmón marinado + guacamole':    ['CENA'],
  'Mousse de chocolate proteico':   ['SNACK', 'DESAYUNO'],
  'Yogur con fruta':                ['SNACK', 'DESAYUNO'],
};

// Recetas nuevas (sin foto)
interface NewRecipe {
  title: string;
  description: string;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  kcal: number;
  categories: MealType[];
  ingredients: { name: string; quantity?: number | null; unit?: string | null }[];
}

const newRecipes: NewRecipe[] = [
  // ─── DESAYUNOS ───────────────────────────────────────────────────────────
  {
    title: 'Tostada con queso cottage + miel + fruta',
    description: '~350 kcal · ~18g proteína · Dulce, proteico y rapidísimo.',
    instructions: 'Tostar el pan cristal. Untar el queso cottage encima. Añadir un chorrito de miel y las fresas o arándanos por encima.',
    prepTime: 5, cookTime: 0, servings: 1, kcal: 350,
    categories: ['DESAYUNO'],
    ingredients: [
      { name: 'Pan cristal', quantity: 2, unit: 'rebanadas' },
      { name: 'Queso cottage', quantity: 4, unit: 'cucharadas' },
      { name: 'Miel', quantity: 1, unit: 'cucharadita' },
      { name: 'Fresas o arándanos', quantity: 80, unit: 'g' },
    ],
  },
  {
    title: 'Bowl de queso cottage + cacao + plátano',
    description: '~280 kcal · ~22g proteína · Parece postre pero es desayuno.',
    instructions: 'Mezclar el queso cottage con el cacao puro. Poner el plátano en rodajas encima. Añadir canela al gusto.',
    prepTime: 3, cookTime: 0, servings: 1, kcal: 280,
    categories: ['DESAYUNO'],
    ingredients: [
      { name: 'Queso cottage', quantity: 200, unit: 'g' },
      { name: 'Cacao puro sin azúcar', quantity: 1, unit: 'cucharadita' },
      { name: 'Plátano', quantity: 1, unit: 'unidad' },
      { name: 'Canela', quantity: null, unit: 'al gusto' },
    ],
  },
  {
    title: 'Huevos revueltos + queso light + pan cristal',
    description: '~420 kcal · ~28g proteína · El desayuno más completo y saciante.',
    instructions: 'Batir los huevos. En sartén con un poco de aceite a fuego medio-bajo, añadir los huevos y remover despacio. Cuando estén casi cuajados, añadir el queso light en tiras y dejar fundir. Servir con pan cristal tostado.',
    prepTime: 5, cookTime: 7, servings: 1, kcal: 420,
    categories: ['DESAYUNO'],
    ingredients: [
      { name: 'Huevos', quantity: 3, unit: 'unidades' },
      { name: 'Queso light en lonchas', quantity: 2, unit: 'lonchas' },
      { name: 'Pan cristal', quantity: 2, unit: 'rebanadas' },
      { name: 'Aceite de oliva', quantity: 0.5, unit: 'cucharadita' },
    ],
  },
  // ─── SNACKS POST-GYM ─────────────────────────────────────────────────────
  {
    title: 'Batido chocolate post-gym',
    description: '~380 kcal · ~35g proteína · El clásico post-entreno. Batidora 30 segundos.',
    instructions: 'Meter todos los ingredientes en la batidora. Batir 30 segundos. Beber inmediatamente.',
    prepTime: 2, cookTime: 0, servings: 1, kcal: 380,
    categories: ['SNACK'],
    ingredients: [
      { name: 'Proteína en polvo de chocolate', quantity: 30, unit: 'g' },
      { name: 'Leche', quantity: 250, unit: 'ml' },
      { name: 'Plátano', quantity: 1, unit: 'unidad' },
      { name: 'Hielo', quantity: null, unit: 'al gusto' },
    ],
  },
  {
    title: 'Batido chocolate + MPC',
    description: '~350 kcal · ~33g proteína · Con la cremosidad de la mantequilla de cacahuete.',
    instructions: 'Meter todos los ingredientes en la batidora. Batir 30 segundos. Beber inmediatamente.',
    prepTime: 2, cookTime: 0, servings: 1, kcal: 350,
    categories: ['SNACK'],
    ingredients: [
      { name: 'Proteína en polvo de chocolate', quantity: 30, unit: 'g' },
      { name: 'Leche', quantity: 200, unit: 'ml' },
      { name: 'Mantequilla de cacahuete', quantity: 1, unit: 'cucharada' },
      { name: 'Hielo', quantity: null, unit: 'al gusto' },
    ],
  },
  {
    title: 'Batido verde proteico',
    description: '~320 kcal · ~32g proteína · Las espinacas no se notan. En serio.',
    instructions: 'Meter todos los ingredientes en la batidora. Batir 1 minuto hasta que quede suave. Beber inmediatamente.',
    prepTime: 3, cookTime: 0, servings: 1, kcal: 320,
    categories: ['SNACK'],
    ingredients: [
      { name: 'Proteína en polvo de chocolate', quantity: 30, unit: 'g' },
      { name: 'Leche', quantity: 200, unit: 'ml' },
      { name: 'Plátano', quantity: 1, unit: 'unidad' },
      { name: 'Espinacas frescas', quantity: 30, unit: 'g' },
      { name: 'Hielo', quantity: null, unit: 'al gusto' },
    ],
  },
  // ─── SNACKS DULCES ────────────────────────────────────────────────────────
  {
    title: 'Queso cottage + mermelada sin azúcar',
    description: '~160 kcal · ~16g proteína · 2 ingredientes, muy dulzón y rapidísimo.',
    instructions: 'Poner el queso cottage en un bol. Añadir la mermelada sin azúcar por encima.',
    prepTime: 1, cookTime: 0, servings: 1, kcal: 160,
    categories: ['SNACK'],
    ingredients: [
      { name: 'Queso cottage', quantity: 150, unit: 'g' },
      { name: 'Mermelada sin azúcar', quantity: 2, unit: 'cucharadas' },
    ],
  },
  {
    title: 'Rice cakes con MPC y plátano',
    description: '~240 kcal · ~7g proteína · Crujiente, dulce y saciante.',
    instructions: 'Untar cada rice cake con mantequilla de cacahuete. Poner rodajas de plátano encima.',
    prepTime: 2, cookTime: 0, servings: 1, kcal: 240,
    categories: ['SNACK'],
    ingredients: [
      { name: 'Rice cakes', quantity: 2, unit: 'unidades' },
      { name: 'Mantequilla de cacahuete', quantity: 2, unit: 'cucharadas' },
      { name: 'Plátano', quantity: 1, unit: 'unidad' },
    ],
  },
  {
    title: 'Gelatina proteica con fruta',
    description: '~120 kcal · ~20g proteína · Casi 0 calorías, muy saciante. Se prepara con antelación.',
    instructions: 'Disolver el sobre de gelatina sin azúcar en agua caliente según instrucciones. Dejar enfriar un poco. Añadir la proteína en polvo batiendo bien con varillas para que no queden grumos. Añadir fruta troceada. Meter en nevera mínimo 2 horas.',
    prepTime: 5, cookTime: 0, servings: 1, kcal: 120,
    categories: ['SNACK'],
    ingredients: [
      { name: 'Gelatina sin azúcar (sobre)', quantity: 1, unit: 'sobre' },
      { name: 'Proteína en polvo', quantity: 25, unit: 'g' },
      { name: 'Fruta al gusto', quantity: 100, unit: 'g' },
    ],
  },
];

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) throw new Error('Usuario no encontrado.');

  const household = await prisma.household.findFirst({
    where: { members: { some: { userId: user.id } } },
  });
  if (!household) throw new Error('Hogar no encontrado.');

  const recipes = await prisma.recipe.findMany({ where: { householdId: household.id } });
  const byTitle = new Map(recipes.map((r) => [r.title, r.id]));

  // 1. Actualizar categorías
  let updated = 0;
  for (const [title, categories] of Object.entries(categoryUpdates)) {
    const id = byTitle.get(title);
    if (!id) { console.log(`No encontrada: ${title}`); continue; }
    await prisma.recipeCategory.deleteMany({ where: { recipeId: id } });
    await prisma.recipeCategory.createMany({
      data: categories.map((mealType) => ({ recipeId: id, mealType })),
    });
    console.log(`✓ Categoría actualizada: ${title} → [${categories.join(', ')}]`);
    updated++;
  }

  // 2. Añadir recetas nuevas
  let added = 0;
  for (const r of newRecipes) {
    if (byTitle.has(r.title)) {
      console.log(`Ya existe, omitiendo: ${r.title}`);
      continue;
    }
    await prisma.recipe.create({
      data: {
        title: r.title,
        description: r.description,
        instructions: r.instructions,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        servings: r.servings,
        kcal: r.kcal,
        householdId: household.id,
        ingredients: { create: r.ingredients.map((ing, i) => ({ ...ing, order: i })) },
        categories: { create: r.categories.map((mealType) => ({ mealType })) },
      },
    });
    console.log(`+ Añadida: ${r.title}`);
    added++;
  }

  console.log(`\nResumen: ${updated} categorías actualizadas, ${added} recetas añadidas.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
