import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../lib/routes';
import { BrandMarkIcon } from '../ui/Icons';

interface PublicDocumentLayoutProps {
  title: string;
  intro: string;
  children: ReactNode;
}

export function PublicDocumentLayout({ title, intro, children }: Readonly<PublicDocumentLayoutProps>) {
  return (
    <div className="min-h-screen bg-page px-4 py-8 text-ink sm:py-12">
      <article className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm sm:p-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-3" aria-label="Volver a Comidas">
          <span className="brand-logo-mark flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)]">
            <BrandMarkIcon className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold">Comidas</span>
        </Link>

        <header className="mb-8 border-b border-border pb-6">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-3 leading-7 text-muted">{intro}</p>
        </header>

        <div className="space-y-8 leading-7 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:space-y-2">
          {children}
        </div>

        <nav aria-label="Información legal" className="mt-10 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
          <Link to={routes.privacy}>Privacidad</Link>
          <Link to={routes.terms}>Condiciones</Link>
          <Link to="/">Volver a la aplicación</Link>
        </nav>
      </article>
    </div>
  );
}
