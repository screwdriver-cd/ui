import { TrustedIcon } from '~/components/TrustedIcon';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useT } from '~/i18n/useT';
import { compareVersions, timeRange } from './format';
import type { TemplateItem } from './types';

const PRESETS = [
  '6hr',
  '12hr',
  '1d',
  '1wk',
  '1mo',
  '3mo',
  '180d',
  '1yr'
] as const;
const PRESET_LABEL: Record<(typeof PRESETS)[number], string> = {
  '6hr': '6hr',
  '12hr': '12hr',
  '1d': '1d',
  '1wk': '1wk',
  '1mo': '1mo',
  '3mo': '3mo',
  '180d': '6mo',
  '1yr': '1yr'
};

interface Props {
  templates: TemplateItem[];
  kind: 'job' | 'pipeline';
  selectedRange: string | null;
  range: { startTime: string; endTime: string };
  onRangeChange: (
    range: { startTime: string; endTime: string },
    preset: string | null
  ) => void;
  canRemove: boolean;
  onRemoveVersion: (version: string) => Promise<unknown>;
  utc: boolean;
}

type Key = 'version' | 'published' | 'pipelines' | 'jobs' | 'builds';

const num = (v: number | string | undefined) =>
  typeof v === 'number' ? v : Number(v) || 0;

export function TemplateVersions({
  templates,
  kind,
  selectedRange,
  range,
  onRangeChange,
  canRemove,
  onRemoveVersion,
  utc
}: Props) {
  const t = useT();
  const { formatDate } = useIntl();
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({
    key: 'version',
    dir: -1
  });
  const [toRemove, setToRemove] = useState<TemplateItem | null>(null);
  const [customStart, setCustomStart] = useState(range.startTime.slice(0, 10));
  const [customEnd, setCustomEnd] = useState(range.endTime.slice(0, 10));

  const rows = useMemo(() => {
    const val = (m: TemplateItem): string | number =>
      ({
        version: m.version,
        published: new Date(m.createTime ?? 0).getTime(),
        pipelines: num(m.metrics?.pipelines.count),
        jobs: num(m.metrics?.jobs.count),
        builds: num(m.metrics?.builds.count)
      }[sort.key]);

    return [...templates].sort((a, b) => {
      const x = val(a);
      const y = val(b);

      return (
        (typeof x === 'string' && typeof y === 'string'
          ? compareVersions(x, y)
          : Number(x) - Number(y)) * sort.dir
      );
    });
  }, [templates, sort]);

  const totals = (pick: 'pipelines' | 'jobs' | 'builds') =>
    templates.reduce((n, m) => n + num(m.metrics?.[pick].count), 0);
  const th = (key: Key, label: string) => (
    <th
      scope="col"
      aria-sort={
        sort.key === key
          ? sort.dir === 1
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
            dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1
          }))
        }
      >
        {label}
      </button>
    </th>
  );
  const detail = kind === 'job' ? '/templates/job' : '/templates/pipeline';
  const published = (m: TemplateItem) =>
    m.createTime
      ? formatDate(m.createTime, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short',
          ...(utc ? { timeZone: 'UTC' } : {})
        })
      : '';

  return (
    <section className="template-versions">
      <h4>{t('template.versions.title')}</h4>
      {kind === 'job' ? (
        <div className="table-controls mb-2">
          <em>{t('template.versions.note')}</em>
          <div className="d-flex flex-wrap align-items-center gap-2 mt-1">
            <span className="fw-semibold">
              {t('template.versions.timeRange')}
            </span>
            <div
              className="btn-group btn-group-sm"
              role="group"
              aria-label={t('template.versions.timeRange')}
            >
              {PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-outline-secondary${
                    selectedRange === p ? ' active' : ''
                  }`}
                  aria-pressed={selectedRange === p}
                  onClick={() => {
                    const r = timeRange(new Date(), p);

                    if (r) {
                      onRangeChange(r, p);
                    }
                  }}
                >
                  {PRESET_LABEL[p]}
                </button>
              ))}
            </div>
            <span className="fw-semibold">
              {t('template.versions.customRange')}
            </span>
            <input
              type="date"
              className="form-control form-control-sm w-auto"
              aria-label={t('template.versions.from')}
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
            />
            <input
              type="date"
              className="form-control form-control-sm w-auto"
              aria-label={t('template.versions.to')}
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              disabled={!customStart || !customEnd || customStart > customEnd}
              onClick={() =>
                onRangeChange(
                  {
                    startTime: new Date(`${customStart}T00:00:00`)
                      .toISOString()
                      .slice(0, 16),
                    endTime: new Date(`${customEnd}T23:59:00`)
                      .toISOString()
                      .slice(0, 16)
                  },
                  null
                )
              }
            >
              {t('template.versions.apply')}
            </button>
          </div>
        </div>
      ) : null}
      <table className="table table-sm" data-testid="versions-table">
        <thead>
          <tr>
            {th('version', t('template.versions.version'))}
            {th('published', t('template.versions.published'))}
            {kind === 'job' ? (
              <>
                {th('pipelines', t('template.versions.pipelines'))}
                {th('jobs', t('template.versions.jobs'))}
                {th('builds', t('template.versions.builds'))}
              </>
            ) : null}
            <th scope="col">{t('template.versions.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(m => (
            <tr key={m.version}>
              <td>
                {m.trusted ? (
                  <span
                    role="img"
                    aria-label={t('template.trusted')}
                    title={t('template.trusted')}
                  >
                    <TrustedIcon />{' '}
                  </span>
                ) : null}
                <Link to={`${detail}/${m.namespace}/${m.name}/${m.version}`}>
                  {m.version}
                  {m.tag ? ` - ${m.tag}` : ''}
                </Link>
              </td>
              <td>{published(m)}</td>
              {kind === 'job' ? (
                <>
                  <td>
                    {num(m.metrics?.pipelines.count) > 0 ? (
                      <Link
                        to={`/templates/job/${m.namespace}/${m.name}/${m.version}/usage`}
                      >
                        {String(m.metrics?.pipelines.count)}
                      </Link>
                    ) : (
                      String(m.metrics?.pipelines.count ?? '')
                    )}
                  </td>
                  <td>{String(m.metrics?.jobs.count ?? '')}</td>
                  <td>{String(m.metrics?.builds.count ?? '')}</td>
                </>
              ) : null}
              <td>
                {canRemove ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-danger"
                    title={t('template.versions.delete')}
                    aria-label={t('template.versions.deleteVersion', {
                      version: m.version
                    })}
                    onClick={() => setToRemove(m)}
                  >
                    {t('template.versions.delete')}
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
        {kind === 'job' ? (
          <tfoot>
            <tr>
              <td />
              <td>{t('template.versions.total')}</td>
              <td>{totals('pipelines')}</td>
              <td>{totals('jobs')}</td>
              <td>{totals('builds')}</td>
              <td />
            </tr>
          </tfoot>
        ) : null}
      </table>
      <Modal show={!!toRemove} onHide={() => setToRemove(null)} centered>
        <Modal.Header closeButton>
          {t('template.versions.confirmDeletion')}
        </Modal.Header>
        <Modal.Body>
          {toRemove && num(toRemove.metrics?.jobs.count) > 0
            ? t('template.versions.confirmUsed', {
                version: toRemove.version,
                count: num(toRemove.metrics?.jobs.count)
              })
            : t('template.versions.confirmUnused', {
                version: toRemove?.version ?? ''
              })}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setToRemove(null)}
          >
            {t('template.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={async () => {
              const v = toRemove?.version;

              setToRemove(null);
              if (v) {
                await onRemoveVersion(v);
              }
            }}
          >
            {t('template.confirm.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
