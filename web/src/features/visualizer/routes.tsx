import { createRoute, lazyRouteComponent } from '@tanstack/react-router';
import type { CreateRoutes } from '../routes';

export const createRoutes: CreateRoutes = authenticated => [
  createRoute({
    getParentRoute: () => authenticated,
    path: '/pipeline-visualizer',
    validateSearch: (s: Record<string, unknown>) => ({
      selectedPipelineId: s.selectedPipelineId
        ? String(s.selectedPipelineId)
        : undefined,
      selectedConnectedPipelineId: s.selectedConnectedPipelineId
        ? String(s.selectedConnectedPipelineId)
        : undefined
    }),
    component: lazyRouteComponent(
      () => import('./components/VisualizerPage'),
      'VisualizerPage'
    )
  })
];
