import { TrustedIcon } from '~/components/TrustedIcon';
import { Link, Outlet, useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { PageLayout } from '~/components/PageLayout';
import { ScrollRegion } from '~/components/ScrollRegion';
import { config } from '~/config/config';
import { useT } from '~/i18n/useT';
import { CollectionList } from '~/features/templates/CollectionList';
import { Crumbs } from '~/features/templates/TemplatesLayout';
import { mutationMessage, useIsAdmin, usePipelineScmUrl } from '~/features/templates/api';
import { isTrusted, relativeTime, resolveVersion } from '~/features/templates/format';
import { type CommandVersion, useCommand, useCommandMutations, useCommands } from './api';
import '~/features/templates/templates.scss';

export function CommandsLayout() {
  const t = useT();
  const { namespace, name } = useParams({ strict: false }) as { namespace?: string; name?: string };
  const crumbs: Array<{ name: string; to: string }> = [];

  if (namespace) {
    crumbs.push({ name: t('command.title'), to: '/commands' }, { name: namespace, to: `/commands/${namespace}` });
  }
  if (name) {
    crumbs.push({ name, to: `/commands/${namespace}/${name}` });
  }

  return (
    <PageLayout
      scroll={false}
      header={
        <div className="template-page__header commands-header">
          <h4>
            {t('command.title')}
            <a
              className="doc-link float-end fs-6 fw-normal"
              href={`${config.docUrl}/user-guide/commands`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('command.docs')}
            </a>
          </h4>
          <div className="command-description">{t('command.description')}</div>
          {crumbs.length ? <Crumbs crumbs={crumbs} /> : null}
        </div>
      }
    >
      <div className="fill-col commands">
        <Outlet />
      </div>
    </PageLayout>
  );
}

export function CommandListPage() {
  const t = useT();
  const { namespace } = useParams({ strict: false }) as { namespace?: string };
  const q = useCommands(namespace);

  return q.data ? (
    <CollectionList key={namespace ?? ''} items={q.data} kind="commands" namespace={namespace} />
  ) : (
    <div className="p-3">{q.isError ? t('common.error') : t('common.loading')}</div>
  );
}

function Format({ command }: { command: CommandVersion }) {
  const t = useT();
  const row = (label: string, value?: string, title?: string) => (
    <div title={title}>
      <span className="label fw-semibold">{label}</span> <span className="value">{value}</span>
    </div>
  );

  return (
    <div className="command-format">
      <h4>{t('command.format', { format: String(command.format ?? '') })}</h4>
      {command.format === 'habitat' ? (
        <>
          {row(t('command.habitat.mode'), command.habitat?.mode)}
          {row(t('command.habitat.package'), command.habitat?.package)}
          {row(t('command.habitat.command'), command.habitat?.command)}
        </>
      ) : command.format === 'docker' ? (
        <>
          {row(t('command.docker.image'), command.docker?.image)}
          {row(t('command.docker.command'), command.docker?.command)}
        </>
      ) : command.format === 'binary' ? (
        row(t('command.binary.file'), command.binary?.file)
      ) : (
        <span>{t('command.unknownFormat')}</span>
      )}
    </div>
  );
}

function Header({
  command,
  isLatest,
  trusted,
  isAdmin,
  onTrust,
  onRemove
}: {
  command: CommandVersion;
  isLatest: boolean;
  /** The command's trust (from its latest version), not the selected version's flag. */
  trusted: boolean;
  isAdmin: boolean;
  onTrust: (trusted: boolean) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}) {
  const t = useT();
  const { locale } = useIntl();
  const scm = usePipelineScmUrl(command.pipelineId);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmTrust, setConfirmTrust] = useState(false);
  const full = `${command.namespace}/${command.name}`;
  const canDelete = isAdmin || !!scm.data;
  const usage =
    command.usage ?? `sd-cmd exec ${full}@${isLatest ? 'latest' : command.version}`;

  return (
    <div className="command-header">
      <div className="header d-flex justify-content-between">
        <h1 className="d-flex align-items-center gap-2">
          {isAdmin ? (
            <button
              type="button"
              className="btn btn-link p-0"
              title={t('command.toggleTrusted')}
              aria-label={t('command.toggleTrusted')}
              onClick={() => setConfirmTrust(true)}
            >
              <span className={`trusted${trusted ? '' : ' distrusted'}`}><TrustedIcon trusted={trusted} /></span>
            </button>
          ) : trusted ? (
            <span className="trusted" role="img" aria-label={t('template.trusted')} title={t('template.trusted')}>
              <TrustedIcon />
            </span>
          ) : null}
          {command.pipelineId ? (
            <Link to={`/pipelines/${command.pipelineId}`} title={t('command.goToPipeline')}>
              {full}
            </Link>
          ) : (
            full
          )}
          {scm.data ? (
            <a href={scm.data} className="fs-6" title={t('template.sourceCode')}>
              {t('template.sourceCode')}
            </a>
          ) : null}
        </h1>
        {canDelete ? (
          <button type="button" className="btn btn-sm btn-outline-danger align-self-start" onClick={() => setConfirmRemove(true)}>
            {t('template.delete')}
          </button>
        ) : (
          <span className="text-muted" title={t('command.cannotDelete')}>
            {t('template.delete')}
          </span>
        )}
      </div>
      <div className="command-stats">
        <h2>{isLatest ? t('command.versionLatest', { version: command.version }) : command.version}</h2>
      </div>
      <p>{command.description}</p>
      <ul>
        <li>
          {t('template.releasedBy')} <a href={`mailto:${command.maintainer}`}>{command.maintainer}</a>
        </li>
        {command.compatibilities?.clouds?.length ? (
          <li>
            {t('template.clouds')} {command.compatibilities.clouds.join(' ')}
          </li>
        ) : null}
        {command.compatibilities?.architectures?.length ? (
          <li>
            {t('template.arches')} {command.compatibilities.architectures.join(' ')}
          </li>
        ) : null}
        {command.createTime ? (
          <li>
            {t('command.lastPublished', { when: relativeTime(command.createTime, locale) })}
          </li>
        ) : null}
      </ul>
      <h4>{t('template.usage.title')}</h4>
      <pre>{usage}</pre>
      <Modal show={confirmRemove} onHide={() => setConfirmRemove(false)} centered>
        <Modal.Header closeButton>
          <h4>{t('template.confirm.title')}</h4>
        </Modal.Header>
        <Modal.Body>{t('command.confirm.removeAll', { name: full })}</Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={() => setConfirmRemove(false)}>
            {t('template.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={async () => {
              setConfirmRemove(false);
              await onRemove();
            }}
          >
            {t('template.confirm.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
      <Modal show={confirmTrust} onHide={() => setConfirmTrust(false)} centered>
        <Modal.Header closeButton>{t('command.trust.title')}</Modal.Header>
        <Modal.Body>
          {trusted ? t('command.trust.setDistrusted', { name: full }) : t('command.trust.setTrusted', { name: full })}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={() => setConfirmTrust(false)}>
            {t('template.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              setConfirmTrust(false);
              await onTrust(!trusted);
            }}
          >
            {t('template.confirm.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export function CommandDetailPage() {
  const { namespace, name } = useParams({ strict: false }) as { namespace: string; name: string };

  // Remount per command, as templates do: Back/Forward to another command keeps this route mounted.
  return <CommandDetail key={`${namespace}/${name}`} />;
}

function CommandDetail() {
  const t = useT();
  const { locale } = useIntl();
  const navigate = useNavigate();
  const { namespace, name, version } = useParams({ strict: false }) as {
    namespace: string;
    name: string;
    version?: string;
  };
  const q = useCommand(namespace, name);
  const isAdmin = useIsAdmin();
  const m = useCommandMutations(namespace, name);
  const [error, setError] = useState('');

  if (q.isError) {
    return (
      <div className="p-3" id="not-found">
        <h3>{t('command.notFound')}</h3>
        <Link to="/">{t('nav.home')}</Link>
      </div>
    );
  }
  if (!q.data) {
    return <div className="p-3">{t('common.loading')}</div>;
  }

  const { versions, tags } = q.data;
  const selectedVersion = version ? resolveVersion(version, versions, tags) : (versions[0]?.version ?? null);
  const selected = versions.find(v => v.version === selectedVersion);

  if (!selected) {
    return (
      <div className="p-3" id="not-found">
        <h3>{t('command.notFound')}</h3>
        <Link to="/">{t('nav.home')}</Link>
      </div>
    );
  }

  const run = async (p: Promise<unknown>) => {
    try {
      setError('');
      await p;

      return true;
    } catch (e) {
      setError(mutationMessage(e, t('command.noPermission'), { onlyForbidden: true }));

      return false;
    }
  };

  return (
    <ScrollRegion className="template-page__body">
      <title>{`${namespace} / ${name}${version ? `@${version}` : ''}`}</title>
      {error ? (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      ) : null}
      <Header
        // Back/Forward to another command keeps this page: its remove/trust confirmation must not
        // stay open and act on the other command.
        key={`${selected.namespace}/${selected.name}`}
        command={selected}
        // The API's `latest` decides (a 1.x patch published after 2.x is not latest); only a
        // version without the flag falls back to being the newest one.
        isLatest={selected.latest ?? selected.version === versions[0]?.version}
        trusted={isTrusted(versions)}
        isAdmin={isAdmin}
        onTrust={trusted => (isAdmin ? run(m.trust.mutateAsync(trusted)) : Promise.resolve())}
        onRemove={async () => {
          if (await run(m.remove.mutateAsync())) {
            void navigate({ to: '/commands' });
          }
        }}
      />
      <Format command={selected} />
      <h4>{t('command.versions')}</h4>
      <ul data-testid="command-versions">
        {versions.map(c => (
          <li key={c.version}>
            <Link to={`/commands/${c.namespace}/${c.name}/${c.version}`}>
              <span className="version">
                {c.version}
                {c.tag ? ` - ${c.tag}` : ''}
              </span>
            </Link>{' '}
            {relativeTime(c.createTime, locale)}
          </li>
        ))}
      </ul>
    </ScrollRegion>
  );
}
