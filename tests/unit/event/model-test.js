import { run } from '@ember/runloop';
import { get } from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Model | event', function(hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let model = run(() => this.owner.lookup('service:store').createRecord('event'));

    assert.ok(!!model);
  });

  test('it is not completed when there are no builds', function (assert) {
    const model = run(() => this.owner.lookup('service:store').createRecord('event'));

    run.next(this, () => {
      const isComplete = get(model, 'isComplete');

      assert.notOk(isComplete);
    });
  });

  // Testing observers is messy, need to change the model value, then schedule to read the newly set value later
  test('it is not completed when the a build is not complete', function (assert) {
    run(() => {
      const build = this.owner.lookup('service:store').createRecord('build', { jobId: 1, status: 'RUNNING' });
      const model = run(() => this.owner.lookup('service:store').createRecord('event'));

      model.set('builds', [build]);

      run.next(this, () => {
        const isComplete = get(model, 'isComplete');

        assert.notOk(isComplete);
      });
    });
  });

  test('it is not completed when new builds created during reload', function (assert) {
    run(() => {
      assert.expect(3);
      const build1 = this.owner.lookup('service:store').createRecord('build', { jobId: 1, status: 'SUCCESS' });
      const build2 = this.owner.lookup('service:store').createRecord('build', { jobId: 2, status: 'SUCCESS' });
      const build3 = this.owner.lookup('service:store').createRecord('build', { jobId: 3, status: 'SUCCESS' });
      const model = run(() => this.owner.lookup('service:store').createRecord('event'));
      let reloadCnt = 0;

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
        const isComplete = get(model, 'isComplete');

        assert.notOk(isComplete);
      });

      run.next(this, () => {
        // Since no new builds addes after 2 reloads, event eventually finishes
        const isComplete = get(model, 'isComplete');

        assert.ok(isComplete);
      });
    });
  });

  test('it is complete when all builds have run', function (assert) {
    run(() => {
      const build1 = this.owner.lookup('service:store').createRecord('build', { jobId: 1, status: 'SUCCESS' });
      const build2 = this.owner.lookup('service:store').createRecord('build', { jobId: 2, status: 'SUCCESS' });
      const build3 = this.owner.lookup('service:store').createRecord('build', { jobId: 3, status: 'SUCCESS' });
      const build4 = this.owner.lookup('service:store').createRecord('build', { jobId: 4, status: 'SUCCESS' });
      const build5 = this.owner.lookup('service:store').createRecord('build', { jobId: 5, status: 'SUCCESS' });
      const model = run(() => this.owner.lookup('service:store').createRecord('event'));

      model.set('builds', [build5, build4, build3, build2, build1]);

      run.next(this, () => {
        const isComplete = get(model, 'isComplete');

        assert.ok(isComplete);
      });
    });
  });

  test('it is RUNNING when there are no builds', function (assert) {
    run(() => {
      const model = run(() => this.owner.lookup('service:store').createRecord('event'));

      model.set('builds', []);

      run.next(this, () => {
        const status = get(model, 'status');

        assert.equal(status, 'RUNNING');
      });
    });
  });

  test('it returns build status when a build is not SUCCESS', function (assert) {
    run(() => {
      const build1 = this.owner.lookup('service:store').createRecord('build', { jobId: 1, status: 'ABORTED' });
      const build2 = this.owner.lookup('service:store').createRecord('build', { jobId: 2, status: 'SUCCESS' });
      const model = run(() => this.owner.lookup('service:store').createRecord('event'));

      model.set('builds', [build2, build1]);

      run.next(this, () => {
        const status = get(model, 'status');

        assert.equal(status, 'ABORTED');
      });
    });
  });

  test('it is SUCCESS when all expected builds have run successfully', function (assert) {
    run(() => {
      const build1 = this.owner.lookup('service:store').createRecord('build', { jobId: 1, status: 'SUCCESS' });
      const build2 = this.owner.lookup('service:store').createRecord('build', { jobId: 2, status: 'SUCCESS' });
      const build3 = this.owner.lookup('service:store').createRecord('build', { jobId: 3, status: 'SUCCESS' });
      const build4 = this.owner.lookup('service:store').createRecord('build', { jobId: 4, status: 'SUCCESS' });
      const build5 = this.owner.lookup('service:store').createRecord('build', { jobId: 5, status: 'SUCCESS' });
      const model = run(() => this.owner.lookup('service:store').createRecord('event'));

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
      const model = run(() => this.owner.lookup('service:store').createRecord('event'));

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
      const model = run(() => this.owner.lookup('service:store').createRecord('event'));
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
});
