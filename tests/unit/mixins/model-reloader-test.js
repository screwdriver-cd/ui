import Model from '@ember-data/model';
import { resolve } from 'rsvp';
import { run } from '@ember/runloop';
import ModelReloaderMixin, {
  SHOULD_RELOAD_YES
} from 'screwdriver-ui/mixins/model-reloader';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

let subject;

module('Unit | Mixin | model reloader mixin', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    const ModelReloaderObject = Model.extend(ModelReloaderMixin);

    this.owner.register('model:reload-mixin', ModelReloaderObject);
    subject = this.owner
      .lookup('service:store')
      .createRecord('reload-mixin', { isPaused: false });
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
    assert.expect(2);
    subject.set('testModel', {
      reload() {
        assert.ok(true);

        return resolve({});
      }
    });

    subject.set('runLater', 'foo');
    subject.set('modelToReload', 'testModel');

    subject.shouldReload = model => {
      assert.ok(model);

      return SHOULD_RELOAD_YES;
    };
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
    subject.set('shouldReload', m => {
      assert.equal(m, testModel);

      return false;
    });
    subject.set('modelToReload', 'testModel');

    subject.reloadModel();
  });

  test('it force reloads a model', async function (assert) {
    assert.expect(3);

    subject.set('testModel', {
      reload() {
        assert.ok(true);

        return resolve({});
      }
    });
    subject.set('modelToReload', 'testModel');
    subject.shouldReload = model => {
      assert.ok(model);

      return SHOULD_RELOAD_YES;
    };

    subject.forceReload();

    run(() => {
      assert.ok(true);
    });
  });

  test('it calls reload function if modelToReload is absent', function (assert) {
    assert.expect(2);

    subject.set('reload', function () {
      assert.ok(true);

      return resolve({});
    });

    subject.shouldReload = model => {
      assert.ok(model);

      return SHOULD_RELOAD_YES;
    };

    subject.set('runLater', 'foo');

    subject.reloadModel();
  });
});
