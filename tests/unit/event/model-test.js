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
  const model = this.subject({ workflowGraph, startFrom: '~commit' });

  run.next(this, () => {
    const isComplete = get(model, 'isComplete');

    assert.notOk(isComplete);
  });
});

// Testing observers is messy, need to change the model value, then schedule to read the newly set value later
test('it is not completed when the a build is not complete', function (assert) {
  run(() => {
    const build = this.store().createRecord('build', { jobId: 1, status: 'RUNNING' });
    const model = this.subject({ workflowGraph, startFrom: '~commit' });

    model.set('builds', [build]);

    run.next(this, () => {
      const isComplete = get(model, 'isComplete');

      assert.notOk(isComplete);
    });
  });
});

test('it is completed when any build is unsuccessful', function (assert) {
  run(() => {
    const build = this.store().createRecord('build', { status: 'ABORTED' });
    const model = this.subject({ workflowGraph, startFrom: '~commit' });

    model.set('builds', [build]);

    run.next(this, () => {
      const isComplete = get(model, 'isComplete');

      assert.ok(isComplete);
    });
  });
});

test('it is not completed when all not all expected builds have run', function (assert) {
  run(() => {
    const build = this.store().createRecord('build', { status: 'SUCCESS' });
    const model = this.subject({ workflowGraph, startFrom: '~commit' });

    model.set('builds', [build]);

    run.next(this, () => {
      const isComplete = get(model, 'isComplete');

      assert.notOk(isComplete);
    });
  });
});

test('it is complete when all expected builds have run', function (assert) {
  run(() => {
    const build1 = this.store().createRecord('build', { jobId: 1, status: 'SUCCESS' });
    const build2 = this.store().createRecord('build', { jobId: 2, status: 'SUCCESS' });
    const build3 = this.store().createRecord('build', { jobId: 3, status: 'SUCCESS' });
    const build4 = this.store().createRecord('build', { jobId: 4, status: 'SUCCESS' });
    const build5 = this.store().createRecord('build', { jobId: 5, status: 'SUCCESS' });
    const model = this.subject({ workflowGraph, startFrom: '~commit' });

    model.set('builds', [build5, build4, build3, build2, build1]);

    run.next(this, () => {
      const isComplete = get(model, 'isComplete');

      assert.ok(isComplete);
    });
  });
});

test('it is RUNNING when there are no builds', function (assert) {
  run(() => {
    const model = this.subject({ workflowGraph, startFrom: '~commit' });

    model.set('builds', []);

    run.next(this, () => {
      const status = get(model, 'status');

      assert.equal(status, 'RUNNING');
    });
  });
});

test('it returns build status when a build is not SUCCESS', function (assert) {
  run(() => {
    const build1 = this.store().createRecord('build', { jobId: 1, status: 'ABORTED' });
    const build2 = this.store().createRecord('build', { jobId: 2, status: 'SUCCESS' });
    const model = this.subject({ workflowGraph, startFrom: '~commit' });

    model.set('builds', [build2, build1]);

    run.next(this, () => {
      const status = get(model, 'status');

      assert.equal(status, 'ABORTED');
    });
  });
});

test('it is SUCCESS when all expected builds have run successfully', function (assert) {
  run(() => {
    const build1 = this.store().createRecord('build', { jobId: 1, status: 'SUCCESS' });
    const build2 = this.store().createRecord('build', { jobId: 2, status: 'SUCCESS' });
    const build3 = this.store().createRecord('build', { jobId: 3, status: 'SUCCESS' });
    const build4 = this.store().createRecord('build', { jobId: 4, status: 'SUCCESS' });
    const build5 = this.store().createRecord('build', { jobId: 5, status: 'SUCCESS' });
    const model = this.subject({ workflowGraph, startFrom: '~commit' });

    model.set('builds', [build5, build4, build3, build2, build1]);

    run.next(this, () => {
      const status = get(model, 'status');

      assert.equal(status, 'SUCCESS');
    });
  });
});

test('it returns event duration whenever builds have run in parallel', function (assert) {
  run(() => {
    const eventStartTime = 1472244582531;
    const elapsed10secsTime = eventStartTime + 10000;
    const elapsed20secsTime = eventStartTime + 20000;
    const build1 = this.store().createRecord('build', {
      jobId: 1,
      createTime: new Date(eventStartTime),
      endTime: new Date(elapsed10secsTime),
      status: 'SUCCESS'
    });
    const build2 = this.store().createRecord('build', {
      jobId: 2,
      createTime: new Date(eventStartTime),
      endTime: new Date(elapsed20secsTime),
      status: 'ABORTED'
    });
    const model = this.subject({ workflowGraph, startFrom: '~commit' });

    model.set('builds', [build2, build1]);

    run.next(this, () => {
      const duration = get(model, 'duration');

      assert.equal(duration, 20000);
    });
  });
});

test('it returns event duration until now if not completed yet', function (assert) {
  run(() => {
    const eventStartTime = 1472244582531;
    const elapsed10secsTime = eventStartTime + 10000;
    const elapsed20secsTime = eventStartTime + 20000;
    const build1 = this.store().createRecord('build', {
      jobId: 1,
      createTime: new Date(eventStartTime),
      endTime: new Date(elapsed10secsTime)
    });
    const build2 = this.store().createRecord('build', {
      jobId: 2,
      createTime: new Date(eventStartTime),
      endTime: new Date(elapsed10secsTime)
    });
    const build3 = this.store().createRecord('build', {
      jobId: 3,
      createTime: new Date(elapsed20secsTime),
      status: 'RUNNING'
    });
    const model = this.subject({ workflowGraph, startFrom: '~commit' });
    const testStartTime = new Date().getTime();

    model.set('builds', [build2, build1, build3]);

    run.next(this, () => {
      const duration = get(model, 'duration');
      const testFinishedTime = new Date().getTime();

      assert.ok(duration >= (testStartTime - eventStartTime),
        `duration ${duration} should be equal or longer than test start ${testStartTime}`);
      assert.ok(duration <= (testFinishedTime - eventStartTime),
        `duration ${duration} should be equal or shorter than test finished ${testFinishedTime}`);
    });
  });
});
