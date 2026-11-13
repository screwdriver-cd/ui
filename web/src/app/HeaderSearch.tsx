import { useNavigate } from '@tanstack/react-router';
import { useRef, useState, type FormEvent } from 'react';
import { SvgIcon } from '~/components/SvgIcon';
import { isImeEnter } from '~/components/ime';
import { useT } from '~/i18n/useT';

/**
 * Header search box. Submitting goes to `/search?query=`; the Enter that
 * confirms an IME conversion (Japanese input) never submits.
 */
export function HeaderSearch() {
  const t = useT();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const composing = useRef(false);
  const [open, setOpen] = useState(false);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const query = term.trim();

    if (query) {
      setOpen(false);
      void navigate({ to: '/search', search: { query } });
    }
  };

  // Like Ember, search stays an icon in the header until it is opened.
  if (!open) {
    return (
      <button
        type="button"
        className="header-search-toggle"
        aria-label={t('nav.search')}
        aria-expanded="false"
        onClick={() => setOpen(true)}
      >
        <SvgIcon name="search" size={20} />
      </button>
    );
  }

  return (
    <form role="search" className="d-flex header-search" onSubmit={submit}>
      <input
        type="search"
        name="query"
        className="form-control form-control-sm"
        value={term}
        ref={input => input?.focus()}
        placeholder={t('nav.searchPlaceholder')}
        aria-label={t('nav.search')}
        onChange={event => setTerm(event.target.value)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            setTerm('');
            setOpen(false);
          } else if (event.key === 'Enter' && (composing.current || isImeEnter(event))) {
            // Confirming a conversion candidate: keep the form from submitting.
            event.preventDefault();
          }
        }}
      />
      <button type="submit" className="btn btn-sm ms-1" aria-label={t('nav.search')}>
        <SvgIcon name="search" size={20} />
      </button>
    </form>
  );
}
