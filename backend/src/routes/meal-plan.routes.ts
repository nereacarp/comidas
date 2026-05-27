import type { FastifyInstance } from 'fastify';
import { createMealPlanService } from '../services/meal-plan.service.js';
import { prisma } from '../lib/prisma.js';
import {
  createMealPlanItemSchema,
  updateMealPlanItemSchema,
  dateRangeSchema,
  copyDaySchema,
  clearDaySchema,
  copyWeekSchema,
} from '../lib/validation.js';
import { householdGuard } from '../plugins/household-guard.js';
import { canEditGuard } from '../plugins/can-edit-guard.js';

export async function mealPlanRoutes(fastify: FastifyInstance) {
  const mealPlanService = createMealPlanService(prisma);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get<{ Params: { householdId: string }; Querystring: Record<string, string> }>(
    '/households/:householdId/meal-plan',
    { preHandler: [householdGuard] },
    async (request, reply) => {
      const parsed = dateRangeSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      return mealPlanService.getByDateRange(
        request.params.householdId,
        parsed.data.startDate,
        parsed.data.endDate
      );
    }
  );

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/meal-plan',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = createMealPlanItemSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      const item = await mealPlanService.addItem(request.params.householdId, parsed.data);
      return reply.status(201).send(item);
    }
  );

  fastify.put<{ Params: { householdId: string; itemId: string } }>(
    '/households/:householdId/meal-plan/:itemId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = updateMealPlanItemSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      return mealPlanService.updateItem(request.params.itemId, request.params.householdId, parsed.data);
    }
  );

  fastify.delete<{ Params: { householdId: string; itemId: string } }>(
    '/households/:householdId/meal-plan/:itemId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      await mealPlanService.deleteItem(request.params.itemId, request.params.householdId);
      return reply.status(204).send();
    }
  );

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/meal-plan/copy-day',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = copyDaySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      return mealPlanService.copyDay(
        request.params.householdId,
        parsed.data.sourceDate,
        parsed.data.targetDate
      );
    }
  );

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/meal-plan/clear-day',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = clearDaySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      await mealPlanService.clearDay(request.params.householdId, parsed.data.date);
      return reply.status(204).send();
    }
  );

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/meal-plan/copy-week',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = copyWeekSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      const items = await mealPlanService.copyWeek(
        request.params.householdId,
        parsed.data.sourceStartDate,
        parsed.data.targetStartDate
      );
      return reply.status(201).send(items);
    }
  );
}
