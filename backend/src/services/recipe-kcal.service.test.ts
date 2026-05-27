import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRecipeKcalService } from './recipe-kcal.service.js';

const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  },
}));

describe('createRecipeKcalService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('throws when no ingredients', async () => {
    const service = createRecipeKcalService({ geminiApiKey: 'test-key' });
    await expect(
      service.estimateFromIngredients({ ingredients: [{ name: '  ' }] })
    ).rejects.toThrow('al menos un ingrediente');
  });

  it('throws when gemini key is missing', async () => {
    const service = createRecipeKcalService();
    await expect(
      service.estimateFromIngredients({
        ingredients: [{ name: 'Pasta', quantity: 80, unit: 'g' }],
      })
    ).rejects.toThrow('GEMINI_API_KEY');
  });

  it('returns kcal from gemini json response', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            kcal: 520,
            explanation: 'Estimado según pasta y salmón por ración.',
          }),
      },
    });

    const service = createRecipeKcalService({ geminiApiKey: 'test-key' });
    const result = await service.estimateFromIngredients({
      title: 'Pasta con salmón',
      servings: 2,
      ingredients: [
        { name: 'Pasta', quantity: 160, unit: 'g' },
        { name: 'Salmón', quantity: 260, unit: 'g' },
      ],
    });

    expect(result.kcal).toBe(520);
    expect(result.explanation).toContain('ración');
    expect(mockGenerateContent).toHaveBeenCalledOnce();
    const prompt = mockGenerateContent.mock.calls[0][0] as string;
    expect(prompt).toContain('Pasta con salmón');
    expect(prompt).toContain('Raciones: 2');
    expect(prompt).toContain('160 g de Pasta');
  });

  it('parses json inside markdown code block', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => '```json\n{"kcal": 380}\n```',
      },
    });

    const service = createRecipeKcalService({ geminiApiKey: 'test-key' });
    const result = await service.estimateFromIngredients({
      ingredients: [{ name: 'Huevos', quantity: 2, unit: 'unidades' }],
    });

    expect(result.kcal).toBe(380);
  });

  it('tries next model when a model is not found', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(
        new Error('[404 Not Found] models/gemini-2.5-flash is not found')
      )
      .mockResolvedValueOnce({
        response: { text: () => '{"kcal": 410}' },
      });

    const service = createRecipeKcalService({ geminiApiKey: 'test-key' });
    const result = await service.estimateFromIngredients({
      ingredients: [{ name: 'Arroz', quantity: 100, unit: 'g' }],
    });

    expect(result.kcal).toBe(410);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid kcal values', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '{"kcal": 12}' },
    });

    const service = createRecipeKcalService({ geminiApiKey: 'test-key' });
    await expect(
      service.estimateFromIngredients({
        ingredients: [{ name: 'Sal' }],
      })
    ).rejects.toThrow('No se pudo interpretar');
  });
});
