import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BrandMarkIcon,
  CalendarIcon,
  PantryIcon,
  ShoppingCartIcon,
} from '../ui/Icons';
import { routes } from '../../lib/routes';

const HIGHLIGHTS = [
  {
    icon: CalendarIcon,
    label: 'Plan semanal',
    desc: 'Organiza comidas de la semana',
    bg: 'var(--pastel-mint)',
    color: 'var(--pastel-mint-icon)',
  },
  {
    icon: PantryIcon,
    label: 'Despensa',
    desc: 'Sabe qué tienes en casa',
    bg: 'var(--pastel-cyan)',
    color: 'var(--pastel-cyan-icon)',
  },
  {
    icon: ShoppingCartIcon,
    label: 'Lista de la compra',
    desc: 'Genera la compra desde el menú',
    bg: 'var(--pastel-peach)',
    color: 'var(--pastel-peach-icon)',
  },
] as const;

function AuthBrandLink({ size = 'desktop' }: Readonly<{ size?: 'mobile' | 'desktop' }>) {
  const isMobile = size === 'mobile';
  return (
    <Link
      to={routes.dashboard}
      className={isMobile ? 'auth-shell__logo auth-shell__topbar-logo' : 'auth-shell__logo'}
    >
      <span
        className={`brand-logo-mark flex items-center justify-center rounded-[var(--radius-control)] ${
          isMobile ? 'h-10 w-10' : 'h-11 w-11'
        }`}
      >
        <BrandMarkIcon className={isMobile ? 'h-5 w-5' : 'h-6 w-6'} />
      </span>
      <span
        className={`font-display font-bold tracking-tight text-ink ${isMobile ? 'text-lg' : 'text-2xl'}`}
        {...(isMobile ? {} : { id: 'auth-brand-heading' })}
      >
        Comidas
      </span>
    </Link>
  );
}

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, children, footer }: Readonly<AuthLayoutProps>) {
  return (
    <div className="auth-shell">
      <header className="auth-shell__topbar lg:hidden">
        <AuthBrandLink size="mobile" />
      </header>

      <div className="auth-shell__main">
        <div className="auth-shell__inner">
          <section className="auth-shell__intro" aria-labelledby="auth-brand-heading">
            <div className="auth-shell__intro-content">
              <AuthBrandLink size="desktop" />
              <p className="auth-shell__tagline">
                Tu cocina,{' '}
                <span className="text-[var(--accent-greeting)] font-semibold">organizada</span>
              </p>
              <p className="text-sm text-muted max-w-sm">
                Menús, despensa y compras para tu hogar, sin hojas de cálculo ni listas sueltas.
              </p>
              <ul className="auth-shell__highlights">
                {HIGHLIGHTS.map(({ icon: Icon, label, desc, bg, color }) => (
                  <li key={label} className="auth-shell__highlight">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)]"
                      style={{ background: bg, color }}
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{label}</span>
                      <span className="block text-xs text-muted">{desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="auth-shell__form-area" aria-labelledby="auth-form-heading">
            <div className="auth-shell__form-header">
              <h1 id="auth-form-heading" className="auth-shell__form-title">
                {title}
              </h1>
              <p className="auth-shell__form-footer">{footer}</p>
            </div>

            <div className="auth-card">
              <div className="auth-card__accent" aria-hidden />
              <div className="auth-card__body">{children}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
