import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function run() {
  const count = await p.pantryItem.count({ where: { householdId: 'cmlz2shi9001pnr0yta0n5jbn' } });
  console.log('Pantry items in Benidorm:', count);
  const items = await p.pantryItem.findMany({
    where: { householdId: 'cmlz2shi9001pnr0yta0n5jbn' },
    include: { location: true },
    take: 5,
  });
  for (const i of items) {
    console.log(`  ${i.name} - ${i.quantity} ${i.unit} -> ${i.location?.name ?? 'sin ubicacion'}`);
  }
  await p.$disconnect();
}

run();
