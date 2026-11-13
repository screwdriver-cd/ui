import {
  buildArtifactTree,
  buildInitLogs,
  getActiveStep,
  isActiveBuild,
  safeMetaUrl,
  selectedArtifactPath,
  stepStatus
} from './utils';

describe('selectedArtifactPath', () => {
  const nodes = buildArtifactTree('./report.html\n./cov/index.html\n');

  it('defaults to the manifest, selects the root and marks directories', () => {
    expect(selectedArtifactPath({ root: false, nodes, settled: true })).toBe('manifest.txt');
    expect(selectedArtifactPath({ root: true, nodes, settled: true })).toBe('/');
    expect(selectedArtifactPath({ splat: 'cov', root: false, nodes, settled: true })).toBe('cov/');
    expect(selectedArtifactPath({ splat: 'cov/index.html', root: false, nodes, settled: true })).toBe('cov/index.html');
    expect(selectedArtifactPath({ splat: 'cov', root: false, nodes: undefined, settled: false })).toBe('');
  });
});

describe('build utils', () => {
  it('detects active builds', () => {
    expect(isActiveBuild('RUNNING')).toBe(true);
    expect(isActiveBuild('QUEUED')).toBe(true);
    expect(isActiveBuild('BLOCKED')).toBe(true);
    expect(isActiveBuild('UNSTABLE')).toBe(true);
    expect(isActiveBuild('UNSTABLE', '2020-01-01')).toBe(false);
    expect(isActiveBuild('SUCCESS')).toBe(false);
  });

  it('picks the running step, else the first failed one', () => {
    expect(
      getActiveStep([
        { name: 'a', startTime: 't', endTime: 't', code: 0 },
        { name: 'b', startTime: 't' }
      ])
    ).toBe('b');
    expect(
      getActiveStep([
        { name: 'a', startTime: 't', endTime: 't', code: 0 },
        { name: 'b', startTime: 't', endTime: 't', code: 137 }
      ])
    ).toBe('b');
    expect(getActiveStep([{ name: 'a', startTime: 't', endTime: 't', code: 0 }])).toBeUndefined();
    expect(getActiveStep()).toBeUndefined();
  });

  it('derives step status', () => {
    expect(stepStatus({ name: 'a' })).toBe('queued');
    expect(stepStatus({ name: 'a', startTime: 't' })).toBe('running');
    expect(stepStatus({ name: 'a', startTime: 't', code: 0 })).toBe('success');
    expect(stepStatus({ name: 'a', startTime: 't', code: 1 })).toBe('failure');
  });

  it('builds a sorted artifact tree from the manifest', () => {
    const tree = buildArtifactTree('./b.txt\n./dir/z.html\n./dir/a.html\n');

    expect(tree.map(n => n.text)).toEqual(['b.txt', 'dir']);
    const clean = buildArtifactTree('/b.txt\n/dir/z.html\n/dir/a.html\n');

    expect(clean.map(n => [n.text, n.type])).toEqual([
      ['b.txt', 'file'],
      ['dir', 'directory']
    ]);
    expect(clean[1]?.children.map(n => n.path)).toEqual(['dir/a.html', 'dir/z.html']);
    expect(buildArtifactTree('')).toEqual([]);
  });

  it('only accepts http(s) and root-relative links from build meta', () => {
    expect(safeMetaUrl('https://x/y', '/base')).toBe('https://x/y');
    expect(safeMetaUrl('/coverage/index.html', 'https://api/builds/1/artifacts')).toBe(
      'https://api/builds/1/artifacts/coverage/index.html'
    );
    expect(safeMetaUrl('javascript:alert(1)', '')).toBeUndefined();
    expect(safeMetaUrl('//evil.example', '')).toBeUndefined();
    expect(safeMetaUrl(undefined, '')).toBeUndefined();
  });

  it('synthesises the init step log from build stats', () => {
    const queued = buildInitLogs({
      stepStartTime: '2020-01-01T00:00:00Z',
      stepEndTime: '2020-01-01T00:00:10Z',
      buildStartTime: '2020-01-01T00:00:10Z',
      buildStatus: 'RUNNING',
      stats: {
        queueEnterTime: '2020-01-01T00:00:01Z',
        hostname: 'node1',
        imagePullStartTime: '2020-01-01T00:00:05Z'
      }
    });

    expect(queued.lines.map(l => l.m)).toEqual([
      'Build created.',
      'Build enqueued.',
      'Build scheduled on node1. Starting image pull.',
      'Image pull completed. Build init completed.'
    ]);
    expect(queued.total).toBe(4);
    // Every line has its own number: the log view keys measured row heights by it.
    expect(
      buildInitLogs({
        buildStatus: 'RUNNING',
        parameters: { a: 1 },
        stats: { queueEnterTime: '2020-01-01T00:00:01Z', blockedStartTime: '2020-01-01T00:00:02Z' }
      }).lines.map(l => l.n)
    ).toEqual([0, 1, 2, 3]);
    expect(
      buildInitLogs({ buildStatus: 'FROZEN', stepEndTime: '2020-01-01T00:00:10Z' }).lines.at(-1)?.m
    ).toBe('Build frozen and removed from the queue.');
    expect(buildInitLogs({ buildStatus: 'RUNNING', stepStartTime: '2020-01-01T00:00:00Z' }).total).toBeUndefined();
    expect(
      buildInitLogs({ buildStatus: 'SUCCESS', stepEndTime: '2020-01-01T00:00:10Z' }).lines.at(-1)?.m
    ).toBe('Build init done.');
  });
});
