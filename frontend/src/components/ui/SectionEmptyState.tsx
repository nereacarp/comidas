import type { CSSProperties, ReactNode } from 'react';
import { getNavAccent, type SectionAccent } from '../../lib/section-accents';

export function sectionEmptyIconStyle(accent: SectionAccent): CSSProperties {
  return {
    background: accent.bg,
    color: accent.text,
  };
}

interface SectionEmptyStateProps {
  /** Route path used to resolve nav section accent (e.g. routes.pantry). */
  sectionPath: string;
  icon: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Full card wrapper (default) or compact block inside an existing card. */
  variant?: 'card' | 'inline';
  size?: 'md' | 'sm';
}

const ICON_BOX: Record<'md' | 'sm', string> = {
  md: 'w-14 h-14 mb-4',
  sm: 'w-12 h-12 mb-3',
};

const ICON_SLOT: Record<'md' | 'sm', string> = {
  md: '[&_svg]:w-7 [&_svg]:h-7',
  sm: '[&_svg]:w-6 [&_svg]:h-6',
};

export function SectionEmptyState({
  sectionPath,
  icon,
  title,
  description,
  children,
  variant = 'card',
  size = 'md',
}: Readonly<SectionEmptyStateProps>) {
  const accent = getNavAccent(sectionPath);
  const iconStyle = sectionEmptyIconStyle(accent);

  const body = (
    <>
      <div
        className={`${ICON_BOX[size]} rounded-2xl flex items-center justify-center opacity-90 ${ICON_SLOT[size]}`}
        style={iconStyle}
        aria-hidden
      >
        {icon}
      </div>
      <p className={`font-medium text-ink ${size === 'sm' ? 'text-sm' : ''} mb-1`}>{title}</p>
      {description ? (
        <p className={`text-muted ${size === 'sm' ? 'text-xs mt-0.5' : 'text-sm'}`}>{description}</p>
      ) : null}
      {children}
    </>
  );

  if (variant === 'inline') {
    return (
      <div className={`${size === 'sm' ? 'py-12' : 'py-14'} text-center flex flex-col items-center`}>
        {body}
      </div>
    );
  }

  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      {body}
    </div>
  );
}
