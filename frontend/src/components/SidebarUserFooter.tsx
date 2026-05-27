import type { ReactNode } from 'react';
import { LogOutIcon } from './ui/Icons';
import { getUserInitials } from '../lib/user-display';

type SidebarUserFooterProps = {
  name?: string | null;
  email?: string | null;
  onLogout: () => void;
  actions?: ReactNode;
};

export function SidebarUserFooter({ name, email, onLogout, actions }: SidebarUserFooterProps) {
  const displayName = name?.trim() || 'Usuario';
  const initials = getUserInitials(name);

  return (
    <div className="sidebar-user-footer">
      <div className="sidebar-user-panel">
        <div className="sidebar-user-panel__identity">
          <span className="avatar-ring shrink-0" aria-hidden>
            {initials}
          </span>
          <div className="sidebar-user-panel__text min-w-0">
            <p className="sidebar-user-panel__name truncate" title={displayName}>
              {displayName}
            </p>
            {email && (
              <p className="sidebar-user-panel__email truncate" title={email}>
                {email}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="sidebar-user-panel__actions">{actions}</div>}
      </div>

      <button type="button" onClick={onLogout} className="sidebar-user-footer__logout">
        <LogOutIcon className="w-4 h-4 shrink-0" />
        Salir
      </button>
    </div>
  );
}
