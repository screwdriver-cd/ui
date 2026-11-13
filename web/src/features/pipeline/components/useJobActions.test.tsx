import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider
} from '@tanstack/react-router';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, signIn, signOut } from '~/test/feature-router';
import { renderWithProviders } from '~/test/render';
import type { Build, Job, Pipeline, SdEvent } from '../types';
import { useJobActions } from './useJobActions';

const pipeline = {
  id: 1,
  name: 'p',
  state: 'ACTIVE',
  workflowGraph: { nodes: [{ name: '~commit' }, { name: 'main' }], edges: [] }
} as unknown as Pipeline;
const job = { id: 1, name: 'main', state: 'ENABLED' } as Job;
const event = {
  id: 5,
  pipelineId: 1,
  sha: 'abc',
  commit: { message: 'm' }
} as unknown as SdEvent;

function Harness({ build }: { build: Build }) {
  const { onStart, modals } = useJobActions({ pipeline });

  return (
    <>
      <button type="button" onClick={() => onStart(job, 'restart', build)}>
        restart
      </button>
      {modals}
    </>
  );
}

async function renderHarness(build: Build) {
  mockFetch([
    [/\/events\/5$/, () => event],
    [/.*/, () => []]
  ]);
  const root = createRootRoute({ component: () => <Harness build={build} /> });
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ['/'] })
  });

  renderWithProviders(<RouterProvider router={router} />);
  await act(async () => {
    await router.load();
  });
}

beforeEach(() => signIn());
afterEach(() => {
  signOut();
  vi.unstubAllGlobals();
});

describe('useJobActions', () => {
  it('restarts a FROZEN build as a force start that asks for a reason', async () => {
    await renderHarness({
      id: 9,
      jobId: 1,
      eventId: 5,
      status: 'FROZEN'
    } as Build);
    await userEvent.click(screen.getByRole('button', { name: 'restart' }));

    expect(await screen.findByLabelText('Reason')).toBeInTheDocument();
  });

  it('asks for no reason for an ordinary restart', async () => {
    await renderHarness({
      id: 9,
      jobId: 1,
      eventId: 5,
      status: 'FAILURE'
    } as Build);
    await userEvent.click(screen.getByRole('button', { name: 'restart' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByLabelText('Reason')).toBeNull();
  });

  it('opens the confirmation for the last restart clicked, not the slowest lookup', async () => {
    let releaseA: () => void = () => undefined;
    const jobA = { id: 1, name: 'a', state: 'ENABLED' } as Job;
    const jobB = { id: 2, name: 'b', state: 'ENABLED' } as Job;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const path = new URL(String(input)).pathname;
        const json = (body: unknown) => new Response(JSON.stringify(body));

        if (path.endsWith('/builds/9')) {
          await new Promise<void>(r => (releaseA = r));

          return json({ id: 9, eventId: 5 });
        }
        if (/\/events\/[56]$/.test(path)) {
          return json({ ...event, id: Number(path.split('/').pop()) });
        }

        return json([]);
      })
    );
    function TwoJobs() {
      const { onStart, modals } = useJobActions({ pipeline });

      return (
        <>
          <button
            type="button"
            onClick={() =>
              onStart(jobA, 'restart', { id: 9, jobId: 1 } as Build)
            }
          >
            restart a
          </button>
          <button
            type="button"
            onClick={() =>
              onStart(jobB, 'restart', {
                id: 10,
                jobId: 2,
                eventId: 6
              } as Build)
            }
          >
            restart b
          </button>
          {modals}
        </>
      );
    }
    const root = createRootRoute({ component: TwoJobs });
    const router = createRouter({
      routeTree: root,
      history: createMemoryHistory({ initialEntries: ['/'] })
    });

    renderWithProviders(<RouterProvider router={router} />);
    await act(async () => {
      await router.load();
    });
    await userEvent.click(screen.getByRole('button', { name: 'restart a' }));
    await userEvent.click(screen.getByRole('button', { name: 'restart b' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent(/\bb\b/);

    await act(async () => releaseA());
    expect(screen.getByRole('dialog')).not.toHaveTextContent(/\ba\b/);
  });
});
