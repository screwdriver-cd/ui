/**
 * Dev-only harness for the Playwright visual and timing specs
 * (e2e/specs/graph-*.spec.ts). Served by the Vite dev server at
 * /src/features/workflow-graph/bench/index.html?fixture=stress&locale=ja.
 * Not part of the production build (index.html is the only Vite entry).
 */
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '~/i18n/I18nProvider';
import { benchProps, type BenchFixture } from '../fixtures/bench';
import { WorkflowGraph } from '../render/WorkflowGraph';

declare global {
  interface Window {
    __graph?: { ready: boolean; ms: number; nodes: number };
  }
}

const params = new URLSearchParams(window.location.search);
const fixture = (params.get('fixture') ?? 'stages') as BenchFixture;
const base = benchProps(fixture);
const zoom = Number(params.get('zoom')) || undefined;
// ?complete=1: the same event once every build has finished.
const props = params.get('complete')
  ? { ...base, builds: base.builds?.map(b => ({ ...b, status: b.status === 'FAILURE' ? 'FAILURE' : 'SUCCESS' })) }
  : base;
const mini = fixture === 'mini';
const t0 = performance.now();

window.__graph = { ready: false, ms: 0, nodes: 0 };

// Ready = all React Flow nodes measured and visible, and fonts loaded.
const timer = setInterval(() => {
  const nodes = document.querySelectorAll('.react-flow__node');
  const visible = document.querySelectorAll('.react-flow__node[style*="visibility: hidden"]').length;

  if (nodes.length > 0 && visible === 0) {
    clearInterval(timer);
    const ms = performance.now() - t0;

    document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        window.__graph = { ready: true, ms, nodes: nodes.length };
        document.body.dataset.graphReady = 'true';
      });
    });
  }
}, 20);

createRoot(document.getElementById('root') as HTMLElement).render(
  <I18nProvider>
    <div id="bench-frame" style={{ width: mini ? 360 : 1200, height: mini ? 90 : 700, border: '1px solid #ccc' }}>
      <WorkflowGraph {...props} legibleZoom={zoom} />
    </div>
  </I18nProvider>
);
