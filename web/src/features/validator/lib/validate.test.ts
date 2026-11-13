import { afterEach } from 'vitest';
import { mockApi } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import { detectKind, validateYaml } from './validate';

afterEach(() => {
  signOut();
  vi.unstubAllGlobals();
});

describe('detectKind', () => {
  it('tells commands, pipelines and templates apart from their top-level keys', () => {
    expect(detectKind('format: binary\nnamespace: a')).toBe('command');
    expect(detectKind('jobs:\n  main:\n    image: node')).toBe('pipeline');
    expect(
      detectKind('namespace: a\nname: b\nconfig:\n  jobs:\n    main: {}')
    ).toBe('pipelineTemplate');
    expect(detectKind('name: foo\nversion: 1')).toBe('jobTemplate');
  });
});

describe('validateYaml', () => {
  it('posts to the endpoint for the kind of yaml', async () => {
    signIn();
    const { calls } = mockApi({
      'POST /validator': () => ({ jobs: {} }),
      'POST /validator/command': () => ({ command: {} }),
      'POST /validator/template': () => ({ template: {} }),
      'POST /pipeline/template/validate': () => ({ template: {} })
    });

    await validateYaml('jobs: {}');
    await validateYaml('format: docker');
    await validateYaml('name: x');
    await validateYaml('namespace: a\nname: b\nconfig:\n  jobs: {}');

    expect(calls.map(c => c.path)).toEqual([
      '/validator',
      '/validator/command',
      '/validator/template',
      '/pipeline/template/validate'
    ]);
    expect(calls[0]!.body).toEqual({ yaml: 'jobs: {}' });
  });

  it('turns API failures into error messages, with the status except for 400', async () => {
    signIn();
    mockApi({ 'POST /validator': () => [400, { message: 'bad yaml' }] });
    expect(await validateYaml('a: b')).toEqual({ errors: ['bad yaml'] });

    mockApi({ 'POST /validator': () => [500, { error: 'boom' }] });
    expect(await validateYaml('a: b')).toEqual({ errors: ['500 - boom'] });

    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')));
    expect(await validateYaml('a: b')).toEqual({ errors: ['Request Failed'] });
  });
});
