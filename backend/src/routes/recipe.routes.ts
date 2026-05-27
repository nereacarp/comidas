import type { FastifyInstance } from 'fastify';
import { createRecipeService } from '../services/recipe.service.js';
import { createRecipeImportService } from '../services/recipe-import.service.js';
import { createRecipeKcalService } from '../services/recipe-kcal.service.js';
import { createSuggestionService } from '../services/suggestion.service.js';
import { prisma } from '../lib/prisma.js';
import { parseRecipeListFilters } from '../lib/recipe-list-filters.js';
import {
  createRecipeSchema,
  importRecipeSchema,
  estimateKcalSchema,
  suggestRecipesSchema,
} from '../lib/validation.js';
import { householdGuard } from '../plugins/household-guard.js';
import { canEditGuard } from '../plugins/can-edit-guard.js';

export async function recipeRoutes(fastify: FastifyInstance) {
  const recipeService = createRecipeService(prisma);
  const recipeImportService = createRecipeImportService({
    geminiApiKey: process.env.GEMINI_API_KEY,
  });
  const recipeKcalService = createRecipeKcalService({
    geminiApiKey: process.env.GEMINI_API_KEY,
  });
  const suggestionService = createSuggestionService(prisma);

  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/recipes',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = createRecipeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      const recipe = await recipeService.create(request.params.householdId, parsed.data);
      return reply.status(201).send(recipe);
    }
  );

  fastify.get<{ Params: { householdId: string }; Querystring: Record<string, string> }>(
    '/households/:householdId/recipes',
    { preHandler: [householdGuard] },
    async (request) => {
      const filters = parseRecipeListFilters(request.query as Record<string, unknown>);
      return recipeService.list(request.params.householdId, {
        ...filters,
        userId: request.user.id,
      });
    }
  );

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/recipes/import-url',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = importRecipeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      try {
        const data = await recipeImportService.parseFromUrl(parsed.data.url);
        const warnings: string[] = [];
        if (!data.ingredients || data.ingredients.length === 0) {
          warnings.push('No se encontraron ingredientes');
        }
        if (!data.instructions) {
          warnings.push('No se encontraron los pasos de preparación');
        }
        if (!data.title || data.title === 'Receta importada') {
          warnings.push('No se encontró el título de la receta');
        }
        return { ...data, warnings };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al importar';
        const userMessage = msg.includes('No se pudo acceder')
          ? 'No se pudo leer la receta de esta página'
          : msg;
        return reply.status(422).send({ error: userMessage });
      }
    }
  );

  fastify.post<{ Params: { householdId: string } }>(
    '/households/:householdId/recipes/estimate-kcal',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = estimateKcalSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      try {
        return await recipeKcalService.estimateFromIngredients(parsed.data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al estimar calorías';
        return reply.status(422).send({ error: msg });
      }
    }
  );

  fastify.get<{ Params: { householdId: string }; Querystring: Record<string, string> }>(
    '/households/:householdId/recipes/suggestions',
    { preHandler: [householdGuard] },
    async (request, reply) => {
      const parsed = suggestRecipesSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      return suggestionService.suggest(
        request.params.householdId,
        request.user.id,
        parsed.data.mealType,
        parsed.data.date
      );
    }
  );

  fastify.get<{ Params: { householdId: string; recipeId: string } }>(
    '/households/:householdId/recipes/:recipeId',
    { preHandler: [householdGuard] },
    async (request) => {
      return recipeService.getById(request.params.recipeId, request.params.householdId);
    }
  );

  fastify.put<{ Params: { householdId: string; recipeId: string } }>(
    '/households/:householdId/recipes/:recipeId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      const parsed = createRecipeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.issues[0].message });
      }
      return recipeService.update(request.params.recipeId, request.params.householdId, parsed.data);
    }
  );

  fastify.delete<{ Params: { householdId: string; recipeId: string } }>(
    '/households/:householdId/recipes/:recipeId',
    { preHandler: [householdGuard, canEditGuard] },
    async (request, reply) => {
      await recipeService.delete(request.params.recipeId, request.params.householdId);
      return reply.status(204).send();
    }
  );
}
