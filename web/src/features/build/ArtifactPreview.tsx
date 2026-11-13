import { useEffect, useRef, useState } from 'react';
import { config, storeBase } from '~/config/config';
import { useT } from '~/i18n/useT';
import { artifactsUrl } from './api';

interface Props {
  buildId: string;
  /** Path under the artifacts root; a trailing slash means a directory, `/` the root. */
  path: string;
}

export function ArtifactPreview({ buildId, path }: Props) {
  const t = useT();
  const isDir = path.endsWith('/');
  const [override, setOverride] = useState<string | null>(null);
  const previewUrl = !isDir && path ? `${artifactsUrl(buildId, path)}?type=preview` : '';
  const src = override ?? previewUrl;
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => setOverride(null), [path, buildId]);

  // The store preview page posts `loaded` / `redirect` messages (same protocol as Ember).
  useEffect(() => {
    const origin = new URL(storeBase()).origin;
    const handler = (e: MessageEvent) => {
      // The sandboxed preview has an opaque ("null") origin; take that only from our own frame.
      const fromPreview = e.origin === 'null' && e.source === frame.current?.contentWindow;

      if (e.origin !== origin && !fromPreview) {
        return;
      }
      const { state, href } = (e.data ?? {}) as { state?: string; href?: string };

      if (state === 'loaded') {
        // An opaque origin cannot be named as the target; the message carries nothing private.
        (e.source as Window | null)?.postMessage({ state: 'ready' }, fromPreview ? '*' : e.origin);
      } else if (state === 'redirect' && typeof href === 'string' && /^https?:\/\//.test(href)) {
        setOverride(href);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, []);

  const download = () => {
    let link = src.replace('type=preview', 'type=download');

    if (isDir && config.downloadArtifactDir) {
      link = `${artifactsUrl(buildId, path.replace(/\/$/, ''))}?type=download&dir=true`;
    }
    window.open(link, '_blank', 'noopener');
  };

  const downloadAll = () => window.open(`${artifactsUrl(buildId).replace(/\/$/, '')}`, '_blank', 'noopener');

  return (
    <div className="artifact-preview">
      {path === '/' ? (
        config.downloadArtifactDir ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={downloadAll}>
            {t('build.artifacts.downloadAll')}
          </button>
        ) : null
      ) : (
        <button type="button" className="btn btn-primary btn-sm" onClick={download}>
          {t('build.artifacts.download')}
        </button>
      )}
      {/* Artifacts are build (and PR) controlled and served from the API origin. Without
          allow-same-origin their scripts run in an opaque origin, so they cannot use the viewer's
          API session (e.g. read /auth/token). */}
      <iframe
        ref={frame}
        title={t('build.artifacts.preview')}
        src={src || 'about:blank'}
        sandbox="allow-scripts allow-popups allow-downloads"
      />
    </div>
  );
}
