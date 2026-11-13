import { Link } from '@tanstack/react-router';
import { useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { Button, Table } from 'react-bootstrap';
import { Icon } from '~/components/Icon';
import { useLocale } from '~/i18n/I18nProvider';
import { useT } from '~/i18n/useT';
import { StatusIcon } from '../StatusIcon';
import { clampZoom, niceTicks, segmentAt, tickIndexes, type ChartRow } from '../../utils/metrics';

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  kind?: 'bar' | 'line';
  /** Per-row override, e.g. a failed event's duration in the critical status color. */
  colorFor?: (row: ChartRow) => string;
  /** Second legend swatch color when `colorFor` can differ (failed events). */
  altColor?: string;
}

export interface MetricsChartProps {
  id: string;
  title: string;
  rows: ChartRow[];
  series: ChartSeries[];
  hidden?: Set<string>;
  /** Omit to render without a toggleable legend (single-series panels). */
  onHiddenChange?: (next: Set<string>) => void;
  zoom: [number, number] | null;
  onZoom: (zoom: [number, number] | null) => void;
  utc: boolean;
  yLabel: string;
  formatValue: (minutes: number, key: string) => string;
  /** Where clicking a row (and optionally one of its segments) goes. */
  hrefFor?: (row: ChartRow, seriesKey: string | null) => string | null;
  onNavigate?: (href: string) => void;
  /** Extra class on the <svg>; the Events chart keeps `metrics-chart` for e2e. */
  svgClassName?: string;
  /** Extra controls in the chart header (trendline toggle, job selector). */
  toolbar?: ReactNode;
  /** Render the title as an h3 under a group heading. */
  subtitle?: boolean;
}

const HEIGHT = 200;
const M = { top: 12, right: 12, bottom: 40, left: 48 };
const BAR_MAX = 24;
const GAP = 2;
const RADIUS = 4;

/** Rounded data-end, square at the baseline. */
function topRoundedRect(x: number, y: number, w: number, h: number) {
  const r = Math.min(RADIUS, w / 2, h);

  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);

  useLayoutEffect(() => {
    const el = ref.current;

    if (!el || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry?.contentRect.width ?? 0);

      if (w > 0) {
        setWidth(w);
      }
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

export function MetricsChart({
  id,
  title,
  rows,
  series,
  hidden = new Set(),
  onHiddenChange,
  zoom,
  onZoom,
  utc,
  yLabel,
  formatValue,
  hrefFor,
  onNavigate,
  svgClassName = '',
  toolbar,
  subtitle = false
}: MetricsChartProps) {
  const t = useT();
  const { locale } = useLocale();
  const [wrapRef, width] = useWidth();
  const [hover, setHover] = useState<{ index: number; key: string | null } | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const [table, setTable] = useState(false);
  const dragged = useRef(false);

  const [lo, hi] = clampZoom(zoom, rows.length);
  const shown = rows.slice(lo, hi + 1);
  const visible = series.filter(s => !hidden.has(s.key));
  const bars = visible.filter(s => s.kind !== 'line');
  const lines = visible.filter(s => s.kind === 'line');
  const plotW = Math.max(width - M.left - M.right, 40);
  const band = plotW / Math.max(shown.length, 1);
  const barW = Math.max(Math.min(BAR_MAX, band * 0.6), 1);
  const max = Math.max(
    0,
    ...shown.map(r => bars.reduce((sum, s) => sum + (r.values[s.key] ?? 0), 0)),
    ...shown.flatMap(r => lines.map(s => r.values[s.key] ?? 0))
  );
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const y = (v: number) => M.top + HEIGHT - (v / top) * HEIGHT;
  const cx = (i: number) => M.left + band * i + band / 2;
  const tz = utc ? 'UTC' : undefined;
  const lang = locale === 'en-XA' ? 'en' : locale;
  const spanDays =
    shown.length > 1
      ? (new Date(shown[shown.length - 1]!.time).getTime() - new Date(shown[0]!.time).getTime()) / 86_400_000
      : 0;
  const dateFmt = new Intl.DateTimeFormat(lang, { month: '2-digit', day: '2-digit', timeZone: tz });
  const timeFmt = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', timeZone: tz });
  const fullFmt = new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
    timeZoneName: 'short'
  });
  const colorOf = (s: ChartSeries, row: ChartRow) => s.colorFor?.(row) ?? s.color;
  const dim = (key: string) => (focus !== null && focus !== key ? 0.25 : 1);
  const zoomed = lo > 0 || hi < rows.length - 1;

  /** Row index and stacked segment under a pointer position. */
  const locate = (clientX: number, clientY: number, target: Element) => {
    const box = target.getBoundingClientRect();
    const index = Math.floor((clientX - box.left) / band);

    if (index < 0 || index >= shown.length) {
      return null;
    }

    const row = shown[index]!;
    const value = ((HEIGHT - (clientY - box.top)) / HEIGHT) * top;
    const withinBar = Math.abs(clientX - box.left - (band * index + band / 2)) <= Math.max(barW / 2 + GAP, 6);
    const key = withinBar ? segmentAt(row.values, bars.map(s => s.key), value) : null;

    return { index, key };
  };

  const toggle = (key: string, only = false) => {
    if (!onHiddenChange) {
      return;
    }
    if (only) {
      onHiddenChange(new Set(series.map(s => s.key).filter(k => k !== key)));

      return;
    }

    const next = new Set(hidden);

    if (next.has(key)) {
      next.delete(key);
    } else if (series.length - next.size > 1) {
      // Like Ember, the last visible series cannot be hidden.
      next.add(key);
    }
    onHiddenChange(next);
  };

  const onPointerDown = (e: PointerEvent<SVGRectElement>) => {
    const at = locate(e.clientX, e.clientY, e.currentTarget);

    dragged.current = false;
    if (at) {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDrag({ from: at.index, to: at.index });
    }
  };
  const onPointerMove = (e: PointerEvent<SVGRectElement>) => {
    const at = locate(e.clientX, e.clientY, e.currentTarget);

    setHover(at);
    if (drag && at && at.index !== drag.to) {
      setDrag({ ...drag, to: at.index });
    }
  };
  const onPointerUp = () => {
    if (drag && drag.from !== drag.to) {
      dragged.current = true;
      onZoom([lo + Math.min(drag.from, drag.to), lo + Math.max(drag.from, drag.to)]);
    }
    setDrag(null);
  };
  const onClick = (e: MouseEvent<SVGRectElement>) => {
    if (dragged.current) {
      dragged.current = false;

      return;
    }

    const at = locate(e.clientX, e.clientY, e.currentTarget);
    const href = at && hrefFor?.(shown[at.index]!, at.key);

    if (href) {
      onNavigate?.(href);
    }
  };

  const hovered = hover ? shown[hover.index] : undefined;
  const legend = onHiddenChange && series.length > 1;

  return (
    <section className="metrics-panel" id={id} aria-label={title}>
      <header className="metrics-panel__header">
        {subtitle ? (
          <h3 className="metrics-panel__title">{title}</h3>
        ) : (
          <h2 className="metrics-panel__title">{title}</h2>
        )}
        {toolbar}
        <div className="metrics-panel__actions">
          <Button
            size="sm"
            variant="outline-secondary"
            className="reset-zoom"
            onClick={() => onZoom(null)}
            disabled={!zoomed}
            title={t('pipeline.metrics.resetZoom')}
            aria-label={t('pipeline.metrics.resetZoomFor', { chart: title })}
          >
            <Icon name="rotate" />
          </Button>
          <Button
            size="sm"
            variant={table ? 'secondary' : 'outline-secondary'}
            className="table-toggle"
            onClick={() => setTable(!table)}
            aria-pressed={table}
            title={t('pipeline.metrics.tableView')}
            aria-label={t('pipeline.metrics.tableViewFor', { chart: title })}
          >
            <Icon name="tableCells" />
          </Button>
        </div>
      </header>
      {legend ? (
        <ul className="metrics-legend list-inline" aria-label={t('pipeline.metrics.legend', { chart: title })}>
          {series.map(s => {
            const on = !hidden.has(s.key);

            return (
              <li
                key={s.key}
                className={`metrics-legend__item${on ? '' : ' unselected'}`}
                onMouseEnter={() => on && setFocus(s.key)}
                onMouseLeave={() => setFocus(null)}
              >
                <button type="button" className="metrics-legend__toggle" aria-pressed={on} onClick={() => toggle(s.key)}>
                  <svg width="14" height="10" aria-hidden="true">
                    {s.kind === 'line' ? (
                      <line x1="0" x2="14" y1="5" y2="5" stroke={s.color} strokeWidth="2" />
                    ) : (
                      <>
                        <rect width={s.altColor ? 7 : 14} height="10" rx="2" fill={s.color} />
                        {s.altColor ? <rect x="7" width="7" height="10" rx="2" fill={s.altColor} /> : null}
                      </>
                    )}
                  </svg>
                  {s.label}
                </button>
                <button
                  type="button"
                  className="metrics-legend__only"
                  onClick={() => toggle(s.key, true)}
                  aria-label={t('pipeline.metrics.onlySeries', { series: s.label })}
                >
                  {t('pipeline.metrics.only')}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="metrics-panel__plot" ref={wrapRef}>
        {table ? (
          <div className="metrics-table">
            <Table size="sm" striped>
              <thead>
                <tr>
                  <th>{t('pipeline.metrics.time')}</th>
                  <th>{t('pipeline.metrics.sha')}</th>
                  <th>{t('pipeline.metrics.status')}</th>
                  {visible.map(s => (
                    <th key={s.key}>{s.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(row => {
                  const href = hrefFor?.(row, null);

                  return (
                    <tr key={row.id}>
                      <td>{href ? <Link to={href as never}>{fullFmt.format(new Date(row.time))}</Link> : fullFmt.format(new Date(row.time))}</td>
                      <td className="text-monospace">{row.sha.slice(0, 7)}</td>
                      <td>{row.status}</td>
                      {visible.map(s => {
                        const v = row.values[s.key];
                        const cellHref = v ? hrefFor?.(row, s.key) : null;
                        const text = v ? formatValue(v, s.key) : '';

                        return (
                          <td key={s.key}>
                            {cellHref && cellHref !== href ? <Link to={cellHref as never}>{text}</Link> : text}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : (
          <>
            <span className="metrics-panel__ylabel">{yLabel}</span>
            <svg
              role="img"
              aria-label={title}
              className={`viz-chart ${svgClassName}`.trim()}
              width={width}
              height={M.top + HEIGHT + M.bottom}
            >
              {ticks.map(v => (
                <g key={v} className="viz-grid">
                  <line x1={M.left} x2={M.left + plotW} y1={y(v)} y2={y(v)} />
                  <text x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end">
                    {Number.isInteger(v) ? v : v.toFixed(1)}
                  </text>
                </g>
              ))}
              {hovered ? (
                <rect className="viz-hover-band" x={M.left + band * hover!.index} y={M.top} width={band} height={HEIGHT} />
              ) : null}
              {shown.map((row, i) => {
                let acc = 0;
                const stack = bars.filter(s => (row.values[s.key] ?? 0) > 0);

                return (
                  <g key={row.id} data-event={row.id}>
                    {stack.map((s, j) => {
                      const v = row.values[s.key] ?? 0;
                      const y0 = y(acc);
                      const y1 = y(acc + v);
                      const isTop = j === stack.length - 1;
                      const trim = j > 0 && y0 - y1 > GAP + 1 ? GAP : 0;
                      const h = Math.max(y0 - y1 - trim, 0.5);
                      const x = cx(i) - barW / 2;

                      acc += v;

                      return (
                        <path
                          key={s.key}
                          className={`viz-bar ${s.key}`}
                          data-series={s.key}
                          d={isTop ? topRoundedRect(x, y1, barW, h) : `M${x},${y1}h${barW}v${h}h${-barW}Z`}
                          fill={colorOf(s, row)}
                          opacity={dim(s.key)}
                        />
                      );
                    })}
                  </g>
                );
              })}
              {lines.map(s => (
                <g key={s.key} className="viz-line" opacity={dim(s.key)}>
                  <polyline
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={shown.map((r, i) => `${cx(i)},${y(r.values[s.key] ?? 0)}`).join(' ')}
                  />
                  {shown.length <= 60
                    ? shown.map((r, i) => (
                        <circle key={r.id} cx={cx(i)} cy={y(r.values[s.key] ?? 0)} r="4" fill={s.color} className="viz-dot" />
                      ))
                    : null}
                </g>
              ))}
              <line className="viz-axis" x1={M.left} x2={M.left + plotW} y1={M.top + HEIGHT} y2={M.top + HEIGHT} />
              {tickIndexes(shown.length, plotW).map(i => {
                const d = new Date(shown[i]!.time);

                return (
                  <text key={i} className="viz-tick" x={cx(i)} y={M.top + HEIGHT + 16} textAnchor="middle">
                    <tspan x={cx(i)}>{dateFmt.format(d)}</tspan>
                    {spanDays <= 7 ? (
                      <tspan x={cx(i)} dy="1.2em">
                        {timeFmt.format(d)}
                      </tspan>
                    ) : null}
                  </text>
                );
              })}
              {drag && drag.from !== drag.to ? (
                <rect
                  className="viz-brush"
                  x={M.left + band * Math.min(drag.from, drag.to)}
                  y={M.top}
                  width={band * (Math.abs(drag.to - drag.from) + 1)}
                  height={HEIGHT}
                />
              ) : null}
              <rect
                className={`viz-overlay${hover?.key || (hovered && !bars.length) ? ' clickable' : ''}`}
                data-testid={`${id}-overlay`}
                x={M.left}
                y={M.top}
                width={plotW}
                height={HEIGHT}
                fill="transparent"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={() => {
                  setHover(null);
                  setDrag(null);
                }}
                onClick={onClick}
              />
            </svg>
            <span className="metrics-panel__xlabel">{t(utc ? 'pipeline.metrics.xAxisUtc' : 'pipeline.metrics.xAxisLocal')}</span>
            {hovered ? (
              <div
                className="viz-tooltip"
                role="status"
                style={{
                  left: Math.min(cx(hover!.index) + 12, Math.max(width - 240, 0)),
                  top: M.top
                }}
              >
                <div className="viz-tooltip__head">
                  <StatusIcon status={hovered.status} />
                  <strong>{hovered.sha ? `#${hovered.sha.slice(0, 7)}` : `#${hovered.id}`}</strong>
                  <span className="text-muted">{fullFmt.format(new Date(hovered.time))}</span>
                </div>
                {[...visible]
                  .filter(s => hovered.values[s.key])
                  .sort((a, b) => (hovered.values[b.key] ?? 0) - (hovered.values[a.key] ?? 0))
                  .map(s => (
                    <div key={s.key} className={`viz-tooltip__row${hover!.key === s.key ? ' active' : ''}`}>
                      <span className="viz-tooltip__key" style={{ background: colorOf(s, hovered) }} />
                      <strong>{formatValue(hovered.values[s.key] ?? 0, s.key)}</strong>
                      <span>{s.label}</span>
                    </div>
                  ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
