import { Fragment, useState } from 'react';
import { Icon, type IconName } from '~/components/Icon';
import { SvgIcon } from '~/components/SvgIcon';
import { Link, Outlet, useLocation, useParams } from '@tanstack/react-router';
import { Alert, Dropdown, Spinner } from 'react-bootstrap';
import { useSession } from '~/auth/session';
import { CollectionDropdown } from '~/features/collections/components/CollectionDropdown';
import { useCollectionMutations } from '~/features/collections/lib/api';
import type { Collection } from '~/features/collections/lib/types';
import { PageLayout } from '~/components/PageLayout';
import { useT } from '~/i18n/useT';
import { StartWarningAlert } from '../hooks/useStartGuard';
import {
  usePipelineQuery,
  useSameRepoPipelines,
  useScmContexts
} from '../api/queries';
import { branchUrlEncode } from '~/features/search/lib/api';
import { useFormatRelative } from '../hooks/useFormat';
import {
  branchLabel,
  disabledMessage,
  hasSonarBadge,
  isDisabled,
  isInactive
} from '../utils/pipeline';
import { PipelineBanners } from './PipelineBanners';
import { PipelineContext } from './PipelineContext';

const TABS = ['events', 'pulls', 'jobs'] as const;

const SIDE_NAV = [
  { to: 'events', key: 'events', icon: 'cubes' },
  { to: 'child-pipelines', key: 'children', icon: 'sitemap' },
  { to: 'secrets', key: 'secrets', icon: 'key' },
  { to: 'settings', key: 'settings', icon: 'gears' },
  { to: 'metrics', key: 'metrics', icon: 'chartLine' }
] as const satisfies ReadonlyArray<{ to: string; key: string; icon: IconName }>;

function AddToCollection({
  pipelineId,
  name
}: {
  pipelineId: number;
  name: string;
}) {
  const t = useT();
  const isAuthenticated = useSession(s => s.isAuthenticated);
  const { addPipelines } = useCollectionMutations();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  if (!isAuthenticated) return null;

  const add = async (collection: Collection) => {
    try {
      await addPipelines.mutateAsync({
        id: collection.id,
        pipelineIds: [pipelineId]
      });
      setMessage({
        ok: true,
        text: t('pipeline.collection.added', { name: collection.name })
      });
    } catch {
      setMessage({
        ok: false,
        text: t('pipeline.collection.error', { name: collection.name })
      });
    }
  };

  return (
    <div className="add-to-collection ms-auto d-flex align-items-center gap-2">
      {message ? (
        <span
          role="status"
          className={message.ok ? 'text-success' : 'text-danger'}
        >
          {message.text}
        </span>
      ) : null}
      <CollectionDropdown
        variant="outline-primary"
        toggleClassName="add-to-collection-btn"
        label={t('pipeline.collection.add')}
        ariaLabel={t('pipeline.collection.addNamed', { name })}
        onSelect={add}
      />
    </div>
  );
}

export function PipelineLayout() {
  const t = useT();
  const params = useParams({ strict: false }) as { pipelineId?: string };
  const pipelineId = Number(params.pipelineId);
  const query = usePipelineQuery(pipelineId);
  const pipeline = query.data;
  const pathname = useLocation({ select: l => l.pathname });
  const { data: contexts = [] } = useScmContexts();
  const { data: sameRepo = [] } = useSameRepoPipelines(pipeline);
  const formatRelative = useFormatRelative();

  if (query.isError) {
    return (
      <PageLayout>
        <Alert variant="danger" className="m-3" id="pipeline-error">
          {t('pipeline.error.notFound')}
        </Alert>
      </PageLayout>
    );
  }
  if (!pipeline) {
    return (
      <PageLayout>
        <div className="p-3" role="status">
          <Spinner size="sm" animation="border" /> {t('common.loading')}
        </div>
      </PageLayout>
    );
  }

  const base = `/v2/pipelines/${pipeline.id}`;
  const rawDescription =
    pipeline.annotations?.['screwdriver.cd/pipelineDescription'];
  const description =
    typeof rawDescription === 'string' ? rawDescription.trim() : '';
  const scmContext = pipeline.scmContext ?? '';
  const scm =
    contexts.find(c => c.context === scmContext)?.displayName ??
    scmContext.split(':')[0];
  const scmIcon = scmContext.startsWith('github') ? 'github' : null;

  // Events / Pull Requests / Jobs only belong to the workflow pages; the side-nav sections own their own tabs.
  const showTabs = TABS.some(
    tab =>
      pathname === `${base}/${tab}` || pathname.startsWith(`${base}/${tab}/`)
  );

  const header = (
    <>
      <PipelineBanners pipelineId={pipeline.id} />
      <StartWarningAlert pipelineId={pipeline.id} />
      {isInactive(pipeline) ? (
        <Alert
          variant="info"
          className="pipeline-state-message"
          id="pipeline-inactive"
        >
          <Icon name="triangleExclamation" /> {t('pipeline.header.inactive')}
        </Alert>
      ) : null}
      {isDisabled(pipeline) ? (
        <Alert
          variant="warning"
          className="pipeline-state-message"
          id="pipeline-disabled"
        >
          <Icon name="ban" /> {disabledMessage(pipeline, t, formatRelative)}
        </Alert>
      ) : null}
      <div className="pipeline-header">
        <div className="header-main">
          <h1 className="pipeline-name m-0">
            <Link to={`${base}/events` as never} id="pipeline-link">
              {pipeline.scmRepo?.name ?? pipeline.name ?? `#${pipeline.id}`}
            </Link>
          </h1>
          {pipeline.configPipelineId ? (
            <Link
              to={`/v2/pipelines/${pipeline.configPipelineId}/events` as never}
              className="header-item"
              id="parent-pipeline-link"
              target="_blank"
            >
              <Icon name="gear" /> {t('pipeline.header.parent')}
            </Link>
          ) : null}
          {scm ? (
            <a
              id="scm-link"
              className="header-item scm"
              href={branchUrlEncode(pipeline.scmRepo?.url)}
              target="_blank"
              rel="noreferrer"
            >
              {scmIcon ? <SvgIcon name={scmIcon} size={18} /> : null} {scm}
            </a>
          ) : null}
          <Dropdown className="header-item" id="repo-pipelines">
            <Dropdown.Toggle
              variant="link"
              className="branch-toggle"
              title={t('pipeline.header.switchBranch')}
              aria-label={t('pipeline.header.switchBranchNamed', {
                branch: branchLabel(pipeline)
              })}
            >
              <Icon name="codeBranch" />{' '}
              <span className="branch">{branchLabel(pipeline)}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {sameRepo.length === 0 ? (
                <Dropdown.ItemText>
                  {t('pipeline.header.noOtherPipelines')}
                </Dropdown.ItemText>
              ) : (
                sameRepo.map(p => (
                  <Dropdown.Item
                    key={p.id}
                    as={Link}
                    to={`/v2/pipelines/${p.id}/events` as never}
                  >
                    {p.scmRepo?.rootDir
                      ? `${p.scmRepo.branch}:${p.scmRepo.rootDir}`
                      : p.scmRepo?.branch ?? `#${p.id}`}
                  </Dropdown.Item>
                ))
              )}
            </Dropdown.Menu>
          </Dropdown>
          {pipeline.settings?.aliasName ? (
            <span className="alias">{pipeline.settings.aliasName}</span>
          ) : null}
          {hasSonarBadge(pipeline) ? (
            <a
              id="sonarqube-link"
              className="header-item"
              href={pipeline.badges?.sonar?.uri}
              title={t('pipeline.header.sonar', {
                name: pipeline.badges?.sonar?.name
              })}
              aria-label={t('pipeline.header.sonar', {
                name: pipeline.badges?.sonar?.name
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SvgIcon name="sonarqube" size={22} />
            </a>
          ) : null}
          <AddToCollection
            key={pipeline.id}
            pipelineId={pipeline.id}
            name={pipeline.scmRepo?.name ?? `#${pipeline.id}`}
          />
        </div>
        {description ? (
          <div className="pipeline-description">{description}</div>
        ) : null}
        {showTabs ? (
          <nav className="pipeline-tabs" aria-label={t('pipeline.tabs.label')}>
            {TABS.map(tab => (
              <Link
                key={tab}
                to={`${base}/${tab}` as never}
                className="pipeline-tab"
                activeProps={{ className: 'pipeline-tab active' }}
                id={`tab-${tab}`}
              >
                {t(`pipeline.nav.${tab}`)}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </>
  );

  const sideNav = (
    <nav className="pipeline-side-nav" aria-label={t('pipeline.nav.label')}>
      {SIDE_NAV.map(item => {
        const label = t(`pipeline.nav.${item.key}`);
        const href = `${base}/${item.to}`;
        // Tokens live under the Secrets section.
        const extra = item.to === 'secrets' ? [`${base}/tokens`] : [];
        const active = [href, ...extra].some(
          h => pathname === h || pathname.startsWith(`${h}/`)
        );

        return (
          <Link
            key={item.key}
            to={href as never}
            className={`side-nav-link${active ? ' active' : ''}`}
            id={`nav-${item.key}`}
            title={label}
            aria-label={label}
          >
            <Icon name={item.icon} size="lg" />
          </Link>
        );
      })}
    </nav>
  );

  return (
    <PipelineContext.Provider value={{ pipeline, pipelineId: pipeline.id }}>
      <div className="pipeline-page-grid">
        {sideNav}
        <PageLayout header={header} scroll={false}>
          {/* The router keeps a page across pipelines (Back from a parent to its child): a fresh
              one per pipeline, so an open dialog cannot act on the pipeline it was not opened on. */}
          <Fragment key={pipeline.id}>
            <Outlet />
          </Fragment>
        </PageLayout>
      </div>
    </PipelineContext.Provider>
  );
}
