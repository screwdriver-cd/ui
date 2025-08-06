import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import { settled } from '@ember/test-helpers';

module('Unit | Model | event', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    assert.ok(!!this.owner.lookup('service:store').createRecord('event'));
  });

  test('it is not completed when there are no builds', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('event');

    await settled();

    const { isComplete } = model;

    assert.notOk(isComplete);
  });

  // Testing observers is messy, need to change the model value, then schedule to read the newly set value later
  test('it is not completed when the a build is not complete', async function (assert) {
    const build = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 1, status: 'RUNNING' });
    const model = this.owner.lookup('service:store').createRecord('event');

    run(() => model.set('builds', [build]));

    await settled();

    assert.notOk(model.get('isComplete'));
  });

  test('it is not completed when new builds created during reload', async function (assert) {
    assert.expect(3);

    const build1 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 1, status: 'SUCCESS' });
    const build2 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 2, status: 'SUCCESS' });
    const build3 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 3, status: 'SUCCESS' });
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('event')
    );

    let reloadCnt = 0;

    run(() => {
      model.set('builds', [build1]);
      model.set('buildId', 121);
      model.set('startReloading', function () {
        reloadCnt += 1;

        if (reloadCnt > 2) {
          return;
        }

        // During each reload, add one new build
        if (reloadCnt === 1) {
          this.set('builds', [build2, build1]);
        } else {
          this.set('builds', [build3, build2, build1]);
        }

        // New build added during reload, event not complete
        const { isComplete } = model;

        assert.notOk(isComplete);
      });
    });

    await settled();

    // Since no new builds added after 2 reloads, event eventually finishes
    const { isComplete } = model;

    assert.ok(isComplete);
  });

  test('it is complete when all builds have run', async function (assert) {
    const build1 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 1, status: 'SUCCESS' });
    const build2 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 2, status: 'SUCCESS' });
    const build3 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 3, status: 'SUCCESS' });
    const build4 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 4, status: 'SUCCESS' });
    const build5 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 5, status: 'SUCCESS' });
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('event')
    );

    run(() => model.set('builds', [build5, build4, build3, build2, build1]));

    await settled();

    const { isComplete } = model;

    assert.ok(isComplete);
  });

  test('it is skipped when commit massage contains skip ci', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('event');

    run(() => {
      model.set('commit', { message: '[skip ci] skip ci build.' });
      model.set('type', 'pipeline');
    });

    await settled();

    const { isSkipped } = model;

    assert.ok(isSkipped);
  });

  test('it is not skipped when commit type is pr', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('event');

    run(() => {
      model.set('commit', { message: '[skip ci] skip ci build.' });
      model.set('type', 'pr');
    });

    await settled();

    const { isSkipped } = model;

    assert.notOk(isSkipped);
  });

  test('it is not skipped when it has builds', async function (assert) {
    const build = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 1, status: 'RUNNING' });
    const model = this.owner.lookup('service:store').createRecord('event');

    run(() => {
      model.set('commit', { message: '[skip ci] skip ci build.' });
      model.set('type', 'pipeline');
      model.set('builds', [build]);
    });

    await settled();

    const { isSkipped } = model;

    assert.notOk(isSkipped);
  });

  test('it is UNKNOWN when there are no builds', async function (assert) {
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('event')
    );

    run(() => model.set('builds', []));

    await settled();

    const { status } = model;

    assert.equal(status, 'UNKNOWN');
  });

  test('it returns build status when a build is not SUCCESS', async function (assert) {
    const build1 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 1, status: 'ABORTED' });
    const build2 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 2, status: 'SUCCESS' });
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('event')
    );

    run(() => model.set('builds', [build2, build1]));

    await settled();

    const { status } = model;

    assert.equal(status, 'ABORTED');
  });

  test('it is SUCCESS when all expected builds have run successfully', async function (assert) {
    const build1 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 1, status: 'SUCCESS' });
    const build2 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 2, status: 'SUCCESS' });
    const build3 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 3, status: 'SUCCESS' });
    const build4 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 4, status: 'SUCCESS' });
    const build5 = this.owner
      .lookup('service:store')
      .createRecord('build', { jobId: 5, status: 'SUCCESS' });
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('event')
    );

    run(() => model.set('builds', [build5, build4, build3, build2, build1]));

    await settled();

    const { status } = model;

    assert.equal(status, 'SUCCESS');
  });

  test('it returns event duration whenever builds have run in parallel', async function (assert) {
    const eventStartTime = 1472244582531;
    const elapsed10secsTime = eventStartTime + 10000;
    const elapsed20secsTime = eventStartTime + 20000;
    const build1 = this.owner.lookup('service:store').createRecord('build', {
      jobId: 1,
      createTime: new Date(eventStartTime),
      endTime: new Date(elapsed10secsTime),
      status: 'SUCCESS'
    });
    const build2 = this.owner.lookup('service:store').createRecord('build', {
      jobId: 2,
      createTime: new Date(eventStartTime),
      endTime: new Date(elapsed20secsTime),
      status: 'ABORTED'
    });
    const build3 = this.owner.lookup('service:store').createRecord('build', {
      jobId: 3,
      createTime: new Date(eventStartTime),
      status: 'SUCCESS'
    });
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('event')
    );

    run(() => model.set('builds', [build2, build1, build3]));

    await settled();

    const { duration } = model;

    assert.equal(duration, 20000);
  });

  test('it returns event duration until now if not completed yet', async function (assert) {
    const eventStartTime = 1472244582531;
    const elapsed10secsTime = eventStartTime + 10000;
    const elapsed20secsTime = eventStartTime + 20000;
    const build1 = this.owner.lookup('service:store').createRecord('build', {
      jobId: 1,
      createTime: new Date(eventStartTime),
      endTime: new Date(elapsed10secsTime)
    });
    const build2 = this.owner.lookup('service:store').createRecord('build', {
      jobId: 2,
      createTime: new Date(eventStartTime),
      endTime: new Date(elapsed10secsTime)
    });
    const build3 = this.owner.lookup('service:store').createRecord('build', {
      jobId: 3,
      createTime: new Date(elapsed20secsTime),
      status: 'RUNNING'
    });
    const testStartTime = new Date().getTime();
    const model = run(() =>
      this.owner.lookup('service:store').createRecord('event')
    );

    run(() => model.set('builds', [build2, build1, build3]));

    await settled();

    const { duration } = model;
    const testFinishedTime = new Date().getTime();

    assert.ok(
      duration >= testStartTime - eventStartTime,
      `duration ${duration} should be equal or longer than test start ${testStartTime}`
    );
    assert.ok(
      duration <= testFinishedTime - eventStartTime,
      `duration ${duration} should be equal or shorter than test finished ${testFinishedTime}`
    );
  });
});
