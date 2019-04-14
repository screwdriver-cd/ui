import { resolve } from 'rsvp';
import { getOwner } from '@ember/application';
import { run } from '@ember/runloop';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import DS from 'ember-data';

let subject;

module('Unit | Mixin | model reloader mixin', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.subject = function() {
      const ModelReloaderObject = DS.Model.extend(ModelReloaderMixin);

      this.owner.register('model:reload-mixin', ModelReloaderObject);

      return run(() => {
        let store = getOwner(this).lookup('service:store');

        return store.createRecord('reload-mixin', { isPaused: false });
      });
    };
  });

  hooks.beforeEach(function() {
    subject = this.owner.lookup('mixin:model-reloader');
  });

  test('it mixes in to an ember object', function(assert) {
    assert.ok(typeof subject.startReloading === 'function');
  });

  test('it try to start a reloading model', function(assert) {
    subject.set('scheduleReload', () => {
      subject.set('runLater', 'foo');
    });
    subject.startReloading();
    assert.equal(subject.get('runLater'), 'foo');
  });

  test('it not try to start a reloading model', function(assert) {
    subject.set('runLater', 1);
    subject.set('scheduleReload', () => {
      subject.set('runLater', 'foo');
    });
    subject.startReloading();
    assert.equal(subject.get('runLater'), 1);
  });

  test('it will stop a reloading model', function(assert) {
    subject.set('runLater', 1);

    subject.stopReloading();
    assert.notOk(subject.get('runLater'));
  });

  test('it calls reload on a model', function(assert) {
    assert.expect(1);
    subject.set('testModel', {
      reload() {
        assert.ok(true);

        return resolve({});
      }
    });

    subject.set('runLater', 'foo');
    subject.set('modelToReload', 'testModel');

    subject.reloadModel();
  });

  test('it should not reload a model if shouldReload returns false', function(assert) {
    assert.expect(1);
    const testModel = {
      reload() {
        assert.ok(true);

        return Promise.resolve({});
      }
    };

    subject.set('testModel', testModel);
    subject.set('shouldReload', m => {
      assert.equal(m, testModel);

      return false;
    });
    subject.set('modelToReload', 'testModel');

    subject.reloadModel();
  });

  test('it force reloads a model', function(assert) {
    assert.expect(2);
    subject.set('testModel', {
      reload() {
        assert.ok(true);

        return resolve({});
      }
    });
    subject.set('modelToReload', 'testModel');

    subject.forceReload();

    return settled().then(() => {
      assert.ok(true);
    });
  });

  test('it calls reload function if modelToReload is absent', function(assert) {
    assert.expect(1);

    subject.set('reload', function() {
      assert.ok(true);

      return resolve({});
    });

    subject.set('runLater', 'foo');

    subject.reloadModel();
  });
});
