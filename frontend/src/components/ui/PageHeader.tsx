import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  titleAddon?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  bottom?: ReactNode;
  accentName?: string;
}

export function PageHeader({
  title,
  titleAddon,
  description,
  actions,
  bottom,
  accentName,
}: Readonly<PageHeaderProps>) {
  const renderTitle = () => {
    if (accentName && typeof title === 'string' && title.includes(accentName)) {
      const parts = title.split(accentName);
      return (
        <>
          {parts[0]}
          <span className="text-[var(--accent-greeting)]">{accentName}</span>
          {parts[1]}
        </>
      );
    }
    return title;
  };

  return (
    <header className="space-y-4 w-full min-w-0">
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5 min-w-0">
            <h1 className="type-page-title min-w-0 flex-1">
              {renderTitle()}
            </h1>
            {titleAddon && <div className="shrink-0 pt-0.5">{titleAddon}</div>}
          </div>
          {description && (
            <p className="mt-1.5 text-sm text-muted w-full min-w-0 text-pretty">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="actions-bar w-full min-w-0 sm:w-auto sm:shrink-0">
            {actions}
          </div>
        )}
      </div>
      {bottom && <div className="w-full min-w-0">{bottom}</div>}
    </header>
  );
}
