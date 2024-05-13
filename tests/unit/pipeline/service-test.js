import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import Service from '@ember/service';
import { resolve } from 'rsvp';

let pipelines;

const userPreference = EmberObject.create({
  id: 123,
  showPRJobs: true
});

const storeServiceStub = Service.extend({
  query() {
    return pipelines;
  },
  peekAll() {
    /* eslint new-cap: ["error", { "capIsNewExceptions": ["A"] }] */
    return A([
      EmberObject.create({
        id: 200,
        showPRJobs: true
      })
    ]);
  },
  createRecord() {
    return EmberObject.create({
      id: userPreference.id,
      showPRJobs: userPreference.showPRJobs
    });
  }
});

const userSettingsServiceStub = Service.extend({
  getUserPreference() {
    return resolve(userPreference);
  }
});

module('Unit | Service | pipeline', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.unregister('service:store');
    this.owner.register('service:store', storeServiceStub);
    this.owner.unregister('service:userSettings');
    this.owner.register('service:userSettings', userSettingsServiceStub);
  });

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:pipeline');

    assert.ok(service);
  });

  test('it handles updating job state', function (assert) {
    pipelines = EmberObject.create([
      {
        id: 123456,
        name: 'screwdriver-cd/screwdriver'
      }
    ]);

    const service = this.owner.lookup('service:pipeline');
    const value = service.getSiblingPipeline('screwdriver-cd/screwdriver');

    assert.equal(value, pipelines);
  });

  test('it returns an empty object if no pipeline was specified', async function (assert) {
    const service = this.owner.lookup('service:pipeline');
    const pipelinePreference = await service.getUserPipelinePreference();

    assert.equal(Object.keys(pipelinePreference).length, 0);
  });

  test('it returns pipeline preferences if they exist', async function (assert) {
    const pipelineId = 200;
    const service = this.owner.lookup('service:pipeline');
    const pipelinePreference = await service.getUserPipelinePreference(
      pipelineId
    );

    assert.equal(Object.keys(pipelinePreference).length, 2);
    assert.equal(pipelinePreference.id, pipelineId);
    assert.equal(pipelinePreference.showPRJobs, true);
  });

  test('it creates preferences if none exist', async function (assert) {
    const service = this.owner.lookup('service:pipeline');
    const pipelinePreference = await service.getUserPipelinePreference(
      userPreference.id
    );

    assert.equal(Object.keys(pipelinePreference).length, 2);
    assert.equal(pipelinePreference.id, userPreference.id);
    assert.equal(pipelinePreference.showPRJobs, userPreference.showPRJobs);
  });
});
