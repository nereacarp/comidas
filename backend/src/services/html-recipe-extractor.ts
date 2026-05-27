import { parseIngredient } from './ingredient-parser.js';
import type { Ingredient } from './ingredient-parser.js';

type MealType = 'DESAYUNO' | 'COMIDA' | 'CENA' | 'SNACK' | 'POSTRE';

export interface HtmlRecipeData {
  title?: string;
  description?: string;
  imageUrl?: string;
  ingredients: Ingredient[];
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  categories: MealType[];
}

function extractMeta(html: string, property: string): string | undefined {
  const re1 = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'
  );
  const m1 = html.match(re1);
  if (m1) return m1[1].trim();
  const re2 = new RegExp(
    `<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${property}["']`, 'i'
  );
  const m2 = html.match(re2);
  return m2 ? m2[1].trim() : undefined;
}

function extractTitle(html: string): string | undefined {
  const og = extractMeta(html, 'og:title');
  if (og) return og;
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return h1 ? h1[1].replace(/<[^>]+>/g, '').trim() : undefined;
}

function findSectionContent(html: string, keywords: string[]): string | undefined {
  const kw = keywords.join('|');

  // Strategy 1: heading containing keyword → content until next heading
  const headingRe = new RegExp(
    `<(h[2-4])[^>]*>[\\s\\S]*?(?:${kw})[\\s\\S]*?<\\/\\1>`, 'i'
  );
  const headingMatch = headingRe.exec(html);
  if (headingMatch) {
    const start = (headingMatch.index ?? 0) + headingMatch[0].length;
    const rest = html.slice(start, start + 10000);
    const end = rest.search(/<h[2-4][^>]*>/i);
    return end > 0 ? rest.slice(0, end) : rest.slice(0, 5000);
  }

  // Strategy 2: element with class/id containing keyword
  for (const keyword of keywords) {
    const classRe = new RegExp(
      `<(?:div|section|ul|ol)[^>]*(?:class|id)=["'][^"']*${keyword}[^"']*["'][^>]*>([\\s\\S]*?)` +
      `<\\/(?:div|section|ul|ol)>`, 'i'
    );
    const match = classRe.exec(html);
    if (match) return match[1];
  }

  return undefined;
}

function extractListItems(sectionHtml: string): string[] {
  const items: string[] = [];
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = liRe.exec(sectionHtml)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text) items.push(text);
  }
  return items;
}

function extractPlainTextLines(sectionHtml: string): string[] {
  const text = sectionHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ');
  return text.split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && /^\d|^(?:un[ao]?\s|½|¼|¾|medio|media)/i.test(l));
}

function extractIngredients(html: string): Ingredient[] {
  const section = findSectionContent(html, ['ingrediente', 'ingredient']);
  if (!section) return [];

  // Try <li> items first
  const items = extractListItems(section);
  if (items.length >= 2) return items.flatMap((text) => parseIngredient(text));

  // Fallback: plain text lines starting with numbers/quantities
  const lines = extractPlainTextLines(section);
  if (lines.length >= 2) return lines.flatMap((text) => parseIngredient(text));

  return [];
}

function extractInstructions(html: string): string | undefined {
  const section = findSectionContent(html, [
    'preparaci[oó]n', 'elaboraci[oó]n', 'instrucciones',
    'modo\\s+de', 'c[oó]mo\\s+(?:se\\s+)?hac', 'pasos',
    'recipe-instruction', 'recipe-step', 'directions',
  ]);
  if (!section) return undefined;

  // Try <li> items first
  const items = extractListItems(section);
  if (items.length >= 2) {
    const steps = items.filter((s) => s.length > 10);
    if (steps.length >= 2) return steps.join('\n');
  }

  // Try <p> elements, filtering for meaningful cooking content
  const pSteps: string[] = [];
  const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRe.exec(section)) !== null) {
    let text = match[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim();
    // Strip leading "1.-" or "2.-" numbering from original HTML
    text = text.replace(/^\d+[\.\-–]+\s*/, '');
    if (text.length > 15) pSteps.push(text);
  }
  if (pSteps.length >= 2) return pSteps.join('\n');

  // Fallback: plain text with numbered steps ("1.-", "2.-")
  const plainText = section
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/gi, ' ');
  const numbered = plainText.match(/\d+[\.\-–]+\s*[^\n]{15,}/g);
  if (numbered && numbered.length >= 2) {
    return numbered
      .map((s) => s.replace(/^\d+[\.\-–]+\s*/, '').trim())
      .join('\n');
  }

  return undefined;
}

function parseIsoTime(iso: string): number | undefined {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;
  return (parseInt(match[1] || '0') * 60 + parseInt(match[2] || '0')) || undefined;
}

function extractMicrodataTime(html: string, prop: string): number | undefined {
  const re1 = new RegExp(
    `<time[^>]*itemprop=["']${prop}["'][^>]*datetime=["']([^"']+)["']`, 'i'
  );
  const re2 = new RegExp(
    `<time[^>]*datetime=["']([^"']+)["'][^>]*itemprop=["']${prop}["']`, 'i'
  );
  const match = html.match(re1) || html.match(re2);
  return match ? parseIsoTime(match[1]) : undefined;
}

function extractTimes(html: string): { prepTime?: number; cookTime?: number } {
  const text = html.replace(/<[^>]+>/g, ' ');
  const result: { prepTime?: number; cookTime?: number } = {};

  // Try text patterns first
  const prepMatch = text.match(
    /(?:tiempo\s+de\s+)?preparaci[oó]n[:\s]+(\d+)\s*(?:min|minutos?|')/i
  );
  if (prepMatch) result.prepTime = parseInt(prepMatch[1]);

  const cookMatch = text.match(
    /(?:tiempo\s+de\s+)?cocci[oó]n[:\s]+(\d+)\s*(?:min|minutos?|')/i
  );
  if (cookMatch) result.cookTime = parseInt(cookMatch[1]);

  if (!result.prepTime && !result.cookTime) {
    const hourMatch = text.match(/tiempo[:\s]+(\d+)\s*(?:hora|h)/i);
    const minMatch = text.match(/tiempo[:\s]+(\d+)\s*(?:min|minutos?|')/i);
    if (hourMatch) result.cookTime = parseInt(hourMatch[1]) * 60;
    else if (minMatch) result.cookTime = parseInt(minMatch[1]);
  }

  // Fallback: microdata <time> elements
  if (!result.prepTime) result.prepTime = extractMicrodataTime(html, 'prepTime');
  if (!result.cookTime) result.cookTime = extractMicrodataTime(html, 'cookTime');
  if (!result.cookTime && !result.prepTime) {
    result.cookTime = extractMicrodataTime(html, 'totalTime');
  }

  return result;
}

function extractServings(html: string): number | undefined {
  const text = html.replace(/<[^>]+>/g, ' ');
  const match = text.match(/(\d+)\s*(?:personas|raciones|porciones|comensales)/i)
    || text.match(/(?:raciones|porciones|para)[:\s]+(\d+)/i);
  return match ? parseInt(match[1]) : undefined;
}

const CATEGORY_MAP: Record<string, MealType[]> = {
  desayuno: ['DESAYUNO'], merienda: ['DESAYUNO', 'SNACK'],
  postre: ['POSTRE'], reposteria: ['POSTRE'], dulce: ['POSTRE'],
  bizcocho: ['POSTRE'], tarta: ['POSTRE'], galletas: ['POSTRE'], pastel: ['POSTRE'],
  ensalada: ['COMIDA', 'CENA'], pasta: ['COMIDA', 'CENA'],
  sopa: ['COMIDA', 'CENA'], guiso: ['COMIDA', 'CENA'],
  carne: ['COMIDA', 'CENA'], pescado: ['COMIDA', 'CENA'],
  arroz: ['COMIDA', 'CENA'], legumbre: ['COMIDA', 'CENA'],
};

function detectCategoriesFromText(text: string): MealType[] {
  const lower = text.toLowerCase();
  const categories = new Set<MealType>();
  for (const [key, types] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) {
      types.forEach((c) => categories.add(c));
      break;
    }
  }
  return Array.from(categories);
}

export function extractRecipeFromHtml(html: string): HtmlRecipeData {
  const title = extractTitle(html);
  const times = extractTimes(html);
  return {
    title,
    description: extractMeta(html, 'og:description') || extractMeta(html, 'description'),
    imageUrl: extractMeta(html, 'og:image'),
    ingredients: extractIngredients(html),
    instructions: extractInstructions(html),
    prepTime: times.prepTime,
    cookTime: times.cookTime,
    servings: extractServings(html),
    categories: detectCategoriesFromText(title || ''),
  };
}

