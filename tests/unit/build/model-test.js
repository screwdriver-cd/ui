import { run } from '@ember/runloop';
import { moduleForModel, test } from 'ember-qunit';

moduleForModel('build', 'Unit | Model | build', {
  // Specify the other units that are required for this test.
  needs: []
});

test('it exists and has statusMessage defaults to null', function (assert) {
  let model = this.subject();

  assert.ok(!!model);
  assert.equal(model.get('statusMessage'), null);
});

test('it calculates queuedDuration', function (assert) {
  let model = this.subject({
    createTime: new Date(1472244582531),
    startTime: new Date(1472244592531)
  });

  run(() => {
    assert.equal(model.get('queuedDuration'), '10 seconds');
    model.set('startTime', null);
    assert.equal(model.get('queuedDuration'), '0 seconds');
  });
});

test('it calculates buildDuration', function (assert) {
  let model = this.subject({
    startTime: new Date(1472244582531),
    endTime: new Date(1472244592531)
  });

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

test('it humanizes createTime', function (assert) {
  const createTime = new Date(1472244582531);
  let model = this.subject({
    createTime
  });

  run(() => {
    assert.equal(model.get('createTimeWords'),
      `${humanizeDuration(Date.now() - createTime, { round: true, largest: 1 })} ago`);
  });
});

test('it truncates the sha', function (assert) {
  const sha = '026c5b76b210f96dc27011b553679a7663b38698';
  let model = this.subject({
    sha
  });

  run(() => {
    assert.equal(model.get('truncatedSha'), '026c5b');
  });
});
