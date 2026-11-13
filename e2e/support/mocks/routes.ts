import type { RouteTable } from '../route-table';
import { makeBuilds } from './builds';
import { DEFAULT_EVENT_ID, INVALID_EVENT_ID, mockEvents } from './events';
import {
  CHILD_1_PIPELINE_ID,
  childPipeline1,
  childPipeline2,
  INVALID_PIPELINE_ID,
  mockJobs,
  PARENT_PIPELINE_ID,
  parentPipeline,
  pipeline,
  PIPELINE_WITH_NO_EVENTS_ID
} from './pipeline';

// The default API routes every test gets (support/app.ts registers them in this order).

export function noBanners(api: RouteTable) {
  api.get('/banners', () => [200, []]);
}

export function userSettingRoute(api: RouteTable) {
  api.get('/users/settings', () => [200, {}]);
  api.put('/users/settings', () => [200, {}]);
}

export function pipelineRoutes(api: RouteTable) {
  api.get('/pipelines', req => {
    const { configPipelineId, page } = req.queryParams;

    if (configPipelineId === `${PARENT_PIPELINE_ID}` && (page ?? '1') === '1') {
      return [200, [childPipeline1, childPipeline2]];
    }

    return [200, []];
  });
  api.post('/pipelines', () => [200, { id: PIPELINE_WITH_NO_EVENTS_ID }]);

  api.get('/pipelines/:id', req => {
    const pipelineId = parseInt(req.params.id, 10);

    if (pipelineId === INVALID_PIPELINE_ID) {
      return [404, { statusCode: 404, error: 'Not Found', message: `Pipeline ${INVALID_PIPELINE_ID} does not exist` }];
    }
    if (pipelineId === PARENT_PIPELINE_ID) {
      return [200, parentPipeline];
    }
    if (pipelineId === PIPELINE_WITH_NO_EVENTS_ID) {
      return [200, { ...pipeline, id: PIPELINE_WITH_NO_EVENTS_ID, lastEventId: null }];
    }

    return [200, { ...pipeline, lastEventId: DEFAULT_EVENT_ID }];
  });

  api.get('/pipelines/:id/admins', () => [200, []]);

  api.get('/pipelines/:id/events', req => {
    const pipelineId = parseInt(req.params.id, 10);
    const prNum = req.queryParams.prNum ? parseInt(req.queryParams.prNum, 10) : null;
    const { id } = req.queryParams;

    if (id && (id.startsWith('lt:') || id.startsWith('gt:'))) {
      return [200, []];
    }
    if (prNum) {
      return [200, [mockEvents.find(event => event.prNum === prNum)]];
    }
    if (pipelineId === PIPELINE_WITH_NO_EVENTS_ID) {
      return [200, []];
    }

    return [200, mockEvents];
  });

  api.get('/pipelines/:id/jobs', req => {
    const pipelineId = parseInt(req.params.id, 10);

    if (pipelineId === PIPELINE_WITH_NO_EVENTS_ID) {
      return [200, []];
    }

    const { type } = req.queryParams;

    if (!type) {
      return [200, mockJobs];
    }
    if (type === 'pipeline') {
      return [200, mockJobs.filter(job => !job.name.startsWith('PR-'))];
    }

    return [200, mockJobs.filter(job => job.name.startsWith('PR-'))];
  });

  api.get('/pipelines/:id/latestCommitEvent', req => {
    if (parseInt(req.params.id, 10) === PIPELINE_WITH_NO_EVENTS_ID) {
      return [404, {}];
    }

    return [200, mockEvents[0]];
  });

  api.get('/pipelines/:id/secrets', req => {
    const pipelineId = parseInt(req.params.id, 10);

    if (pipelineId === PARENT_PIPELINE_ID || pipelineId === CHILD_1_PIPELINE_ID) {
      return [200, [{ id: 1, pipelineId: PARENT_PIPELINE_ID, name: 'OVERRIDE_ME', allowInPR: false }]];
    }

    return [
      200,
      [
        { id: 1234, name: 'BATMAN', value: null, allowInPR: false },
        { id: 1235, name: 'ROBIN', value: null, allowInPR: false }
      ]
    ];
  });

  api.get('/pipelines/:id/stages', () => [200, []]);

  api.get('/pipelines/:id/tokens', () => [
    200,
    [
      { id: 2345, name: 'foo', description: 'foofoo' },
      { id: 2346, name: 'bar', description: 'barbar' }
    ]
  ]);

  api.get('/pipelines/:id/triggers', () => [200, []]);
}

export function eventRoutes(api: RouteTable) {
  api.get('/events/:id', req => {
    const eventId = parseInt(req.params.id, 10);

    if (!eventId || eventId === INVALID_EVENT_ID) {
      return [404, {}];
    }

    return [200, mockEvents.find(event => event.id === eventId)];
  });

  api.get('/events/:id/builds', req => [200, makeBuilds(parseInt(req.params.id, 10))]);
}

export function buildRoutes(api: RouteTable) {
  api.get('/builds', () => [200, []]);
  api.get('/builds/statuses', () => [
    200,
    [{ jobId: 1, builds: [{ id: 12345, jobId: 1, status: 'SUCCESS', startTime: null, endTime: null }] }]
  ]);
}
