// eslint-disable-next-line import/prefer-default-export
import { PIPELINE_ID } from './pipeline';

// eslint-disable-next-line import/prefer-default-export
export const mockJobs = [
  {
    id: 12345,
    name: 'main',
    pipelineId: PIPELINE_ID,
    state: 'ENABLED',
    archived: false,
    permutations: [{}]
  },
  {
    id: 12346,
    name: 'publish',
    pipelineId: PIPELINE_ID,
    state: 'ENABLED',
    archived: false,
    permutations: [{}]
  },
  {
    id: 12347,
    name: 'PR-42:main',
    pipelineId: PIPELINE_ID,
    state: 'ENABLED',
    archived: false,
    permutations: [{}]
  },
  {
    id: 12348,
    name: 'PR-42:publish',
    pipelineId: PIPELINE_ID,
    state: 'ENABLED',
    archived: false,
    permutations: [{}]
  },
  {
    id: 12349,
    name: 'PR-43:main',
    pipelineId: PIPELINE_ID,
    state: 'ENABLED',
    archived: false,
    permutations: [{}]
  }
];
