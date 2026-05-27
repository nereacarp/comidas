import type { CSSProperties } from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'default' | 'outline';
}

const BASE_CLASS =
  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border';

/** Pastel/custom hex: light fill + dark text for readable contrast. */
function badgeStyleFromColor(color: string, variant: 'default' | 'outline'): CSSProperties {
  const fill = variant === 'outline'
    ? 'transparent'
    : `color-mix(in oklab, ${color} 48%, var(--surface))`;
  return {
    backgroundColor: fill,
    color: `color-mix(in oklab, ${color} 28%, #333333)`,
    borderColor: variant === 'outline'
      ? `color-mix(in oklab, ${color} 55%, var(--border-subtle))`
      : `color-mix(in oklab, ${color} 65%, var(--border-subtle))`,
  };
}

export function Badge({ children, color, variant = 'default' }: BadgeProps) {
  if (color) {
    return (
      <span className={BASE_CLASS} style={badgeStyleFromColor(color, variant)}>
        {children}
      </span>
    );
  }

  return (
    <span
      className={`${BASE_CLASS} bg-page text-ink`}
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {children}
    </span>
  );
}
