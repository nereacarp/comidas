import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';

export interface SectionContextItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  emphasis?: boolean;
}

interface SectionContextBarProps {
  lead?: string;
  items: SectionContextItem[];
  accentText: string;
  accentBg: string;
}

export function SectionContextBar({
  lead,
  items,
  accentText,
  accentBg,
}: Readonly<SectionContextBarProps>) {
  if (!lead && items.length === 0) return null;

  const splitRow = Boolean(lead && items.length > 0);

  const style = {
    '--section-accent-text': accentText,
    '--section-accent-bg': accentBg,
  } as CSSProperties;

  return (
    <nav
      className={`section-context-bar${splitRow ? ' section-context-bar--split' : ''}`}
      style={style}
      aria-label="Acciones de sección"
    >
      {lead ? <p className="section-context-bar__lead">{lead}</p> : null}
      {items.length > 0 ? (
        <ul className="section-context-bar__list">
          {items.map((item, index) => (
            <li key={item.id} className="section-context-bar__item-wrap">
              {index > 0 ? (
                <span className="section-context-bar__sep" aria-hidden>
                  ·
                </span>
              ) : null}
              {item.href ? (
                <Link
                  to={item.href}
                  className={`section-context-bar__item ${item.emphasis ? 'section-context-bar__item--emphasis' : ''}`}
                >
                  {item.label}
                  {item.emphasis ? <ContextActionChevron /> : null}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={`section-context-bar__item ${item.emphasis ? 'section-context-bar__item--emphasis' : ''}`}
                >
                  {item.label}
                  {item.emphasis ? <ContextActionChevron /> : null}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}

function ContextActionChevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="section-context-bar__chevron"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
