import type { ReactNode } from 'react';
import { Form } from 'react-bootstrap';
import { Icon } from '~/components/Icon';
import { useT } from '~/i18n/useT';
import './jobs-table.scss';

export const PAGE_SIZES = [10, 25, 50];

interface FilterInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  clearLabel: string;
}

/** Text filter under a column header, with a clear (x) button. */
export function FilterInput({
  value,
  onChange,
  label,
  clearLabel
}: FilterInputProps) {
  return (
    <div className="jobs-filter">
      <input
        type="text"
        className="form-control form-control-sm"
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="jobs-filter-clear"
          aria-label={clearLabel}
          onClick={() => onChange('')}
        >
          <Icon name="xmark" />
        </button>
      ) : null}
    </div>
  );
}

interface FooterProps {
  first: number;
  last: number;
  total: number;
  pageSize: number;
  onPageSize: (size: number) => void;
  /** Current page (1-based, already clamped) and the number of pages. */
  page: number;
  pages: number;
  onPage: (page: number) => void;
  /** Extra controls between the summary and the page size. */
  children?: ReactNode;
}

/** "Show 1 - 3 of 3", rows per page, first/prev/next/last and a page select (Ember models-table footer). */
export function TableFooter({
  first,
  last,
  total,
  pageSize,
  onPageSize,
  page,
  pages,
  onPage,
  children
}: FooterProps) {
  const t = useT();

  return (
    <div className="jobs-table-footer">
      <span className="entry-summary">
        {t('pipeline.jobs.summary', { first, last, total })}
      </span>
      {children}
      <label className="page-size">
        {t('pipeline.jobs.rows')}
        <Form.Select
          size="sm"
          value={pageSize}
          onChange={e => onPageSize(Number(e.target.value))}
        >
          {PAGE_SIZES.map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Form.Select>
      </label>
      <div className="page-navigation">
        <button
          type="button"
          aria-label={t('pipeline.jobs.firstPage')}
          disabled={page <= 1}
          onClick={() => onPage(1)}
        >
          <Icon name="anglesLeft" />
        </button>
        <button
          type="button"
          aria-label={t('pipeline.jobs.prevPage')}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <Icon name="angleLeft" />
        </button>
        <button
          type="button"
          aria-label={t('pipeline.jobs.nextPage')}
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          <Icon name="angleRight" />
        </button>
        <button
          type="button"
          aria-label={t('pipeline.jobs.lastPage')}
          disabled={page >= pages}
          onClick={() => onPage(pages)}
        >
          <Icon name="anglesRight" />
        </button>
      </div>
      <label className="page-select">
        {t('pipeline.jobs.page')}
        <Form.Select
          size="sm"
          value={page}
          onChange={e => onPage(Number(e.target.value))}
        >
          {Array.from({ length: pages }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </Form.Select>
      </label>
    </div>
  );
}
