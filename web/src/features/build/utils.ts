import type { ArtifactNode, Build, BuildStats, BuildStep, LogLine } from './types';

export const isActiveBuild = (status: string, endTime?: string | null) =>
  status === 'QUEUED' ||
  status === 'RUNNING' ||
  status === 'BLOCKED' ||
  (status === 'UNSTABLE' && !endTime);

export const isPRJob = (jobName = '') => /^PR-/.test(jobName);

/** Same rule as app/utils/build.js getActiveStep. */
export function getActiveStep(steps: BuildStep[] = []): string | undefined {
  const running = steps.find(s => s.startTime && !s.endTime);

  if (running?.name) {
    return running.name;
  }

  return steps.find(s => s.code)?.name;
}

export type StepStatus = 'queued' | 'running' | 'success' | 'failure';

export function stepStatus(step: BuildStep): StepStatus {
  if (!step.startTime) {
    return 'queued';
  }
  if (step.code === undefined || step.code === null) {
    return 'running';
  }

  return step.code === 0 ? 'success' : 'failure';
}

export const isSetupStep = (name: string) => /^sd-setup/.test(name);
export const isTeardownStep = (name: string) => /^sd-teardown/.test(name);

export function msBetween(start?: string | number | null, end?: string | number | null, now = Date.now()) {
  if (!start) {
    return 0;
  }
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : now;

  return Number.isNaN(s) || Number.isNaN(e) ? 0 : Math.max(0, e - s);
}

/**
 * Build the nested artifact tree from manifest.txt lines (`/a/b.txt` per line).
 * Input is sorted alphabetically like the Ember service did.
 */
export function buildArtifactTree(manifest: string): ArtifactNode[] {
  const root: ArtifactNode[] = [];
  const paths = manifest
    .split('\n')
    .map(p => p.trim())
    .filter(Boolean)
    .sort();

  for (const path of paths) {
    const raw = path.split('/');

    // Manifest lines are `./a/b` or `/a/b`: drop the leading `.`/blank segment.
    if (raw[0] === '' || raw[0] === '.') {
      raw.shift();
    }
    const parts = raw.filter(Boolean);
    let level = root;
    let acc = '';

    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      let node = level.find(n => n.text === part);

      if (!node) {
        node = { text: part, type: 'directory', path: acc, children: [] };
        level.push(node);
      }
      if (i === parts.length - 1 && node.children.length === 0) {
        node.type = 'file';
      }
      level = node.children;
    });
  }

  return root;
}

type InitArgs = {
  stepStartTime?: string;
  stepEndTime?: string;
  buildStartTime?: string;
  buildStatus: string;
  stats?: BuildStats;
  parameters?: Record<string, unknown>;
};

/**
 * Synthetic log for the `sd-setup-init` step, from build stats (port of build-log component).
 * Lines are numbered in order: Ember reuses `n: 1` for several messages, but the log view keys
 * its measured rows by `n`, so shared numbers make rows of different heights overlap.
 */
export function buildInitLogs(args: InitArgs): { lines: LogLine[]; total?: number } {
  const { lines, total } = initLogs(args);

  return { lines: lines.map((line, n) => ({ ...line, n })), total };
}

function initLogs(args: InitArgs): { lines: LogLine[]; total?: number } {
  const { stepStartTime, stepEndTime, buildStartTime, buildStatus, stats = {}, parameters = {} } = args;
  const at = (v?: string) => (v ? new Date(v).getTime() : undefined);
  const lines: LogLine[] = [{ t: at(stepStartTime), m: 'Build created.' }];

  if (Object.keys(parameters).length > 0) {
    lines.push({ t: at(stepEndTime), m: `Build parameters: ${JSON.stringify(parameters, null, 2)}` });
  }

  if (buildStatus === 'FROZEN') {
    lines.push({ t: at(stepEndTime), m: 'Build frozen and removed from the queue.' });

    return { lines };
  }

  if (stats.queueEnterTime) {
    lines.push({ t: at(stats.queueEnterTime), m: 'Build enqueued.' });

    if (buildStatus === 'COLLAPSED') {
      lines.push({ t: at(stepEndTime), m: 'Build collapsed and removed from the queue.' });

      return { lines };
    }
    if (stats.blockedStartTime) {
      lines.push({ t: at(stats.blockedStartTime), m: 'Build blocked, putting back into queue.' });
    }
    if (stats.hostname && stats.imagePullStartTime) {
      lines.push({ t: at(stats.imagePullStartTime), m: `Build scheduled on ${stats.hostname}. Starting image pull.` });
    }
    if (stepEndTime) {
      lines.push({
        t: at(stepEndTime),
        m: buildStartTime ? 'Image pull completed. Build init completed.' : 'Build init failed.'
      });

      return { lines, total: 4 };
    }

    return { lines };
  }

  if (stepEndTime) {
    lines.push({ t: at(stepEndTime), m: 'Build init done.' });

    return { lines, total: 2 };
  }

  return { lines };
}

export const buildContainer = (b: Build) => b.buildContainer ?? b.container ?? '';
export const truncatedSha = (sha = '') => sha.slice(0, 7);

const isHttp = (u: string) => /^https?:\/\//i.test(u);

/** Coverage/test links from build meta: only http(s) or same-origin relative paths. */
export function safeMetaUrl(url: unknown, artifactsBase: string): string | undefined {
  if (typeof url !== 'string' || !url) {
    return undefined;
  }
  if (isHttp(url)) {
    return url;
  }
  if (url.startsWith('/') && !url.startsWith('//')) {
    return `${artifactsBase}${url}`;
  }

  return undefined;
}

export interface CoverageView {
  coverage: string;
  coverageUrl: string;
  results: string;
  resultsUrl: string;
}

/**
 * Banner coverage: values from `/coverage/info` first, then overridden by
 * `build.meta.tests` (saucelabs, then sonarqube, then the plain object), as
 * the Ember banner does.
 */
export function resolveCoverage(
  remote: { coverage: string; coverageUrl: string; tests: string; testsUrl: string } | undefined,
  metaTests: Record<string, unknown> | undefined,
  artifactsBase: string
): CoverageView {
  const view: CoverageView = {
    coverage: remote?.coverage ?? 'N/A',
    coverageUrl: remote?.coverageUrl ?? '#',
    results: remote?.tests ?? 'N/A',
    resultsUrl: remote?.testsUrl ?? '#'
  };

  if (!metaTests) {
    return view;
  }

  const tests = (metaTests.saucelabs ?? metaTests.sonarqube ?? metaTests) as Record<string, unknown>;
  const coverageFloat = parseFloat(String(tests.coverage));

  if (coverageFloat) {
    view.coverage = `${Number(coverageFloat.toFixed(2))}%`;
    view.coverageUrl = '#';
  }
  view.coverageUrl = safeMetaUrl(tests.coverageUrl, artifactsBase) ?? view.coverageUrl;

  if (/^\d+\/\d+$/.test(String(tests.results))) {
    view.results = String(tests.results);
    view.resultsUrl = '#';
  }
  view.resultsUrl = safeMetaUrl(tests.resultsUrl, artifactsBase) ?? view.resultsUrl;

  return view;
}

/** True when `path` names a directory in the artifact tree. */
export function isArtifactDirectory(nodes: ArtifactNode[], path: string): boolean {
  return nodes.some(
    node => node.type === 'directory' && (node.path === path || (path.startsWith(`${node.path}/`) && isArtifactDirectory(node.children, path)))
  );
}

/**
 * The selected artifact path in the form ArtifactPreview expects: `/` for the root,
 * a trailing slash for directories (the router strips trailing slashes from the URL, so
 * directories are recognised from the manifest). Empty while the manifest is pending.
 */
export function selectedArtifactPath(opts: { splat?: string; root: boolean; nodes: ArtifactNode[] | undefined; settled: boolean }): string {
  const { splat, root, nodes, settled } = opts;

  if (root && !splat) {
    return '/';
  }
  if (!splat) {
    return 'manifest.txt';
  }
  if (!settled) {
    return '';
  }

  return nodes && isArtifactDirectory(nodes, splat) ? `${splat}/` : splat;
}
