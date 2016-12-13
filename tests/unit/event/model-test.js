import { moduleForModel, test } from 'ember-qunit';
import Ember from 'ember';

const workflow = ['one', 'two', 'three', 'four'];

moduleForModel('event', 'Unit | Model | event', {
  // Specify the other units that are required for this test.
  needs: ['model:build']
});

test('it exists', function (assert) {
  let model = this.subject();

  assert.ok(!!model);
});

test('it is not completed when there are no builds', function (assert) {
  const model = this.subject({ builds: [], workflow });

  assert.notOk(model.get('isComplete'));
});

test('it is not completed when the most recent build is not complete', function (assert) {
  Ember.run(() => {
    const build = this.store().createRecord('build', { status: 'RUNNING' });
    const model = this.subject({ builds: [build], workflow });

    assert.notOk(model.get('isComplete'));
  });
});

test('it is completed when the most recent build is unsuccessful', function (assert) {
  Ember.run(() => {
    const build = this.store().createRecord('build', { status: 'ABORTED' });
    const model = this.subject({ builds: [build], workflow });

    assert.ok(model.get('isComplete'));
  });
});

test('it is not completed when all not all builds have run', function (assert) {
  Ember.run(() => {
    const build = this.store().createRecord('build', { status: 'SUCCESS' });
    const model = this.subject({ builds: [build], workflow });

    assert.notOk(model.get('isComplete'));
  });
});

test('it is complete when all builds have run', function (assert) {
  Ember.run(() => {
    const build1 = this.store().createRecord('build', { status: 'SUCCESS' });
    const build2 = this.store().createRecord('build', { status: 'SUCCESS' });
    const build3 = this.store().createRecord('build', { status: 'SUCCESS' });
    const build4 = this.store().createRecord('build', { status: 'SUCCESS' });
    const model = this.subject({ builds: [build4, build3, build2, build1], workflow });

    assert.ok(model.get('isComplete'));
  });
});
