import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Model | build', function (hooks) {
  setupTest(hooks);

  test('it exists and has statusMessage defaults to null', function (assert) {
    let model = run(() =>
      this.owner.lookup('service:store').createRecord('build')
    );

    assert.ok(!!model);
    assert.equal(model.get('statusMessage'), null);
  });

  test('it calculates blockedDuration', function (assert) {
    let model = run(() =>
      this.owner.lookup('service:store').createRecord('build', {
        createTime: new Date(1472244582531),
        stats: {
          imagePullStartTime: 'Fri Aug 26 2016 13:49:52 GMT-0700 (PDT)'
        }
      })
    );

    run(() => {
      assert.equal(model.get('blockedDuration'), '9 seconds');
      model.set('stats.imagePullStartTime', null);
      assert.equal(model.get('blockedDuration'), '0 seconds');
    });
  });

  test('it calculates imagePullDuration', function (assert) {
    let model = run(() =>
      this.owner.lookup('service:store').createRecord('build', {
        stats: {
          imagePullStartTime: 'Fri Aug 26 2016 13:48:52 GMT-0700 (PDT)'
        },
        startTime: new Date(1472244592531)
      })
    );

    run(() => {
      assert.equal(model.get('imagePullDuration'), '1 minute, 1 second');
      model.set('startTime', null);
      assert.equal(model.get('imagePullDuration'), '0 seconds');
    });
  });

  test('it calculates buildDuration', function (assert) {
    let model = run(() =>
      this.owner.lookup('service:store').createRecord('build', {
        createTime: new Date(1472244572531),
        startTime: new Date(1472244582531),
        endTime: new Date(1472244592531)
      })
    );

    run(() => {
      // valid duration
      assert.equal(model.get('buildDuration'), '10 seconds');
      // no end time, so duration is 0
      model.set('endTime', null);
      assert.equal(model.get('buildDuration'), '0 seconds');
      // no start time, so duration is 0
      model.set('endTime', new Date(1472244592531));
      model.set('startTime', null);
      assert.equal(model.get('buildDuration'), '0 seconds');
    });
  });

  test('it calculates totalDuration', function (assert) {
    let model = run(() =>
      this.owner.lookup('service:store').createRecord('build', {
        createTime: new Date(1472244572531),
        startTime: new Date(1472244582531),
        endTime: new Date(1472244592531)
      })
    );

    run(() => {
      // valid duration
      assert.equal(model.get('totalDuration'), '20 seconds');
      // no end time, so duration is 0
      model.set('endTime', null);
      assert.equal(model.get('totalDuration'), '0 seconds');
      // no start time, so duration is 0
      model.set('endTime', new Date(1472244592531));
      model.set('createTime', null);
      assert.equal(model.get('totalDuration'), '0 seconds');
    });
  });

  test('it humanizes createTime', function (assert) {
    const createTime = new Date(1472244582531);

    let model = run(() =>
      this.owner.lookup('service:store').createRecord('build', {
        createTime
      })
    );

    run(() => {
      assert.equal(
        model.get('createTimeWords'),
        `${humanizeDuration(Date.now() - createTime, {
          round: true,
          largest: 1
        })} ago`
      );
    });
  });

  test('it truncates the sha', function (assert) {
    const sha = '026c5b76b210f96dc27011b553679a7663b38698';

    let model = run(() =>
      this.owner.lookup('service:store').createRecord('build', {
        sha
      })
    );

    run(() => {
      assert.equal(model.get('truncatedSha'), '026c5b7');
    });
  });
});
