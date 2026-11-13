import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { EditorView } from '@codemirror/view';
import { afterEach, beforeEach } from 'vitest';
import { mockApi, renderPage } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import { mockReactFlowEnvironment } from '~/features/workflow-graph/render/testSetup';
import { patchProperty } from '~/test/patch';
import { ValidatorPage } from './ValidatorPage';

beforeEach(() => {
  signIn();
});
afterEach(() => {
  signOut();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const typeYaml = (text: string) =>
  act(() => {
    const view = EditorView.findFromDOM(
      screen.getByTestId('yaml-editor') as HTMLElement
    )!;

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: text }
    });
  });

describe('ValidatorPage', () => {
  it('validates the yaml against the API after a pause and shows jobs and errors', async () => {
    const { calls } = mockApi({
      'POST /validator': () => ({
        errors: ['jobs.main: requires is bad'],
        warnMessages: [{ message: 'deprecated key' }],
        jobs: {
          main: [
            {
              image: 'node:20',
              commands: [{ name: 'install', command: 'npm ci' }],
              environment: { FOO: 'bar' }
            }
          ]
        },
        workflowGraph: {
          nodes: [{ name: '~commit' }, { name: 'main' }],
          edges: [{ src: '~commit', dest: 'main' }]
        }
      })
    });

    renderPage(ValidatorPage, { path: '/validator', url: '/validator' });
    expect(
      await screen.findByRole('heading', { name: 'Results' })
    ).toBeInTheDocument();

    typeYaml('jobs:\n  main:\n    image: node:20');
    expect(calls).toHaveLength(0);

    expect(
      await screen.findByText(
        'jobs.main: requires is bad',
        {},
        { timeout: 2000 }
      )
    ).toBeInTheDocument();
    expect(calls).toHaveLength(1);
    expect(screen.getByText('deprecated key')).toBeInTheDocument();
    expect(screen.getByText('npm ci')).toBeInTheDocument();
    expect(screen.getByText('node:20')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('validator-graph')).getByTestId(
        'workflow-graph'
      )
    ).toBeInTheDocument();
  });

  it('links the workflow graph and the job panels', async () => {
    mockReactFlowEnvironment();
    const scrollIntoView = vi.fn();

    patchProperty(HTMLElement.prototype, 'scrollIntoView', {
      value: scrollIntoView
    });
    const job = (command: string) => [
      { image: 'node:20', commands: [{ name: 'run', command }] }
    ];

    mockApi({
      'POST /validator': () => ({
        jobs: { main: job('npm ci'), deploy: job('npm run deploy') },
        workflowGraph: {
          nodes: [{ name: '~commit' }, { name: 'main' }, { name: 'deploy' }],
          edges: [
            { src: '~commit', dest: 'main' },
            { src: 'main', dest: 'deploy' }
          ]
        }
      })
    });
    renderPage(ValidatorPage, { path: '/validator', url: '/validator' });
    await screen.findByTestId('yaml-editor');
    typeYaml('jobs:\n  main: {}\n  deploy: {}');

    const panel = async (name: string) =>
      (await screen.findByRole('heading', { name }, { timeout: 2000 })).closest(
        'details'
      ) as HTMLDetailsElement;
    const deploy = await panel('deploy');
    const node = (name: string) =>
      document.querySelector(`[data-node="${name}"]`) as HTMLElement;

    await waitFor(() => expect(node('deploy')).not.toBeNull());

    // Collapsing: the summary toggles the panel, and the bar does all of them at once.
    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    await waitFor(() => expect(deploy.open).toBe(false));
    expect((await panel('main')).open).toBe(false);

    // A click on a job in the graph opens its panel and scrolls to it, without a popover.
    fireEvent.click(node('deploy'));
    await waitFor(() => expect(deploy.open).toBe(true));
    expect(deploy).toHaveAttribute('data-active');
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(deploy);
    expect(screen.queryByRole('dialog')).toBeNull();

    // A click on a panel selects its job in the graph.
    fireEvent.click(await panel('main'));
    await waitFor(() => expect(node('main')).toHaveClass('wg-tier--focus'));
    expect(deploy).not.toHaveAttribute('data-active');
  });

  it('only sends the latest text when typing continues', async () => {
    const { calls } = mockApi({ 'POST /validator': () => ({ jobs: {} }) });

    renderPage(ValidatorPage, { path: '/validator', url: '/validator' });
    await screen.findByTestId('yaml-editor');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const wait = (ms: number) =>
      act(async () => {
        vi.advanceTimersByTime(ms);
      });

    typeYaml('a: 1');
    typeYaml('a: 12');
    typeYaml('a: 123');

    await wait(249);
    expect(calls).toHaveLength(0);
    await wait(1000);
    expect(calls.map(c => (c.body as { yaml: string }).yaml)).toEqual([
      'a: 123'
    ]);
  });

  it('shows the Japanese UI', async () => {
    mockApi({});
    renderPage(ValidatorPage, {
      path: '/validator',
      url: '/validator',
      locale: 'ja'
    });

    expect(
      await screen.findByRole('heading', { name: '検証結果' })
    ).toBeInTheDocument();
  });
});
