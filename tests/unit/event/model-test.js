import { run } from '@ember/runloop';
import { get } from '@ember/object';
import { moduleForModel, test } from 'ember-qunit';

const workflowGraph = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { name: 'main', id: 1 },
    { name: 'A', id: 2 },
    { name: 'B', id: 3 },
    { name: 'C', id: 4 },
    { name: 'D', id: 5 }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'A' },
    { src: 'main', dest: 'B' },
    { src: 'A', dest: 'C' },
    { src: 'B', dest: 'D' },
    { src: 'C', dest: 'D' }
  ]
};

moduleForModel('event', 'Unit | Model | event', {
  // Specify the other units that are required for this test.
  needs: ['model:build']
});

test('it exists', function (assert) {
  let model = this.subject();

  assert.ok(!!model);
});

test('it is not completed when there are no builds', function (assert) {
  const model = this.subject({ builds: [], workflowGraph, startFrom: '~commit' });

  return get(model, 'isComplete').then(isComplete => assert.notOk(isComplete));
});

test('it is not completed when the a build is not complete', function (assert) {
  run(() => {
    const build = this.store().createRecord('build', { jobId: 1, status: 'RUNNING' });
    const model = this.subject({ builds: [build], workflowGraph, startFrom: '~commit' });

    return get(model, 'isComplete').then(isComplete => assert.notOk(isComplete));
  });
});

test('it is completed when any build is unsuccessful', function (assert) {
  run(() => {
    const build = this.store().createRecord('build', { status: 'ABORTED' });
    const model = this.subject({ builds: [build], workflowGraph, startFrom: '~commit' });

    return get(model, 'isComplete').then(isComplete => assert.ok(isComplete));
  });
});

test('it is not completed when all not all expected builds have run', function (assert) {
  run(() => {
    const build = this.store().createRecord('build', { status: 'SUCCESS' });
    const model = this.subject({ builds: [build], workflowGraph, startFrom: '~commit' });

    return get(model, 'isComplete').then(isComplete => assert.notOk(isComplete));
  });
});

test('it is complete when all expected builds have run', function (assert) {
  run(() => {
    const build1 = this.store().createRecord('build', { jobId: 1, status: 'SUCCESS' });
    const build2 = this.store().createRecord('build', { jobId: 2, status: 'SUCCESS' });
    const build3 = this.store().createRecord('build', { jobId: 3, status: 'SUCCESS' });
    const build4 = this.store().createRecord('build', { jobId: 4, status: 'SUCCESS' });
    const build5 = this.store().createRecord('build', { jobId: 5, status: 'SUCCESS' });
    const model = this.subject({
      builds: [build5, build4, build3, build2, build1],
      workflowGraph,
      startFrom: '~commit'
    });

    return get(model, 'isComplete').then(isComplete => assert.ok(isComplete));
  });
});

test('it is RUNNING when there are no builds', function (assert) {
  run(() => {
    const model = this.subject({ builds: [], workflowGraph, startFrom: '~commit' });

    get(model, 'status').then(status => assert.equal('RUNNING', status));
  });
});

test('it returns build status when a build is not SUCCESS', function (assert) {
  run(() => {
    const build1 = this.store().createRecord('build', { jobId: 1, status: 'ABORTED' });
    const build2 = this.store().createRecord('build', { jobId: 2, status: 'SUCCESS' });
    const model = this.subject({ builds: [build2, build1], workflowGraph, startFrom: '~commit' });

    get(model, 'status').then(status => assert.equal('ABORTED', status));
  });
});

test('it is SUCCESS when all expected builds have run successfully', function (assert) {
  run(() => {
    const build1 = this.store().createRecord('build', { jobId: 1, status: 'SUCCESS' });
    const build2 = this.store().createRecord('build', { jobId: 2, status: 'SUCCESS' });
    const build3 = this.store().createRecord('build', { jobId: 3, status: 'SUCCESS' });
    const build4 = this.store().createRecord('build', { jobId: 4, status: 'SUCCESS' });
    const build5 = this.store().createRecord('build', { jobId: 5, status: 'SUCCESS' });
    const model = this.subject({
      builds: [build5, build4, build3, build2, build1],
      workflowGraph,
      startFrom: '~commit'
    });

    return get(model, 'status').then(status => assert.equal('SUCCESS', status));
  });
});
