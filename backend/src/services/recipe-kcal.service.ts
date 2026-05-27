import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_MODELS, isRetriableGeminiError } from '../lib/gemini-models.js';

export interface KcalIngredientInput {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface EstimateKcalInput {
  ingredients: KcalIngredientInput[];
  servings?: number;
  title?: string;
}

export interface EstimateKcalResult {
  kcal: number;
  explanation?: string;
}

interface KcalServiceOptions {
  geminiApiKey?: string;
}

const KCAL_PROMPT = `Estima las calorías de una receta de cocina a partir de sus ingredientes.
Devuelve UNICAMENTE un objeto JSON valido (sin markdown, sin backticks) con esta estructura:
{
  "kcal": numero entero,
  "explanation": "string breve en español (1 frase) o null"
}

Reglas:
- Usa valores nutricionales habituales en España (tablas USDA/CIQUAL como referencia)
- Si hay raciones (servings), devuelve kcal POR UNA RACION del plato terminado
- Si no hay raciones, devuelve kcal del plato completo
- Incluye aceites, mantequilla y condimentos calóricos si aparecen en la lista
- Si falta cantidad en un ingrediente, estima una cantidad razonable para esa receta
- kcal debe ser un entero entre 50 y 8000
- explanation: resume en una frase cómo has estimado (opcional)

Datos de la receta:
`;

function formatIngredientsForPrompt(ingredients: KcalIngredientInput[]): string {
  return ingredients
    .map((ing) => {
      const qty =
        ing.quantity != null
          ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}`
          : 'cantidad estimada';
      return `- ${qty} de ${ing.name}`;
    })
    .join('\n');
}

function buildPrompt(input: EstimateKcalInput): string {
  const lines = [KCAL_PROMPT];
  if (input.title) lines.push(`Titulo: ${input.title}`);
  if (input.servings) lines.push(`Raciones: ${input.servings}`);
  lines.push('Ingredientes:');
  lines.push(formatIngredientsForPrompt(input.ingredients));
  return lines.join('\n');
}

function parseKcalResponse(text: string): EstimateKcalResult {
  let jsonStr = text.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  const parsed = JSON.parse(jsonStr) as { kcal?: unknown; explanation?: unknown };
  const kcal = Math.round(Number(parsed.kcal));

  if (!Number.isFinite(kcal) || kcal < 50 || kcal > 8000) {
    throw new Error('No se pudo interpretar la estimación de calorías');
  }

  return {
    kcal,
    explanation:
      typeof parsed.explanation === 'string' && parsed.explanation.trim()
        ? parsed.explanation.trim()
        : undefined,
  };
}

export function createRecipeKcalService(options?: KcalServiceOptions) {
  const geminiApiKey = options?.geminiApiKey;

  async function callGeminiWithFallback(
    genAI: GoogleGenerativeAI,
    prompt: string
  ): Promise<EstimateKcalResult> {
    let lastError: unknown;
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return parseKcalResponse(result.response.text());
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : '';
        if (!isRetriableGeminiError(msg)) throw err;
      }
    }
    throw lastError;
  }

  return {
    async estimateFromIngredients(input: EstimateKcalInput): Promise<EstimateKcalResult> {
      const ingredients = input.ingredients.filter((i) => i.name.trim());
      if (ingredients.length === 0) {
        throw new Error('Añade al menos un ingrediente con nombre');
      }

      if (!geminiApiKey) {
        throw new Error('El cálculo con IA no está configurado (falta GEMINI_API_KEY)');
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      return callGeminiWithFallback(genAI, buildPrompt({ ...input, ingredients }));
    },
  };
}
