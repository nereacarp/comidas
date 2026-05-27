import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODELS, isRetriableGeminiError } from '../lib/gemini-models.js';
import { parseIngredient, enrichFromInstructions } from './ingredient-parser.js';
import type { Ingredient } from './ingredient-parser.js';
import { extractRecipeFromHtml } from './html-recipe-extractor.js';
import type { HtmlRecipeData } from './html-recipe-extractor.js';

type MealType = 'DESAYUNO' | 'COMIDA' | 'CENA' | 'SNACK' | 'POSTRE';

interface ParsedRecipe {
  title: string;
  description?: string;
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  categories: MealType[];
  ingredients: Ingredient[];
}

interface ImportServiceOptions {
  geminiApiKey?: string;
}

function parseIsoDuration(duration: string): number | undefined {
  if (!duration) return undefined;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  return hours * 60 + minutes || undefined;
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const TITLE_ADJECTIVES =
  /(?:muy\s+)?(?:fácil|facil|sencill[oa]|rápi[do]a|delicios[oa]|riqu[ií]sim[oa]|espectacular|increíble|caser[oa]|tradicional|perfect[oa]|esponjos[oa]|jugos[oa]|crujiente|tiern[oa]|best|easy|simple|healthy|quick)/gi;

function cleanTitle(title: string): string {
  let result = title;
  // Remove ", el más fácil y esponjoso" or ", fácil y delicioso"
  result = result.replace(new RegExp(
    '\\s*,\\s*(?:(?:el|la|los|las)\\s+(?:más\\s+)?)?' + TITLE_ADJECTIVES.source +
    '(?:\\s+y\\s+' + TITLE_ADJECTIVES.source + ')*', 'gi'), '');
  // Remove "- receta tradicional"
  result = result.replace(new RegExp(
    '\\s*[-–—]\\s*(?:(?:receta|el|la)\\s+)?' + TITLE_ADJECTIVES.source +
    '(?:\\s+y\\s+' + TITLE_ADJECTIVES.source + ')*', 'gi'), '');
  // Remove standalone adjectives (allow comma/dash/end after them)
  result = result.replace(new RegExp(
    '\\s+' + TITLE_ADJECTIVES.source + '(?=[\\s,\\-–—]|$)', 'gi'), '');
  // Remove subtitle patterns: ", un postre clásico", ", el plato perfecto"
  result = result.replace(/\s*,\s+(?:un[ao]?|el|la|los|las)\s+.+$/i, '');
  result = result.replace(/^\s*receta\s+de\s+/i, '');
  result = result.replace(/\s{2,}/g, ' ').trim();
  result = result.replace(/,\s*$/, '').trim();
  return capitalize(result);
}

function truncateDescription(desc: string | undefined): string | undefined {
  if (!desc || desc.length <= 300) return desc;
  const firstSentence = desc.match(/^.{50,280}[.!?]/);
  if (firstSentence) return firstSentence[0];
  return desc.slice(0, 280).replace(/\s+\S*$/, '') + '...';
}

const COOKING_WORDS =
  /(?:mezcl|bati|hornea|coc[ie]n|cort|pela|añad|agreg|sofr[eí]|calen|remov|precalen|vert|incorpor|salpiment|fre[íi]|herv|revol|derrit|tamiz|amasa|dej[ae]|pon[ge]|coloc|sirv|engras|volca|pinch|ensa)/i;

function validateInstructions(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const steps = text.split('\n').filter((s) => s.trim().length > 10);
  if (steps.length < 2) return undefined;
  if (!steps.some((s) => COOKING_WORDS.test(s))) return undefined;
  return text;
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const scriptRegex = /<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data)) {
        const recipe = data.find((d) => d['@type'] === 'Recipe');
        if (recipe) return recipe;
      }
      if (data['@graph']) {
        const recipe = data['@graph'].find(
          (d: Record<string, unknown>) => d['@type'] === 'Recipe'
        );
        if (recipe) return recipe;
      }
      if (data['@type'] === 'Recipe') return data;
    } catch {
      continue;
    }
  }
  return null;
}

function extractMetaImage(html: string): string | undefined {
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogMatch) return ogMatch[1];
  const ogReverse = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogReverse) return ogReverse[1];
  return undefined;
}

function normalizeInstructions(instructions: unknown): string | undefined {
  if (typeof instructions === 'string') return instructions;
  if (Array.isArray(instructions)) {
    return instructions
      .map((step) => {
        if (typeof step === 'string') return step;
        if (step?.text) return step.text;
        return null;
      })
      .filter(Boolean)
      .join('\n');
  }
  return undefined;
}

function normalizeImage(image: unknown): string | undefined {
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return typeof image[0] === 'string' ? image[0] : image[0]?.url;
  if (image && typeof image === 'object' && 'url' in image) return (image as { url: string }).url;
  return undefined;
}

const CATEGORY_MAP: Record<string, MealType[]> = {
  desayuno: ['DESAYUNO'], breakfast: ['DESAYUNO'], merienda: ['DESAYUNO', 'SNACK'],
  almuerzo: ['COMIDA'], comida: ['COMIDA'], lunch: ['COMIDA'],
  cena: ['CENA'], dinner: ['CENA'], supper: ['CENA'],
  snack: ['SNACK'], aperitivo: ['SNACK'], entrante: ['SNACK'], tapa: ['SNACK'], tapas: ['SNACK'],
  postre: ['POSTRE'], dessert: ['POSTRE'], reposteria: ['POSTRE'], dulce: ['POSTRE'],
  bizcocho: ['POSTRE'], tarta: ['POSTRE'], galletas: ['POSTRE'], pastel: ['POSTRE'],
  'plato principal': ['COMIDA', 'CENA'], 'main course': ['COMIDA', 'CENA'],
  'primer plato': ['COMIDA', 'CENA'], 'segundo plato': ['COMIDA', 'CENA'],
  'carnes y aves': ['COMIDA', 'CENA'], carnes: ['COMIDA', 'CENA'],
  'pescados y mariscos': ['COMIDA', 'CENA'], pescados: ['COMIDA', 'CENA'],
  pasta: ['COMIDA', 'CENA'], arroces: ['COMIDA', 'CENA'],
  'sopas y cremas': ['COMIDA', 'CENA'], sopas: ['COMIDA', 'CENA'],
  ensaladas: ['COMIDA', 'CENA'], verduras: ['COMIDA', 'CENA'],
  legumbres: ['COMIDA', 'CENA'], guisos: ['COMIDA', 'CENA'],
};

function detectCategories(recipe: Record<string, unknown>): MealType[] {
  const categories = new Set<MealType>();
  const fields = [recipe.recipeCategory, recipe['@recipeCategory']];
  for (const field of fields) {
    const values = Array.isArray(field) ? field : typeof field === 'string' ? [field] : [];
    for (const val of values) {
      const key = String(val).toLowerCase().trim();
      const mapped = CATEGORY_MAP[key];
      if (mapped) mapped.forEach((c) => categories.add(c));
    }
  }
  if (categories.size === 0) {
    const kwSources = [recipe.keywords, recipe.name];
    const kwStr = kwSources.map((s) =>
      typeof s === 'string' ? s : Array.isArray(s) ? s.join(' ') : ''
    ).join(' ').toLowerCase();
    for (const [key, types] of Object.entries(CATEGORY_MAP)) {
      if (kwStr.includes(key)) {
        types.forEach((c) => categories.add(c));
        break;
      }
    }
  }
  return Array.from(categories);
}

function parseTimes(recipe: Record<string, unknown>): { prepTime?: number; cookTime?: number } {
  const prep = parseIsoDuration(recipe.prepTime as string);
  const cook = parseIsoDuration(recipe.cookTime as string);
  if (prep || cook) return { prepTime: prep, cookTime: cook };

  const total = parseIsoDuration(recipe.totalTime as string);
  if (total) return { prepTime: undefined, cookTime: total };
  return {};
}

function buildJsonLdRecipe(recipe: Record<string, unknown>): ParsedRecipe {
  const rawIngredients = Array.isArray(recipe.recipeIngredient)
    ? recipe.recipeIngredient.flatMap((ing: string) => parseIngredient(ing))
    : [];
  const ingredients = enrichFromInstructions(rawIngredients, recipe.recipeInstructions);

  const servingsRaw = recipe.recipeYield;
  let servings: number | undefined;
  if (typeof servingsRaw === 'number') {
    servings = servingsRaw;
  } else if (typeof servingsRaw === 'string') {
    const num = parseInt(servingsRaw);
    if (!isNaN(num)) servings = num;
  } else if (Array.isArray(servingsRaw) && servingsRaw.length > 0) {
    const num = parseInt(servingsRaw[0]);
    if (!isNaN(num)) servings = num;
  }

  const { prepTime, cookTime } = parseTimes(recipe);

  return {
    title: cleanTitle((recipe.name as string) || 'Receta importada'),
    description: truncateDescription((recipe.description as string) || undefined),
    instructions: validateInstructions(normalizeInstructions(recipe.recipeInstructions)),
    prepTime,
    cookTime,
    servings,
    imageUrl: normalizeImage(recipe.image),
    categories: detectCategories(recipe),
    ingredients,
  };
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const GEMINI_PROMPT = `Extrae los datos de una receta de cocina del siguiente texto de una pagina web.
Devuelve UNICAMENTE un objeto JSON valido (sin markdown, sin backticks) con esta estructura exacta:
{
  "title": "string (solo el nombre del plato, sin adjetivos como facil o delicioso)",
  "description": "string o null",
  "instructions": "string con cada paso en una linea separada por \\n, SIN numerar, o null",
  "prepTime": numero en minutos o null,
  "cookTime": numero en minutos o null,
  "servings": numero de raciones o null,
  "categories": ["COMIDA", "CENA"] o array vacio,
  "ingredients": [{"name": "string", "quantity": numero o null, "unit": "string o null"}]
}

Reglas:
- Separa cantidad, unidad y nombre en los ingredientes (ej: "200g de pasta" -> quantity: 200, unit: "g", name: "Pasta")
- El nombre del ingrediente debe ser limpio y capitalizado (ej: "Salsa de soja", no "salsa de soja baja en sal si quieres")
- Elimina coletillas como "si te gusta", "opcional", "al gusto" del nombre
- Si un ingrediente es opcional, anade " (Opcional)" al final del nombre
- Las instrucciones NO deben llevar numeros al inicio (nada de "1.", "2.", etc). Solo el texto del paso
- Los tiempos deben estar en minutos
- Las categories son: DESAYUNO, COMIDA, CENA, SNACK. Asigna las que apliquen segun el tipo de plato
- Si no encuentras un campo, usa null
- Devuelve SOLO el JSON, nada mas

Texto de la pagina web:
`;

function stripStepNumbers(instructions: string | undefined): string | undefined {
  if (!instructions) return undefined;
  return instructions
    .split('\n')
    .map((line) => line.replace(/^\d+[\.\-–)\s]+\s*/, ''))
    .join('\n');
}

function parseGeminiResponse(text: string): ParsedRecipe {
  let jsonStr = text.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  const parsed = JSON.parse(jsonStr);

  const categories: MealType[] = Array.isArray(parsed.categories)
    ? parsed.categories.filter((c: string) =>
        ['DESAYUNO', 'COMIDA', 'CENA', 'SNACK', 'POSTRE'].includes(c)
      )
    : [];

  return {
    title: cleanTitle(parsed.title || 'Receta importada'),
    description: parsed.description || undefined,
    instructions: stripStepNumbers(parsed.instructions || undefined),
    prepTime: typeof parsed.prepTime === 'number' ? parsed.prepTime : undefined,
    cookTime: typeof parsed.cookTime === 'number' ? parsed.cookTime : undefined,
    servings: typeof parsed.servings === 'number' ? parsed.servings : undefined,
    imageUrl: undefined,
    categories,
    ingredients: Array.isArray(parsed.ingredients)
      ? parsed.ingredients
          .map((ing: Record<string, unknown>) => ({
            name: (ing.name as string) || '',
            quantity: typeof ing.quantity === 'number' ? ing.quantity : undefined,
            unit: (ing.unit as string) || undefined,
          }))
          .filter((ing: { name: string }) => ing.name)
      : [],
  };
}

function isRecipeComplete(recipe: ParsedRecipe): boolean {
  return !!(
    recipe.title &&
    recipe.description &&
    recipe.instructions &&
    recipe.prepTime !== undefined &&
    recipe.cookTime !== undefined &&
    recipe.servings !== undefined &&
    recipe.imageUrl &&
    recipe.categories.length > 0 &&
    recipe.ingredients.length > 0
  );
}

function mergeRecipes(base: ParsedRecipe, completion: ParsedRecipe): ParsedRecipe {
  return {
    title: base.title && base.title !== 'Receta importada' ? base.title : completion.title,
    description: base.description || completion.description,
    instructions: base.instructions || completion.instructions,
    prepTime: base.prepTime ?? completion.prepTime,
    cookTime: base.cookTime ?? completion.cookTime,
    servings: base.servings ?? completion.servings,
    imageUrl: base.imageUrl || completion.imageUrl,
    categories: base.categories.length > 0 ? base.categories : completion.categories,
    ingredients: base.ingredients.length > 0 ? base.ingredients : completion.ingredients,
  };
}

function mergeWithHtmlData(base: ParsedRecipe, html: HtmlRecipeData): ParsedRecipe {
  return {
    title: base.title && base.title !== 'Receta importada'
      ? base.title : html.title ? cleanTitle(html.title) : base.title,
    description: base.description || truncateDescription(html.description),
    instructions: base.instructions || validateInstructions(html.instructions),
    prepTime: base.prepTime ?? html.prepTime,
    cookTime: base.cookTime ?? html.cookTime,
    servings: base.servings ?? html.servings,
    imageUrl: base.imageUrl || html.imageUrl,
    categories: base.categories.length > 0 ? base.categories : html.categories,
    ingredients: base.ingredients.length > 0 ? base.ingredients : html.ingredients,
  };
}

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^0\.\d+\.\d+\.\d+$/,
  /^::1$/,
  /^fc[\da-f]{2}:/i,
  /^fd[\da-f]{2}:/i,
];

function validateUrl(urlString: string): void {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('URL no válida');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Solo se permiten URLs HTTPS');
  }
  const host = parsed.hostname.toLowerCase();
  if (PRIVATE_IP_PATTERNS.some((re) => re.test(host))) {
    throw new Error('URL no permitida');
  }
}

export function createRecipeImportService(options?: ImportServiceOptions) {
  const geminiApiKey = options?.geminiApiKey;

  async function callGeminiWithFallback(
    genAI: GoogleGenerativeAI, textContent: string
  ): Promise<ParsedRecipe> {
    let lastError: unknown;
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(GEMINI_PROMPT + textContent);
        return parseGeminiResponse(result.response.text());
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : '';
        if (!isRetriableGeminiError(msg)) throw err;
      }
    }
    throw lastError;
  }

  return {
    async parseFromUrl(url: string): Promise<ParsedRecipe> {
      validateUrl(url);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RecipeParser/1.0)',
          Accept: 'text/html',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`No se pudo acceder a la URL: ${response.status}`);
      }

      const html = await response.text();

      // 1. Try schema.org JSON-LD (fast, free, structured)
      const jsonLd = extractJsonLd(html);
      let recipe: ParsedRecipe = {
        title: 'Receta importada', categories: [], ingredients: [],
      };
      if (jsonLd) {
        recipe = buildJsonLdRecipe(jsonLd);
        if (isRecipeComplete(recipe)) return recipe;
      }

      // 2. Supplement with heuristic HTML extraction (free, no AI)
      const htmlData = extractRecipeFromHtml(html);
      recipe = mergeWithHtmlData(recipe, htmlData);
      if (isRecipeComplete(recipe)) return recipe;

      // 3. Use Gemini AI to fill remaining gaps (tries multiple models)
      const hasData = recipe.title !== 'Receta importada' || recipe.ingredients.length > 0;

      if (!geminiApiKey) {
        if (hasData) return recipe;
        throw new Error('No se encontraron datos de receta en la URL');
      }

      const textContent = stripHtmlToText(html).slice(0, 15000);
      if (textContent.length < 50) {
        if (hasData) return recipe;
        throw new Error('No se encontraron datos de receta en la URL');
      }

      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const geminiRecipe = await callGeminiWithFallback(genAI, textContent);
        const merged = mergeRecipes(recipe, geminiRecipe);

        if (!merged.imageUrl) {
          const metaImage = extractMetaImage(html);
          if (metaImage) merged.imageUrl = metaImage;
        }

        return merged;
      } catch (err) {
        if (hasData) return recipe;
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('429') || message.includes('quota')) {
          throw new Error('Límite de uso de IA alcanzado. Inténtalo de nuevo en unos minutos.');
        }
        throw new Error('Error al analizar la receta con IA. Inténtalo de nuevo.');
      }
    },
  };
}

