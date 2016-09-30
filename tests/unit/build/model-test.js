import { moduleForModel, test } from 'ember-qunit';
import Ember from 'ember';

moduleForModel('build', 'Unit | Model | build', {
  // Specify the other units that are required for this test.
  needs: []
});

test('it exists', function (assert) {
  let model = this.subject();

  assert.ok(!!model);
});

test('it calculates queuedDuration', function (assert) {
  let model = this.subject({
    createTime: new Date(1472244582531),
    startTime: new Date(1472244592531)
  });

  Ember.run(() => {
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

  Ember.run(() => {
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

  Ember.run(() => {
    assert.equal(model.get('createTimeWords'),
    `${humanizeDuration(Date.now() - createTime, { round: true, largest: 1 })} ago`);
  });
});
