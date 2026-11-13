import { createRoute } from '@tanstack/react-router';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import type { CreateRoutes } from '~/features/routes';
import { createRoutes as visualizerRoutes } from '../routes';

vi.mock('~/features/workflow-graph', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    WorkflowGraph: ({
      onJobAction
    }: {
      onJobAction?: (a: unknown) => void;
    }) => (
      <button
        type="button"
        onClick={() =>
          onJobAction?.({
            type: 'open-external',
            pipelineId: '77',
            jobName: 'main'
          })
        }
      >
        open remote
      </button>
    )
  };
});

const createRoutes: CreateRoutes = parent => [
  ...visualizerRoutes(parent),
  createRoute({
    getParentRoute: () => parent,
    path: '/v2/pipelines/$id',
    component: () => <p>remote pipeline page</p>
  })
];

describe('visualizer page', () => {
  beforeEach(() => signIn());

  it('opens the external pipeline from a graph node action', async () => {
    mockFetch([
      [
        /\/pipelines\/5$/,
        () => ({
          id: 5,
          name: 'a',
          workflowGraph: { nodes: [{ name: 'main' }], edges: [] }
        })
      ]
    ]);
    const { router } = await renderFeature(
      createRoutes,
      '/pipeline-visualizer?selectedPipelineId=5'
    );

    await userEvent.click(
      await screen.findByRole('button', { name: 'open remote' })
    );

    expect(await screen.findByText('remote pipeline page')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/v2/pipelines/77');
  });
});
