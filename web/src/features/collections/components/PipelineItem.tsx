import { Icon } from '~/components/Icon';
import { Link } from '@tanstack/react-router';
import { useLocale } from '~/i18n/I18nProvider';
import { useT } from '~/i18n/useT';
import { formatMetrics } from '../lib/metrics';
import { usePipelineMetrics } from '../lib/api';
import { branchLabel, formatDate } from '../lib/format';
import { pipelineEventsPath } from '../lib/links';
import { useInView } from '../lib/useInView';
import type { PipelineSummary } from '../lib/types';
import { EventsThumbnail } from './EventsThumbnail';
import { StatusGlyph } from './StatusGlyph';
import styles from '../collections.module.scss';

export interface PipelineItemProps {
  pipeline: PipelineSummary;
  canRemove: boolean;
  organizing: boolean;
  /** Metrics are always loaded (needed by the current sort). */
  eager: boolean;
  selected: boolean;
  collectionName: string;
  hasAlias?: boolean;
  onToggle: (id: number) => void;
  onRemove: (pipeline: PipelineSummary) => void;
}

function useMetrics(pipeline: PipelineSummary, eager: boolean) {
  const [ref, seen] = useInView();
  const query = usePipelineMetrics(pipeline.id, seen || eager);
  const formatted = query.data ? formatMetrics(query.data) : null;

  return { ref, query, formatted };
}

function CommitInfo({
  formatted,
  failed
}: {
  formatted: ReturnType<typeof formatMetrics> | null;
  failed: boolean;
}) {
  const t = useT();
  const last = formatted?.lastEventInfo;

  if (failed) {
    return <>{t('collections.pipeline.loadError')}</>;
  }
  if (!last) {
    return <>{t('collections.pipeline.loading')}</>;
  }
  if (last.empty) {
    return <>{t('collections.pipeline.noEvents')}</>;
  }

  return <>{last.commitMessage}</>;
}

export function PipelineCard({
  pipeline,
  canRemove,
  organizing,
  eager,
  selected,
  collectionName,
  onToggle,
  onRemove
}: PipelineItemProps) {
  const t = useT();
  const { locale } = useLocale();
  const { ref, query, formatted } = useMetrics(pipeline, eager);
  const last = formatted?.lastEventInfo;
  const name = pipeline.scmRepo.name;

  return (
    <div className={styles.cardWrap} ref={ref}>
      {organizing ? (
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={selected}
            aria-label={t('collections.pipeline.select', { name })}
            onChange={() => onToggle(pipeline.id)}
          />
          <span className={styles.checkmark} />
        </label>
      ) : null}
      <article
        className={`${styles.card} ${
          organizing ? styles.selecting : ''
        }`.trim()}
        data-testid="pipeline-card"
      >
        {canRemove && !organizing ? (
          <button
            type="button"
            className={styles.remove}
            title={t('collections.pipeline.remove', {
              name,
              collection: collectionName
            })}
            aria-label={t('collections.pipeline.remove', {
              name,
              collection: collectionName
            })}
            onClick={() => onRemove(pipeline)}
          >
            <Icon name="xmark" />
          </button>
        ) : null}
        <div className={styles.branchInfo}>
          <Link to={pipelineEventsPath(pipeline.id)} title={name}>
            {name}
          </Link>
          <div title={branchLabel(pipeline)}>
            <Icon name="codeBranch" /> {branchLabel(pipeline)}
          </div>
        </div>
        <div className={styles.commitInfo}>
          <div className={styles.commitStatus}>
            {last && !last.empty ? (
              <StatusGlyph glyph={last.glyph} tone={last.tone} />
            ) : null}{' '}
            {last?.sha ? (
              last.commitUrl ? (
                <a href={last.commitUrl}>{last.sha}</a>
              ) : (
                <span>{last.sha}</span>
              )
            ) : null}
          </div>
          <p
            className={styles.commitMessage}
            title={last?.commitMessage ?? undefined}
          >
            <CommitInfo formatted={formatted} failed={query.isError} />
          </p>
        </div>
        <div className={styles.timeMetrics}>
          <div>
            <span className={styles.badgeLabel}>
              {t('collections.pipeline.lastRun')}
            </span>
            <span className={styles.badgeInfo}>
              {formatDate(last?.createTime ?? null, locale) ?? '--/--/----'}
            </span>
          </div>
          <div>
            <span className={styles.badgeLabel}>
              {t('collections.pipeline.duration')}
            </span>
            <span className={styles.badgeInfo}>
              {last?.durationText ?? '--'}
            </span>
          </div>
        </div>
        <div className={styles.thumbWrap}>
          {formatted ? (
            <EventsThumbnail
              events={formatted.eventsInfo}
              pipelineId={pipeline.id}
            />
          ) : (
            <div className={styles.thumbPlaceholder} />
          )}
        </div>
      </article>
    </div>
  );
}

export function PipelineRow({
  pipeline,
  canRemove,
  organizing,
  eager,
  selected,
  collectionName,
  hasAlias,
  onToggle,
  onRemove
}: PipelineItemProps) {
  const t = useT();
  const { locale } = useLocale();
  const { ref, query, formatted } = useMetrics(pipeline, eager);
  const last = formatted?.lastEventInfo;
  const name = pipeline.scmRepo.name;

  return (
    <tr ref={ref} data-testid="pipeline-row">
      <td className={styles.colChoose}>
        {organizing ? (
          <input
            type="checkbox"
            checked={selected}
            aria-label={t('collections.pipeline.select', { name })}
            onChange={() => onToggle(pipeline.id)}
          />
        ) : null}
      </td>
      <td className={styles.nameCell}>
        {hasAlias ? (
          <p className={styles.alias}>{pipeline.settings?.aliasName}</p>
        ) : null}
        <p>
          <Link
            to={pipelineEventsPath(pipeline.id)}
            title={name}
            className={styles.rowName}
          >
            {name}
          </Link>
        </p>
      </td>
      <td className={styles.branchCell} title={branchLabel(pipeline)}>
        <Icon name="codeBranch" /> {branchLabel(pipeline)}
      </td>
      <td className={styles.numeric}>
        {formatDate(last?.createTime ?? null, locale) ?? '--/--/----'}
      </td>
      <td className={styles.numeric}>{last?.durationText ?? '--'}</td>
      <td>
        {last && !last.empty ? (
          <StatusGlyph glyph={last.glyph} tone={last.tone} />
        ) : null}{' '}
        {query.isError ? (
          t('collections.pipeline.loadError')
        ) : !last ? (
          t('collections.pipeline.loading')
        ) : last.sha ? (
          last.commitUrl ? (
            <a href={last.commitUrl}>{last.sha}</a>
          ) : (
            last.sha
          )
        ) : (
          t('collections.pipeline.noEvents')
        )}
      </td>
      <td>
        {formatted ? (
          <EventsThumbnail
            events={formatted.eventsInfo}
            pipelineId={pipeline.id}
          />
        ) : null}
      </td>
      <td className={styles.colRemove}>
        {canRemove && !organizing ? (
          <button
            type="button"
            className={styles.rowRemove}
            title={t('collections.pipeline.remove', {
              name,
              collection: collectionName
            })}
            aria-label={t('collections.pipeline.remove', {
              name,
              collection: collectionName
            })}
            onClick={() => onRemove(pipeline)}
          >
            <Icon name="xmark" />
          </button>
        ) : null}
      </td>
    </tr>
  );
}
