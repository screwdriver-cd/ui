import { TrustedIcon } from '~/components/TrustedIcon';
import { Icon } from '~/components/Icon';
import { Link } from '@tanstack/react-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { ScrollRegion } from '~/components/ScrollRegion';
import { useT } from '~/i18n/useT';
import { relativeTime } from './format';
import type { TemplateItem } from './types';
import './templates.scss';

export type CollectionKind = 'job' | 'pipeline' | 'commands';
type SortKey = 'name' | 'namespace' | 'updated' | 'maintainer';

interface Props {
  items: TemplateItem[];
  kind: CollectionKind;
  /** Namespace pre-selected by the URL (`/templates/job/:namespace`). */
  namespace?: string;
}

export const collectionPrefix = (kind: CollectionKind) =>
  kind === 'commands' ? '/commands' : `/templates/${kind}`;

/** Shared by job templates, pipeline templates and commands (Ember `tc-collection-list`). */
export function CollectionList({ items, kind, namespace }: Props) {
  const t = useT();
  const { locale } = useIntl();
  const [trustedOnly, setTrustedOnly] = useState(false);
  const [ns, setNs] = useState(namespace ?? '');
  const [maintainer, setMaintainer] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'updated',
    dir: 'desc'
  });
  const search = useDeferredValue(query.trim().toLowerCase());
  const prefix = collectionPrefix(kind);

  const filtered = useMemo(
    () =>
      items.filter(
        m =>
          (!trustedOnly || m.trusted) &&
          (!ns || m.namespace === ns) &&
          (!maintainer || m.maintainer === maintainer) &&
          (!search ||
            m.namespace.toLowerCase().includes(search) ||
            m.name.toLowerCase().includes(search) ||
            (m.description ?? '').toLowerCase().includes(search) ||
            (m.maintainer ?? '').toLowerCase().includes(search))
      ),
    [items, trustedOnly, ns, maintainer, search]
  );

  const rows = useMemo(() => {
    const time = (m: TemplateItem) =>
      new Date(
        (kind === 'pipeline' ? m.updateTime : m.createTime) ?? 0
      ).getTime();
    const value = (m: TemplateItem): string | number =>
      ({
        name: m.name,
        namespace: m.namespace,
        updated: time(m),
        maintainer: m.maintainer ?? ''
      }[sort.key]);
    const sign = sort.dir === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      const x = value(a);
      const y = value(b);

      return (
        (typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x).localeCompare(String(y))) * sign
      );
    });
  }, [filtered, sort, kind]);

  // Option lists narrow to what the other filter leaves, like the Ember component did.
  const namespaces = [
    ...new Set(
      (maintainer ? items.filter(i => i.maintainer === maintainer) : items).map(
        i => i.namespace
      )
    )
  ].sort();
  const maintainers = [
    ...new Set(
      (ns ? items.filter(i => i.namespace === ns) : items).map(
        i => i.maintainer
      )
    )
  ]
    .filter(Boolean)
    .sort();

  const th = (key: SortKey, label: string) => (
    <th
      scope="col"
      aria-sort={
        sort.key === key
          ? sort.dir === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
    >
      <button
        type="button"
        className="btn btn-link p-0 fw-bold text-decoration-none"
        onClick={() =>
          setSort(s => ({
            key,
            dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc'
          }))
        }
      >
        {label}
        {sort.key === key ? (
          <span aria-hidden="true">
            {' '}
            <Icon name={sort.dir === 'asc' ? 'sortUp' : 'sortDown'} />
          </span>
        ) : null}
      </button>
    </th>
  );

  const title =
    kind === 'commands'
      ? t('collection.commands')
      : t(`collection.${kind}Templates`);
  const placeholder =
    kind === 'commands'
      ? t('collection.search.commands')
      : t(`collection.search.${kind}`);

  return (
    <section className="collection-list">
      <div className="collection-list__top">
        <h5>
          <b>{title}</b>
          <span className="float-end">
            <span className="text-uppercase total">
              {t('collection.total')}
            </span>{' '}
            <span data-testid="total">{filtered.length}</span>
          </span>
        </h5>
        <div className="row g-2 mb-2">
          <div className="col-sm-2">
            <label className="trusted-toggle form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                checked={trustedOnly}
                onChange={e => setTrustedOnly(e.target.checked)}
              />{' '}
              <span className="form-check-label">
                {t('collection.trusted')}
              </span>
            </label>
          </div>
          <div className="col-sm-3">
            <select
              className="form-select form-select-sm"
              aria-label={t('collection.namespaces')}
              value={ns}
              onChange={e => setNs(e.target.value)}
            >
              <option value="">{t('collection.allNamespaces')}</option>
              {namespaces.map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm-3">
            <select
              className="form-select form-select-sm"
              aria-label={t('collection.maintainers')}
              value={maintainer}
              onChange={e => setMaintainer(e.target.value)}
            >
              <option value="">{t('collection.allMaintainers')}</option>
              {maintainers.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm-4">
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder={placeholder}
              aria-label={placeholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      <ScrollRegion className="collection-list__scroll">
        <table className="table table-sm collection-list__table">
          <thead>
            <tr>
              {th('name', t('collection.col.name'))}
              <th scope="col">{t('collection.col.description')}</th>
              {th('namespace', t('collection.col.namespace'))}
              {th('updated', t('collection.col.updated'))}
              {th('maintainer', t('collection.col.releasedBy'))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>{t('collection.noResult')}</td>
              </tr>
            ) : (
              rows.map(m => (
                <tr key={m.fullName}>
                  <td>
                    <Link to={`${prefix}/${m.namespace}/${m.name}`}>
                      {/* The slot is always there so names line up whether or not the shield shows. */}
                      <span
                        className="trusted-slot"
                        title={m.trusted ? t('template.trusted') : undefined}
                      >
                        {m.trusted ? <TrustedIcon /> : null}
                      </span>
                      <span>{m.name}</span>
                    </Link>
                  </td>
                  <td>{m.description}</td>
                  <td>
                    <Link to={`${prefix}/${m.namespace}`}>{m.namespace}</Link>
                  </td>
                  <td>{relativeTime(m.updateTime ?? m.createTime, locale)}</td>
                  <td>{m.maintainer}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollRegion>
    </section>
  );
}
