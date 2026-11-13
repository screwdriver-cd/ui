import { TrustedIcon } from '~/components/TrustedIcon';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useT } from '~/i18n/useT';
import { usePipelineScmUrl } from './api';
import type { TemplateItem } from './types';

interface Props {
  template: TemplateItem;
  kind: 'job' | 'pipeline';
  /** The template's trust (from its latest version), not the selected version's flag. */
  trusted: boolean;
  isAdmin: boolean;
  /** Toggle the trusted flag. Resolves when the API call is done. */
  onUpdateTrust: (trusted: boolean) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}

export function TemplateHeader({
  template,
  kind,
  trusted,
  isAdmin,
  onUpdateTrust,
  onRemove
}: Props) {
  const t = useT();
  const scm = usePipelineScmUrl(template.pipelineId);
  const scmUrl = scm.data ?? null;
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmTrust, setConfirmTrust] = useState(false);
  const [busy, setBusy] = useState(false);
  const usage =
    kind === 'pipeline'
      ? `template: ${template.fullName}@${template.version}`
      : `jobs:\n  main:\n    template: ${template.fullName}@${template.version}`;

  return (
    <div className="template-header">
      <div className="header d-flex justify-content-between align-items-start">
        <h1>
          <span
            className={`trusted${trusted ? '' : ' distrusted'}`}
            role="img"
            aria-label={
              trusted ? t('template.trusted') : t('template.notTrusted')
            }
            title={trusted ? t('template.trusted') : t('template.notTrusted')}
          >
            <TrustedIcon trusted={trusted} />
          </span>
          {template.pipelineId ? (
            <Link
              to={`/pipelines/${template.pipelineId}`}
              title={t('template.goToPipeline')}
            >
              {template.fullName}
            </Link>
          ) : (
            template.fullName
          )}
          {scmUrl ? (
            <a href={scmUrl} title={t('template.sourceCode')}>
              {t('template.sourceCode')}
            </a>
          ) : (
            <span className="text-muted fs-6" title={t('template.noPipeline')}>
              {t('template.sourceCode')}
            </span>
          )}
          {isAdmin || scmUrl ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => setConfirmRemove(true)}
            >
              {t('template.delete')}
            </button>
          ) : (
            <span
              title={t('template.cannotDelete')}
              className="text-muted fs-6"
            >
              {t('template.delete')}
            </span>
          )}
        </h1>
        {isAdmin ? (
          <label className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              checked={trusted}
              onChange={() => setConfirmTrust(true)}
            />{' '}
            <span className="form-check-label">
              {t('template.trustedToggle')}
            </span>
          </label>
        ) : null}
      </div>

      <div className="template-stats">
        <h2 className="template-version">{template.version}</h2>
        {kind === 'job' ? (
          <div className="template-metrics">
            {t('template.usage.metrics', {
              jobs: String(template.metrics?.jobs.count ?? ''),
              builds: String(template.metrics?.builds.count ?? '')
            })}
          </div>
        ) : null}
      </div>
      <p>{template.description}</p>
      <div className="template-details--item" id="template-namespace">
        <span className="template-details--label">
          {t('template.namespace')}
        </span>
        <span>{template.namespace}</span>
      </div>
      <div className="template-details--item" id="template-name">
        <span className="template-details--label">{t('template.name')}</span>
        <span>{template.name}</span>
      </div>
      <div className="template-details--item" id="template-maintainer">
        <span className="template-details--label">
          {t('template.releasedBy')}
        </span>
        <a href={`mailto:${template.maintainer}`}>{template.maintainer}</a>
      </div>
      {template.compatibilities?.clouds?.length ? (
        <div className="template-details--item">
          <span className="template-details--label">
            {t('template.clouds')}
          </span>
          <span>{template.compatibilities.clouds.join(' ')}</span>
        </div>
      ) : null}
      {template.compatibilities?.architectures?.length ? (
        <div className="template-details--item">
          <span className="template-details--label">
            {t('template.arches')}
          </span>
          <span>{template.compatibilities.architectures.join(' ')}</span>
        </div>
      ) : null}
      {template.labels?.length ? (
        <div className="template-details--item" id="template-tags">
          <span className="template-details--label">
            {t('template.labels')}
          </span>
          <span>
            {template.labels.map(l => (
              <span key={l} className="template-label">
                {l}
              </span>
            ))}
          </span>
        </div>
      ) : null}
      <h4 className="mt-2">{t('template.usage.title')}</h4>
      <pre>{usage}</pre>

      <Modal
        show={confirmRemove}
        onHide={() => setConfirmRemove(false)}
        centered
      >
        <Modal.Header closeButton>
          <h4>{t('template.confirm.title')}</h4>
        </Modal.Header>
        <Modal.Body>
          {t('template.confirm.removeAll', { name: template.fullName })}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setConfirmRemove(false)}
          >
            {t('template.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onRemove();
              } finally {
                setBusy(false);
                setConfirmRemove(false);
              }
            }}
          >
            {t('template.confirm.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
      <Modal show={confirmTrust} onHide={() => setConfirmTrust(false)} centered>
        <Modal.Header closeButton>{t('template.trust.title')}</Modal.Header>
        <Modal.Body>
          {trusted
            ? t('template.trust.setDistrusted', { name: template.fullName })
            : t('template.trust.setTrusted', { name: template.fullName })}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setConfirmTrust(false)}
          >
            {t('template.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              setConfirmTrust(false);
              await onUpdateTrust(!trusted);
            }}
          >
            {t('template.confirm.confirm')}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
