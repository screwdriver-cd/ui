import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearch } from '@tanstack/react-router';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { Alert, Button, ButtonGroup, Form } from 'react-bootstrap';
import { api, ApiError } from '~/api/client';
import { ScrollRegion } from '~/components/ScrollRegion';
import { useT } from '~/i18n/useT';
import { useJobMetrics, useJobs, usePipelineMetrics } from '../api/queries';
import { MetricsChart, type ChartSeries } from '../components/metrics/MetricsChart';
import { usePipeline } from '../components/PipelineContext';
import { formatShortDuration } from '../utils/event';
import { getDisplayName } from '../utils/job';
import {
  buildBreakdown,
  categoricalColor,
  customRange,
  DEFAULT_RANGE,
  DOWNTIME_STATUSES,
  downtimeRows,
  eventRows,
  RANGE_PRESETS,
  stepBreakdown,
  summarize,
  timeRange,
  toDateInput,
  type ChartRow,
  type DowntimeMetric,
  type JobMetric,
  type RangePreset,
  type TimeWindow
} from '../utils/metrics';
import '../components/metrics/metrics.scss';

/** Status palette (fixed): success / failure. */
const GOOD = '#0ca30c';
const CRITICAL = '#d03b3b';

type Zoom = [number, number] | null;

/** `?jobId=` from the Jobs page; the router may hand back a number or a string. */
export function parseJobId(value: unknown): number | null {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

const minutes = (m: number) => formatShortDuration(m * 60_000);
const seconds = (s: number) => formatShortDuration(s * 1000);

function useDowntimeMetrics(pipelineId: number, downtimeJobs: number[], { startTime, endTime }: TimeWindow) {
  return useQuery({
    queryKey: ['pipeline', pipelineId, 'metrics', 'downtime', downtimeJobs, startTime, endTime],
    queryFn: () =>
      api.get<DowntimeMetric[]>(`/pipelines/${pipelineId}/metrics`, {
        query: { downtimeJobs, downtimeStatuses: DOWNTIME_STATUSES, startTime, endTime }
      }),
    placeholderData: keepPreviousData
  });
}

/** Per-job hidden series that resets to a default whenever the selected job changes. */
function useHiddenFor(jobId: number | null, fallback: () => Set<string>) {
  const [state, setState] = useState<{ jobId: number | null; hidden: Set<string> | null }>({
    jobId,
    hidden: null
  });
  const hidden = state.jobId === jobId && state.hidden ? state.hidden : fallback();

  return [hidden, (next: Set<string>) => setState({ jobId, hidden: next })] as const;
}

/** One summary figure; the value is named by its label. */
function Stat({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();

  return (
    <div>
      <dt id={id}>{label}</dt>
      <dd aria-labelledby={id}>{children}</dd>
    </div>
  );
}

export function MetricsPage() {
  const t = useT();
  const { pipeline } = usePipeline();
  const navigate = useNavigate();
  const pathname = useLocation({ select: l => l.pathname });
  const search = useSearch({ strict: false }) as { jobId?: unknown };
  const requestedJobId = parseJobId(search.jobId);

  const [preset, setPreset] = useState<RangePreset | null>(DEFAULT_RANGE);
  const [range, setRange] = useState<TimeWindow>(() => timeRange(DEFAULT_RANGE)!);
  const [draft, setDraft] = useState(() => ({
    start: toDateInput(range.startTime),
    end: toDateInput(range.endTime)
  }));
  const [utc, setUtc] = useState(false);
  const [successOnly, setSuccessOnly] = useState(false);
  const [trendline, setTrendline] = useState(false);
  const [eventZoom, setEventZoom] = useState<Zoom>(null);
  const [stepZoom, setStepZoom] = useState<Zoom>(null);
  const [downtimeZoom, setDowntimeZoom] = useState<Zoom>(null);
  const [eventHidden, setEventHidden] = useState<Set<string>>(new Set());

  // Every job, PR ones included, as Ember's `pipeline.jobs`: a PR job's ?jobId= is honoured.
  const jobs = useJobs(pipeline.id);
  const jobNames = useMemo(
    () => new Map((jobs.data ?? []).map(j => [j.id, getDisplayName(j)] as const)),
    [jobs.data]
  );
  // Like Ember, a jobId that is not one of this pipeline's jobs is ignored.
  const jobId = requestedJobId !== null && jobNames.has(requestedJobId) ? requestedJobId : null;
  const pipelineMetrics = usePipelineMetrics(pipeline.id, range.startTime, range.endTime);
  const jobMetrics = useJobMetrics(jobId, range.startTime, range.endTime);
  const downtimeJobs = pipeline.settings?.metricsDowntimeJobs ?? [];
  const downtime = useDowntimeMetrics(pipeline.id, downtimeJobs, range);

  const metrics = useMemo(() => pipelineMetrics.data ?? [], [pipelineMetrics.data]);
  const summary = summarize(metrics, successOnly);
  const events = useMemo(() => eventRows(metrics, successOnly), [metrics, successOnly]);
  const allBuildJobs = useMemo(() => buildBreakdown(metrics, jobNames).jobs, [metrics, jobNames]);
  const builds = useMemo(() => buildBreakdown(metrics, jobNames, successOnly), [metrics, jobNames, successOnly]);
  const jobMetricRows = useMemo(
    () => (jobId === null ? [] : (jobMetrics.data ?? [])) as JobMetric[],
    [jobId, jobMetrics.data]
  );
  const allSteps = useMemo(() => stepBreakdown(jobMetricRows).steps, [jobMetricRows]);
  const steps = useMemo(() => stepBreakdown(jobMetricRows, successOnly), [jobMetricRows, successOnly]);
  const downtimeData = useMemo(() => downtimeRows(downtime.data ?? []), [downtime.data]);

  const [buildHidden, setBuildHidden] = useHiddenFor(jobId, () =>
    // Ember hides every other job in the build breakdown while one is selected.
    jobId !== null && allBuildJobs.some(j => j.jobId === jobId)
      ? new Set(allBuildJobs.filter(j => j.jobId !== jobId).map(j => j.key))
      : new Set()
  );
  const [stepHidden, setStepHidden] = useHiddenFor(jobId, () => new Set());

  const resetZooms = () => {
    setEventZoom(null);
    setStepZoom(null);
    setDowntimeZoom(null);
  };
  const applyRange = (next: TimeWindow, nextPreset: RangePreset | null) => {
    setPreset(nextPreset);
    setRange(next);
    setDraft({ start: toDateInput(next.startTime), end: toDateInput(next.endTime) });
    resetZooms();
  };
  const custom = customRange(draft.start, draft.end);
  const selectJob = (id: number | null) => {
    setStepZoom(null);
    void navigate({
      to: pathname as never,
      search: ((prev: Record<string, unknown>) => ({ ...prev, jobId: id ?? undefined })) as never,
      replace: true
    });
  };
  const go = (href: string) => void navigate({ to: href as never });

  const base = `/v2/pipelines/${pipeline.id}`;
  const eventHref = (row: ChartRow) => `${base}/events/${row.id}`;
  const buildHref = (id: number) => `/pipelines/${pipeline.id}/builds/${id}`;

  const eventSeries: ChartSeries[] = trendline
    ? [{ key: 'total', label: t('pipeline.metrics.eventDuration'), color: '#2a78d6', kind: 'line' }]
    : [
        { key: 'queuedTime', label: t('pipeline.metrics.queued'), color: '#e87ba4' },
        { key: 'imagePullTime', label: t('pipeline.metrics.imagePull'), color: '#2a78d6' },
        {
          key: 'duration',
          label: t('pipeline.metrics.duration'),
          color: GOOD,
          altColor: CRITICAL,
          colorFor: row => (row.status === 'SUCCESS' ? GOOD : CRITICAL)
        }
      ];
  const buildSeries: ChartSeries[] = allBuildJobs
    .map((j, i) => ({ key: j.key, label: j.name, color: categoricalColor(i) }))
    .filter(s => builds.jobs.some(j => j.key === s.key));
  const stepSeries: ChartSeries[] = allSteps
    .map((name, i) => ({ key: name, label: name, color: categoricalColor(i) }))
    .filter(s => steps.steps.includes(s.key));
  const jobOptions = [...allBuildJobs];

  if (jobId !== null && !jobOptions.some(j => j.jobId === jobId)) {
    jobOptions.push({ key: String(jobId), jobId, name: jobNames.get(jobId) ?? String(jobId) });
  }

  const error = pipelineMetrics.error;
  const errorMessage =
    error instanceof ApiError && typeof (error.body as { message?: unknown })?.message === 'string'
      ? (error.body as { message: string }).message
      : error
        ? t('common.error')
        : null;
  const common = { utc, onNavigate: go, formatValue: minutes, yLabel: t('pipeline.metrics.yAxisMinutes') };
  const na = t('pipeline.metrics.notAvailable');

  const jobSelect = (
    <Form.Group className="metrics-job-select">
      <Form.Label htmlFor="metrics-job" className="visually-hidden">
        {t('pipeline.metrics.job')}
      </Form.Label>
      <Form.Select
        id="metrics-job"
        size="sm"
        value={jobId ?? ''}
        onChange={e => selectJob(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{t('pipeline.metrics.selectJob')}</option>
        {jobOptions.map(j => (
          <option key={j.key} value={j.jobId}>
            {j.name}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  );

  return (
    <div className="pipeline-page pipeline-metrics">
      <div className="metrics-controls" role="group" aria-label={t('pipeline.metrics.controls')}>
        <div className="metrics-control">
          <span className="metrics-control__title" id="metrics-range-label">
            {t('pipeline.metrics.timeRange')}
          </span>
          <ButtonGroup size="sm" aria-labelledby="metrics-range-label" className="range-selection">
            {RANGE_PRESETS.map(p => (
              <Button
                key={p}
                variant={preset === p ? 'primary' : 'outline-secondary'}
                aria-pressed={preset === p}
                onClick={() => preset !== p && applyRange(timeRange(p)!, p)}
              >
                {t(`pipeline.metrics.preset.${p}`)}
              </Button>
            ))}
          </ButtonGroup>
        </div>
        <Form
          className="metrics-control custom-date-selection"
          onSubmit={e => {
            e.preventDefault();
            if (custom) {
              applyRange(custom, null);
            }
          }}
        >
          <span className="metrics-control__title">{t('pipeline.metrics.customRange')}</span>
          <Form.Control
            type="date"
            size="sm"
            aria-label={t('pipeline.metrics.startDate')}
            value={draft.start}
            max={draft.end || undefined}
            onChange={e => setDraft({ ...draft, start: e.target.value })}
          />
          <Form.Control
            type="date"
            size="sm"
            aria-label={t('pipeline.metrics.endDate')}
            value={draft.end}
            min={draft.start || undefined}
            onChange={e => setDraft({ ...draft, end: e.target.value })}
          />
          <Button type="submit" size="sm" variant="outline-primary" disabled={!custom}>
            {t('pipeline.metrics.apply')}
          </Button>
        </Form>
        <ButtonGroup size="sm" aria-label={t('pipeline.metrics.timeZone')} className="metrics-control tz-toggle">
          <Button variant={utc ? 'outline-secondary' : 'primary'} aria-pressed={!utc} onClick={() => setUtc(false)}>
            {t('pipeline.metrics.local')}
          </Button>
          <Button variant={utc ? 'primary' : 'outline-secondary'} aria-pressed={utc} onClick={() => setUtc(true)}>
            {t('pipeline.metrics.utc')}
          </Button>
        </ButtonGroup>
        <Form.Check
          type="switch"
          id="metrics-success-only"
          className="metrics-control"
          label={t('pipeline.metrics.successOnly')}
          checked={successOnly}
          onChange={e => {
            setSuccessOnly(e.target.checked);
            resetZooms();
          }}
        />
      </div>
      {errorMessage ? (
        <Alert variant="warning" className="metrics-error">
          {errorMessage}
        </Alert>
      ) : null}
      <dl className="metrics-summary">
        <Stat label={t('pipeline.metrics.totalEvents')}>{summary.total || na}</Stat>
        <Stat label={t('pipeline.metrics.passedFailed')}>
          {summary.total ? (
            <>
              <span className="passed">{summary.passed}</span>
              {' / '}
              <span className="failed">{summary.failed}</span>
            </>
          ) : (
            na
          )}
        </Stat>
        <Stat label={t('pipeline.metrics.successRate')}>
          {summary.total
            ? new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 }).format(summary.successRate)
            : na}
        </Stat>
        <Stat label={t('pipeline.metrics.avgBuildTime')}>{summary.total ? seconds(summary.avgDuration) : na}</Stat>
        <Stat label={t('pipeline.metrics.avgImagePull')}>{summary.total ? seconds(summary.avgImagePull) : na}</Stat>
        <Stat label={t('pipeline.metrics.avgQueuedTime')}>{summary.total ? seconds(summary.avgQueued) : na}</Stat>
      </dl>
      <ScrollRegion className={`metrics-charts${pipelineMetrics.isFetching ? ' is-refetching' : ''}`}>
        {metrics.length === 0 ? (
          <p className="chart-cta" id="no-metrics">
            {pipelineMetrics.isPending ? t('common.loading') : t('pipeline.metrics.empty')}
          </p>
        ) : (
          <>
            <section className="metrics-group" aria-labelledby="metrics-downtime-title">
              <h2 className="metrics-group__title" id="metrics-downtime-title">
                {t('pipeline.metrics.downtimeTitle')}
              </h2>
              {downtime.isPending ? (
                <p className="chart-cta">{t('common.loading')}</p>
              ) : downtime.isError ? (
                <p className="chart-cta">{t('pipeline.metrics.downtimeUnavailable')}</p>
              ) : downtimeData.length === 0 ? (
                <p className="chart-cta">{t('pipeline.metrics.downtimeNotEnough')}</p>
              ) : (
                <>
                  <MetricsChart
                    {...common}
                    subtitle
                    id="metrics-downtime"
                    title={t('pipeline.metrics.downtime')}
                    rows={downtimeData}
                    series={[{ key: 'downtime', label: t('pipeline.metrics.downtime'), color: CRITICAL }]}
                    zoom={downtimeZoom}
                    onZoom={setDowntimeZoom}
                    hrefFor={eventHref}
                  />
                  <MetricsChart
                    {...common}
                    subtitle
                    id="metrics-build-count"
                    title={t('pipeline.metrics.buildCount')}
                    rows={downtimeData}
                    series={[{ key: 'builds', label: t('pipeline.metrics.buildCount'), color: '#2a78d6', kind: 'line' }]}
                    zoom={downtimeZoom}
                    onZoom={setDowntimeZoom}
                    hrefFor={eventHref}
                    yLabel={t('pipeline.metrics.yAxisCount')}
                    formatValue={v => String(v)}
                  />
                </>
              )}
            </section>
            <MetricsChart
              {...common}
              id="metrics-events"
              svgClassName="metrics-chart"
              title={t('pipeline.metrics.eventsTitle')}
              rows={events}
              series={eventSeries}
              hidden={eventHidden}
              onHiddenChange={setEventHidden}
              zoom={eventZoom}
              onZoom={setEventZoom}
              hrefFor={eventHref}
              toolbar={
                <Form.Check
                  type="switch"
                  id="metrics-trendline"
                  className="toggle-trend"
                  label={t('pipeline.metrics.trendline')}
                  checked={trendline}
                  onChange={e => {
                    setTrendline(e.target.checked);
                    setEventHidden(new Set());
                  }}
                />
              }
            />
            <MetricsChart
              {...common}
              id="metrics-builds"
              title={t('pipeline.metrics.buildsTitle')}
              rows={builds.rows}
              series={buildSeries}
              hidden={buildHidden}
              onHiddenChange={setBuildHidden}
              // Events and builds share x positions, so they zoom together (Ember conjugate charts).
              zoom={eventZoom}
              onZoom={setEventZoom}
              hrefFor={(row, key) => {
                const id = key ? row.buildIds?.[key] : undefined;

                return id ? buildHref(id) : eventHref(row);
              }}
            />
            {jobId !== null && steps.rows.length > 0 ? (
              <MetricsChart
                {...common}
                id="metrics-steps"
                title={t('pipeline.metrics.stepsTitle')}
                toolbar={jobSelect}
                rows={steps.rows}
                series={stepSeries}
                hidden={stepHidden}
                onHiddenChange={setStepHidden}
                zoom={stepZoom}
                onZoom={setStepZoom}
                hrefFor={(row, key) =>
                  key ? `${buildHref(row.id)}/steps/${encodeURIComponent(key)}` : buildHref(row.id)
                }
              />
            ) : (
              <div className="chart-cta metrics-steps-cta" id="metrics-steps">
                <h2 className="metrics-panel__title">{t('pipeline.metrics.stepsTitle')}</h2>
                <p>
                  {jobId !== null && jobMetrics.isFetching
                    ? t('common.loading')
                    : jobId !== null
                      ? t('pipeline.metrics.noStepMetrics')
                      : t('pipeline.metrics.selectJobPrompt')}
                </p>
                {jobSelect}
              </div>
            )}
          </>
        )}
      </ScrollRegion>
    </div>
  );
}
