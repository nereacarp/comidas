import type { PrismaClientType } from '../lib/prisma.js';

interface CreateTagInput {
  name: string;
  color?: string;
}

export function createTagService(prisma: PrismaClientType) {
  return {
    async create(householdId: string, input: CreateTagInput) {
      const existing = await prisma.tag.findUnique({
        where: { name_householdId: { name: input.name, householdId } },
      });
      if (existing) {
        throw new Error('La etiqueta ya existe');
      }
      return prisma.tag.create({
        data: { name: input.name, color: input.color, householdId },
      });
    },

    async list(householdId: string) {
      return prisma.tag.findMany({
        where: { householdId },
        orderBy: { name: 'asc' },
      });
    },

    async update(tagId: string, householdId: string, input: CreateTagInput) {
      const existing = await prisma.tag.findFirst({ where: { id: tagId, householdId } });
      if (!existing) throw Object.assign(new Error('Etiqueta no encontrada'), { statusCode: 404 });
      return prisma.tag.update({
        where: { id: tagId },
        data: { name: input.name, color: input.color },
      });
    },

    async delete(tagId: string, householdId: string) {
      const existing = await prisma.tag.findFirst({ where: { id: tagId, householdId } });
      if (!existing) throw Object.assign(new Error('Etiqueta no encontrada'), { statusCode: 404 });
      return prisma.tag.delete({ where: { id: tagId } });
    },
  };
}
