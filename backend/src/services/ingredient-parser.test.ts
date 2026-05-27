import { describe, it, expect } from 'vitest';
import { parseIngredient } from './ingredient-parser.js';

describe('parseIngredient', () => {
  it('should parse simple ingredient with quantity and unit', () => {
    const result = parseIngredient('200 g de harina');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'Harina', quantity: 200, unit: 'g' });
  });

  it('should parse ingredient with range quantity "10-12 almejas"', () => {
    const result = parseIngredient('10-12 almejas');
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(10);
    expect(result[0].name).toBe('Almejas');
  });

  it('should parse ingredient with range quantity "8-10 puntas de espárragos"', () => {
    const result = parseIngredient('8-10 puntas de espárragos');
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(8);
    expect(result[0].name).toBe('Puntas de espárragos');
  });

  it('should parse range with en-dash "10–12 gambas"', () => {
    const result = parseIngredient('10–12 gambas');
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(10);
    expect(result[0].name).toBe('Gambas');
  });

  it('should parse range with optional marker', () => {
    const result = parseIngredient('8-10 puntas de espárragos (opcional)');
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(8);
    expect(result[0].name).toContain('(Opcional)');
  });

  it('should still parse simple quantities correctly', () => {
    const result = parseIngredient('3 huevos');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'Huevos', quantity: 3, unit: undefined });
  });

  it('should parse fraction quantities', () => {
    const result = parseIngredient('½ cucharadita de sal');
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(0.5);
    expect(result[0].unit).toBe('cucharadita');
    expect(result[0].name).toBe('Sal');
  });
});
