import { Icon } from '~/components/Icon';
import { SvgIcon } from '~/components/SvgIcon';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useT } from '~/i18n/useT';
import { AnsiLines } from './ansi';
import type { LogLine } from './types';
import { formatDuration } from '~/i18n/duration';

const TIME_FORMATS = ['datetime', 'datetimeUTC', 'elapsedBuild', 'elapsedStep'] as const;
export type TimeFormat = (typeof TIME_FORMATS)[number];
const TIME_KEY = 'screwdriver.logs.timeFormat';

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage may be unavailable
  }
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatLogTime(
  format: TimeFormat,
  t: number | undefined,
  buildStart: number | undefined,
  stepStart: number | undefined,
  locale: string
): string {
  if (t === undefined) {
    return '';
  }
  const d = new Date(t);

  switch (format) {
    case 'datetime':
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    case 'datetimeUTC':
      return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    case 'elapsedBuild':
      return formatDuration(Math.max(0, t - (buildStart ?? t)), locale, 3);
    default:
      return formatDuration(Math.max(0, t - (stepStart ?? t)), locale, 3);
  }
}

interface Props {
  lines: LogLine[];
  /** Placeholder shown instead of a log (no step selected, loading...). */
  message?: string;
  buildStartTime?: string;
  stepStartTime?: string;
  stepName: string | null;
  inProgress: boolean;
  /** Preferred time format from the user's settings (`UTC` wins over the stored one). */
  preferUtc?: boolean;
  /** Earlier lines exist but are not loaded yet (tail-first loading). */
  hasEarlier?: boolean;
  loadingEarlier?: boolean;
  onLoadEarlier?: () => void;
  /** Resolves with the complete log; used by Top and Download. */
  onLoadAll?: () => Promise<LogLine[]>;
}

export function LogPane({
  lines,
  message,
  buildStartTime,
  stepStartTime,
  stepName,
  inProgress,
  preferUtc,
  hasEarlier = false,
  loadingEarlier = false,
  onLoadEarlier,
  onLoadAll
}: Props) {
  const t = useT();
  const { locale } = useIntl();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoscroll, setAutoscroll] = useState(true);
  const [wrap, setWrap] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    const stored = readStored(TIME_KEY);

    return TIME_FORMATS.includes(stored as TimeFormat) ? (stored as TimeFormat) : 'datetime';
  });
  const [dlTimestamp, setDlTimestamp] = useState(() => readStored('screwdriver.logs.download.timestampEnabled') === 'true');
  const [dlFormat, setDlFormat] = useState(() => readStored('screwdriver.logs.download.timestampFormat') ?? 'full-time');
  const [dlUtc, setDlUtc] = useState(() => readStored('screwdriver.logs.download.timezone') === 'UTC');
  const [dlError, setDlError] = useState(false);
  const effectiveFormat: TimeFormat = preferUtc && timeFormat === 'datetime' ? 'datetimeUTC' : timeFormat;

  const rows: LogLine[] = useMemo(() => (message ? [{ m: message }] : lines), [message, lines]);
  const [ansi] = useState(() => new AnsiLines());
  const buildStart = buildStartTime ? new Date(buildStartTime).getTime() : undefined;
  const stepStart = stepStartTime ? new Date(stepStartTime).getTime() : undefined;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 20,
    // Stable keys keep measured heights attached to their line when earlier lines are prepended.
    getItemKey: index => (message ? index : (rows[index]?.n ?? `i${index}`)),
    overscan: 30,
    initialRect: { width: 800, height: 600 }
  });

  // New step: follow the tail again.
  useEffect(() => setAutoscroll(true), [stepName]);

  // Earlier lines were prepended: keep the line the reader was on in place.
  const topRequested = useRef(false);
  const prevFirst = useRef<{ n: number | undefined; length: number }>({ n: undefined, length: 0 });

  useLayoutEffect(() => {
    const n = message ? undefined : rows[0]?.n;
    const prev = prevFirst.current;

    prevFirst.current = { n, length: rows.length };
    if (topRequested.current) {
      virtualizer.scrollToIndex(0);
      topRequested.current = hasEarlier;
    } else if (!autoscroll && n !== undefined && prev.n !== undefined && n < prev.n && rows.length > prev.length) {
      virtualizer.scrollToIndex(rows.length - prev.length, { align: 'start' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  useEffect(() => {
    if (autoscroll && rows.length > 0) {
      virtualizer.scrollToIndex(rows.length - 1, { align: 'end' });
    }
  }, [autoscroll, rows.length, virtualizer]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;

    if (!el) {
      return;
    }
    // Scrolling away from the bottom switches auto scroll off.
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;

    if (!atBottom) {
      setAutoscroll(false);
    }
    if (el.scrollTop < 120 && hasEarlier && !loadingEarlier) {
      onLoadEarlier?.();
    }
  }, [hasEarlier, loadingEarlier, onLoadEarlier]);

  const cycleTime = () => {
    const next = TIME_FORMATS[(TIME_FORMATS.indexOf(effectiveFormat) + 1) % TIME_FORMATS.length] as TimeFormat;

    setTimeFormat(next);
    writeStored(TIME_KEY, next);
  };

  const download = async () => {
    let all = lines;

    setDlError(false);
    if (onLoadAll) {
      try {
        all = await onLoadAll();
      } catch {
        setDlError(true);

        return;
      }
    }
    const text = all
      .map(l => {
        if (!dlTimestamp || l.t === undefined) {
          return `${l.m}\n`;
        }
        const d = new Date(l.t);
        let stamp: string;

        if (dlFormat === 'elapsed-build') {
          stamp = formatDuration(Math.max(0, l.t - (buildStart ?? l.t)), 'en', 3);
        } else if (dlFormat === 'elapsed-step') {
          stamp = formatDuration(Math.max(0, l.t - (stepStart ?? l.t)), 'en', 3);
        } else if (dlFormat === 'simple-time') {
          stamp = dlUtc ? d.toISOString().slice(11, 19) : `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        } else {
          stamp = dlUtc ? d.toISOString() : d.toString();
        }

        return `${stamp} ${l.m}\n`;
      })
      .join('');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');

    a.href = url;
    a.download = `${stepName ?? 'build'}.log`;
    a.click();
    URL.revokeObjectURL(url);
    writeStored('screwdriver.logs.download.timestampEnabled', String(dlTimestamp));
    writeStored('screwdriver.logs.download.timestampFormat', dlFormat);
    writeStored('screwdriver.logs.download.timezone', dlUtc ? 'UTC' : 'LOCAL_TIMEZONE');
    setShowDownload(false);
  };

  const timeLabel = {
    datetime: t('build.log.time.local'),
    datetimeUTC: t('build.log.time.utc'),
    elapsedBuild: t('build.log.time.sinceBuild'),
    elapsedStep: t('build.log.time.sinceStep')
  }[effectiveFormat];

  return (
    <div className={`build-log${fullscreen ? ' build-log--fullscreen' : ''}`} data-testid="build-log">
      <div className="build-log__toolbar">
        <button type="button" className="btn btn-link btn-sm" onClick={cycleTime}>
          {timeLabel}
        </button>
        <span className="build-log__spacer" />
        <button
          type="button"
          className="btn btn-link btn-sm"
          aria-pressed={autoscroll}
          title={t('build.log.autoscroll')}
          onClick={() => setAutoscroll(a => !a)}
        >
          <Icon name="scroll" aria-hidden="true" />
          <span className="visually-hidden">{t('build.log.autoscroll')}</span>
        </button>
        <button
          type="button"
          className="btn btn-link btn-sm"
          aria-pressed={fullscreen}
          title={t('build.log.fullscreen')}
          onClick={() => setFullscreen(f => !f)}
        >
          <Icon name="compress" aria-hidden="true" />
          <span className="visually-hidden">{t('build.log.fullscreen')}</span>
        </button>
        <button
          type="button"
          className="btn btn-link btn-sm"
          aria-pressed={wrap}
          title={t('build.log.wrap')}
          onClick={() => setWrap(w => !w)}
        >
          <SvgIcon name="word-wrap" size={14} />
          <span className="visually-hidden">{t('build.log.wrap')}</span>
        </button>
        <button
          type="button"
          className="btn btn-link btn-sm"
          onClick={async () => {
            setAutoscroll(false);
            topRequested.current = hasEarlier;
            if (hasEarlier && onLoadAll) {
              // On a failed read go to the top of what is loaded; "Load earlier" stays to retry.
              await onLoadAll().catch(() => undefined);
            }
            // The layout effect finishes the jump once the last chunk is rendered.
            virtualizer.scrollToIndex(0);
          }}
        >
          <Icon name="arrowUp" aria-hidden="true" />
          <span className="visually-hidden">{t('build.log.top')}</span>
        </button>
        <button type="button" className="btn btn-link btn-sm" onClick={() => setAutoscroll(true)}>
          <Icon name="arrowDown" aria-hidden="true" />
          <span className="visually-hidden">{t('build.log.bottom')}</span>
        </button>
        {!inProgress && lines.length > 0 ? (
          <div className="build-log__download">
            <button
              type="button"
              className="btn btn-link btn-sm"
              aria-expanded={showDownload}
              onClick={() => setShowDownload(s => !s)}
            >
              <Icon name="download" aria-hidden="true" />
          <span className="visually-hidden">{t('build.log.download')}</span>
            </button>
            {showDownload ? (
              <div className="build-log__download-menu card card-body">
                <label>
                  <input type="checkbox" checked={dlTimestamp} onChange={e => setDlTimestamp(e.target.checked)} />{' '}
                  {t('build.log.download.timestamp')}
                </label>
                <label>
                  {t('build.log.download.format')}
                  <select
                    className="form-select form-select-sm"
                    disabled={!dlTimestamp}
                    value={dlFormat}
                    onChange={e => setDlFormat(e.target.value)}
                  >
                    <option value="full-time">{t('build.log.download.fullTime')}</option>
                    <option value="simple-time">{t('build.log.download.simpleTime')}</option>
                    <option value="elapsed-build">{t('build.log.time.sinceBuild')}</option>
                    <option value="elapsed-step">{t('build.log.time.sinceStep')}</option>
                  </select>
                </label>
                <label>
                  {t('build.log.download.timezone')}
                  <select
                    className="form-select form-select-sm"
                    disabled={!dlTimestamp || !['full-time', 'simple-time'].includes(dlFormat)}
                    value={dlUtc ? 'UTC' : 'LOCAL'}
                    onChange={e => setDlUtc(e.target.value === 'UTC')}
                  >
                    <option value="LOCAL">{t('build.log.time.local')}</option>
                    <option value="UTC">{t('build.log.time.utc')}</option>
                  </select>
                </label>
                {dlError ? (
                  <div className="alert alert-danger py-1 my-1" role="alert">
                    {t('build.log.download.failed')}
                  </div>
                ) : null}
                <button type="button" className="btn btn-primary btn-sm" onClick={download}>
                  {t('build.log.download.submit')}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {hasEarlier ? (
        <div className="build-log__earlier" data-testid="log-earlier">
          <button type="button" className="btn btn-link btn-sm" disabled={loadingEarlier} onClick={() => onLoadEarlier?.()}>
            {loadingEarlier ? t('build.log.loadingEarlier') : t('build.log.loadEarlier')}
          </button>
        </div>
      ) : null}
      <div
        ref={scrollRef}
        className={`build-log__scroll scroll-region${wrap ? '' : ' build-log__scroll--nowrap'}`}
        data-scroll-region=""
        data-testid="log-scroll"
        role="log"
        aria-label={t('build.log.label')}
        aria-live="off"
        onScroll={onScroll}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }} className="build-log__lines">
          {virtualizer.getVirtualItems().map(item => {
            const line = rows[item.index] as LogLine;

            return (
              <div
                key={item.key}
                ref={virtualizer.measureElement}
                data-index={item.index}
                className="build-log__line"
                style={{ position: 'absolute', top: 0, left: 0, transform: `translateY(${item.start}px)` }}
              >
                {!message ? (
                  <span className="build-log__time">
                    {formatLogTime(effectiveFormat, line.t, buildStart, stepStart, locale)}
                  </span>
                ) : null}
                <span className="build-log__content" dangerouslySetInnerHTML={{ __html: ansi.get(rows, item.index) }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

