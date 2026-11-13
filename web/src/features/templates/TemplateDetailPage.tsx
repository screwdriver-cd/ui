import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { stringify } from 'yaml';
import { ScrollRegion } from '~/components/ScrollRegion';
import { useT } from '~/i18n/useT';
import {
  JobPanel,
  PipelinePanel
} from '~/features/validator/components/ValidatorResults';
import type {
  JobConfig,
  ValidationResult
} from '~/features/validator/lib/validate';
import {
  mutationMessage,
  useIsAdmin,
  useJobTemplate,
  usePipelineTemplate,
  useTemplateMutations,
  useUtcPreference
} from './api';
import { isTrusted, resolveVersion, timeRange } from './format';
import { TemplateHeader } from './TemplateHeader';
import { TemplateVersions } from './TemplateVersions';
import type { TemplateItem, TemplateTag } from './types';
import './templates.scss';

const DEFAULT_RANGE = '1yr';

export function NotFound({ what }: { what: string }) {
  const t = useT();

  return (
    <div className="py-3" id="not-found">
      <h3>{what}</h3>
      <Link to="/">{t('nav.home')}</Link>
    </div>
  );
}

function Yaml({ value }: { value: unknown }) {
  const text = useMemo(() => {
    try {
      return stringify(value ?? {});
    } catch {
      return JSON.stringify(value, null, 2);
    }
  }, [value]);

  return <pre className="template-contents">{text}</pre>;
}

/** The raw config, folded away under the structured view (as the validator shows it). */
function YamlSource({ value }: { value: unknown }) {
  const t = useT();

  return (
    <details className="template-source">
      <summary>{t('template.source')}</summary>
      <Yaml value={value} />
    </details>
  );
}

interface Loaded {
  versions: TemplateItem[];
  tags: TemplateTag[];
  /** Rows for the versions table (job templates use the time-windowed metrics). */
  table: TemplateItem[];
}

function Detail({
  kind,
  namespace,
  name,
  loaded,
  range,
  selectedRange,
  onRangeChange
}: {
  kind: 'job' | 'pipeline';
  namespace: string;
  name: string;
  loaded: Loaded;
  range: { startTime: string; endTime: string };
  selectedRange: string | null;
  onRangeChange: (
    range: { startTime: string; endTime: string },
    preset: string | null
  ) => void;
}) {
  const t = useT();
  const navigate = useNavigate();
  const { version: versionParam } = useParams({ strict: false }) as {
    version?: string;
  };
  const isAdmin = useIsAdmin();
  const utc = useUtcPreference();
  const m = useTemplateMutations(kind, namespace, name);
  const [error, setError] = useState('');
  const permission = t('template.noPermission');
  const list = `/templates/${kind}`;

  const version = versionParam
    ? resolveVersion(versionParam, loaded.versions, loaded.tags)
    : loaded.versions[0]?.version ?? null;
  const selected = loaded.versions.find(v => v.version === version);

  if (!selected) {
    return <NotFound what={t('template.notFound')} />;
  }

  const run = async (p: Promise<unknown>) => {
    try {
      setError('');
      await p;

      return true;
    } catch (e) {
      setError(mutationMessage(e, permission, { onlyForbidden: false }));

      return false;
    }
  };
  const config = (selected.config ?? {}) as Record<string, unknown> & {
    jobs?: Record<string, JobConfig>;
  };
  const fullName = `${namespace}/${name}@${selected.version}`;
  const pipeline: ValidationResult = {
    annotations: config.annotations as ValidationResult['annotations'],
    parameters: config.parameters as ValidationResult['parameters'],
    cache: config.cache as ValidationResult['cache'],
    subscribe: config.subscribe as ValidationResult['subscribe'],
    stages: config.stages as ValidationResult['stages'],
    workflowGraph: selected.workflowGraph as ValidationResult['workflowGraph']
  };

  return (
    <div className="template-detail">
      <title>{`${namespace} / ${name}${
        versionParam ? `@${versionParam}` : ''
      }`}</title>
      {error ? (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      ) : null}
      <TemplateHeader
        // Back/Forward to another template keeps this page: its remove/trust confirmation must not
        // stay open and act on the other template.
        key={selected.fullName}
        template={selected}
        kind={kind}
        trusted={isTrusted(loaded.versions)}
        isAdmin={isAdmin}
        onUpdateTrust={trusted =>
          isAdmin ? run(m.trust.mutateAsync(trusted)) : Promise.resolve()
        }
        onRemove={async () => {
          if (await run(m.remove.mutateAsync())) {
            void navigate({ to: list });
          }
        }}
      />
      {kind === 'job' ? (
        <>
          <h4>{t('template.contents')}</h4>
          <JobPanel name={fullName} job={config as JobConfig} />
          <YamlSource value={selected.config} />
        </>
      ) : (
        <>
          <h4>{t('template.pipelineContents')}</h4>
          <PipelinePanel name={fullName} result={pipeline} />
          <h4>{t('template.jobsContents')}</h4>
          {Object.entries(config.jobs ?? {}).map(([jobName, jobConfig]) => (
            <JobPanel key={jobName} name={jobName} job={jobConfig} />
          ))}
          <YamlSource value={selected.config} />
        </>
      )}
      <hr className="section-divider" />
      <TemplateVersions
        templates={loaded.table}
        kind={kind}
        range={range}
        selectedRange={selectedRange}
        onRangeChange={onRangeChange}
        canRemove={kind === 'job' || isAdmin}
        utc={utc}
        onRemoveVersion={v => run(m.removeVersion.mutateAsync(v))}
      />
    </div>
  );
}

function JobTemplateDetail({
  namespace,
  name
}: {
  namespace: string;
  name: string;
}) {
  const t = useT();
  const [preset, setPreset] = useState<string | null>(DEFAULT_RANGE);
  const [range, setRange] = useState(
    () =>
      timeRange(new Date(), DEFAULT_RANGE) as {
        startTime: string;
        endTime: string;
      }
  );
  const { all, filtered, tags } = useJobTemplate(namespace, name, range);

  if (all.isError) {
    return <NotFound what={t('template.notFound')} />;
  }
  // Tags only decorate the versions: if they fail to load, show the template without them.
  const tagList = tags.isError ? [] : tags.data;

  if (!all.data || !tagList) {
    return <div className="py-3">{t('common.loading')}</div>;
  }
  const tagged = (list: TemplateItem[]) =>
    list.map(v => ({
      ...v,
      tag:
        v.tag ||
        tagList
          .filter(x => x.version === v.version)
          .map(x => x.tag)
          .join(' ')
    }));

  return (
    <Detail
      kind="job"
      namespace={namespace}
      name={name}
      loaded={{
        versions: tagged(all.data),
        tags: tagList,
        table: tagged(filtered.data ?? all.data)
      }}
      range={range}
      selectedRange={preset}
      onRangeChange={(r, p) => {
        setRange(r);
        setPreset(p);
      }}
    />
  );
}

function PipelineTemplateDetail({
  namespace,
  name
}: {
  namespace: string;
  name: string;
}) {
  const t = useT();
  const q = usePipelineTemplate(namespace, name);
  const range = useMemo(
    () =>
      timeRange(new Date(), DEFAULT_RANGE) as {
        startTime: string;
        endTime: string;
      },
    []
  );

  if (q.isError || (q.data && q.data.versions.length === 0)) {
    return <NotFound what={t('template.pipelineNotFound')} />;
  }
  if (!q.data) {
    return <div className="py-3">{t('common.loading')}</div>;
  }

  return (
    <Detail
      kind="pipeline"
      namespace={namespace}
      name={name}
      loaded={{
        versions: q.data.versions,
        tags: q.data.tags,
        table: q.data.versions
      }}
      range={range}
      selectedRange={null}
      onRangeChange={() => undefined}
    />
  );
}

export function TemplateDetailPage({ kind }: { kind: 'job' | 'pipeline' }) {
  const { namespace, name } = useParams({ strict: false }) as {
    namespace: string;
    name: string;
  };

  return (
    <ScrollRegion className="template-page__body">
      {kind === 'job' ? (
        <JobTemplateDetail
          key={`${namespace}/${name}`}
          namespace={namespace}
          name={name}
        />
      ) : (
        <PipelineTemplateDetail
          key={`${namespace}/${name}`}
          namespace={namespace}
          name={name}
        />
      )}
    </ScrollRegion>
  );
}
