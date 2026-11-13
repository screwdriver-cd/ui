import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSession } from '~/auth/session';
import { mockFetch, signIn } from '~/test/feature-router';
import { renderWithProviders } from '~/test/render';
import type { Job, Pipeline, SdEvent } from '../../types';
import { buildStartBody, StartEventModal } from './StartEventModal';

const pipeline = {
  id: 1,
  state: 'ACTIVE',
  parameters: {
    env: { value: ['dev', 'prod'], description: 'Target' },
    region: 'us'
  }
} as unknown as Pipeline;
const event = {
  id: 42,
  pipelineId: 1,
  groupEventId: 40,
  type: 'pipeline',
  sha: 'abcdef1234567890',
  createTime: '2020-01-01T00:00:00Z',
  creator: { username: 'batman' },
  commit: { message: 'Fix', author: { username: 'batman' } },
  meta: {
    parameters: {
      env: { value: 'prod' },
      region: { value: 'eu' },
      main: { tag: { value: 'v2' } }
    }
  }
} as unknown as SdEvent;
const jobs = [
  {
    id: 1,
    name: 'main',
    pipelineId: 1,
    state: 'ENABLED',
    permutations: [{ parameters: { tag: ['v1', 'v2'] } }]
  }
] as Job[];
const prJobs = [
  {
    id: 2,
    name: 'PR-7:main',
    pipelineId: 1,
    state: 'ENABLED',
    permutations: [{ parameters: { flag: 'on' } }]
  },
  {
    id: 3,
    name: 'PR-8:main',
    pipelineId: 1,
    state: 'ENABLED',
    permutations: [{ parameters: { other: 'x' } }]
  }
] as Job[];

function routes(posted: unknown[] = []) {
  return mockFetch([
    [
      /\/pipelines\/1\/jobs$/,
      url => (url.searchParams.get('type') === 'pr' ? prJobs : jobs)
    ],
    [
      /\/pipelines\/1\/latestCommitEvent$/,
      () => ({ ...event, id: 99, sha: 'ffffffffffff' })
    ],
    [
      /\/events$/,
      (_url, init) => {
        posted.push(JSON.parse(String(init?.body)));

        return { ...event, id: 100 };
      }
    ]
  ]);
}

describe('StartEventModal parameters', () => {
  beforeEach(() => signIn());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('prefills an event restart with the event values and posts them under meta.parameters', async () => {
    const posted: unknown[] = [];

    routes(posted);
    renderWithProviders(
      <StartEventModal
        pipeline={pipeline}
        event={event}
        action="restart"
        isPr={false}
        onClose={vi.fn()}
      />
    );
    const form = await screen.findByTestId('parameters-form');

    expect(within(form).getByLabelText(/^env/)).toHaveValue('prod');
    expect(within(form).getByLabelText(/^region/)).toHaveValue('eu');

    await userEvent.clear(within(form).getByLabelText(/^region/));
    await userEvent.type(within(form).getByLabelText(/^region/), 'ap');
    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      startAction: 'RESTART_FROM_EVENT',
      parentEventId: 42,
      meta: { parameters: { env: 'prod', region: 'ap', main: { tag: 'v2' } } }
    });
  });

  it('explains when no job was started and opens the new event on close', async () => {
    mockFetch([
      [/\/pipelines\/1\/jobs$/, () => jobs],
      [/\/pipelines\/1\/latestCommitEvent$/, () => event],
      [
        /\/events$/,
        () =>
          new Response(JSON.stringify({ ...event, id: 100 }), {
            status: 201,
            headers: { 'X-Status-Message': 'No jobs to start' }
          })
      ]
    ]);
    const onClose = vi.fn();
    const onStarted = vi.fn();

    renderWithProviders(
      <StartEventModal
        pipeline={pipeline}
        event={{ ...event, commit: { ...event.commit, url: 'https://c/abc' } }}
        action="restart"
        isPr={false}
        onClose={onClose}
        onStarted={onStarted}
      />
    );
    expect(
      await screen.findByRole('link', { name: 'abcdef1' })
    ).toHaveAttribute('href', 'https://c/abc');
    await screen.findByTestId('parameters-form');
    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));

    expect(await screen.findByText('No jobs to start')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart' })).toBeDisabled();
    expect(onStarted).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
    expect(onStarted).toHaveBeenCalledWith(
      expect.objectContaining({ id: 100 })
    );
  });

  it('starts fresh from the definitions: first choice is the default, other jobs are collapsed', async () => {
    const posted: unknown[] = [];

    routes(posted);
    renderWithProviders(
      <StartEventModal
        pipeline={pipeline}
        job={{ name: 'main', state: 'ENABLED' }}
        event={{ ...event, meta: {} }}
        action="start"
        isPr={false}
        onClose={vi.fn()}
      />
    );
    const form = await screen.findByTestId('parameters-form');

    // The started job's group leads and is open.
    expect(within(form).getByLabelText(/^tag/)).toHaveValue('v1');
    expect(
      within(form).getByRole('button', { name: /Shared/ })
    ).toHaveAttribute('aria-expanded', 'false');

    await userEvent.selectOptions(within(form).getByLabelText(/^tag/), 'v2');
    await userEvent.click(within(form).getByRole('button', { name: /Shared/ }));
    expect(within(form).getByLabelText(/^env/)).toHaveValue('dev');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'not the latest commit'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      startAction: 'START_FROM_EVENT',
      startFrom: 'main',
      meta: { parameters: { env: 'dev', region: 'us', main: { tag: 'v2' } } }
    });
  });

  it('accepts a typed override of a choice and blocks a blank value that has a default', async () => {
    const posted: unknown[] = [];

    routes(posted);
    renderWithProviders(
      <StartEventModal
        pipeline={pipeline}
        event={event}
        action="restart"
        isPr={false}
        onClose={vi.fn()}
      />
    );
    const form = await screen.findByTestId('parameters-form');

    await userEvent.selectOptions(
      within(form).getByLabelText(/^env/),
      'Other…'
    );
    const custom = within(form).getByLabelText('Custom value for env');

    await userEvent.clear(custom);
    expect(
      await within(form).findByText('A value is required.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart' })).toBeDisabled();

    await userEvent.type(custom, 'staging');
    expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      meta: { parameters: { env: 'staging' } }
    });
  });

  it('PR start: shows only this PR job parameters, keyed by the base job name', async () => {
    const posted: unknown[] = [];

    routes(posted);
    const prEvent = { ...event, type: 'pr', prNum: 7, meta: {} } as SdEvent;

    renderWithProviders(
      <StartEventModal
        pipeline={{ ...pipeline, parameters: undefined } as Pipeline}
        event={prEvent}
        job={{ name: 'PR-7:main', state: 'ENABLED' }}
        action="restart"
        isPr
        onClose={vi.fn()}
      />
    );
    const form = await screen.findByTestId('parameters-form');

    expect(within(form).getByLabelText(/^flag/)).toHaveValue('on');
    expect(within(form).queryByLabelText(/^other/)).toBeNull();
    expect(
      within(form).getByRole('button', { name: 'Job: main' })
    ).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      prNum: 7,
      startFrom: 'PR-7:main',
      meta: { parameters: { main: { flag: 'on' } } }
    });
  });

  it('shows no form and sends no parameters for an unparameterized pipeline', async () => {
    const posted: unknown[] = [];

    mockFetch([
      [/\/pipelines\/1\/jobs$/, () => []],
      [/\/pipelines\/1\/latestCommitEvent$/, () => event],
      [
        /\/events$/,
        (_u, init) => (
          posted.push(JSON.parse(String(init?.body))), { ...event, id: 100 }
        )
      ]
    ]);
    renderWithProviders(
      <StartEventModal
        pipeline={{ id: 1, state: 'ACTIVE' } as Pipeline}
        event={{ ...event, meta: {} }}
        action="restart"
        isPr={false}
        onClose={vi.fn()}
      />
    );

    expect(
      await screen.findByText('No parameters to configure.')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).not.toHaveProperty('meta');
  });
});

describe('StartEventModal job definitions', () => {
  beforeEach(() => signIn());
  afterEach(() => {
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('keeps Start disabled when the jobs fail to load, and recovers on retry', async () => {
    let fail = true;

    mockFetch([
      [
        /\/pipelines\/1\/jobs$/,
        () =>
          fail ? new Response('{"message":"boom"}', { status: 502 }) : jobs
      ],
      [/\/pipelines\/1\/latestCommitEvent$/, () => event]
    ]);
    renderWithProviders(
      <StartEventModal
        pipeline={pipeline}
        event={event}
        action="restart"
        isPr={false}
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load the job parameters.'
    );
    expect(screen.getByRole('button', { name: 'Restart' })).toBeDisabled();

    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Restart' })).toBeEnabled()
    );
  });
});

describe('StartEventModal upstream failures', () => {
  beforeEach(() => signIn());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  const graphEvent = {
    ...event,
    meta: {},
    workflowGraph: {
      nodes: [
        { name: '~commit' },
        { name: 'build', id: 1 },
        { name: 'deploy', id: 2 }
      ],
      edges: [
        { src: '~commit', dest: 'build' },
        { src: 'build', dest: 'deploy' }
      ]
    }
  } as unknown as SdEvent;
  const deployJob = { name: 'deploy', state: 'ENABLED' } as Job;

  function serve(status: string) {
    mockFetch([
      [/\/pipelines\/1\/jobs$/, () => []],
      [/\/pipelines\/1\/latestCommitEvent$/, () => event],
      [
        /\/events\/42\/builds$/,
        () => [{ id: 10, jobId: 1, status, createTime: '2020-01-01T00:00:00Z' }]
      ]
    ]);
  }

  it('warns when an upstream build of the event failed', async () => {
    serve('FAILURE');
    renderWithProviders(
      <StartEventModal
        pipeline={{ id: 1, state: 'ACTIVE' } as Pipeline}
        event={graphEvent}
        job={deployJob}
        action="restart"
        isPr={false}
        onClose={vi.fn()}
      />
    );

    expect(
      await screen.findByText(/An upstream job failed in this event: build/)
    ).toBeInTheDocument();
  });

  it('does not warn when upstream builds succeeded', async () => {
    serve('SUCCESS');
    const { queryClient } = renderWithProviders(
      <StartEventModal
        pipeline={{ id: 1, state: 'ACTIVE' } as Pipeline}
        event={graphEvent}
        job={deployJob}
        action="restart"
        isPr={false}
        onClose={vi.fn()}
      />
    );

    await screen.findByText('No parameters to configure.');
    // The builds query has answered, so a warning would be showing by now.
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(screen.queryByText(/upstream job/i)).toBeNull();
  });
});

describe('buildStartBody', () => {
  it('adds meta.parameters only when given', () => {
    const base = {
      pipelineId: 1,
      jobName: 'main',
      startAction: 'START_FROM_LATEST_COMMIT' as const,
      causeMessage: 'x',
      sha: 'abc'
    };

    expect(buildStartBody(base)).not.toHaveProperty('meta');
    expect(buildStartBody({ ...base, parameters: { a: '1' } }).meta).toEqual({
      parameters: { a: '1' }
    });
  });
});
