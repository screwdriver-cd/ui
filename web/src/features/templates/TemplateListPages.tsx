import { Navigate, useParams } from '@tanstack/react-router';
import { useT } from '~/i18n/useT';
import { useJobTemplates, usePipelineTemplates } from './api';
import { CollectionList } from './CollectionList';

function Status({ loading, error }: { loading: boolean; error: boolean }) {
  const t = useT();

  return (
    <div className="p-3">
      {error ? t('common.error') : loading ? t('common.loading') : null}
    </div>
  );
}

export function JobTemplateListPage() {
  const { namespace } = useParams({ strict: false }) as { namespace?: string };
  const q = useJobTemplates(namespace);

  return q.data ? (
    <CollectionList
      key={namespace ?? ''}
      items={q.data}
      kind="job"
      namespace={namespace}
    />
  ) : (
    <Status loading={q.isLoading} error={q.isError} />
  );
}

export function PipelineTemplateListPage() {
  const { namespace } = useParams({ strict: false }) as { namespace?: string };
  const q = usePipelineTemplates();
  const items =
    q.data && namespace
      ? q.data.filter(i => i.namespace === namespace)
      : q.data;

  return items ? (
    <CollectionList
      key={namespace ?? ''}
      items={items}
      kind="pipeline"
      namespace={namespace}
    />
  ) : (
    <Status loading={q.isLoading} error={q.isError} />
  );
}

/** `/templates` and the legacy `/templates/:namespace[/:name]` URLs. */
export function TemplatesIndexRedirect() {
  return <Navigate to="/templates/pipeline" replace />;
}

export function LegacyTemplateRedirect() {
  const { _splat } = useParams({ strict: false }) as { _splat?: string };

  return <Navigate to={`/templates/job/${_splat ?? ''}`} replace />;
}
