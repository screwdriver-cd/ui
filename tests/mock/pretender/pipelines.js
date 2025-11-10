/* eslint-disable require-jsdoc, import/prefer-default-export */

import { DEFAULT_EVENT_ID, mockEvents } from '../events';
import { mockJobs } from '../jobs';
import {
  CHILD_1_PIPELINE_ID,
  childPipeline1,
  childPipeline2,
  INVALID_PIPELINE_ID,
  PARENT_PIPELINE_ID,
  parentPipeline,
  pipeline,
  PIPELINE_WITH_NO_EVENTS_ID
} from '../pipeline';

export function pipelineRoutes(mockApi) {
  mockApi.get('/pipelines', req => {
    const { configPipelineId } = req.queryParams;

    if (configPipelineId && configPipelineId === `${PARENT_PIPELINE_ID}`) {
      return [200, [childPipeline1, childPipeline2]];
    }

    return [200, []];
  });
  mockApi.post('/pipelines', () => [200, { id: PIPELINE_WITH_NO_EVENTS_ID }]);

  mockApi.get('/pipelines/:id', req => {
    const pipelineId = parseInt(req.params.id, 10);

    if (pipelineId === INVALID_PIPELINE_ID) {
      return [
        404,
        {
          statusCode: 404,
          error: 'Not Found',
          message: `Pipeline ${INVALID_PIPELINE_ID} does not exist`
        }
      ];
    }
    if (pipelineId === PARENT_PIPELINE_ID) {
      return [200, parentPipeline];
    }
    if (pipelineId === PIPELINE_WITH_NO_EVENTS_ID) {
      return [
        200,
        { ...pipeline, id: PIPELINE_WITH_NO_EVENTS_ID, lastEventId: null }
      ];
    }

    return [
      200,
      {
        ...pipeline,
        lastEventId: DEFAULT_EVENT_ID
      }
    ];
  });

  mockApi.get('/pipelines/:id/admins', () => {
    return [200, []];
  });

  mockApi.get('/pipelines/:id/events', req => {
    const pipelineId = parseInt(req.params.id, 10);
    const prNum = req.queryParams.prNum
      ? parseInt(req.queryParams.prNum, 10)
      : null;
    const { id } = req.queryParams;

    if (id) {
      if (id.startsWith('lt:') || id.startsWith('gt:')) {
        return [200, []];
      }
    }
    if (prNum) {
      return [200, [mockEvents.find(event => event.prNum === prNum)]];
    }

    if (pipelineId === PIPELINE_WITH_NO_EVENTS_ID) {
      return [200, []];
    }

    return [200, mockEvents];
  });

  mockApi.get('/pipelines/:id/jobs', req => {
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

  mockApi.get('/pipelines/:id/latestCommitEvent', req => {
    const id = parseInt(req.params.id, 10);

    if (id === PIPELINE_WITH_NO_EVENTS_ID) {
      return [404, {}];
    }

    return [200, mockEvents[0]];
  });

  mockApi.get('/pipelines/:id/secrets', req => {
    const pipelineId = parseInt(req.params.id, 10);

    if (
      pipelineId === PARENT_PIPELINE_ID ||
      pipelineId === CHILD_1_PIPELINE_ID
    ) {
      return [
        200,
        [
          {
            id: 1,
            pipelineId: PARENT_PIPELINE_ID,
            name: 'OVERRIDE_ME',
            allowInPR: false
          }
        ]
      ];
    }

    return [
      200,
      [
        { id: 1234, name: 'BATMAN', value: null, allowInPR: false },
        { id: 1235, name: 'ROBIN', value: null, allowInPR: false }
      ]
    ];
  });

  mockApi.get('/pipelines/:id/stages', () => {
    return [200, []];
  });

  mockApi.get('/pipelines/:id/tokens', () => {
    return [
      200,
      [
        { id: 2345, name: 'foo', description: 'foofoo' },
        { id: 2346, name: 'bar', description: 'barbar' }
      ]
    ];
  });

  mockApi.get('/pipelines/:id/triggers', () => {
    return [200, []];
  });
}
