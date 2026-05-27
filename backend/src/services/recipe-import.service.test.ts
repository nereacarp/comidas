import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRecipeImportService } from './recipe-import.service.js';

const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  },
}));

const HTML_WITH_RECIPE = `
<html>
<head>
<script type="application/ld+json">
{
  "@type": "Recipe",
  "name": "Tortilla de patatas",
  "description": "La clasica tortilla espanola",
  "recipeIngredient": ["4 huevos", "3 patatas medianas", "1 cebolla"],
  "recipeInstructions": [
    {"@type": "HowToStep", "text": "Pelar y cortar las patatas"},
    {"@type": "HowToStep", "text": "Freir en aceite"}
  ],
  "prepTime": "PT15M",
  "cookTime": "PT30M",
  "recipeYield": "4",
  "recipeCategory": "Comida",
  "image": "https://example.com/tortilla.jpg"
}
</script>
</head>
<body></body>
</html>`;

const HTML_WITH_UNQUOTED_JSONLD = `
<html>
<head>
<script type=application/ld+json id=schema-recipe-json>
{
  "@type": "Recipe",
  "name": "Pato a la naranja",
  "description": "Receta de pato al horno",
  "recipeIngredient": [
    "1 pato entero limpio de unos 1,5 kg",
    "150 ml de brandy",
    "100 ml de zumo de naranja",
    "10 ml de salsa de soja",
    "1 cucharadita de postre de maicena",
    "Un poquito de wasabi si te gusta el toque picante",
    "Sal"
  ],
  "recipeInstructions": [
    {"@type": "HowToStep", "text": "Precalentar el horno a 200C"},
    {"@type": "HowToStep", "text": "Secar bien el pato"}
  ],
  "prepTime": "PT120M",
  "cookTime": "PT120M",
  "recipeYield": "4",
  "recipeCategory": "Carnes y aves",
  "image": {"@type": "ImageObject", "url": "https://example.com/pato.jpg"}
}
</script>
</head>
<body></body>
</html>`;

const HTML_BIZCOCHO = `
<html>
<head>
<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "Recipe",
  "name": "Bizcocho casero de yogur, el más fácil y esponjoso",
  "totalTime": "PT45M",
  "recipeYield": "8",
  "recipeIngredient": [
    "Vamos a utilizar la medida del envase de un yogur (normalmente trae 125 g.)",
    "1 medida de yogur de aceite suave de oliva",
    "1 medida de yogur (en este caso natural azucarado)",
    "2 medidas de yogur de azucar blanquilla",
    "3 medidas de yogur de harina de trigo",
    "3 huevos tamaño mediano",
    "1 sobrecito de levadura quimica en polvo (16 g.)",
    "1 pizca de sal",
    "un poquito de mantequilla y una pizca de harina, para la base del bizcocho"
  ],
  "recipeInstructions": [
    {"@type": "HowToStep", "text": "Precalentamos el horno a 200 grados"},
    {"@type": "HowToStep", "text": "Batimos los huevos con unas varillas"}
  ],
  "image": "https://example.com/bizcocho.jpg"
}
</script>
</head>
<body></body>
</html>`;

const HTML_PARTIAL_JSONLD = `
<html>
<head>
<script type="application/ld+json">
{
  "@type": "Recipe",
  "name": "Bizcocho facil",
  "description": "Un bizcocho muy sencillo",
  "image": "https://example.com/bizcocho-partial.jpg",
  "recipeIngredient": [""],
  "recipeInstructions": [{"@type": "HowToStep", "text": ""}]
}
</script>
</head>
<body>
<h1>Bizcocho facil</h1>
<p>Ingredientes: 3 huevos, 200g de harina, 150g de azucar</p>
<p>Preparacion: mezclar todo y hornear 35 minutos a 180 grados</p>
</body>
</html>`;

const HTML_NO_JSONLD = `
<html>
<head>
<meta property="og:image" content="https://example.com/paella.jpg" />
<meta property="og:description" content="Una receta tradicional valenciana" />
</head>
<body>
<h1>Paella Valenciana</h1>
<p>Una receta tradicional valenciana con arroz, pollo y verduras.</p>
<h2>Ingredientes</h2>
<ul>
<li>400g de arroz bomba</li>
<li>500g de pollo troceado</li>
<li>200g de judia verde</li>
</ul>
</body>
</html>`;

const HTML_EMPTY = `
<html>
<body>
<p>Este es un articulo sobre cocina moderna pero no contiene ninguna receta con ingredientes o instrucciones detalladas para preparar un plato concreto.</p>
</body>
</html>`;

const GEMINI_COMPLETION_RESPONSE = JSON.stringify({
  title: 'Bizcocho facil',
  description: 'Un bizcocho sencillo y rapido',
  instructions: 'Mezclar huevos con azucar\nAnadir harina\nHornear 35 minutos a 180 grados',
  prepTime: 10,
  cookTime: 35,
  servings: 6,
  categories: ['POSTRE'],
  ingredients: [
    { name: 'Huevos', quantity: 3, unit: null },
    { name: 'Harina', quantity: 200, unit: 'g' },
    { name: 'Azucar', quantity: 150, unit: 'g' },
  ],
});

const GEMINI_RESPONSE = JSON.stringify({
  title: 'Paella Valenciana',
  description: 'Una receta tradicional valenciana con arroz, pollo y verduras.',
  instructions: 'Calentar aceite\nSofreir el pollo\nAnadir verduras y arroz',
  prepTime: 20,
  cookTime: 45,
  servings: 4,
  categories: ['COMIDA', 'CENA'],
  ingredients: [
    { name: 'Arroz bomba', quantity: 400, unit: 'g' },
    { name: 'Pollo troceado', quantity: 500, unit: 'g' },
    { name: 'Judia verde', quantity: 200, unit: 'g' },
  ],
});

describe('RecipeImportService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockGenerateContent.mockReset();
  });

  it('should parse recipe from URL with JSON-LD', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HTML_WITH_RECIPE),
    } as Response);

    const service = createRecipeImportService();
    const result = await service.parseFromUrl('https://example.com/receta');

    expect(result.title).toBe('Tortilla de patatas');
    expect(result.prepTime).toBe(15);
    expect(result.cookTime).toBe(30);
    expect(result.servings).toBe(4);
    expect(result.imageUrl).toBe('https://example.com/tortilla.jpg');
    expect(result.ingredients).toHaveLength(3);
  });

  it('should parse recipe with unquoted JSON-LD attributes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HTML_WITH_UNQUOTED_JSONLD),
    } as Response);

    const service = createRecipeImportService();
    const result = await service.parseFromUrl('https://example.com/pato');

    expect(result.title).toBe('Pato a la naranja');
    expect(result.prepTime).toBe(120);
    expect(result.servings).toBe(4);
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('should clean ingredient names and parse units', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HTML_WITH_UNQUOTED_JSONLD),
    } as Response);

    const service = createRecipeImportService();
    const result = await service.parseFromUrl('https://example.com/pato');

    const brandy = result.ingredients.find((i) => i.name.toLowerCase().includes('brandy'));
    expect(brandy).toEqual({ name: 'Brandy', quantity: 150, unit: 'ml' });

    const soja = result.ingredients.find((i) => i.name.toLowerCase().includes('salsa de soja'));
    expect(soja).toEqual({ name: 'Salsa de soja', quantity: 10, unit: 'ml' });

    const wasabi = result.ingredients.find((i) => i.name.toLowerCase().includes('wasabi'));
    expect(wasabi!.name).toContain('(Opcional)');
    expect(wasabi!.quantity).toBe(1);
    expect(wasabi!.unit).toBe('pizca');

    const maicena = result.ingredients.find((i) => i.name.toLowerCase().includes('maicena'));
    expect(maicena!.name).toBe('Maicena');
    expect(maicena!.unit).toBe('cucharadita de postre');
  });

  it('should handle bizcocho-style recipes with totalTime and narrative ingredients', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HTML_BIZCOCHO),
    } as Response);

    const service = createRecipeImportService();
    const result = await service.parseFromUrl('https://example.com/bizcocho');

    expect(result.title).toBe('Bizcocho de yogur');
    expect(result.cookTime).toBe(45);

    const noteIngredient = result.ingredients.find((i) =>
      i.name.toLowerCase().includes('vamos a utilizar')
    );
    expect(noteIngredient).toBeUndefined();

    const aceite = result.ingredients.find((i) => i.name.toLowerCase().includes('aceite'));
    expect(aceite).toBeDefined();
    expect(aceite!.quantity).toBe(1);

    const huevos = result.ingredients.find((i) => i.name.toLowerCase().includes('huevos'));
    expect(huevos).toBeDefined();
    expect(huevos!.quantity).toBe(3);

    const levadura = result.ingredients.find((i) => i.name.toLowerCase().includes('levadura'));
    expect(levadura).toBeDefined();
    expect(levadura!.quantity).toBe(1);
    expect(levadura!.unit).toBe('sobrecito');

    expect(result.categories).toContain('POSTRE');
  });

  it('should enrich ingredients from instructions', async () => {
    const html = `<html><head><script type="application/ld+json">
    {
      "@type": "Recipe",
      "name": "Ensalada",
      "recipeIngredient": ["Sal", "Pimienta", "200 g de lechuga"],
      "recipeInstructions": [
        {"@type": "HowToStep", "text": "Lavar la lechuga"},
        {"@type": "HowToStep", "text": "Anadir una pizca de sal y servir"}
      ],
      "recipeYield": "2"
    }
    </script></head><body></body></html>`;

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    } as Response);

    const service = createRecipeImportService();
    const result = await service.parseFromUrl('https://example.com/ensalada');

    const sal = result.ingredients.find((i) => i.name === 'Sal');
    expect(sal!.quantity).toBe(1);
    expect(sal!.unit).toBe('pizca');

    const pimienta = result.ingredients.find((i) => i.name === 'Pimienta');
    expect(pimienta!.quantity).toBeUndefined();
    expect(pimienta!.unit).toBeUndefined();
  });

  it('should clean title removing adjectives and prefixes', async () => {
    const cases = [
      { input: 'Receta de pato a la naranja al horno, fácil y delicioso', expected: 'Pato a la naranja al horno' },
      { input: 'Bizcocho casero de yogur, el más fácil y esponjoso', expected: 'Bizcocho de yogur' },
      { input: 'Lentejas con chorizo - receta tradicional', expected: 'Lentejas con chorizo' },
      { input: 'Bizcocho fácil, un postre clásico', expected: 'Bizcocho' },
    ];

    for (const { input, expected } of cases) {
      const html = `<html><head><script type="application/ld+json">
      {"@type":"Recipe","name":"${input}","recipeIngredient":["1 huevo"],"recipeYield":"2"}
      </script></head><body></body></html>`;

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(html),
      } as Response);

      const service = createRecipeImportService();
      const result = await service.parseFromUrl('https://example.com/test');
      expect(result.title).toBe(expected);
      vi.restoreAllMocks();
    }
  });

  it('should detect categories from recipeCategory and title', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HTML_WITH_RECIPE),
    } as Response);

    const service = createRecipeImportService();
    const result = await service.parseFromUrl('https://example.com/receta');
    expect(result.categories).toContain('COMIDA');
  });

  it('should throw when URL is not accessible', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const service = createRecipeImportService();
    await expect(service.parseFromUrl('https://example.com/nope'))
      .rejects.toThrow('No se pudo acceder a la URL');
  });

  it('should throw when no recipe data and no Gemini key', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HTML_EMPTY),
    } as Response);

    const service = createRecipeImportService();
    await expect(service.parseFromUrl('https://example.com/no-recipe'))
      .rejects.toThrow('No se encontraron datos de receta');
  });

  it('should extract data from HTML when no JSON-LD and no Gemini key', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HTML_NO_JSONLD),
    } as Response);

    const service = createRecipeImportService();
    const result = await service.parseFromUrl('https://example.com/paella');

    expect(result.title).toBe('Paella Valenciana');
    expect(result.imageUrl).toBe('https://example.com/paella.jpg');
    expect(result.ingredients).toHaveLength(3);
    expect(result.description).toBe('Una receta tradicional valenciana');
  });

  describe('with Gemini fallback', () => {
    it('should prefer JSON-LD when available', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(HTML_WITH_RECIPE),
      } as Response);

      const service = createRecipeImportService({ geminiApiKey: 'test-key' });
      const result = await service.parseFromUrl('https://example.com/receta');

      expect(result.title).toBe('Tortilla de patatas');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('should use Gemini when no JSON-LD found', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(HTML_NO_JSONLD),
      } as Response);

      mockGenerateContent.mockResolvedValue({
        response: { text: () => GEMINI_RESPONSE },
      });

      const service = createRecipeImportService({ geminiApiKey: 'test-key' });
      const result = await service.parseFromUrl('https://example.com/paella');

      expect(result.title).toBe('Paella Valenciana');
      expect(result.ingredients).toHaveLength(3);
      expect(result.imageUrl).toBe('https://example.com/paella.jpg');
      expect(result.categories).toContain('COMIDA');
    });

    it('should handle Gemini response wrapped in code blocks', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(HTML_NO_JSONLD),
      } as Response);

      mockGenerateContent.mockResolvedValue({
        response: { text: () => '```json\n' + GEMINI_RESPONSE + '\n```' },
      });

      const service = createRecipeImportService({ geminiApiKey: 'test-key' });
      const result = await service.parseFromUrl('https://example.com/paella');
      expect(result.title).toBe('Paella Valenciana');
    });

    it('should use Gemini to complete partial JSON-LD data', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(HTML_PARTIAL_JSONLD),
      } as Response);

      mockGenerateContent.mockResolvedValue({
        response: { text: () => GEMINI_COMPLETION_RESPONSE },
      });

      const service = createRecipeImportService({ geminiApiKey: 'test-key' });
      const result = await service.parseFromUrl('https://example.com/bizcocho');

      // Title and image come from JSON-LD (base takes priority)
      expect(result.title).toBe('Bizcocho');
      expect(result.description).toBe('Un bizcocho muy sencillo');
      expect(result.imageUrl).toBe('https://example.com/bizcocho-partial.jpg');

      // Ingredients, instructions, times come from Gemini (fills gaps)
      expect(result.ingredients).toHaveLength(3);
      expect(result.instructions).toContain('Mezclar');
      expect(result.prepTime).toBe(10);
      expect(result.cookTime).toBe(35);
      expect(result.servings).toBe(6);
      expect(result.categories).toContain('POSTRE');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should throw when Gemini returns invalid JSON and no HTML data', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(HTML_EMPTY),
      } as Response);

      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'This is not JSON at all' },
      });

      const service = createRecipeImportService({ geminiApiKey: 'test-key' });
      await expect(service.parseFromUrl('https://example.com/bad'))
        .rejects.toThrow();
    });

    it('should return HTML data when Gemini returns invalid JSON', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(HTML_NO_JSONLD),
      } as Response);

      mockGenerateContent.mockResolvedValue({
        response: { text: () => 'This is not JSON at all' },
      });

      const service = createRecipeImportService({ geminiApiKey: 'test-key' });
      const result = await service.parseFromUrl('https://example.com/paella');

      expect(result.title).toBe('Paella Valenciana');
      expect(result.ingredients).toHaveLength(3);
    });

    it('should return partial data when Gemini fails with rate limit', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(HTML_PARTIAL_JSONLD),
      } as Response);

      mockGenerateContent.mockRejectedValue(new Error('429 Too Many Requests'));

      const service = createRecipeImportService({ geminiApiKey: 'test-key' });
      const result = await service.parseFromUrl('https://example.com/bizcocho');

      expect(result.title).toBe('Bizcocho');
      expect(result.description).toBe('Un bizcocho muy sencillo');
      expect(result.imageUrl).toBe('https://example.com/bizcocho-partial.jpg');
    });

    it('should strip step numbers from Gemini response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(HTML_NO_JSONLD),
      } as Response);

      const numberedResponse = JSON.stringify({
        title: 'Paella Valenciana',
        description: 'Una receta tradicional',
        instructions: '1. Calentar aceite\n2. Sofreir el pollo\n3. Anadir verduras y arroz',
        prepTime: 20,
        cookTime: 45,
        servings: 4,
        categories: ['COMIDA'],
        ingredients: [{ name: 'Arroz', quantity: 400, unit: 'g' }],
      });

      mockGenerateContent.mockResolvedValue({
        response: { text: () => numberedResponse },
      });

      const service = createRecipeImportService({ geminiApiKey: 'test-key' });
      const result = await service.parseFromUrl('https://example.com/paella');

      expect(result.instructions).not.toMatch(/^\d+\./m);
      expect(result.instructions).toContain('Calentar aceite');
      expect(result.instructions).toContain('Sofreir el pollo');
    });

    it('should show friendly error when Gemini quota exceeded and no data', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(HTML_EMPTY),
      } as Response);

      mockGenerateContent.mockRejectedValue(new Error('429 Too Many Requests quota'));

      const service = createRecipeImportService({ geminiApiKey: 'test-key' });
      await expect(service.parseFromUrl('https://example.com/bad'))
        .rejects.toThrow('Límite de uso de IA alcanzado');
    });

    it('should return HTML-extracted data when Gemini quota exceeded', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(HTML_NO_JSONLD),
      } as Response);

      mockGenerateContent.mockRejectedValue(new Error('429 Too Many Requests'));

      const service = createRecipeImportService({ geminiApiKey: 'test-key' });
      const result = await service.parseFromUrl('https://example.com/paella');

      expect(result.title).toBe('Paella Valenciana');
      expect(result.imageUrl).toBe('https://example.com/paella.jpg');
      expect(result.ingredients).toHaveLength(3);
    });
  });
});
