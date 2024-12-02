import { reject, resolve } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import EmberObject from '@ember/object';
import { settled } from '@ember/test-helpers';
import injectSessionStub from '../../helpers/inject-session';

module('Unit | Controller | search', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    injectSessionStub(this);
    const controller = this.owner.lookup('controller:search');

    assert.ok(controller);
  });

  test('it calls updatePipelines', function (assert) {
    injectSessionStub(this);
    const controller = this.owner.lookup('controller:search');

    const pipelineModelMockArray = [
      EmberObject.create({
        id: 2,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      }),
      EmberObject.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })
    ];

    controller.store.query = (modelName, params) => {
      assert.strictEqual(modelName, 'pipeline');
      assert.deepEqual(params, {
        page: 2,
        count: 3,
        sortBy: 'name',
        sort: 'ascending'
      });

      return resolve(pipelineModelMockArray);
    };

    controller.send('updatePipelines', { page: 2 });
  });

  test('it calls updatePipelines with search param', function (assert) {
    injectSessionStub(this);
    const controller = this.owner.lookup('controller:search');

    const pipelineModelMockArray = [
      EmberObject.create({
        id: 2,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      }),
      EmberObject.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })
    ];

    controller.store.query = (modelName, params) => {
      assert.strictEqual(modelName, 'pipeline');
      assert.deepEqual(params, {
        page: 2,
        count: 3,
        sortBy: 'name',
        sort: 'ascending',
        search: 'ba'
      });

      return resolve(pipelineModelMockArray);
    };

    controller.send('updatePipelines', { page: 2, search: 'ba' });
  });

  test('it calls updatePipelines when search result is zero', async function (assert) {
    injectSessionStub(this);
    const controller = this.owner.lookup('controller:search');

    const pipelineModelMockArray = [
      EmberObject.create({
        id: 2,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      })
    ];

    controller.store.query = (_, params) => {
      if (params.page === 1) {
        return resolve(pipelineModelMockArray);
      }
      if (params.page === 2) {
        return resolve([]);
      }

      return reject('This should not run');
    };

    controller.send('updatePipelines', { page: 1 });
    await settled();
    assert.strictEqual(controller.moreToShow, true);

    controller.send('updatePipelines', { page: 2 });
    await settled();
    assert.strictEqual(controller.moreToShow, false);
  });

  test('it calls addToCollection', function (assert) {
    injectSessionStub(this);
    const controller = this.owner.lookup('controller:search');

    let pipelineIds = [1, 2];

    const collectionModelMock = {
      id: 1,
      name: 'collection1',
      description: 'description1',
      pipelineIds,
      get(field) {
        assert.strictEqual(field, 'pipelineIds');

        // The collection currently has pipelineIds 1 and 2
        return pipelineIds;
      },
      set(field, value) {
        assert.strictEqual(field, 'pipelineIds');
        assert.deepEqual(value, [1, 2, 3]);

        pipelineIds = value;
      },
      save() {
        assert.deepEqual(pipelineIds, [1, 2, 3]);

        return resolve({
          id: 1,
          name: 'collection1',
          description: 'description1',
          pipelineIds: [1, 2, 3]
        });
      }
    };

    controller.store.findRecord = (modelName, collectionId) => {
      assert.strictEqual(modelName, 'collection');
      assert.strictEqual(collectionId, 1);

      return resolve(collectionModelMock);
    };

    // Add pipeline with id 3 to collection with id 1
    controller.send('addToCollection', 3, 1);
  });
});
