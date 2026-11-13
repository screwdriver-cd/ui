import { createRoute } from '@tanstack/react-router';
import type { CreateRoutes } from '../routes';

import { lazyNamed } from '../lazy';

const CommandDetailPage = lazyNamed(() => import('./CommandPages'), 'CommandDetailPage');
const CommandListPage = lazyNamed(() => import('./CommandPages'), 'CommandListPage');
const CommandsLayout = lazyNamed(() => import('./CommandPages'), 'CommandsLayout');

/** /commands, /commands/:namespace, /commands/:namespace/:name[/:version] (same as Ember). */
export const createRoutes: CreateRoutes = authenticated => {
  const layout = createRoute({ getParentRoute: () => authenticated, path: '/commands', component: CommandsLayout });
  const child = (path: string, component: () => React.ReactNode) =>
    createRoute({ getParentRoute: () => layout, path, component });

  return [
    layout.addChildren([
      child('/', CommandListPage),
      child('/$namespace', CommandListPage),
      child('/$namespace/$name', CommandDetailPage),
      child('/$namespace/$name/$version', CommandDetailPage)
    ])
  ];
};
