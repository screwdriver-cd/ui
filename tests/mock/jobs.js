import { copy } from '@ember/object/internals';

export default () => copy([
  {
    id: '12345',
    name: 'main',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  },
  {
    id: '12346',
    name: 'publish',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  },
  {
    id: '12347',
    name: 'PR-42:main',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  },
  {
    id: '12348',
    name: 'PR-42:publish',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  },
  {
    id: '12349',
    name: 'PR-43:main',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  }
], true);
