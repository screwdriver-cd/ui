import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Form } from 'react-bootstrap';
import { Icon } from '~/components/Icon';
import { formatDuration } from '~/i18n/duration';
import { useLocale } from '~/i18n/I18nProvider';
import { useT } from '~/i18n/useT';
import { useJobBuilds, useJobCoverage, useUserSettings } from '../api/queries';
import type { Build, Job, Pipeline, WorkflowGraph } from '../types';
import { canJobStart } from '~/features/workflow-graph';
import { getDisplayName, getStageName } from '../utils/job';
import { isActive } from '../utils/pipeline';
import { StatusIcon } from './StatusIcon';
import { FilterInput, TableFooter } from './TableControls';
import './jobs-table.scss';

export const HISTORY_SIZES = [5, 10, 15, 20, 25, 30];
const STOPPABLE = ['RUNNING', 'QUEUED', 'BLOCKED', 'FROZEN'];
const UNFINISHED = ['RUNNING', 'QUEUED', 'BLOCKED', 'CREATED', 'FROZEN'];

type SortKey = 'name' | 'startTime' | 'stage';
type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null;

interface Row {
  job: Job;
  name: string;
  stage: string;
}

export const canTrigger = (job: Job) =>
  job.state !== 'DISABLED' &&
  job.permutations?.[0]?.annotations?.['screwdriver.cd/manualStartEnabled'] !==
    false;

function useStartTimeFormat() {
  const { locale } = useLocale();
  const settings = useUserSettings();
  const utc = settings.data?.timestampFormat === 'UTC';

  return (value?: string) => {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString(locale === 'en-XA' ? 'en-US' : locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: utc ? 'UTC' : undefined
    });
  };
}

function DurationCell({ build }: { build?: Build }) {
  const t = useT();
  const { locale } = useLocale();
  const [now, setNow] = useState(() => Date.now());
  const running = build?.status === 'RUNNING' && !build.endTime;

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const id = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(id);
  }, [running]);

  if (!build) {
    return null;
  }

  const start = Date.parse(build.startTime ?? '');

  if (build.endTime) {
    return <>{formatDuration(Date.parse(build.endTime) - start, locale, 3)}</>;
  }
  if (running && !Number.isNaN(start)) {
    return (
      <>
        {t('pipeline.jobs.runningFor', {
          duration: formatDuration(now - start, locale, 3)
        })}
      </>
    );
  }

  return <>{UNFINISHED.includes(build.status) ? '' : t('pipeline.jobs.na')}</>;
}

function CoverageCell({
  row,
  build,
  pipeline
}: {
  row: Row;
  build?: Build;
  pipeline: Pipeline;
}) {
  const t = useT();
  const coverage = useJobCoverage(row.job, build, pipeline, true);
  const value = coverage.data;

  return (
    <>
      {value && value !== 'N/A'
        ? `${value}%`
        : build
        ? t('pipeline.jobs.na')
        : ''}
    </>
  );
}

interface Props {
  pipeline: Pipeline;
  rows: Row[];
  /** Ask to start / restart / stop a job's build, or toggle the job state. */
  onStart: (job: Job, action: 'start' | 'restart', build?: Build) => void;
  onStop: (build: Build) => void;
  onToggleState: (job: Job) => void;
  archivedToggle?: React.ReactNode;
  /**
   * One event's jobs (the workflow's table view): each row shows its build in this event, and a
   * STATUS column with a status filter replaces HISTORY, as in Ember.
   */
  event?: {
    builds: Build[];
    workflowGraph?: WorkflowGraph;
    view: 'events' | 'pulls';
  };
}

export function buildJobRows(jobs: Job[], prNum?: number): Row[] {
  return jobs.map(job => ({
    job,
    name: getDisplayName(job, prNum),
    stage: getStageName(job) ?? ''
  }));
}

export function PipelineJobsTable({
  pipeline,
  rows,
  onStart,
  onStop,
  onToggleState,
  archivedToggle,
  event
}: Props) {
  const t = useT();
  const formatStart = useStartTimeFormat();
  const [sort, setSort] = useState<Sort>(null);
  const [filters, setFilters] = useState({
    name: '',
    startTime: '',
    stage: '',
    status: ''
  });
  const [numBuilds, setNumBuilds] = useState(5);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const norm = (s: string) => s.trim().toLowerCase();
  const textFiltered = useMemo(
    () =>
      rows.filter(
        r =>
          r.name.toLowerCase().includes(norm(filters.name)) &&
          r.stage.toLowerCase().includes(norm(filters.stage))
      ),
    [rows, filters.name, filters.stage]
  );
  // Start time lives on builds, so sorting or filtering by it needs them for every job.
  const needAll = sort?.key === 'startTime' || filters.startTime.trim() !== '';
  const pageCount = (list: unknown[]) =>
    Math.max(1, Math.ceil(list.length / pageSize));
  const visibleIds = (list: Row[], current: number) =>
    list.slice((current - 1) * pageSize, current * pageSize);
  const baseSorted = useMemo(() => {
    if (!sort || sort.key === 'startTime') {
      return textFiltered;
    }

    const sign = sort.dir === 'asc' ? 1 : -1;

    return [...textFiltered].sort(
      (a, b) =>
        sign *
        (sort.key === 'name'
          ? a.name.localeCompare(b.name)
          : a.stage.localeCompare(b.stage))
    );
  }, [textFiltered, sort]);
  // Clamped like the rendered page below: the rows can shrink under a later page (hiding archived
  // jobs), and slicing past the end would fetch no builds at all.
  const firstPageIds = visibleIds(
    baseSorted,
    Math.min(page, pageCount(baseSorted))
  ).map(r => r.job.id);
  const fetchIds = needAll ? baseSorted.map(r => r.job.id) : firstPageIds;
  // The event view already has its builds; the pipeline view fetches each job's recent ones.
  const eventBuilds = useMemo(() => {
    if (!event) {
      return null;
    }

    const byJob = new Map<number, Build[]>();

    [...event.builds]
      .sort((a, b) => a.id - b.id)
      .forEach(b => byJob.set(b.jobId, [b]));

    return byJob;
  }, [event]);
  const fetched = useJobBuilds(event ? [] : fetchIds, numBuilds);
  const buildMap = eventBuilds ?? fetched.data;
  const statuses = useMemo(
    () => [...new Set(event?.builds.map(b => b.status) ?? [])].sort(),
    [event]
  );
  const latestOf = (row: Row): Build | undefined => {
    const list = buildMap?.get(row.job.id);

    return list?.[list.length - 1];
  };

  const ordered = useMemo(() => {
    let list = baseSorted;

    if (filters.status) {
      list = list.filter(r => latestOf(r)?.status === filters.status);
    }
    if (filters.startTime.trim()) {
      list = list.filter(r =>
        formatStart(latestOf(r)?.startTime)
          .toLowerCase()
          .includes(norm(filters.startTime))
      );
    }
    if (sort?.key === 'startTime') {
      const sign = sort.dir === 'asc' ? 1 : -1;
      const time = (r: Row) => Date.parse(latestOf(r)?.startTime ?? '');

      list = [...list].sort((a, b) => {
        const ta = time(a);
        const tb = time(b);

        if (Number.isNaN(ta) || Number.isNaN(tb)) {
          return Number.isNaN(ta) === Number.isNaN(tb)
            ? 0
            : Number.isNaN(ta)
            ? 1
            : -1;
        }

        return sign * (ta - tb);
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseSorted, filters.startTime, filters.status, sort, buildMap]);

  const pages = pageCount(ordered);
  const current = Math.min(page, pages);
  const shown = visibleIds(ordered, current);
  const first = ordered.length === 0 ? 0 : (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, ordered.length);
  const active = isActive(pipeline);
  const setFilter = (key: keyof typeof filters) => (value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };
  const toggleSort = (key: SortKey) =>
    setSort(s =>
      s?.key !== key
        ? { key, dir: 'asc' }
        : s.dir === 'asc'
        ? { key, dir: 'desc' }
        : null
    );
  const header = (key: SortKey, label: string, filter?: React.ReactNode) => {
    const dir = sort?.key === key ? sort.dir : null;

    return (
      <th
        className={`${key}-column`}
        aria-sort={
          dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'
        }
      >
        <button
          type="button"
          className="jobs-sort"
          onClick={() => toggleSort(key)}
        >
          {label}
          <Icon
            name={
              dir === 'asc' ? 'sortUp' : dir === 'desc' ? 'sortDown' : 'sort'
            }
          />
        </button>
        {filter}
      </th>
    );
  };
  const filterInput = (key: keyof typeof filters, label: string) => (
    <FilterInput
      value={filters[key]}
      onChange={setFilter(key)}
      label={t('pipeline.jobs.filterBy', { column: label })}
      clearLabel={t('pipeline.jobs.clearFilter', { column: label })}
    />
  );
  const metricsHref = () => `/v2/pipelines/${pipeline.id}/metrics`;

  return (
    <div className="jobs-page-table-wrap">
      <div className="jobs-table-body" data-scroll-region="">
        <table className="jobs-grid" id="jobs-page-table">
          <thead>
            <tr>
              {header(
                'name',
                t('pipeline.jobs.name'),
                filterInput('name', t('pipeline.jobs.name'))
              )}
              {event ? (
                <th className="status-column">
                  {t('pipeline.jobs.status')}
                  <Form.Select
                    size="sm"
                    aria-label={t('pipeline.jobs.filterBy', {
                      column: t('pipeline.jobs.status')
                    })}
                    value={filters.status}
                    onChange={e => setFilter('status')(e.target.value)}
                  >
                    <option value="">{t('pipeline.jobs.allStatuses')}</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Form.Select>
                </th>
              ) : (
                <th className="history-column">
                  {t('pipeline.jobs.history')}
                  <Form.Select
                    size="sm"
                    aria-label={t('pipeline.jobs.historySize')}
                    value={numBuilds}
                    onChange={e => setNumBuilds(Number(e.target.value))}
                  >
                    {HISTORY_SIZES.map(n => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Form.Select>
                </th>
              )}
              <th className="duration-column">{t('pipeline.jobs.duration')}</th>
              {header(
                'startTime',
                t('pipeline.jobs.startTime'),
                filterInput('startTime', t('pipeline.jobs.startTime'))
              )}
              <th className="coverage-column">{t('pipeline.jobs.coverage')}</th>
              {header(
                'stage',
                t('pipeline.jobs.stage'),
                filterInput('stage', t('pipeline.jobs.stage'))
              )}
              <th className="metrics-column">{t('pipeline.jobs.metrics')}</th>
              <th className="actions-column">{t('pipeline.jobs.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(row => {
              const history = buildMap?.get(row.job.id) ?? [];
              const build = history[history.length - 1];
              const startDisabled =
                !active ||
                // The API never starts an archived (removed or closed-PR) job.
                !!row.job.archived ||
                !canJobStart(
                  event?.view ?? 'events',
                  event?.workflowGraph ??
                    pipeline.workflowGraph ?? { nodes: [], edges: [] },
                  row.job.name
                ) ||
                !canTrigger(row.job);
              const stopDisabled = !build || !STOPPABLE.includes(build.status);

              return (
                <tr
                  key={row.job.id}
                  data-job={row.job.name}
                  className={
                    row.job.state === 'DISABLED' ? 'job-disabled' : undefined
                  }
                >
                  <td className="job-column">
                    <div className="job-cell">
                      <span className="job-status">
                        {/* the event view's STATUS column links the build instead */}
                        {build && !event ? (
                          <Link
                            to={
                              `/v2/pipelines/${pipeline.id}/builds/${build.id}` as never
                            }
                          >
                            <StatusIcon status={build.status} />
                          </Link>
                        ) : null}
                      </span>
                      <span className="job-name" title={row.job.name}>
                        {row.name}
                      </span>
                      {row.job.archived ? (
                        <span className="badge bg-secondary">
                          {t('pipeline.jobs.archived')}
                        </span>
                      ) : null}
                      {row.job.state === 'DISABLED' ? (
                        <span className="badge bg-secondary">
                          {t('pipeline.jobs.disabled')}
                        </span>
                      ) : null}
                      {row.job.archived ? null : (
                      <button
                        type="button"
                        className="job-state-toggle"
                        aria-label={t(
                          row.job.state === 'DISABLED'
                            ? 'pipeline.jobs.enableJob'
                            : 'pipeline.jobs.disableJob',
                          { name: row.name }
                        )}
                        title={t(
                          row.job.state === 'DISABLED'
                            ? 'pipeline.jobs.enable'
                            : 'pipeline.jobs.disable'
                        )}
                        onClick={() => onToggleState(row.job)}
                      >
                        <Icon
                          name={
                            row.job.state === 'DISABLED' ? 'circleCheck' : 'ban'
                          }
                        />
                      </button>
                      )}
                    </div>
                  </td>
                  {event ? (
                    <td className="status-column">
                      {/* a CREATED build waits for its upstream jobs and has no page yet, as in Ember */}
                      {build?.status === 'CREATED' ? (
                        <span className="status-cell">
                          <StatusIcon status={build.status} /> {build.status}
                        </span>
                      ) : build ? (
                        <Link
                          to={
                            `/v2/pipelines/${pipeline.id}/builds/${build.id}` as never
                          }
                          className="status-cell"
                        >
                          <StatusIcon status={build.status} /> {build.status}
                        </Link>
                      ) : null}
                    </td>
                  ) : (
                    <td className="history-column">
                      <div className="history-cell">
                        {history
                          .filter(b => b.status !== 'CREATED')
                          .map(b => (
                            <Link
                              key={b.id}
                              to={
                                `/v2/pipelines/${pipeline.id}/builds/${b.id}` as never
                              }
                              className={`history-build ${b.status}`}
                              title={t('pipeline.jobs.buildTitle', {
                                id: b.id,
                                status: b.status
                              })}
                              aria-label={t('pipeline.jobs.buildTitle', {
                                id: b.id,
                                status: b.status
                              })}
                            >
                              <Icon name="circleSolid" className={b.status} />
                            </Link>
                          ))}
                      </div>
                    </td>
                  )}
                  <td className="duration-column">
                    <DurationCell build={build} />
                  </td>
                  <td className="startTime-column">
                    {build
                      ? build.startTime
                        ? formatStart(build.startTime)
                        : t('pipeline.jobs.notStarted')
                      : ''}
                  </td>
                  <td className="coverage-column">
                    <CoverageCell row={row} build={build} pipeline={pipeline} />
                  </td>
                  <td className="stage-column">{row.stage}</td>
                  <td className="metrics-column">
                    {build ? (
                      <Link
                        to={metricsHref() as never}
                        search={{ jobId: row.job.id } as never}
                        aria-label={t('pipeline.jobs.metricsFor', {
                          name: row.name
                        })}
                        title={t('pipeline.jobs.jobMetrics')}
                      >
                        <Icon name="chartLine" />
                      </Link>
                    ) : null}
                  </td>
                  <td className="actions-column">
                    <div className="actions-cell">
                      <button
                        type="button"
                        className="job-action start"
                        disabled={startDisabled}
                        aria-label={t('pipeline.jobs.startFrom', {
                          name: row.name
                        })}
                        title={t('pipeline.jobs.startFrom', { name: row.name })}
                        onClick={() => onStart(row.job, 'start', build)}
                      >
                        <Icon name="circlePlay" />
                      </button>
                      <button
                        type="button"
                        className="job-action stop"
                        disabled={stopDisabled}
                        aria-label={t('pipeline.jobs.stopBuild', {
                          name: row.name
                        })}
                        title={t('pipeline.jobs.stopBuild', { name: row.name })}
                        onClick={() => build && onStop(build)}
                      >
                        <Icon name="circleStop" />
                      </button>
                      <button
                        type="button"
                        className="job-action restart"
                        disabled={startDisabled || !build}
                        aria-label={t('pipeline.jobs.restartFrom', {
                          name: row.name
                        })}
                        title={t('pipeline.jobs.restartFrom', {
                          name: row.name
                        })}
                        onClick={() => onStart(row.job, 'restart', build)}
                      >
                        <Icon name="rotateRight" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {ordered.length === 0 ? (
              <tr className="jobs-empty">
                <td colSpan={8}>{t('pipeline.jobs.empty')}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <TableFooter
        first={first}
        last={last}
        total={ordered.length}
        pageSize={pageSize}
        onPageSize={size => {
          setPageSize(size);
          setPage(1);
        }}
        page={current}
        pages={pages}
        onPage={setPage}
      >
        {archivedToggle}
      </TableFooter>
    </div>
  );
}
