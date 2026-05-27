const HEX6 = /^#?([0-9a-f]{6})$/i;
const HEX3 = /^#?([0-9a-f]{3})$/i;

/** Normalizes user/API color strings to #rrggbb for the color picker and storage. */
export function normalizeHexColor(color: string, fallback = '#6366f1'): string {
  const trimmed = color.trim();
  const six = HEX6.exec(trimmed);
  if (six) return `#${six[1].toLowerCase()}`;
  const three = HEX3.exec(trimmed);
  if (three) {
    const [r, g, b] = three[1];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}
