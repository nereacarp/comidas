import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const stylesheet = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

function darkToken(name: string): string {
  const start = stylesheet.indexOf('[data-theme="dark"] {');
  const end = stylesheet.indexOf('\n  html {', start);
  const block = stylesheet.slice(start, end);
  const value = block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];
  if (!value) throw new Error(`No se encontró el token oscuro --${name}`);
  return value;
}

function luminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((part) => Number.parseInt(part, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first: string, second: string): number {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe('contraste del modo oscuro', () => {
  it('mantiene textos y bordes visibles sobre las superficies', () => {
    const surface = darkToken('surface');
    expect(contrast(surface, darkToken('palette-ink'))).toBeGreaterThanOrEqual(7);
    expect(contrast(surface, darkToken('palette-muted'))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(surface, darkToken('palette-border'))).toBeGreaterThanOrEqual(3);
  });

  it.each(['lavender', 'mint', 'peach', 'coral', 'cyan'])(
    'mantiene legible el tono %s',
    (tone) => {
      expect(contrast(darkToken(`pastel-${tone}`), darkToken(`pastel-${tone}-icon`)))
        .toBeGreaterThanOrEqual(4.5);
    },
  );
});
