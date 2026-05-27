import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function run() {
  const h = await p.household.findFirst({
    where: { name: { contains: 'enidorm', mode: 'insensitive' } },
    include: { members: { include: { user: { select: { email: true, name: true } } } } },
  });
  console.log('Household:', h?.name, h?.id);
  console.log('Members:');
  for (const m of h?.members ?? []) {
    console.log(`  ${m.user.email} (${m.role})`);
  }

  const nerea = await p.user.findUnique({ where: { email: 'nerea@dekalabs.com' } });
  console.log('\nNerea user id:', nerea?.id);

  const nereaHouseholds = await p.householdMember.findMany({
    where: { userId: nerea?.id },
    include: { household: { select: { name: true } } },
  });
  console.log('Nerea households:');
  for (const hm of nereaHouseholds) {
    console.log(`  ${hm.household.name} (${hm.role})`);
  }

  await p.$disconnect();
}

run();
