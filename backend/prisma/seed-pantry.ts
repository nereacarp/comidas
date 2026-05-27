import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const household = await prisma.household.findFirst({
    where: { name: { contains: 'enidorm', mode: 'insensitive' } },
  });

  if (!household) {
    console.error('No se encontro un hogar con "Benidorm" en el nombre');
    const all = await prisma.household.findMany({ select: { id: true, name: true } });
    console.log('Hogares disponibles:', all);
    process.exit(1);
  }

  console.log(`Household: ${household.name} (${household.id})`);

  // Ensure storage locations exist
  const locationData = [
    { name: 'Nevera', icon: 'fridge', order: 0 },
    { name: 'Congelador', icon: 'snowflake', order: 1 },
    { name: 'Despensa', icon: 'cabinet', order: 2 },
    { name: 'Armario', icon: 'cabinet', order: 3 },
  ];

  const locations: Record<string, string> = {};
  for (const loc of locationData) {
    const existing = await prisma.storageLocation.findUnique({
      where: { name_householdId: { name: loc.name, householdId: household.id } },
    });
    if (existing) {
      locations[loc.name] = existing.id;
    } else {
      const created = await prisma.storageLocation.create({
        data: { ...loc, householdId: household.id },
      });
      locations[loc.name] = created.id;
    }
  }
  console.log(`Ubicaciones: ${Object.keys(locations).join(', ')}`);

  // Pantry items grouped by location
  const pantryItems: Array<{ name: string; quantity: number; unit: string; location: string }> = [
    // Nevera
    { name: 'Leche entera', quantity: 1, unit: 'L', location: 'Nevera' },
    { name: 'Huevos', quantity: 12, unit: 'uds', location: 'Nevera' },
    { name: 'Queso manchego', quantity: 200, unit: 'g', location: 'Nevera' },
    { name: 'Yogur natural', quantity: 4, unit: 'uds', location: 'Nevera' },
    { name: 'Mantequilla', quantity: 250, unit: 'g', location: 'Nevera' },
    { name: 'Jamon cocido', quantity: 150, unit: 'g', location: 'Nevera' },
    { name: 'Tomates', quantity: 4, unit: 'uds', location: 'Nevera' },
    { name: 'Lechuga', quantity: 1, unit: 'ud', location: 'Nevera' },
    { name: 'Zanahorias', quantity: 500, unit: 'g', location: 'Nevera' },
    { name: 'Pimiento rojo', quantity: 2, unit: 'uds', location: 'Nevera' },
    { name: 'Cebolla', quantity: 3, unit: 'uds', location: 'Nevera' },
    { name: 'Limon', quantity: 2, unit: 'uds', location: 'Nevera' },

    // Congelador
    { name: 'Pechugas de pollo', quantity: 500, unit: 'g', location: 'Congelador' },
    { name: 'Merluza', quantity: 400, unit: 'g', location: 'Congelador' },
    { name: 'Gambas peladas', quantity: 300, unit: 'g', location: 'Congelador' },
    { name: 'Guisantes', quantity: 400, unit: 'g', location: 'Congelador' },
    { name: 'Pan de molde', quantity: 1, unit: 'bolsa', location: 'Congelador' },
    { name: 'Helado vainilla', quantity: 500, unit: 'ml', location: 'Congelador' },

    // Despensa
    { name: 'Arroz', quantity: 1, unit: 'kg', location: 'Despensa' },
    { name: 'Pasta macarrones', quantity: 500, unit: 'g', location: 'Despensa' },
    { name: 'Espaguetis', quantity: 500, unit: 'g', location: 'Despensa' },
    { name: 'Aceite de oliva', quantity: 750, unit: 'ml', location: 'Despensa' },
    { name: 'Tomate frito', quantity: 2, unit: 'botes', location: 'Despensa' },
    { name: 'Garbanzos cocidos', quantity: 2, unit: 'botes', location: 'Despensa' },
    { name: 'Lentejas', quantity: 500, unit: 'g', location: 'Despensa' },
    { name: 'Atun en lata', quantity: 4, unit: 'latas', location: 'Despensa' },
    { name: 'Harina', quantity: 1, unit: 'kg', location: 'Despensa' },
    { name: 'Azucar', quantity: 500, unit: 'g', location: 'Despensa' },
    { name: 'Sal', quantity: 1, unit: 'kg', location: 'Despensa' },
    { name: 'Vinagre', quantity: 500, unit: 'ml', location: 'Despensa' },

    // Armario
    { name: 'Cafe molido', quantity: 250, unit: 'g', location: 'Armario' },
    { name: 'Te verde', quantity: 20, unit: 'bolsitas', location: 'Armario' },
    { name: 'Galletas Maria', quantity: 1, unit: 'paquete', location: 'Armario' },
    { name: 'Chocolate negro', quantity: 200, unit: 'g', location: 'Armario' },
    { name: 'Miel', quantity: 350, unit: 'g', location: 'Armario' },
    { name: 'Pimenton', quantity: 75, unit: 'g', location: 'Armario' },
    { name: 'Oregano', quantity: 25, unit: 'g', location: 'Armario' },
    { name: 'Comino', quantity: 30, unit: 'g', location: 'Armario' },
  ];

  let created = 0;
  for (const item of pantryItems) {
    const existing = await prisma.pantryItem.findFirst({
      where: { name: item.name, householdId: household.id },
    });
    if (existing) continue;

    await prisma.pantryItem.create({
      data: {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        householdId: household.id,
        locationId: locations[item.location],
      },
    });
    created++;
  }

  console.log(`Ingredientes creados: ${created} (${pantryItems.length - created} ya existian)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
