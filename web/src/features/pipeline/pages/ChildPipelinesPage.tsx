import { ApiError } from '~/api/client';
import { assetUrl } from '~/config/config';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { Icon, type IconName } from '~/components/Icon';
import { ScrollRegion } from '~/components/ScrollRegion';
import { SvgIcon } from '~/components/SvgIcon';
import { useT } from '~/i18n/useT';
import { deletePipeline, startAllChildren } from '../api/mutations';
import { useChildPipelines, useScmContexts } from '../api/queries';
import { ConfirmModal } from '../components/ConfirmModal';
import { usePipeline } from '../components/PipelineContext';
import type { Pipeline } from '../types';
import { branchLabel, isActive, isInactive } from '../utils/pipeline';

// The startAll handler's message when only some children could not be started.
const PARTIAL_START = /^Failed to start some child pipelines/;

const STATE_ICON: Record<NonNullable<Pipeline['state']>, IconName> = {
  ACTIVE: 'circleCheck',
  INACTIVE: 'circleXmark',
  DISABLED: 'ban'
};

export function ChildPipelinesPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { pipeline } = usePipeline();
  const children = useChildPipelines(pipeline.id);
  const { data: contexts = [] } = useScmContexts();
  const [confirm, setConfirm] = useState(false);
  // 'partial': the API answers 403 after starting the children it may start, so starting all
  // again would run those twice. The modal closes instead of offering a retry.
  const [started, setStarted] = useState<'all' | 'partial' | null>(null);
  const [deleting, setDeleting] = useState<Pipeline | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const list = children.data ?? [];
  const activeCount = list.filter(isActive).length;

  const account = (child: Pipeline) => {
    const context = child.scmContext ?? '';

    return {
      name:
        contexts.find(c => c.context === context)?.displayName ??
        context.split(':')[0],
      github: context.startsWith('github')
    };
  };

  return (
    <ScrollRegion>
      <div className="pipeline-page pipeline-children">
        {list.some(isInactive) ? (
          <Alert variant="info" id="inactive-children">
            <Icon name="triangleExclamation" />{' '}
            {t('pipeline.children.inactive')}
          </Alert>
        ) : null}
        <div className="d-flex justify-content-between mb-2">
          <h2 className="h6">{t('pipeline.children.title')}</h2>
          <Button
            size="sm"
            id="start-all-children"
            disabled={activeCount === 0}
            onClick={() => setConfirm(true)}
          >
            {t('pipeline.children.startAll')}
          </Button>
        </div>
        {started === 'all' ? (
          <Alert variant="success">{t('pipeline.children.started')}</Alert>
        ) : started === 'partial' ? (
          <Alert variant="warning" id="start-all-partial">
            {t('pipeline.children.partial')}
          </Alert>
        ) : null}
        {children.isError ? (
          <Alert variant="danger">{t('common.error')}</Alert>
        ) : null}
        <table className="table table-sm table-hover" id="children-table">
          <thead>
            <tr>
              <th>{t('pipeline.children.name')}</th>
              <th>{t('pipeline.children.branch')}</th>
              <th>{t('pipeline.children.account')}</th>
              <th>{t('pipeline.children.state')}</th>
              <th>
                <span className="visually-hidden">
                  {t('pipeline.children.actions')}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map(child => {
              const name = child.scmRepo?.name ?? child.name ?? `#${child.id}`;
              const scm = account(child);

              return (
                <tr key={child.id}>
                  <td>
                    <a
                      href={assetUrl(`/v2/pipelines/${child.id}`)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {name}
                    </a>
                  </td>
                  <td>
                    {child.scmRepo?.url ? (
                      <a
                        href={child.scmRepo.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icon name="codeBranch" /> {branchLabel(child)}
                      </a>
                    ) : (
                      branchLabel(child)
                    )}
                  </td>
                  <td>
                    {scm.github ? <SvgIcon name="github" size={16} /> : null}{' '}
                    {scm.name}
                  </td>
                  <td>
                    {child.state ? (
                      <Icon name={STATE_ICON[child.state]} />
                    ) : null}{' '}
                    {child.state ? t(`pipeline.children.${child.state}`) : ''}
                  </td>
                  <td className="text-end">
                    {isInactive(child) ? (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        aria-label={t('pipeline.children.delete', { name })}
                        title={t('pipeline.children.delete', { name })}
                        onClick={() => {
                          setConfirmName('');
                          setDeleting(child);
                        }}
                      >
                        <Icon name="trash" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {children.data && children.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  {t('pipeline.children.empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {confirm ? (
          <ConfirmModal
            id="start-all-modal"
            title={t('pipeline.children.startAll')}
            confirmLabel={t('pipeline.children.startAll')}
            onClose={() => setConfirm(false)}
            onConfirm={async () => {
              try {
                await startAllChildren(pipeline.id);
                setStarted('all');
              } catch (e) {
                // The API answers 403 both when some children could not be started and when the
                // user cannot start any (no push access to this pipeline); only the first started any.
                if (
                  !(
                    e instanceof ApiError &&
                    e.status === 403 &&
                    PARTIAL_START.test(e.message)
                  )
                ) {
                  throw e;
                }
                setStarted('partial');
              }
              setConfirm(false);
            }}
          >
            {t('pipeline.children.confirm', { count: activeCount })}
          </ConfirmModal>
        ) : null}
        {deleting ? (
          <ConfirmModal
            id="delete-pipeline-modal"
            title={t('pipeline.settings.removeTitle')}
            confirmLabel={t('pipeline.common.delete')}
            pendingLabel={t('pipeline.settings.deleting')}
            variant="danger"
            disabled={confirmName !== (deleting.name ?? '')}
            onClose={() => setDeleting(null)}
            onConfirm={async () => {
              await deletePipeline(deleting.id);
              await queryClient.invalidateQueries({
                queryKey: ['pipeline', pipeline.id, 'children']
              });
              setDeleting(null);
            }}
          >
            <p>{t('pipeline.settings.removeBody')}</p>
            <Form.Group>
              <Form.Label htmlFor="delete-child-input">
                {t('pipeline.settings.removeConfirm')}{' '}
                <strong>{deleting.name}</strong>
              </Form.Label>
              <Form.Control
                id="delete-child-input"
                value={confirmName}
                onChange={e => setConfirmName(e.target.value)}
              />
            </Form.Group>
          </ConfirmModal>
        ) : null}
      </div>
    </ScrollRegion>
  );
}
