import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useT } from '~/i18n/useT';
import { useStartGuard } from '~/features/pipeline/hooks/useStartGuard';
import { artifactsUrl, useCoverageInfo, useTemplateDetails } from './api';
import type { Build, BuildEvent, Job, PipelineSummary } from './types';
import { formatDuration } from '~/i18n/duration';
import { buildContainer, isActiveBuild, msBetween, resolveCoverage, truncatedSha } from './utils';

interface Props {
  build: Build;
  job: Job;
  event: BuildEvent | undefined;
  pipeline: PipelineSummary | undefined;
  pipelineId: string;
  isAuthenticated: boolean;
  /** Restart is disabled when the job (or the PR's parent job) is disabled. */
  jobDisabled: boolean;
  utc: boolean;
  onStop: () => void;
  onRestart: () => void;
  busy: boolean;
}

export function BuildBanner({
  build,
  job,
  event,
  pipeline,
  pipelineId,
  isAuthenticated,
  jobDisabled,
  utc,
  onStop,
  onRestart,
  busy
}: Props) {
  const t = useT();
  const { locale, formatDate } = useIntl();
  // The action is fixed when the dialog opens: if polling sees the build finish meanwhile, a "yes"
  // to Stop must not turn into a Restart, so the Stop dialog just closes instead.
  const [confirm, setConfirm] = useState<'stop' | 'restart' | null>(null);
  const canRestart = useStartGuard(pipeline);
  const template = useTemplateDetails(build.templateId);
  const active = isActiveBuild(build.status, build.endTime);
  const prUrl = event?.pr?.url;
  const prNumber = prUrl ? prUrl.split('/').pop() : undefined;
  const dur = (a?: string, b?: string) => formatDuration(msBetween(a, b), locale);
  const base = artifactsUrl(build.id).replace(/\/$/, '');
  const hasCoverageStep = build.steps.some(s => /^sd-teardown-screwdriver-coverage/.test(s.name));
  const remoteCoverage = useCoverageInfo(build, job, pipeline);
  const { coverage, coverageUrl, results, resultsUrl } = resolveCoverage(
    remoteCoverage.data,
    build.meta?.tests,
    base
  );
  const action = active ? 'stop' : 'restart';
  const confirming = confirm === 'stop' && !active ? null : confirm;
  const disabled = busy || (action === 'restart' && (jobDisabled || ['INACTIVE', 'DISABLED'].includes(pipeline?.state ?? '')));
  const created = build.createTime
    ? formatDate(build.createTime, {
        dateStyle: 'medium',
        timeStyle: 'short',
        ...(utc ? { timeZone: 'UTC' } : {})
      })
    : t('build.na');
  const eventLink = prUrl ? `/v2/pipelines/${pipelineId}/pulls/${event?.id}` : `/v2/pipelines/${pipelineId}/events/${event?.id}`;

  return (
    <>
      <ul className={`build-banner build-${build.status}`} data-testid="build-banner" aria-label={t('build.banner.label')}>
        <li className="job-name">
          <Link className="banner-value" to={eventLink} search={prUrl ? undefined : ({ jobId: job.id } as never)}>
            {job.name}
          </Link>
          <span className="banner-label">{t('build.banner.job')}</span>
        </li>
        <li className="commit">
          <a className="banner-value sha commit-sha" href={event?.commit?.url}>
            #{truncatedSha(event?.sha ?? build.sha)}
          </a>
          <span className="banner-label">{t('build.banner.commit')}</span>
        </li>
        {prUrl ? (
          <li className="pr">
            <a className="banner-value" href={prUrl} target="_blank" rel="noopener noreferrer">
              {t('build.banner.prTitle', { number: prNumber ?? '', title: event?.pr?.title ?? '' })}
            </a>
            <span className="banner-label">{t('build.banner.pr')}</span>
          </li>
        ) : null}
        <li className="duration">
          <details>
            <summary
              className="banner-value"
              title={t('build.banner.durationTitle', {
                total: dur(build.createTime, build.endTime),
                blocked: dur(build.createTime, build.stats?.imagePullStartTime),
                pull: dur(build.stats?.imagePullStartTime, build.startTime),
                build: dur(build.startTime, build.endTime)
              })}
            >
              {dur(build.createTime, build.endTime)}
            </summary>
            <div>{t('build.banner.blocked', { value: dur(build.createTime, build.stats?.imagePullStartTime) })}</div>
            <div>{t('build.banner.pulling', { value: dur(build.stats?.imagePullStartTime, build.startTime) })}</div>
            <div>{t('build.banner.inBuild', { value: dur(build.startTime, build.endTime) })}</div>
          </details>
          <Link to={`/pipelines/${pipelineId}/metrics`} search={{ jobId: job.id } as never}>
            {t('build.banner.metrics')}
          </Link>
          <span className="banner-label">{t('build.banner.duration')}</span>
        </li>
        <li className="created">
          <span className="banner-value" title={build.createTime}>
            {created}
          </span>
          <span className="banner-label">{t('build.banner.created')}</span>
        </li>
        <li className="user">
          <span className="banner-value">
            {event?.commit?.author?.url ? (
              <a href={event.commit.author.url}>{event.commit.author.name}</a>
            ) : (
              event?.commit?.author?.name ?? event?.causeMessage
            )}
          </span>
          <span className="banner-label">{t('build.banner.committer')}</span>
        </li>
        {hasCoverageStep ? (
          <>
            <li className="coverage">
              <a className="banner-value" href={coverageUrl} target="_blank" rel="noopener noreferrer">
                {coverage}
              </a>
              <span className="banner-label">{t('build.banner.coverage')}</span>
            </li>
            <li className="tests">
              <a className="banner-value" href={resultsUrl} target="_blank" rel="noopener noreferrer">
                {results}
              </a>
              <span className="banner-label">{t('build.banner.tests')}</span>
            </li>
          </>
        ) : null}
        <li className="docker-container">
          <span className="banner-value">{buildContainer(build)}</span>
          <span className="banner-label">{t('build.banner.container')}</span>
        </li>
        {template.data ? (
          <li className="template-info">
            <Link
              className="banner-value"
              to={`/templates/job/${template.data.namespace}/${template.data.name}/${template.data.version}`}
            >
              {template.data.name}:{template.data.version}
            </Link>
            <span className="banner-label">{t('build.banner.template')}</span>
          </li>
        ) : null}
        {isAuthenticated ? (
          <li className="call-to-action">
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={disabled}
              // Restarting needs the pipeline's SCM login; stopping does not (Ember build-banner).
              onClick={() => {
                if (active) {
                  setConfirm('stop');
                } else if (canRestart()) {
                  setConfirm('restart');
                }
              }}
            >
              {active ? t('build.action.stop') : t('build.action.restart')}
            </button>
          </li>
        ) : null}
      </ul>
      <Modal show={confirming !== null} onHide={() => setConfirm(null)} centered>
        <Modal.Body>
          <h3>{confirming === 'stop' ? t('build.confirm.stop') : t('build.confirm.restart')}</h3>
          {confirming === 'restart' ? (
            <p>
              {t('build.confirm.job')} <code>{job.name}</code>
              <br />
              {t('build.confirm.commit')} <code>{event?.commit?.message}</code> #{truncatedSha(event?.sha ?? build.sha)}
            </p>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-primary build-action-yes"
            onClick={() => {
              setConfirm(null);
              if (confirming === 'stop') {
                onStop();
              } else if (confirming === 'restart') {
                onRestart();
              }
            }}
          >
            {t('build.confirm.yes')}
          </button>
          <button type="button" className="btn btn-secondary build-action-no" onClick={() => setConfirm(null)}>
            {t('build.confirm.no')}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
