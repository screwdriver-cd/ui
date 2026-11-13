import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { Alert, Form } from 'react-bootstrap';
import { Icon } from '~/components/Icon';
import { useT } from '~/i18n/useT';
import {
  deletePipeline,
  syncPipeline,
  updatePipeline
} from '../../api/mutations';
import { keys, useAdmins, useScmContexts } from '../../api/queries';
import { useFormatRelative } from '../../hooks/useFormat';
import type { Pipeline } from '../../types';
import { hasSonarBadge } from '../../utils/pipeline';
import { ConfirmModal } from '../ConfirmModal';
import { CardIconButton, SettingsCard } from './SettingsCard';
import './settings.scss';

type ModalName =
  | 'checkout'
  | 'alias'
  | 'sonar'
  | 'sonarDelete'
  | 'sync-webhooks'
  | 'sync-pullrequests'
  | 'sync-pipeline'
  | 'toggle'
  | 'visibility'
  | 'delete';

/** Ember's getCheckoutUrl: git@<server>:<owner/repo>.git#<branch>. */
export function checkoutUrlOf(pipeline: Pipeline): string {
  const parts = (pipeline.scmUri ?? '').split(':');

  return pipeline.scmUri
    ? `git@${parts[0]}:${pipeline.scmRepo?.name ?? ''}.git#${parts[2] ?? ''}`
    : pipeline.scmRepo?.url ?? '';
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Form.Group className="mb-3">
      <Form.Label htmlFor={id}>{label}</Form.Label>
      <Form.Control
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </Form.Group>
  );
}

export function MainSettings({ pipeline }: { pipeline: Pipeline }) {
  const t = useT();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const relative = useFormatRelative();
  const admins = useAdmins(pipeline.id);
  const contexts = useScmContexts();
  const [modal, setModal] = useState<ModalName | null>(null);
  const [message, setMessage] = useState<{
    variant: 'success' | 'danger';
    text: string;
  } | null>(null);
  const originalUrl = checkoutUrlOf(pipeline);
  const originalDir = pipeline.scmRepo?.rootDir ?? '';
  const sonar = pipeline.badges?.sonar;
  const [checkoutUrl, setCheckoutUrl] = useState(originalUrl);
  const [sourceDir, setSourceDir] = useState(originalDir);
  const [alias, setAlias] = useState(pipeline.settings?.aliasName ?? '');
  const [badgeName, setBadgeName] = useState('');
  const [badgeUri, setBadgeUri] = useState('');
  const [reason, setReason] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const isDisabled = pipeline.state === 'DISABLED';
  const isPublic = pipeline.settings?.public ?? false;
  const sameContext = (admins.data ?? []).filter(
    a => !pipeline.scmContext || a.scmContext === pipeline.scmContext
  );
  const otherContexts = new Map<string, string[]>();

  (admins.data ?? []).forEach(a => {
    if (pipeline.scmContext && a.scmContext !== pipeline.scmContext) {
      otherContexts.set(a.scmContext, [
        ...(otherContexts.get(a.scmContext) ?? []),
        a.username
      ]);
    }
  });

  const refresh = async (saved?: Pipeline) => {
    if (saved?.id === pipeline.id) {
      queryClient.setQueryData(keys.pipeline(pipeline.id), saved);
    } else {
      await queryClient.invalidateQueries({
        queryKey: keys.pipeline(pipeline.id)
      });
    }
  };
  const close = () => setModal(null);
  const open = (name: ModalName) => {
    setCheckoutUrl(originalUrl);
    setSourceDir(originalDir);
    setAlias(pipeline.settings?.aliasName ?? '');
    setBadgeName(sonar?.name || sonar?.defaultName || '');
    setBadgeUri(sonar?.uri || sonar?.defaultUri || '');
    setReason('');
    setConfirmName('');
    setModal(name);
  };
  const save = async (body: Record<string, unknown>) => {
    await refresh(await updatePipeline(pipeline.id, body));
    close();
  };
  const edit = (label: string, name: ModalName, id?: string, off?: boolean) => (
    <CardIconButton
      id={id}
      label={label}
      disabled={off}
      onClick={() => open(name)}
    >
      <Icon name="pen" />
    </CardIconButton>
  );
  const sync = (
    label: string,
    type: 'webhooks' | 'pullrequests' | 'pipeline'
  ) => (
    <CardIconButton label={label} onClick={() => open(`sync-${type}`)}>
      <Icon name="rotate" />
    </CardIconButton>
  );
  const bold = (text: ReactNode) => <b>{text}</b>;
  const syncType = modal?.startsWith('sync-')
    ? (modal.slice(5) as 'webhooks' | 'pullrequests' | 'pipeline')
    : null;
  const syncTitle = {
    webhooks: t('pipeline.settings.syncWebhooksTitle'),
    pullrequests: t('pipeline.settings.syncPrsTitle'),
    pipeline: t('pipeline.settings.syncPipelineTitle')
  };
  const syncBody = {
    webhooks: t('pipeline.settings.syncWebhooksBody'),
    pullrequests: t('pipeline.settings.syncPrsBody'),
    pipeline: t('pipeline.settings.syncPipelineBody')
  };

  return (
    <>
      {message ? (
        <Alert
          variant={message.variant}
          dismissible
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      ) : null}

      <SettingsCard
        id="settings-checkout"
        title={t('pipeline.settings.checkout')}
        description={t('pipeline.settings.checkoutHelp')}
        config={
          <>
            <div id="pipeline-settings-main-checkout-url">
              {t('pipeline.settings.checkoutUrl')} {bold(originalUrl)}
            </div>
            <div id="pipeline-settings-main-checkout-directory">
              {t('pipeline.settings.sourceDir')} {bold(originalDir)}
            </div>
          </>
        }
        action={edit(
          t('pipeline.settings.editPipeline'),
          'checkout',
          'edit-pipeline-configuration',
          Boolean(pipeline.configPipelineId)
        )}
      />

      <SettingsCard
        id="settings-alias"
        title={t('pipeline.settings.aliasTitle')}
        description={t('pipeline.settings.aliasHelp')}
        config={
          <div id="pipeline-settings-main-alias">
            {t('pipeline.settings.aliasLabel')}{' '}
            {bold(pipeline.settings?.aliasName)}
          </div>
        }
        action={edit(t('pipeline.settings.editAlias'), 'alias')}
      />

      <SettingsCard
        id="settings-sonar"
        title={t('pipeline.settings.sonar')}
        description={t('pipeline.settings.sonarHelp')}
        config={
          <>
            <div id="pipeline-settings-main-sonar-badge-name">
              {t('pipeline.settings.badgeName')}{' '}
              {bold(sonar?.name || sonar?.defaultName)}
            </div>
            <div id="pipeline-settings-main-sonar-badge-uri">
              {t('pipeline.settings.badgeUri')}{' '}
              {bold(sonar?.uri || sonar?.defaultUri)}
            </div>
          </>
        }
        action={
          <>
            {edit(t('pipeline.settings.editSonar'), 'sonar')}
            {hasSonarBadge(pipeline) ? (
              <CardIconButton
                variant="danger-outline"
                label={t('pipeline.settings.deleteSonar')}
                onClick={() => open('sonarDelete')}
              >
                <Icon name="trash" />
              </CardIconButton>
            ) : null}
          </>
        }
      />

      <SettingsCard
        id="settings-sync-webhooks"
        title={t('pipeline.settings.syncWebhooksCard')}
        description={t('pipeline.settings.syncWebhooksHelp')}
        action={sync(t('pipeline.settings.syncWebhooks'), 'webhooks')}
      />
      <SettingsCard
        id="settings-sync-prs"
        title={t('pipeline.settings.syncPrsCard')}
        description={t('pipeline.settings.syncPrsHelp')}
        action={sync(t('pipeline.settings.syncPrs'), 'pullrequests')}
      />
      <SettingsCard
        id="settings-sync-pipeline"
        title={t('pipeline.settings.syncPipelineCard')}
        description={t('pipeline.settings.syncPipelineHelp')}
        action={sync(t('pipeline.settings.syncPipeline'), 'pipeline')}
      />

      <SettingsCard
        id="settings-toggle-pipeline"
        title={
          isDisabled
            ? t('pipeline.settings.enablePipeline')
            : t('pipeline.settings.disablePipeline')
        }
        description={
          isDisabled
            ? t('pipeline.settings.enablePipelineHelp')
            : t('pipeline.settings.disablePipelineHelp')
        }
        config={
          <>
            <div id="pipeline-settings-main-pipeline-state">
              {t('pipeline.settings.state')} {bold(pipeline.state)}
            </div>
            {pipeline.stateChanger ? (
              <div id="pipeline-settings-main-state-changer">
                {t(
                  isDisabled
                    ? 'pipeline.settings.disabledBy'
                    : 'pipeline.settings.enabledBy'
                )}{' '}
                {bold(pipeline.stateChanger)}{' '}
                {pipeline.stateChangeTime ? (
                  <i>{relative(pipeline.stateChangeTime)}</i>
                ) : null}
              </div>
            ) : null}
            {pipeline.stateChanger && pipeline.stateChangeMessage ? (
              <div id="pipeline-settings-main-state-change-message">
                {t('pipeline.settings.reason')} {pipeline.stateChangeMessage}
              </div>
            ) : null}
          </>
        }
        action={
          <CardIconButton
            label={
              isDisabled
                ? t('pipeline.settings.enablePipelineAction')
                : t('pipeline.settings.disablePipelineAction')
            }
            onClick={() => open('toggle')}
          >
            <Icon name={isDisabled ? 'play' : 'ban'} />
          </CardIconButton>
        }
      />

      <SettingsCard
        id="settings-admins"
        title={t('pipeline.settings.admins')}
        description={
          <span className="settings-help-line">
            {t('pipeline.settings.adminsHelp')}
            <span
              role="img"
              className="settings-help"
              title={t('pipeline.settings.adminsTip')}
              aria-label={t('pipeline.settings.adminsTip')}
            >
              <Icon name="circleQuestion" />
            </span>
          </span>
        }
      >
        <div className="settings-admin-list" id="admins-list">
          {sameContext
            .map(a => a.username)
            .sort()
            .join(', ')}
        </div>
        {[...otherContexts].map(([context, users]) => {
          const name =
            contexts.data?.find(c => c.context === context)?.displayName ??
            context;

          return (
            <div key={context}>
              <span className="settings-help-line">
                {t('pipeline.settings.adminsFrom', { name })}
                <span
                  role="img"
                  className="settings-help"
                  title={t('pipeline.settings.adminsFromTip', { name })}
                  aria-label={t('pipeline.settings.adminsFromTip', { name })}
                >
                  <Icon name="circleQuestion" />
                </span>
              </span>
              <div className="settings-admin-list">
                {users.sort().join(', ')}
              </div>
            </div>
          );
        })}
      </SettingsCard>

      {pipeline.scmRepo?.private ? (
        <SettingsCard
          id="settings-visibility"
          danger
          title={t('pipeline.settings.visibility')}
          description={t('pipeline.settings.visibilityHelp')}
          config={
            <div id="pipeline-settings-main-visibility">
              {t('pipeline.settings.visibilityLabel')}{' '}
              {bold(
                isPublic
                  ? t('pipeline.settings.public')
                  : t('pipeline.settings.private')
              )}
            </div>
          }
          action={
            <CardIconButton
              variant="danger"
              label={t('pipeline.settings.changeVisibility')}
              onClick={() => open('visibility')}
            >
              <Icon name="gear" />
            </CardIconButton>
          }
        />
      ) : null}

      <SettingsCard
        id="settings-delete"
        danger
        title={t('pipeline.settings.deleteTitle')}
        description={t('pipeline.settings.deleteHelp')}
        action={
          <CardIconButton
            id="remove-pipeline"
            variant="danger"
            label={t('pipeline.settings.remove')}
            onClick={() => open('delete')}
          >
            <Icon name="trash" />
          </CardIconButton>
        }
      />

      {modal === 'checkout' ? (
        <ConfirmModal
          id="edit-pipeline-modal"
          title={t('pipeline.settings.editPipelineTitle')}
          confirmLabel={t('pipeline.settings.update')}
          pendingLabel={t('pipeline.settings.updating')}
          disabled={
            !checkoutUrl.trim() ||
            (checkoutUrl === originalUrl && sourceDir === originalDir)
          }
          onClose={close}
          onConfirm={() => save({ checkoutUrl, rootDir: sourceDir })}
        >
          <Field
            id="checkout-url-input"
            label={t('pipeline.settings.checkoutUrlField')}
            value={checkoutUrl}
            onChange={setCheckoutUrl}
            placeholder={t('pipeline.settings.checkoutUrlPlaceholder')}
          />
          <Field
            id="source-directory-input"
            label={t('pipeline.settings.sourceDirField')}
            value={sourceDir}
            onChange={setSourceDir}
            placeholder={t('pipeline.settings.sourceDirPlaceholder')}
          />
        </ConfirmModal>
      ) : null}

      {modal === 'alias' ? (
        <ConfirmModal
          id="edit-pipeline-alias-modal"
          title={t('pipeline.settings.editAlias')}
          confirmLabel={t('pipeline.settings.update')}
          pendingLabel={t('pipeline.settings.updating')}
          disabled={alias === (pipeline.settings?.aliasName ?? '')}
          onClose={close}
          onConfirm={() =>
            save({
              settings: { aliasName: alias }
            })
          }
        >
          <Field
            id="setting-alias"
            label={t('pipeline.settings.aliasField')}
            value={alias}
            onChange={setAlias}
            placeholder={t('pipeline.settings.aliasPlaceholder')}
          />
        </ConfirmModal>
      ) : null}

      {modal === 'sonar' ? (
        <ConfirmModal
          id="edit-sonar-badge-modal"
          title={t('pipeline.settings.editSonarTitle')}
          confirmLabel={t('pipeline.settings.update')}
          pendingLabel={t('pipeline.settings.updating')}
          disabled={
            !badgeName ||
            !badgeUri ||
            (badgeName === sonar?.name && badgeUri === sonar?.uri)
          }
          onClose={close}
          onConfirm={() =>
            save({
              badges: {
                sonar: {
                  name: badgeName,
                  uri: badgeUri,
                  defaultName: badgeName,
                  defaultUri: badgeUri
                }
              }
            })
          }
        >
          <Field
            id="sonar-badge-name-input"
            label={t('pipeline.settings.badgeNameField')}
            value={badgeName}
            onChange={setBadgeName}
            placeholder={t('pipeline.settings.badgeNamePlaceholder')}
          />
          <Field
            id="sonar-badge-uri-input"
            label={t('pipeline.settings.badgeUriField')}
            value={badgeUri}
            onChange={setBadgeUri}
            placeholder={t('pipeline.settings.badgeUriPlaceholder')}
          />
        </ConfirmModal>
      ) : null}

      {modal === 'sonarDelete' ? (
        <ConfirmModal
          id="delete-sonar-badge-modal"
          title={t('pipeline.settings.deleteSonarTitle')}
          confirmLabel={t('pipeline.common.delete')}
          variant="danger"
          onClose={close}
          onConfirm={() => save({ badges: { sonar: {} } })}
        >
          {t('pipeline.settings.deleteSonarBody')}
        </ConfirmModal>
      ) : null}

      {syncType ? (
        <ConfirmModal
          id="pipeline-settings-sync-modal"
          title={syncTitle[syncType]}
          confirmLabel={t('pipeline.settings.syncAction')}
          pendingLabel={t('pipeline.settings.syncing')}
          onClose={close}
          onConfirm={async () => {
            await syncPipeline(pipeline.id, syncType);
            if (syncType === 'pipeline') {
              await refresh();
            }
            setMessage({
              variant: 'success',
              text: t('pipeline.settings.synced')
            });
            close();
          }}
        >
          {syncBody[syncType]}
        </ConfirmModal>
      ) : null}

      {modal === 'toggle' ? (
        <ConfirmModal
          id="toggle-pipeline-modal"
          title={t(
            isDisabled
              ? 'pipeline.settings.enablePipelineTitle'
              : 'pipeline.settings.disablePipelineTitle',
            { name: pipeline.name ?? String(pipeline.id) }
          )}
          confirmLabel={
            isDisabled ? t('pipeline.jobs.enable') : t('pipeline.jobs.disable')
          }
          pendingLabel={
            isDisabled
              ? t('pipeline.settings.enabling')
              : t('pipeline.settings.disabling')
          }
          variant="danger"
          onClose={close}
          onConfirm={() =>
            save({
              state: isDisabled ? 'ACTIVE' : 'DISABLED',
              ...(reason ? { stateChangeMessage: reason } : {})
            })
          }
        >
          <p id="toggle-pipeline-message">
            {isDisabled
              ? t('pipeline.settings.enablePipelineBody')
              : t('pipeline.settings.disablePipelineBody')}
          </p>
          <Form.Group>
            <Form.Label htmlFor="toggle-pipeline-reason">
              {t('pipeline.jobs.reason')}
            </Form.Label>
            <Form.Control
              id="toggle-pipeline-reason"
              value={reason}
              placeholder={t('pipeline.settings.reasonPlaceholder')}
              onChange={e => setReason(e.target.value)}
            />
          </Form.Group>
        </ConfirmModal>
      ) : null}

      {modal === 'visibility' ? (
        <ConfirmModal
          id="change-visibility-modal"
          title={t('pipeline.settings.visibilityTitle')}
          confirmLabel={t('pipeline.common.yes')}
          onClose={close}
          onConfirm={() => save({ settings: { public: !isPublic } })}
        >
          {isPublic
            ? t('pipeline.settings.visibilityToPrivate')
            : t('pipeline.settings.visibilityToPublic')}
        </ConfirmModal>
      ) : null}

      {modal === 'delete' ? (
        <ConfirmModal
          id="delete-pipeline-modal"
          title={t('pipeline.settings.removeTitle')}
          confirmLabel={t('pipeline.common.delete')}
          pendingLabel={t('pipeline.settings.deleting')}
          variant="danger"
          disabled={confirmName !== (pipeline.name ?? '')}
          onClose={close}
          onConfirm={async () => {
            await deletePipeline(pipeline.id);
            navigate({ to: '/' as never });
          }}
        >
          <p>{t('pipeline.settings.removeBody')}</p>
          <Form.Group>
            <Form.Label htmlFor="delete-repository-input">
              {t('pipeline.settings.removeConfirm')} {bold(pipeline.name)}
            </Form.Label>
            <Form.Control
              id="delete-repository-input"
              value={confirmName}
              onChange={e => setConfirmName(e.target.value)}
            />
          </Form.Group>
        </ConfirmModal>
      ) : null}
    </>
  );
}
