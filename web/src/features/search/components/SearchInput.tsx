import { useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { isImeEnter } from '~/components/ime';
import { useT } from '~/i18n/useT';

export { isImeEnter };

interface SearchInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value' | 'onSubmit'
  > {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  buttonLabel?: string;
  /** Replaces the text of the submit button (e.g. an icon); `buttonLabel` stays its accessible name. */
  buttonContent?: ReactNode;
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  buttonLabel,
  buttonContent,
  className = '',
  ...rest
}: SearchInputProps) {
  const t = useT();
  const composing = useRef(false);

  return (
    <div className={`input-group ${className}`.trim()} role="search">
      <input
        type="search"
        className="form-control"
        {...rest}
        value={value}
        onChange={event => onChange(event.target.value)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
        }}
        onKeyDown={event => {
          if (event.key !== 'Enter') {
            return;
          }
          if (composing.current || isImeEnter(event)) {
            return;
          }
          event.preventDefault();
          onSubmit(value);
        }}
      />
      <button
        type="button"
        className="btn btn-outline-secondary"
        aria-label={
          buttonContent ? buttonLabel ?? t('search.submit') : undefined
        }
        onClick={() => onSubmit(value)}
      >
        {buttonContent ?? buttonLabel ?? t('search.submit')}
      </button>
    </div>
  );
}
