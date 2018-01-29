import { resolve } from 'rsvp';
import EmberObject from '@ember/object';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { module, test } from 'qunit';
import wait from 'ember-test-helpers/wait';

let subject;

module('Unit | Mixin | model reloader mixin', {
  beforeEach() {
    const ModelReloaderObject = EmberObject.extend(ModelReloaderMixin);

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

      return resolve({});
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

test('it force reloads a model', function (assert) {
  assert.expect(2);
  subject.set('testModel', {
    reload() {
      assert.ok(true);

      return resolve({});
    }
  });
  subject.set('modelToReload', 'testModel');

  subject.forceReload();

  return wait().then(() => {
    assert.ok(true);
  });
});
