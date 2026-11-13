import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Form } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import { FilterInput, TableFooter } from '../TableControls';
import './settings.scss';

export interface SettingsColumn<R> {
  key: string;
  header: string;
  className?: string;
  /** Text filter (substring) or a select with fixed options (exact match). */
  filter?: 'text' | Array<{ value: string; label: string }>;
  /** Value the filter looks at; defaults to nothing (column is not filterable). */
  filterValue?: (row: R) => string;
  render: (row: R) => ReactNode;
}

interface Props<R extends { id: number }> {
  id: string;
  rows: R[];
  columns: Array<SettingsColumn<R>>;
  /** When set, a leading checkbox column is shown and selection is controlled. */
  selected?: Set<number>;
  onSelect?: (ids: Set<number>) => void;
  rowLabel: (row: R) => string;
  emptyText: string;
}

/** ember-models-table look: filters under uppercase headers, optional row selection, paging footer. */
export function SettingsTable<R extends { id: number }>({
  id,
  rows,
  columns,
  selected,
  onSelect,
  rowLabel,
  emptyText
}: Props<R>) {
  const t = useT();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const selectable = Boolean(selected && onSelect);
  const filtered = useMemo(
    () =>
      rows.filter(row =>
        columns.every(col => {
          const wanted = (filters[col.key] ?? '').trim().toLowerCase();

          if (!wanted || !col.filterValue) {
            return true;
          }

          const value = col.filterValue(row).toLowerCase();

          return col.filter === 'text'
            ? value.includes(wanted)
            : value === wanted;
        })
      ),
    [rows, columns, filters]
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * pageSize, current * pageSize);
  const first = filtered.length === 0 ? 0 : (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, filtered.length);

  // Rows hidden by a filter (or gone after a refetch) are no longer selected, as in Ember.
  useEffect(() => {
    if (!selected || !onSelect) {
      return;
    }

    const present = new Set(filtered.map(r => r.id));
    const kept = [...selected].filter(i => present.has(i));

    if (kept.length !== selected.size) {
      onSelect(new Set(kept));
    }
  }, [filtered, selected, onSelect]);

  const setFilter = (key: string) => (value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };
  const pageIds = shown.map(r => r.id);
  const allOnPage = pageIds.length > 0 && pageIds.every(i => selected?.has(i));
  const someOnPage = pageIds.some(i => selected?.has(i));
  const toggleAll = () => {
    const next = new Set(selected);

    pageIds.forEach(i => (allOnPage ? next.delete(i) : next.add(i)));
    onSelect?.(next);
  };
  const toggleRow = (rowId: number) => {
    const next = new Set(selected);

    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    onSelect?.(next);
  };

  return (
    <div className="settings-table-wrap">
      <div className="jobs-table-body" data-scroll-region="">
        <table className="jobs-grid settings-grid" id={id}>
          <thead>
            <tr>
              {selectable ? (
                <th className="select-column">
                  <Form.Check
                    type="checkbox"
                    aria-label={t('pipeline.settings.selectAll')}
                    checked={allOnPage}
                    ref={(el: HTMLInputElement | null) => {
                      if (el) {
                        el.indeterminate = someOnPage && !allOnPage;
                      }
                    }}
                    onChange={toggleAll}
                  />
                </th>
              ) : null}
              {columns.map(col => (
                <th key={col.key} className={col.className}>
                  {col.header}
                  {col.filter === 'text' ? (
                    <FilterInput
                      value={filters[col.key] ?? ''}
                      onChange={setFilter(col.key)}
                      label={t('pipeline.jobs.filterBy', {
                        column: col.header
                      })}
                      clearLabel={t('pipeline.jobs.clearFilter', {
                        column: col.header
                      })}
                    />
                  ) : null}
                  {Array.isArray(col.filter) ? (
                    <Form.Select
                      size="sm"
                      aria-label={t('pipeline.jobs.filterBy', {
                        column: col.header
                      })}
                      value={filters[col.key] ?? ''}
                      onChange={e => setFilter(col.key)(e.target.value)}
                    >
                      <option value="" />
                      {col.filter.map(o => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Form.Select>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map(row => (
              <tr
                key={row.id}
                className={selected?.has(row.id) ? 'selected-row' : undefined}
              >
                {selectable ? (
                  <td className="select-column">
                    <Form.Check
                      type="checkbox"
                      aria-label={t('pipeline.settings.selectRow', {
                        name: rowLabel(row)
                      })}
                      checked={selected?.has(row.id) ?? false}
                      onChange={() => toggleRow(row.id)}
                    />
                  </td>
                ) : null}
                {columns.map(col => (
                  <td key={col.key} className={col.className}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr className="jobs-empty">
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  {emptyText}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <TableFooter
        first={first}
        last={last}
        total={filtered.length}
        pageSize={pageSize}
        onPageSize={size => {
          setPageSize(size);
          setPage(1);
        }}
        page={current}
        pages={pages}
        onPage={setPage}
      />
    </div>
  );
}

/** Bootstrap-style switch used in the table cells and preference rows. */
export function Switch({
  id,
  label,
  checked,
  onChange,
  tone = 'primary',
  disabled
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tone?: 'primary' | 'success';
  disabled?: boolean;
}) {
  return (
    <Form.Check
      type="switch"
      id={id}
      className={`settings-switch ${tone}`}
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onChange={e => onChange(e.target.checked)}
    />
  );
}
