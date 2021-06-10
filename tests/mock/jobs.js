import { copy } from 'ember-copy';

export default () =>
  copy(
    [
      {
        id: '12345',
        groupEventId: '23456',
        name: 'main',
        pipelineId: '4',
        state: 'ENABLED',
        archived: false
      },
      {
        id: '12346',
        groupEventId: '23456',
        name: 'publish',
        pipelineId: '4',
        state: 'ENABLED',
        archived: false
      },
      {
        id: '12347',
        groupEventId: '23457',
        name: 'PR-42:main',
        pipelineId: '4',
        state: 'ENABLED',
        archived: false
      },
      {
        id: '12348',
        groupEventId: '23457',
        name: 'PR-42:publish',
        pipelineId: '4',
        state: 'ENABLED',
        archived: false
      },
      {
        id: '12349',
        groupEventId: '23458',
        name: 'PR-43:main',
        pipelineId: '4',
        state: 'ENABLED',
        archived: false
      }
    ],
    true
  );

/**
 * Return jobs mock for use with metrics
 *
 * @export
 * @returns
 */
export function metricJobs() {
  return copy(
    [
      {
        id: 159,
        name: 'prod',
        pipelineId: 4,
        state: 'ENABLED',
        archived: false
      },
      {
        id: 158,
        name: 'beta',
        pipelineId: 4,
        state: 'ENABLED',
        archived: false
      },
      {
        id: 157,
        name: 'publish',
        pipelineId: 4,
        state: 'ENABLED',
        archived: false
      },
      {
        id: 156,
        name: 'main',
        pipelineId: 4,
        state: 'ENABLED',
        archived: false
      }
    ],
    true
  );
}
