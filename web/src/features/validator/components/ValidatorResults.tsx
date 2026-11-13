import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import { Icon } from '~/components/Icon';
import { useT } from '~/i18n/useT';
import { WorkflowGraph } from '~/features/workflow-graph';
import {
  detectKind,
  messageText,
  type JobConfig,
  type ValidationResult
} from '../lib/validate';
import styles from '../validator.module.scss';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Generic nested key/value view (annotations, parameters, settings, ...). */
export function ConfigTree({ data }: { data: unknown }): ReactNode {
  if (Array.isArray(data)) {
    return (
      <ul className={styles.kv}>
        {data.map((item, index) => (
          <li key={index}>
            {isObject(item) || Array.isArray(item) ? (
              <ConfigTree data={item} />
            ) : (
              String(item)
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (isObject(data)) {
    return (
      <ul className={styles.kv}>
        {Object.entries(data).map(([key, value]) => (
          <li key={key}>
            <span className={styles.name}>{key}:</span>{' '}
            {isObject(value) || Array.isArray(value) ? (
              <ConfigTree data={value} />
            ) : (
              String(value)
            )}
          </li>
        ))}
      </ul>
    );
  }

  return String(data);
}

function Field({
  label,
  children,
  empty
}: {
  label: string;
  children?: ReactNode;
  empty?: boolean;
}) {
  const t = useT();

  return (
    <div className={styles.field}>
      <span className={styles.name}>{label}:</span>{' '}
      <span className={styles.value}>
        {empty ? t('validator.none') : children}
      </span>
    </div>
  );
}

/** Jobs annotated `screwdriver.cd/virtualJob: true` are left out of the job list, as in Ember. */
const isVirtual = (job: JobConfig) =>
  (job.annotations as Record<string, unknown> | undefined)?.[
    'screwdriver.cd/virtualJob'
  ] === true;

const hasKeys = (value: unknown) =>
  Array.isArray(value)
    ? value.length > 0
    : isObject(value) && Object.keys(value).length > 0;

function stepsOf(job: JobConfig) {
  if (job.commands) {
    return job.commands.map(c => ({
      name: c.name,
      command: c.command,
      locked: false
    }));
  }

  // Templates use a different shape: [{ name: command | { command, locked } }]
  return (job.steps ?? []).map(step => {
    const name = Object.keys(step)[0] as string;
    const body = step[name] as string | { command?: string; locked?: boolean };

    return typeof body === 'string'
      ? { name, command: body, locked: false }
      : { name, command: body.command ?? '', locked: !!body.locked };
  });
}

interface JobPanelProps {
  name?: string;
  job: JobConfig;
  /** Controlled open state. Omit to start open and let the panel toggle itself. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Marks the job selected in the workflow graph. */
  active?: boolean;
  /** Fires on a click anywhere in the panel. */
  onSelect?: () => void;
  panelRef?: (el: HTMLElement | null) => void;
}

export function JobPanel({
  name,
  job,
  open,
  onOpenChange,
  active,
  onSelect,
  panelRef
}: JobPanelProps) {
  const t = useT();
  const steps = stepsOf(job);
  const env = (job.environment ?? {}) as Record<string, unknown>;
  const templateName = env.SD_TEMPLATE_FULLNAME as string | undefined;
  const pipelineTemplateName = env.SD_PIPELINE_TEMPLATE_FULLNAME as
    | string
    | undefined;

  return (
    // A click anywhere in the panel selects the job; keyboard users select it by focusing its summary.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <details
      ref={panelRef}
      className={`${styles.section} ${styles.job}`}
      data-active={active || undefined}
      open={open ?? true}
      onToggle={e => onOpenChange?.(e.currentTarget.open)}
      onClick={onSelect}
      onFocus={onSelect}
    >
      <summary>
        <Icon name="chevronRight" className={styles.chevron} />
        <h3 className="d-inline">{name || t('validator.job.settings')}</h3>
      </summary>
      {templateName ? (
        <p>
          {t('validator.job.usesTemplate')}{' '}
          <Link
            to={`/templates/job/${env.SD_TEMPLATE_NAMESPACE}/${env.SD_TEMPLATE_NAME}/${env.SD_TEMPLATE_VERSION}`}
          >
            {templateName}
          </Link>
        </p>
      ) : null}
      {pipelineTemplateName ? (
        <p>
          {t('validator.job.inherited')}{' '}
          <Link
            to={`/templates/pipeline/${env.SD_PIPELINE_TEMPLATE_NAMESPACE}/${env.SD_PIPELINE_TEMPLATE_NAME}/${env.SD_PIPELINE_TEMPLATE_VERSION}`}
          >
            {pipelineTemplateName}
          </Link>
        </p>
      ) : null}
      {job.description ? (
        <Field label={t('validator.job.description')}>
          {String(job.description)}
        </Field>
      ) : null}
      <Field label={t('validator.job.image')}>{String(job.image ?? '')}</Field>
      <Field label={t('validator.job.steps')} empty={steps.length === 0}>
        <ul className={styles.kv}>
          {steps.map((step, index) => (
            <li key={`${step.name}-${index}`}>
              <div className={styles.name}>
                {step.name}:
                {step.locked ? ` (${t('validator.job.locked')})` : ''}
              </div>
              <pre className={styles.step}>{step.command}</pre>
            </li>
          ))}
        </ul>
      </Field>
      <Field
        label={t('validator.job.annotations')}
        empty={!hasKeys(job.annotations)}
      >
        <ConfigTree data={job.annotations} />
      </Field>
      <Field
        label={t('validator.job.parameters')}
        empty={!hasKeys(job.parameters)}
      >
        <ConfigTree data={job.parameters} />
      </Field>
      <Field
        label={t('validator.job.freezeWindows')}
        empty={!hasKeys(job.freezeWindows)}
      >
        <ConfigTree data={job.freezeWindows} />
      </Field>
      <Field
        label={t('validator.job.sourcePaths')}
        empty={!hasKeys(job.sourcePaths)}
      >
        <ConfigTree data={job.sourcePaths} />
      </Field>
      <Field label={t('validator.job.secrets')} empty={!hasKeys(job.secrets)}>
        <ConfigTree data={job.secrets} />
      </Field>
      <Field
        label={t('validator.job.environment')}
        empty={!hasKeys(job.environment)}
      >
        <ConfigTree data={job.environment} />
      </Field>
      <Field
        label={t('validator.job.settingsField')}
        empty={!hasKeys(job.settings)}
      >
        <ConfigTree data={job.settings} />
      </Field>
      <Field label={t('validator.job.provider')} empty={!job.provider}>
        <ConfigTree data={job.provider} />
      </Field>
    </details>
  );
}

function PipelineGraph({
  result,
  selected,
  onSelect
}: {
  result: ValidationResult;
  selected?: string | null;
  onSelect?: (name: string) => void;
}) {
  // The graph only needs stage descriptions: membership comes from each node's stageName.
  const stages = useMemo(
    () =>
      Object.entries(result.stages ?? {}).map(([stageName, stage], index) => ({
        id: -(index + 1),
        name: stageName,
        description: stage?.description
      })),
    [result.stages]
  );

  return result.workflowGraph ? (
    <WorkflowGraph
      graph={result.workflowGraph}
      stages={stages}
      readOnly
      popover={false}
      selectedNode={selected}
      onSelectJob={node => (node ? onSelect?.(node.name) : undefined)}
    />
  ) : null;
}

const hasGraph = (result: ValidationResult) =>
  Boolean(result.workflowGraph && result.workflowGraph.edges.length > 0);

export function PipelinePanel({
  name,
  result,
  graph = true
}: {
  name?: string;
  result: ValidationResult;
  /** Show the workflow graph in the panel. Off when the page shows it on its own. */
  graph?: boolean;
}) {
  const t = useT();

  return (
    <section className={styles.section}>
      <h3>{name || t('validator.pipeline.settings')}</h3>
      <Field
        label={t('validator.pipeline.annotations')}
        empty={!hasKeys(result.annotations)}
      >
        <ConfigTree data={result.annotations} />
      </Field>
      <Field
        label={t('validator.pipeline.parameters')}
        empty={!hasKeys(result.parameters)}
      >
        <ConfigTree data={result.parameters} />
      </Field>
      <Field
        label={t('validator.pipeline.cache')}
        empty={!hasKeys(result.cache)}
      >
        <ConfigTree data={result.cache} />
      </Field>
      <Field
        label={t('validator.pipeline.subscribe')}
        empty={!hasKeys(result.subscribe)}
      >
        <ConfigTree data={result.subscribe} />
      </Field>
      {graph ? (
        <Field
          label={t('validator.pipeline.workflow')}
          empty={!hasGraph(result)}
        >
          {result.workflowGraph ? (
            <div className={styles.graph} data-testid="validator-graph">
              <PipelineGraph result={result} />
            </div>
          ) : null}
        </Field>
      ) : null}
    </section>
  );
}

const full = (x?: { namespace?: string; name?: string; version?: string }) =>
  x
    ? `${x.namespace ? `${x.namespace}/` : ''}${x.name ?? ''}@${x.version ?? ''}`
    : '';

/** A pipeline template's config in the shape of a pipeline's validation result. */
function templatePipeline(
  result: ValidationResult,
  template: NonNullable<ValidationResult['template']>
): ValidationResult {
  return {
    ...result,
    annotations: template.config?.annotations as Record<string, unknown>,
    parameters: template.config?.parameters as Record<string, unknown>,
    cache: template.config?.cache as Record<string, unknown>,
    subscribe: template.config?.subscribe as Record<string, unknown>,
    stages: template.config?.stages as ValidationResult['stages'],
    workflowGraph: (
      template as { workflowGraph?: ValidationResult['workflowGraph'] }
    ).workflowGraph
  };
}

/** One job panel: `key` names the panel (`job.1` for a permutation), `node` the job in the graph. */
interface JobEntry {
  key: string;
  node: string;
  job: JobConfig;
}

function pipelineOf(
  kind: ReturnType<typeof detectKind>,
  result: ValidationResult
): { pipeline: ValidationResult; name?: string; jobs: JobEntry[] } | null {
  if (kind === 'pipelineTemplate' && result.template) {
    return {
      pipeline: templatePipeline(result, result.template),
      name: full(result.template),
      jobs: Object.entries(result.template.config?.jobs ?? {})
        .filter(([, job]) => !isVirtual(job))
        .map(([name, job]) => ({ key: name, node: name, job }))
    };
  }
  if (
    kind === 'pipeline' &&
    (result.jobs || result.workflowGraph || result.annotations)
  ) {
    return {
      pipeline: result,
      jobs: Object.entries(result.jobs ?? {}).flatMap(([name, permutations]) =>
        (Array.isArray(permutations) ? permutations : [permutations])
          .map((job, index) => ({
            key: index ? `${name}.${index}` : name,
            node: name,
            job
          }))
          .filter(({ job }) => !isVirtual(job))
      )
    };
  }

  return null;
}

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';

export function ValidatorResults({
  yaml,
  result,
  split = false
}: {
  yaml: string;
  result: ValidationResult | null;
  /**
   * Pin the workflow graph above the settings and jobs, which scroll on their own. A click on a
   * job in the graph scrolls to its panel; a click on a panel selects its job in the graph. The
   * parent must give the results a fixed height.
   */
  split?: boolean;
}) {
  const t = useT();
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [selected, setSelected] = useState<string | null>(null);
  const panels = useRef(new Map<string, HTMLElement>());

  if (!result) {
    return null;
  }

  const kind = detectKind(yaml);
  const errors = (result.errors ?? []).map(messageText);
  const warnings = (result.warnMessages ?? []).map(messageText);
  const pipeline = pipelineOf(kind, result);
  const jobs = pipeline?.jobs ?? [];
  const selectedNode = jobs.find(j => j.key === selected)?.node ?? null;

  const setOpen = (key: string, open: boolean) =>
    setCollapsed(prev => {
      if (prev.has(key) === !open) return prev;

      const next = new Set(prev);

      if (open) next.delete(key);
      else next.add(key);

      return next;
    });

  // A job in the graph shows its first panel (permutations follow it), opened if it was collapsed.
  const showJob = (node: string) => {
    const entry = jobs.find(j => j.node === node);

    if (!entry) return;

    setSelected(entry.key);
    setOpen(entry.key, true);
    requestAnimationFrame(() =>
      panels.current
        .get(entry.key)
        ?.scrollIntoView?.({ block: 'start', behavior: scrollBehavior() })
    );
  };

  const messages = (
    <>
      {errors.map((message, index) => (
        <div key={`e${index}`} className={styles.error} role="alert">
          {message}
        </div>
      ))}
      {warnings.map((message, index) => (
        <div key={`w${index}`} className={styles.warning} role="status">
          {message}
        </div>
      ))}
    </>
  );

  const jobPanels = jobs.map(({ key, job }) => (
    <JobPanel
      key={key}
      name={key}
      job={job}
      open={!collapsed.has(key)}
      onOpenChange={open => setOpen(key, open)}
      active={split && key === selected}
      onSelect={split ? () => setSelected(key) : undefined}
      panelRef={el => {
        if (el) panels.current.set(key, el);
        else panels.current.delete(key);
      }}
    />
  ));

  if (split && pipeline && hasGraph(pipeline.pipeline)) {
    return (
      <div data-testid="validator-results" className={styles.splitResults}>
        <div className={styles.graphPane} data-testid="validator-graph">
          <PipelineGraph
            result={pipeline.pipeline}
            selected={selectedNode}
            onSelect={showJob}
          />
        </div>
        <div className={styles.details}>
          {messages}
          <PipelinePanel
            name={pipeline.name}
            result={pipeline.pipeline}
            graph={false}
          />
          {jobs.length > 1 ? (
            <div className={styles.jobsBar}>
              <button
                type="button"
                className="btn btn-link btn-sm"
                onClick={() => setCollapsed(new Set())}
              >
                {t('validator.jobs.expandAll')}
              </button>
              <button
                type="button"
                className="btn btn-link btn-sm"
                onClick={() => setCollapsed(new Set(jobs.map(j => j.key)))}
              >
                {t('validator.jobs.collapseAll')}
              </button>
            </div>
          ) : null}
          {jobPanels}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="validator-results">
      {messages}
      {kind === 'command' && result.command ? (
        <section className={styles.section}>
          <h3>{full(result.command)}</h3>
          <ConfigTree data={result.command} />
        </section>
      ) : pipeline ? (
        <>
          <PipelinePanel name={pipeline.name} result={pipeline.pipeline} />
          {jobPanels}
        </>
      ) : kind === 'jobTemplate' && result.template ? (
        <JobPanel
          name={full(result.template)}
          job={(result.template.config ?? {}) as JobConfig}
        />
      ) : errors.length === 0 ? (
        <p className={styles.value}>{t('validator.results.empty')}</p>
      ) : null}
    </div>
  );
}
