import type { ReactNode } from 'react';

interface Props {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Italic, indented value lines under the description. */
  config?: ReactNode;
  /** Right-aligned controls, vertically centred. */
  action?: ReactNode;
  danger?: boolean;
  children?: ReactNode;
}

/** One full-width bordered section of the settings pages (Ember `.section`). */
export function SettingsCard({
  id,
  title,
  description,
  config,
  action,
  danger,
  children
}: Props) {
  return (
    <section id={id} className={`settings-card${danger ? ' danger' : ''}`}>
      <div className="settings-card-text">
        <div className="settings-card-title">{title}</div>
        {description ? <div>{description}</div> : null}
        {config ? <div className="settings-card-config">{config}</div> : null}
        {children}
      </div>
      {action ? <div className="settings-card-action">{action}</div> : null}
    </section>
  );
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'danger' | 'danger-outline';
  disabled?: boolean;
  id?: string;
}

/** Square icon-only button at the right edge of a card. */
export function CardIconButton({
  label,
  onClick,
  children,
  variant = 'primary',
  disabled,
  id
}: IconButtonProps) {
  return (
    <button
      type="button"
      id={id}
      className={`settings-icon-button ${variant}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
