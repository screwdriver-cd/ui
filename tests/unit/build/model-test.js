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
    assert.equal(model.get('queuedDuration'), 10);
    model.set('startTime', null);
    assert.equal(model.get('queuedDuration'), 0);
  });
});

test('it calculates buildDuration', function (assert) {
  let model = this.subject({
    startTime: new Date(1472244582531),
    endTime: new Date(1472244592531)
  });

  Ember.run(() => {
    assert.equal(model.get('buildDuration'), 10);
    model.set('endTime', null);
    assert.equal(model.get('buildDuration'), 0);
  });
});
