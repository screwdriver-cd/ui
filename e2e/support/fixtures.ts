import type { RouteTable } from './route-table';

const step = (name: string, extra: object = {}) => ({
  name,
  startTime: '2020-01-01T10:00:00.000Z',
  endTime: '2020-01-01T10:00:10.000Z',
  code: 0,
  lines: 3,
  ...extra
});

export const BUILD_ID = 100;
export const BUILD_URL = `/pipelines/4/builds/${BUILD_ID}`;

/** Build, job, event, pipeline, step logs and an empty artifact manifest for a failed build. */
export function registerBuild(api: RouteTable, opts: { lines?: number } = {}) {
  const lines = opts.lines ?? 3;
  const sha = 'c96f36886e084d18bd068b8156d095cd9b31e1d6';

  api.get('/builds/:id', () => [
    200,
    {
      id: BUILD_ID,
      jobId: 1,
      eventId: 5,
      sha,
      container: 'node:20',
      status: 'FAILURE',
      createTime: '2020-01-01T09:59:00.000Z',
      startTime: '2020-01-01T10:00:00.000Z',
      endTime: '2020-01-01T10:05:00.000Z',
      steps: [step('sd-setup-init'), step('install', { code: 137, lines }), step('test', { code: undefined, startTime: undefined, endTime: undefined })]
    }
  ]);
  api.get('/jobs/:id', () => [200, { id: 1, name: 'main', pipelineId: 4, state: 'ENABLED' }]);
  api.get('/events/:id', () => [200, { id: 5, sha, commit: { message: 'fix', url: 'https://example.test/c', author: { name: 'Bruce', url: 'https://example.test/b' } } }]);
  api.get('/pipelines/4', () => [200, { id: 4, name: 'p', state: 'ACTIVE', scmRepo: { name: 'o/r', url: 'https://example.test/o/r' } }]);
  api.get('/builds/:id/steps/:step/logs', ({ queryParams }) => [
    200,
    Number(queryParams.from ?? 0) >= lines
      ? []
      : Array.from({ length: lines }, (_, n) => ({ t: 1577872800000 + n * 1000, m: `log line ${n}`, n }))
  ]);
  api.get('/builds/:id/artifacts/manifest.txt', () => [404, { message: 'not found' }]);
}

const tpl = (namespace: string, name: string, version: string, extra: object = {}) => ({
  id: Math.abs(hash(`${namespace}${name}${version}`)),
  namespace,
  name,
  version,
  description: `${name} description`,
  maintainer: 'dev@example.test',
  createTime: '2020-01-01T00:00:00.000Z',
  config: { image: 'node:20', steps: [{ install: 'npm install' }] },
  metrics: { jobs: { count: 3 }, builds: { count: 9 }, pipelines: { count: 2 } },
  ...extra
});

function hash(s: string) {
  return [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
}

export function registerTemplates(api: RouteTable) {
  api.get('/templates', () => [200, [tpl('chef', 'publish', '1.0.1', { trusted: true }), tpl('chef', 'publish', '1.0.0'), tpl('nodejs', 'build', '2.0.0')]]);
  api.get('/templates/:full/metrics', () => [200, [tpl('chef', 'publish', '1.0.1', { trusted: true }), tpl('chef', 'publish', '1.0.0')]]);
  api.get('/templates/:full/tags', () => [200, [{ tag: 'stable', version: '1.0.0' }]]);
  api.get('/pipeline/templates', () => [200, [tpl('pipes', 'deploy', '1.0.0')]]);
  api.get('/pipeline/template/:ns/:name', () => [200, {}]);
  api.get('/pipeline/templates/:ns/:name/tags', () => [200, []]);
  api.get('/pipeline/templates/:ns/:name/versions', () => [200, [tpl('pipes', 'deploy', '1.0.0')]]);
}

export function registerCommands(api: RouteTable) {
  const cmd = (version: string) => ({
    namespace: 'foo',
    name: 'bar',
    version,
    description: 'bar description',
    maintainer: 'dev@example.test',
    createTime: '2020-01-01T00:00:00.000Z',
    format: 'binary',
    binary: { file: './run.sh' }
  });

  api.get('/commands', () => [200, [cmd('1.0.1'), cmd('1.0.0'), { ...cmd('2.0.0'), namespace: 'baz', name: 'qux' }]]);
  api.get('/commands/:ns/:name', () => [200, [cmd('1.0.1'), cmd('1.0.0')]]);
  api.get('/commands/:ns/:name/tags', () => [200, [{ tag: 'stable', version: '1.0.0' }]]);
}
