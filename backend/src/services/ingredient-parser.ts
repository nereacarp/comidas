const OPTIONAL_PATTERN =
  /[\(,]?\s*(?:si (?:te |lo |se )?(?:gusta|desea|prefier|quier)|opcional|al gusto|a tu gusto|o al gusto|si es necesario|para servir|para decorar|para acompañar|según gustos?)/i;

const FILLER_PATTERN =
  /\s*[\(,]?\s*(?:si (?:te |lo |se )?(?:gusta|desea|prefier|quier)|opcional|al gusto|a tu gusto|o al gusto|si es necesario|para servir|para decorar|para acompañar|según gustos?)[\s\S]*/i;

const QUALIFIER_PATTERN =
  /\s+(?:limpio|limpios|limpias|troceado|troceados|troceadas|picado|picados|picadas|cortado|cortados|cortadas|pelado|pelados|peladas|entero|enteros|enteras|grande|grandes|mediano|medianos|medianas|pequeño|pequeños|pequeñas|fino|finos|finas|fresco|frescos|frescas|maduro|maduros|maduras|tama[ñn]o\s+\w+)\b/gi;

const TEXT_QUANTITIES: Record<string, { quantity: number; unit: string }> = {
  'un poquito': { quantity: 1, unit: 'pizca' },
  'un poco': { quantity: 1, unit: 'poco' },
  'una pizca': { quantity: 1, unit: 'pizca' },
  'un chorrito': { quantity: 1, unit: 'chorrito' },
  'un chorro': { quantity: 1, unit: 'chorro' },
};

const KNOWN_UNITS = new Set([
  'g', 'gr', 'kg', 'mg', 'ml', 'cl', 'dl', 'l', 'lt',
  'cucharada', 'cucharadas', 'cucharadita', 'cucharaditas',
  'cucharada sopera', 'cucharadas soperas',
  'cucharadita de postre', 'cucharaditas de postre',
  'medida', 'medidas', 'medida de yogur', 'medidas de yogur',
  'taza', 'tazas', 'vaso', 'vasos',
  'unidad', 'unidades', 'ud', 'uds',
  'diente', 'dientes', 'ramita', 'ramitas', 'hoja', 'hojas',
  'rodaja', 'rodajas', 'loncha', 'lonchas', 'rebanada', 'rebanadas',
  'pizca', 'pizcas', 'puñado', 'puñados',
  'lata', 'latas', 'bote', 'botes', 'sobre', 'sobres', 'sobrecito', 'sobrecitos',
]);

const NOTE_PATTERNS = [
  /^(?:vamos\s+a|para\s+(?:la|el|las|los)|nota[:\s]|podéis|también\s+pued|os\s+recomend|recordad)/i,
  /^(?:además|opcionalmente|consejo|truco|tip)[:\s]/i,
];

const INSTRUCTION_QUANTITY_PATTERNS: Array<{ pattern: RegExp; unit: string }> = [
  { pattern: /una\s+pizca\s+de\s+/i, unit: 'pizca' },
  { pattern: /un\s+poquito\s+de\s+/i, unit: 'pizca' },
  { pattern: /un\s+poco\s+de\s+/i, unit: 'poco' },
  { pattern: /un\s+chorrito\s+de\s+/i, unit: 'chorrito' },
  { pattern: /un\s+chorro\s+de\s+/i, unit: 'chorro' },
  { pattern: /([\d.,]+)\s*(g|gr|kg|mg|ml|cl|dl|l|cucharadas?|cucharaditas?)\s+de\s+/i, unit: '' },
];

export type Ingredient = { name: string; quantity?: number; unit?: string };

function isNoteNotIngredient(text: string): boolean {
  if (NOTE_PATTERNS.some((p) => p.test(text))) return true;
  if (text.length > 120 && !/^\d/.test(text)) return true;
  return false;
}

function cleanIngredientText(text: string): { cleaned: string; optional: boolean } {
  const raw = text.trim();
  const optional = OPTIONAL_PATTERN.test(raw);
  let cleaned = raw;
  cleaned = cleaned.replace(FILLER_PATTERN, '');
  cleaned = cleaned.replace(QUALIFIER_PATTERN, '');
  cleaned = cleaned.replace(/\s+de\s+unos?\s+[\d.,]+\s*(?:kg|g|gr|ml|l|cl)\b/i, '');
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ');
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  return { cleaned, optional };
}

function parseFractionQuantity(raw: string): number | undefined {
  let qty = raw.replace(',', '.');
  // Handle ranges like "10-12" or "8–10" — take the first value
  const rangeMatch = qty.match(/^([\d.½¼¾⅓⅔/]+)\s*[-–]\s*[\d.½¼¾⅓⅔/]+$/);
  if (rangeMatch) qty = rangeMatch[1];
  const fractions: Record<string, string> = {
    '½': '0.5', '¼': '0.25', '¾': '0.75', '⅓': '0.33', '⅔': '0.67',
  };
  if (fractions[qty]) qty = fractions[qty];
  else if (qty.includes('/')) {
    const [num, den] = qty.split('/');
    qty = (parseInt(num) / parseInt(den)).toString();
  }
  const n = parseFloat(qty);
  return isNaN(n) ? undefined : n;
}

function parseCompoundUnit(unitPart: string, rest: string): { unit: string; name: string } {
  const words = rest.split(/\s+/);
  const compound = `${unitPart} ${words.slice(0, 3).join(' ')}`;
  for (const known of KNOWN_UNITS) {
    if (known.includes(' ') && compound.toLowerCase().startsWith(known)) {
      const name = rest.slice(known.length - unitPart.length).replace(/^\s*de\s+/i, '').trim();
      return { unit: known, name };
    }
  }
  const name = rest.replace(/^\s*de\s+/i, '').trim();
  return { unit: unitPart, name };
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function splitCompoundIngredient(text: string): string[] {
  const parts = text.split(/\s+y\s+(?=\d|un[ao]?\s)/i);
  if (parts.length > 1) return parts.map((p) => p.trim()).filter(Boolean);
  return [text];
}

function parseIngredientCore(cleaned: string): Ingredient {
  const match = cleaned.match(/^([\d.,/½¼¾⅓⅔]+(?:\s*[-–]\s*[\d.,/½¼¾⅓⅔]+)?)\s+(.+)$/i);
  if (match) {
    const quantity = parseFractionQuantity(match[1]);
    const rest = match[2].trim();

    const unitMatch = rest.match(/^([\wáéíóúñ.]+)\s+(.*)/i);
    if (unitMatch) {
      const maybeUnit = unitMatch[1].toLowerCase();
      if (KNOWN_UNITS.has(maybeUnit)) {
        const { unit, name } = parseCompoundUnit(maybeUnit, unitMatch[2]);
        return { name: capitalize(name), quantity, unit };
      }
      if (KNOWN_UNITS.has(maybeUnit.replace(/s$/, '')) || KNOWN_UNITS.has(maybeUnit + 's')) {
        const name = unitMatch[2].replace(/^\s*de\s+/i, '').trim();
        return { name: capitalize(name), quantity, unit: maybeUnit };
      }
    }

    const name = rest.replace(/^\s*de\s+/i, '').trim();
    return { name: capitalize(name), quantity, unit: undefined };
  }

  return { name: capitalize(cleaned) };
}

function parseSingleIngredient(text: string): Ingredient {
  const { cleaned, optional } = cleanIngredientText(text);
  const suffix = optional ? ' (Opcional)' : '';

  for (const [phrase, info] of Object.entries(TEXT_QUANTITIES)) {
    if (cleaned.toLowerCase().startsWith(phrase)) {
      const name = cleaned.slice(phrase.length).replace(/^\s*de\s+/i, '').trim();
      if (name) return { name: capitalize(name) + suffix, quantity: info.quantity, unit: info.unit };
    }
  }

  const prefixMatch = cleaned.match(/^(?:la ralladura de|el zumo de|el jugo de)\s+/i);
  if (prefixMatch) {
    const after = cleaned.slice(prefixMatch[0].length);
    const inner = parseIngredientCore(after);
    const prefix = prefixMatch[0].trim().replace(/^(?:la|el)\s+/i, '');
    return {
      name: capitalize(`${prefix} ${inner.name}`) + suffix,
      quantity: inner.quantity,
      unit: inner.unit,
    };
  }

  const result = parseIngredientCore(cleaned);
  result.name = result.name + suffix;
  return result;
}

export function parseIngredient(text: string): Ingredient[] {
  const trimmed = text.trim();
  if (!trimmed || isNoteNotIngredient(trimmed)) return [];

  const parts = splitCompoundIngredient(trimmed);
  return parts.map(parseSingleIngredient).filter((i) => i.name.length > 0);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractInstructionText(instructions: unknown): string {
  if (typeof instructions === 'string') return instructions;
  if (Array.isArray(instructions)) {
    return instructions
      .map((s) => (typeof s === 'string' ? s : s?.text || ''))
      .join(' ');
  }
  return '';
}

export function enrichFromInstructions(
  ingredients: Ingredient[],
  instructionsRaw: unknown
): Ingredient[] {
  const text = extractInstructionText(instructionsRaw);
  if (!text) return ingredients;
  const lower = text.toLowerCase();

  return ingredients.map((ing) => {
    if (ing.quantity !== undefined && ing.unit !== undefined) return ing;

    const nameLower = ing.name.replace(/\s*\(Opcional\)$/i, '').toLowerCase();
    if (!lower.includes(nameLower)) return ing;

    for (const { pattern, unit } of INSTRUCTION_QUANTITY_PATTERNS) {
      const regex = new RegExp(pattern.source + escapeRegex(nameLower), 'i');
      const match = text.match(regex);
      if (match) {
        if (unit) {
          return { ...ing, quantity: ing.quantity ?? 1, unit: ing.unit ?? unit };
        }
        const qty = parseFractionQuantity(match[1]);
        if (qty !== undefined) {
          return { ...ing, quantity: qty, unit: ing.unit ?? match[2] };
        }
      }
    }

    return ing;
  });
}
