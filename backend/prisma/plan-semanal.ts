import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL = 'nereacarpinterob@gmail.com';

function getWeekDates(offsetWeeks = 0): Record<string, string> {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const day = (n: number) => { const d = new Date(monday); d.setDate(monday.getDate() + n); return fmt(d); };
  return {
    lunes:     day(0),
    martes:    day(1),
    miercoles: day(2),
    jueves:    day(3),
    viernes:   day(4),
    sabado:    day(5),
    domingo:   day(6),
  };
}

type MealType = 'DESAYUNO' | 'COMIDA' | 'CENA' | 'SNACK';

const planTemplate: { day: string; mealType: MealType; title: string }[] = [
  // Lunes - Gym
  { day: 'lunes', mealType: 'DESAYUNO', title: 'Pan cristal + pavo + aceite' },
  { day: 'lunes', mealType: 'COMIDA',   title: 'Salmón air fryer + arroz' },
  { day: 'lunes', mealType: 'SNACK',    title: 'Yogur griego + plátano + MPC' },
  { day: 'lunes', mealType: 'CENA',     title: 'Tortilla de calabacín' },

  // Martes - Correr
  { day: 'martes', mealType: 'DESAYUNO', title: 'Porridge proteico' },
  { day: 'martes', mealType: 'COMIDA',   title: 'Pollo air fryer + zanahoria asada' },
  { day: 'martes', mealType: 'CENA',     title: 'Ñoquis + pavo + mozzarella' },
  { day: 'martes', mealType: 'SNACK',    title: 'Yogur con fruta' },

  // Miércoles - Descanso
  { day: 'miercoles', mealType: 'DESAYUNO', title: 'Pan cristal + pavo + aguacate' },
  { day: 'miercoles', mealType: 'COMIDA',   title: 'Bowl de pollo + arroz' },
  { day: 'miercoles', mealType: 'CENA',     title: 'Salmón marinado + ensalada' },
  { day: 'miercoles', mealType: 'SNACK',    title: 'Mousse de chocolate proteico' },

  // Jueves - Gym
  { day: 'jueves', mealType: 'DESAYUNO', title: 'Yogur griego + fruta + MPC' },
  { day: 'jueves', mealType: 'COMIDA',   title: 'Huevos al horno + calabacín' },
  { day: 'jueves', mealType: 'SNACK',    title: 'Pavo + plátano' },
  { day: 'jueves', mealType: 'CENA',     title: 'Salmón + calabacín asado' },

  // Viernes - Correr
  { day: 'viernes', mealType: 'DESAYUNO', title: 'Pan cristal + pavo + aceite' },
  { day: 'viernes', mealType: 'COMIDA',   title: 'Ñoquis + salmón + mozzarella bolitas' },
  { day: 'viernes', mealType: 'CENA',     title: 'Huevos revueltos + ensalada zanahoria' },
  { day: 'viernes', mealType: 'SNACK',    title: 'Tortitas proteicas' },

  // Sábado - Batch cook
  { day: 'sabado', mealType: 'DESAYUNO', title: 'Porridge proteico' },
  { day: 'sabado', mealType: 'COMIDA',   title: 'Pollo al horno + verduras (batch)' },
  { day: 'sabado', mealType: 'SNACK',    title: 'Salmón marinado + guacamole' },
  { day: 'sabado', mealType: 'CENA',     title: 'Bowl del batch cook' },

  // Domingo - Descanso
  { day: 'domingo', mealType: 'COMIDA', title: 'Bowl del batch cook' },
  { day: 'domingo', mealType: 'CENA',   title: 'Salmón + ensalada ligera' },
  { day: 'domingo', mealType: 'SNACK',  title: 'Overnight oats de chocolate' },
];

async function main() {
  const offsetWeeks = parseInt(process.argv[2] || '0');
  const WEEK = getWeekDates(offsetWeeks);

  console.log(`Creando plan para semana del ${WEEK.lunes} al ${WEEK.domingo}...`);

  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) throw new Error(`Usuario ${EMAIL} no encontrado.`);

  const household = await prisma.household.findFirst({
    where: { members: { some: { userId: user.id } } },
  });
  if (!household) throw new Error('No se encontró el hogar del usuario.');

  await prisma.mealPlanItem.deleteMany({
    where: {
      householdId: household.id,
      date: { gte: new Date(WEEK.lunes), lte: new Date(WEEK.domingo) },
    },
  });

  const recipes = await prisma.recipe.findMany({ where: { householdId: household.id } });
  const byTitle = new Map(recipes.map((r) => [r.title, r.id]));

  let created = 0;
  const notFound: string[] = [];

  for (const item of planTemplate) {
    const date = WEEK[item.day as keyof typeof WEEK];
    const recipeId = byTitle.get(item.title);
    if (!recipeId) { notFound.push(item.title); continue; }
    await prisma.mealPlanItem.create({
      data: { date: new Date(date), mealType: item.mealType, recipeId, householdId: household.id },
    });
    created++;
  }

  console.log(`Plan creado: ${created} entradas.`);
  if (notFound.length > 0) console.log(`No encontradas: ${notFound.join(', ')}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
