import Ember from 'ember';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { module, test } from 'qunit';
let subject;

module('Unit | Mixin | model reloader mixin', {
  beforeEach() {
    const ModelReloaderObject = Ember.Object.extend(ModelReloaderMixin);

    subject = ModelReloaderObject.create();
  }
});

test('it mixes in to an ember object', function (assert) {
  assert.ok(typeof subject.startReloading === 'function');
});

test('it try to start a reloading model', function (assert) {
  subject.set('scheduleReload', () => {
    subject.set('runLater', 'foo');
  });
  subject.startReloading();
  assert.equal(subject.get('runLater'), 'foo');
});

test('it not try to start a reloading model', function (assert) {
  subject.set('runLater', 1);
  subject.set('scheduleReload', () => {
    subject.set('runLater', 'foo');
  });
  subject.startReloading();
  assert.equal(subject.get('runLater'), 1);
});

test('it will stop a reloading model', function (assert) {
  subject.set('runLater', 1);

  subject.stopReloading();
  assert.notOk(subject.get('runLater'));
});

test('it calls reload on a model', function (assert) {
  assert.expect(1);
  subject.set('testModel', {
    reload() {
      assert.ok(true);

      return Ember.RSVP.resolve({});
    }
  });
  subject.set('modelToReload', 'testModel');

  subject.reloadModel();
});

test('it should not reload a model if shouldReload returns false', function (assert) {
  assert.expect(1);
  const testModel = {
    reload() {
      assert.ok(true);

      return Promise.resolve({});
    }
  };

  subject.set('testModel', testModel);
  subject.set('shouldReload', (m) => {
    assert.equal(m, testModel);

    return false;
  });
  subject.set('modelToReload', 'testModel');

  subject.reloadModel();
});
