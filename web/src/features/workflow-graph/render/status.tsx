import { useT } from '~/i18n/useT';

/**
 * Code points in the screwdriver icon font (public/assets/screwdriver.woff),
 * the same ones as STATUS_MAP in app/utils/pipeline/graph/d3-graph-util.js.
 */
export const ICON_FONT_GLYPHS: Record<string, string> = {
  SUCCESS: '\ue903',
  WARNING: '\ue903',
  STARTED_FROM: '\ue907',
  DOWNSTREAM_TRIGGER: '\ue907',
  RUNNING: '\ue905',
  QUEUED: '\ue904',
  ABORTED: '\ue900',
  FAILURE: '\ue906',
  DISABLED: '\ue902',
  UNKNOWN: '\ue901',
  UNSTABLE: '\ue909',
  BLOCKED: '\ue908',
  COLLAPSED: '\ue908',
  FROZEN: '\ue910',
  SKIPPED: '\ue909',
  VIRTUAL: '\ue911'
};

const GLYPHS = ICON_FONT_GLYPHS;

export const KNOWN_STATUSES = new Set([
  'SUCCESS',
  'WARNING',
  'FAILURE',
  'RUNNING',
  'QUEUED',
  'BLOCKED',
  'ABORTED',
  'UNSTABLE',
  'COLLAPSED',
  'FROZEN',
  'SKIPPED',
  'DISABLED',
  'STARTED_FROM',
  'CREATED'
]);

export function useStatusLabel() {
  const t = useT();

  return (status?: string): string => {
    const s = status && KNOWN_STATUSES.has(status) ? status : 'UNKNOWN';

    return t(`workflowGraph.status.${s}`);
  };
}

export const statusClass = (status?: string) =>
  `wg-status--${
    status && (GLYPHS[status] || KNOWN_STATUSES.has(status))
      ? status
      : 'UNKNOWN'
  }`;

/** Mirrors `icon()` in d3-graph-util.js: virtual nodes without a problem status show the virtual glyph. */
export function glyphFor(status?: string, virtual?: boolean): string {
  if (
    virtual &&
    (!status || ['SUCCESS', 'WARNING', 'CREATED'].includes(status))
  )
    return GLYPHS.VIRTUAL as string;

  // CREATED (a build waiting for its join inputs) reads like QUEUED.
  if (status === 'CREATED') return GLYPHS.QUEUED as string;

  return (status && GLYPHS[status]) || (GLYPHS.UNKNOWN as string);
}

export function StatusIcon({
  status,
  virtual
}: {
  status?: string;
  virtual?: boolean;
}) {
  const label = useStatusLabel()(status);
  const glyph = glyphFor(status, virtual);

  return (
    <span
      className={`wg-icon ${statusClass(status)}${
        virtual ? ' wg-icon--virtual' : ''
      }`}
      role="img"
      aria-label={label}
      title={label}
    >
      {glyph}
    </span>
  );
}
