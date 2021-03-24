import { resolve, reject } from 'rsvp';
import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, findAll, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import Service from '@ember/service';
import $ from 'jquery';
import wait from 'ember-test-helpers/wait';
import injectSessionStub from '../../../helpers/inject-session';
import injectScmServiceStub from '../../../helpers/inject-scm';

const mockDefaultCollection = EmberObject.create({
  id: 1,
  name: 'My Pipelines',
  description: 'Default Collection',
  type: 'default',
  pipelines: [
    {
      id: 1,
      scmUri: 'github.com:12345678:master',
      createTime: '2017-01-05T00:55:46.775Z',
      admins: {
        username: true
      },
      workflow: ['main'],
      scmRepo: {
        name: 'screwdriver-cd/screwdriver',
        branch: 'master',
        url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
      },
      scmContext: 'github:github.com',
      annotations: {},
      lastEventId: 12,
      lastBuilds: [
        {
          id: 123,
          status: 'SUCCESS',
          // Most recent build
          createTime: '2017-09-05T04:02:20.890Z'
        }
      ]
    },
    {
      id: 2,
      scmUri: 'github.com:87654321:master',
      createTime: '2017-01-05T00:55:46.775Z',
      admins: {
        username: true
      },
      workflow: ['main', 'publish'],
      scmRepo: {
        name: 'screwdriver-cd/ui',
        branch: 'master',
        url: 'https://github.com/screwdriver-cd/ui/tree/master'
      },
      scmContext: 'github:github.com',
      annotations: {},
      prs: {
        open: 2,
        failing: 1
      }
    },
    {
      id: 3,
      scmUri: 'github.com:54321876:master',
      createTime: '2017-01-05T00:55:46.775Z',
      admins: {
        username: true
      },
      workflow: ['main'],
      scmRepo: {
        name: 'screwdriver-cd/models',
        branch: 'master',
        url: 'https://github.com/screwdriver-cd/models/tree/master'
      },
      scmContext: 'bitbucket:bitbucket.org',
      annotations: {},
      lastEventId: 23,
      lastBuilds: [
        {
          id: 125,
          status: 'FAILURE',
          // 2nd most recent build
          createTime: '2017-09-05T04:01:41.789Z'
        }
      ]
    },
    {
      id: 4,
      scmUri: 'github.com:54321879:master:lib',
      createTime: '2017-01-05T00:55:46.775Z',
      admins: {
        username: true
      },
      workflow: ['main'],
      scmRepo: {
        name: 'screwdriver-cd/zzz',
        branch: 'master',
        url: 'https://github.com/screwdriver-cd/zzz/tree/master',
        rootDir: 'lib'
      },
      scmContext: 'bitbucket:bitbucket.org',
      annotations: {},
      lastEventId: 23,
      lastBuilds: [
        {
          id: 125,
          status: 'UNSTABLE',
          createTime: '2017-09-05T04:01:41.789Z'
        }
      ]
    }
  ],
  pipelineIds: [1, 2, 3, 4]
});

const mockPipelines = [
  {
    id: 1,
    name: 'screwdriver-cd/screwdriver'
  },
  {
    id: 2,
    name: 'screwdriver-cd/ui'
  },
  {
    id: 3,
    name: 'screwdriver-cd/models'
  },
  {
    id: 4,
    name: 'screwdriver-cd/zzz'
  }
];

const mockEmptyCollection = EmberObject.create({
  id: 2,
  name: 'collection1',
  description: 'Collection1',
  type: 'normal',
  userId: 1,
  pipelineIds: [],
  pipelines: []
});

const mockCollections = [
  {
    id: 1,
    name: 'My Pipelines',
    description: 'Default Collection',
    type: 'default',
    pipelineIds: [1, 2, 3, 4],
    userId: 1
  },
  {
    id: 2,
    name: 'collection1',
    description: 'Collection1',
    type: 'normal',
    userId: 1,
    pipelineIds: []
  },
  {
    id: 3,
    name: 'My Pipelines',
    description: 'Collection2',
    type: 'normal',
    pipelineIds: [1, 2, 3, 4],
    userId: 1
  }
];

const mockMetrics = [
  {
    id: 3,
    createTime: '2020-10-06T17:57:53.388Z',
    causeMessage: 'Manually started by klu909',
    sha: '9af92ba134322',
    commit: {
      message: '3',
      url: 'https://github.com/batman/foo/commit/9af92ba134322'
    },
    duration: 14,
    status: 'SUCCESS'
  },
  {
    id: 2,
    createTime: '2020-10-06T17:47:55.089Z',
    sha: '9af92ba134321',
    commit: {
      message: '2',
      url: 'https://github.com/batman/foo/commit/9af92ba134321'
    },
    duration: 14,
    status: 'SUCCESS'
  }
];

const onRemovePipelineSpy = sinon.spy();
const addMultipleToCollectionSpy = sinon.spy();
const removeMultiplePipelinesSpy = sinon.spy();

module('Integration | Component | collection view', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.unregister('service:store');
    const storeStub = Service.extend({
      query(model, filter) {
        if (filter.pipelineId === 1) {
          return resolve(mockMetrics);
        }

        return resolve([]);
      }
    });

    this.owner.register('service:store', storeStub);
    this.setProperties({
      collection: mockDefaultCollection,
      collections: mockCollections,
      onRemovePipeline: onRemovePipelineSpy,
      addMultipleToCollection: addMultipleToCollectionSpy,
      removeMultiplePipelines: removeMultiplePipelinesSpy
    });
  });

  test('it renders in card mode', async function(assert) {
    assert.expect(23);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
      }}`);

    await wait();

    // check that necessage elements exist
    assert.dom('.collection-card-view').exists({ count: 1 });
    assert.dom('.collection-list-view').doesNotExist();
    assert.dom('.pipeline-card').exists({ count: 4 });

    // check that pipeline card order is correct
    assert.dom('.pipeline-card:nth-of-type(1) .branch-info a').hasText('screwdriver-cd/models');
    assert
      .dom('.pipeline-card:nth-of-type(2) .branch-info a')
      .hasText('screwdriver-cd/screwdriver');
    assert.dom('.pipeline-card:nth-of-type(3) .branch-info a').hasText('screwdriver-cd/ui');
    assert.dom('.pipeline-card:nth-of-type(4) .branch-info a').hasText('screwdriver-cd/zzz');

    // check that helper function getColor() works correctly
    assert.dom('.pipeline-card:nth-of-type(1) .commit-status i').hasClass('build-empty');
    assert.dom('.pipeline-card:nth-of-type(2) .commit-status i').hasClass('build-success');
    assert.dom('.pipeline-card:nth-of-type(3) .commit-status i').hasClass('build-empty');
    assert.dom('.pipeline-card:nth-of-type(4) .commit-status i').hasClass('build-empty');

    // check that helper function getIcon() works correctly
    assert.dom('.pipeline-card:nth-of-type(1) .commit-status i').hasClass('fa-question-circle');
    assert.dom('.pipeline-card:nth-of-type(2) .commit-status i').hasClass('fa-check-circle');
    assert.dom('.pipeline-card:nth-of-type(3) .commit-status i').hasClass('fa-question-circle');
    assert.dom('.pipeline-card:nth-of-type(4) .commit-status i').hasClass('fa-question-circle');

    // check that helper function getSha() works correctly
    assert
      .dom('.pipeline-card:nth-of-type(1) .commit-status a:nth-of-type(2)')
      .hasText('Not available');
    assert.dom('.pipeline-card:nth-of-type(2) .commit-status a:nth-of-type(2)').hasText('9af92ba');
    assert
      .dom('.pipeline-card:nth-of-type(3) .commit-status a:nth-of-type(2)')
      .hasText('Not available');
    assert
      .dom('.pipeline-card:nth-of-type(4) .commit-status a:nth-of-type(2)')
      .hasText('Not available');

    // check that helper function formatTime() works correctly
    assert.dom('.pipeline-card:nth-of-type(1) .duration-badge span:nth-of-type(2)').hasText('--');
    assert.dom('.pipeline-card:nth-of-type(2) .duration-badge span:nth-of-type(2)').hasText('14s');
    assert.dom('.pipeline-card:nth-of-type(3) .duration-badge span:nth-of-type(2)').hasText('--');
    assert.dom('.pipeline-card:nth-of-type(4) .duration-badge span:nth-of-type(2)').hasText('--');
  });

  test('it renders in list mode', async function(assert) {
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
      }}`);

    await click('.header__change-view button:nth-of-type(2)');

    await wait();

    // check that necessage elements exist
    assert.dom('.collection-list-view').exists({ count: 1 });

    assert.dom('.header__name').hasText('My Pipelines');
    assert.dom('.header__description').hasText('Default Collection');
    assert.dom('table').exists({ count: 1 });
    assert.dom('th.collection-pipeline__choose').exists({ count: 1 });
    assert.dom('th.app-id').hasText('Name');
    assert.dom('th.branch').hasText('Branch');
    assert.dom('th.status').hasText('Status');
    assert.dom('th.start').hasText('Start Date');
    assert.dom('th.duration').hasText('Duration');
    assert.dom('th.history').exists({ count: 1 });

    assert.dom('.collection-pipeline').exists({ count: 4 });

    // check that collection table row order is correct
    assert.dom('.collection-pipeline:nth-of-type(1) .app-id a').hasText('screwdriver-cd/models');
    assert
      .dom('.collection-pipeline:nth-of-type(2) .app-id a')
      .hasText('screwdriver-cd/screwdriver');
    assert.dom('.collection-pipeline:nth-of-type(3) .app-id a').hasText('screwdriver-cd/ui');
    assert.dom('.collection-pipeline:nth-of-type(4) .app-id a').hasText('screwdriver-cd/zzz');

    // check that helper function getColor() works correctly
    assert.dom('.collection-pipeline:nth-of-type(1) .status i').hasClass('build-empty');
    assert.dom('.collection-pipeline:nth-of-type(2) .status i').hasClass('build-success');
    assert.dom('.collection-pipeline:nth-of-type(3) .status i').hasClass('build-empty');
    assert.dom('.collection-pipeline:nth-of-type(4) .status i').hasClass('build-empty');

    // check that helper function getIcon() works correctly
    assert.dom('.collection-pipeline:nth-of-type(1) .status i').hasClass('fa-question-circle');
    assert.dom('.collection-pipeline:nth-of-type(2) .status i').hasClass('fa-check-circle');
    assert.dom('.collection-pipeline:nth-of-type(3) .status i').hasClass('fa-question-circle');
    assert.dom('.collection-pipeline:nth-of-type(4) .status i').hasClass('fa-question-circle');

    // check that helper function getSha() works correctly
    assert
      .dom('.collection-pipeline:nth-of-type(1) .status a:nth-of-type(2)')
      .hasText('Not available');
    assert.dom('.collection-pipeline:nth-of-type(2) .status a:nth-of-type(2)').hasText('9af92ba');
    assert
      .dom('.collection-pipeline:nth-of-type(3) .status a:nth-of-type(2)')
      .hasText('Not available');
    assert
      .dom('.collection-pipeline:nth-of-type(4) .status a:nth-of-type(2)')
      .hasText('Not available');

    // check that helper function formatTime() works correctly
    assert.dom('.collection-pipeline:nth-of-type(1) .duration').hasText('--');
    assert.dom('.collection-pipeline:nth-of-type(2) .duration').hasText('14s');
    assert.dom('.collection-pipeline:nth-of-type(3) .duration').hasText('--');
    assert.dom('.collection-pipeline:nth-of-type(4) .duration').hasText('--');
  });

  test('it renders empty view if the collection has no pipelines', async function(assert) {
    this.set('collection', mockEmptyCollection);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
      }}`);

    assert.dom('.collection-empty-view').exists({ count: 1 });
    assert.dom('.guide-image').exists({ count: 1 });
    assert.dom('.guide-create-pipeline-button').exists({ count: 1 });
    assert.dom('.guide-docs-button').exists({ count: 1 });
  });

  test('it switches between card mode and list mode', async function(assert) {
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
      }}`);

    await wait();

    assert.dom('.collection-card-view').exists({ count: 1 });
    assert.dom('.collection-list-view').doesNotExist();

    await click('.header__change-view button:nth-of-type(2)');

    await wait();

    assert.dom('.collection-list-view').exists({ count: 1 });
    assert.dom('.collection-card-view').doesNotExist();

    await click('.header__change-view button:nth-of-type(1)');

    await wait();

    assert.dom('.collection-card-view').exists({ count: 1 });
    assert.dom('.collection-list-view').doesNotExist();
  });

  test('it removes a pipeline from a collection in card mode', async function(assert) {
    assert.expect(3);

    const storeStub = Service.extend({
      query(model, filter) {
        if (filter.pipelineId === 1) {
          return resolve(mockMetrics);
        }

        return resolve([]);
      },
      findRecord(model, id) {
        assert.strictEqual(model, 'collection');
        assert.strictEqual(id, 1);

        return resolve(mockDefaultCollection);
      }
    });

    const onRemovePipelineMock = pipelineId => {
      // Make sure the models pipeline is the one being removed
      assert.strictEqual(pipelineId, 3);

      return resolve();
    };

    this.set('onRemovePipeline', onRemovePipelineMock);
    this.owner.register('service:store', storeStub);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        onRemovePipeline=onRemovePipeline
      }}`);

    // Delete the models pipeline
    await click('.remove-button');
  });

  test('it removes a pipeline from a collection in list mode', async function(assert) {
    assert.expect(3);

    const storeStub = Service.extend({
      query(model, filter) {
        if (filter.pipelineId === 1) {
          return resolve(mockMetrics);
        }

        return resolve([]);
      },
      findRecord(model, id) {
        assert.strictEqual(model, 'collection');
        assert.strictEqual(id, 1);

        return resolve(mockDefaultCollection);
      }
    });

    const onRemovePipelineMock = pipelineId => {
      // Make sure the models pipeline is the one being removed
      assert.strictEqual(pipelineId, 3);

      return resolve();
    };

    this.set('onRemovePipeline', onRemovePipelineMock);
    this.owner.register('service:store', storeStub);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        onRemovePipeline=onRemovePipeline
      }}`);

    await click('.header__change-view button:nth-of-type(2)');

    await wait();

    // Delete the models pipeline
    await click('.collection-pipeline__remove span');
  });

  test('it fails to remove a pipeline in card mode', async function(assert) {
    assert.expect(2);

    const onRemovePipelineMock = pipelineId => {
      assert.strictEqual(pipelineId, 3);

      return reject({
        errors: [
          {
            detail: 'User does not have permission'
          }
        ]
      });
    };

    this.set('onRemovePipeline', onRemovePipelineMock);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        onRemovePipeline=onRemovePipeline
      }}
    `);

    await click('.remove-button');

    assert.dom('.alert-warning > span').hasText('User does not have permission');
  });

  test('it fails to remove a pipeline in list mode', async function(assert) {
    assert.expect(2);

    const onRemovePipelineMock = pipelineId => {
      assert.strictEqual(pipelineId, 3);

      return reject({
        errors: [
          {
            detail: 'User does not have permission'
          }
        ]
      });
    };

    this.set('onRemovePipeline', onRemovePipelineMock);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        onRemovePipeline=onRemovePipeline
      }}
    `);

    await click('.header__change-view button:nth-of-type(2)');

    await wait();

    await click('.collection-pipeline__remove span');

    assert.dom('.alert-warning > span').hasText('User does not have permission');
  });

  test('it does not show remove button in card mode if user is not logged in', async function(assert) {
    assert.expect(1);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        onRemovePipeline=onRemovePipeline
      }}
    `);

    assert.dom('.remove-button').doesNotExist();
  });

  test('it does not show remove button in list mode if user is not logged in', async function(assert) {
    assert.expect(1);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        onRemovePipeline=onRemovePipeline
      }}
    `);

    assert.dom('.collection-pipeline__remove').doesNotExist();
  });

  test('it does not show organize button if user is not logged in or no pipelines', async function(assert) {
    assert.expect(1);

    await render(hbs`
        {{collection-view
          collection=collection
          collections=collections
          metricsMap=metricsMap
          onRemovePipeline=onRemovePipeline
        }}
      `);

    assert.dom('.organize-button').doesNotExist();
  });

  test('it cancels organizing the collection in card mode', async function(assert) {
    assert.expect(13);

    injectSessionStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
      }}
    `);

    // start organizing
    assert.dom('.organize-button').exists({ count: 1 });
    await click('.organize-button');

    // select the first two pipelines
    const checkboxes = findAll('.checkbox-container input');

    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // assert those checkboxes are checked
    assert.equal($(checkboxes[0]).val(), 'true');
    assert.equal($(checkboxes[1]).val(), 'true');
    assert.equal($(checkboxes[2]).val(), 'false');
    assert.equal($(checkboxes[3]).val(), 'false');

    // cancel organizing
    await click('.cancel-organize-button');

    // start organizing again
    await click('.organize-button');

    // assert these two checkboxes are still checked
    assert.equal($(checkboxes[0]).val(), 'true');
    assert.equal($(checkboxes[1]).val(), 'true');
    assert.equal($(checkboxes[2]).val(), 'false');
    assert.equal($(checkboxes[3]).val(), 'false');

    // select these two pipelines again
    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // assert these two checkboxes are still checked instead of being unchecked
    assert.equal($(checkboxes[0]).val(), 'true');
    assert.equal($(checkboxes[1]).val(), 'true');
    assert.equal($(checkboxes[2]).val(), 'false');
    assert.equal($(checkboxes[3]).val(), 'false');
  });

  test('it cancels organizing the collection in list mode', async function(assert) {
    assert.expect(13);

    injectScmServiceStub(this);
    injectSessionStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
      }}
    `);

    // switch to list mode
    await click('.header__change-view button:nth-of-type(2)');

    // start organizing
    assert.dom('.organize-button').exists({ count: 1 });
    await click('.organize-button');

    // select the first two pipelines
    const checkboxes = findAll('.collection-pipeline__choose input');

    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // assert those checkboxes are checked
    assert.equal($(checkboxes[0]).val(), 'true');
    assert.equal($(checkboxes[1]).val(), 'true');
    assert.equal($(checkboxes[2]).val(), 'false');
    assert.equal($(checkboxes[3]).val(), 'false');

    // cancel organizing
    await click('.cancel-organize-button');

    // start organizing again
    await click('.organize-button');

    // assert these two checkboxes are still checked
    assert.equal($(checkboxes[0]).val(), 'true');
    assert.equal($(checkboxes[1]).val(), 'true');
    assert.equal($(checkboxes[2]).val(), 'false');
    assert.equal($(checkboxes[3]).val(), 'false');

    // select these two pipelines again
    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // assert these two checkboxes are still checked instead of being unchecked
    assert.equal($(checkboxes[0]).val(), 'true');
    assert.equal($(checkboxes[1]).val(), 'true');
    assert.equal($(checkboxes[2]).val(), 'false');
    assert.equal($(checkboxes[3]).val(), 'false');
  });

  test('it removes multiple pipelines from collection in card mode', async function(assert) {
    assert.expect(4);

    const storeStub = Service.extend({
      query(model, filter) {
        if (filter.pipelineId === 1) {
          return resolve(mockMetrics);
        }

        return resolve([]);
      },
      findRecord(model, id) {
        assert.strictEqual(model, 'collection');
        assert.strictEqual(id, 1);

        return resolve(mockDefaultCollection);
      }
    });

    const removeMultiplePipelinesMock = (pipelineIds, collectionId) => {
      assert.deepEqual(pipelineIds, [3, 1]);
      assert.strictEqual(collectionId, 1);

      return resolve();
    };

    this.set('removeMultiplePipelines', removeMultiplePipelinesMock);
    this.owner.register('service:store', storeStub);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        removeMultiplePipelines=removeMultiplePipelines
      }}
    `);

    // start organizing
    await click('.organize-button');

    // select the first two pipelines
    const checkboxes = findAll('.checkbox-container input');

    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // remove these selected pipelines
    await click('.operation-button:nth-of-type(1)');
  });

  test('it removes multiple pipelines from collection in list mode', async function(assert) {
    assert.expect(4);

    const storeStub = Service.extend({
      query(model, filter) {
        if (filter.pipelineId === 1) {
          return resolve(mockMetrics);
        }

        return resolve([]);
      },
      findRecord(model, id) {
        assert.strictEqual(model, 'collection');
        assert.strictEqual(id, 1);

        return resolve(mockDefaultCollection);
      }
    });

    const removeMultiplePipelinesMock = (pipelineIds, collectionId) => {
      assert.deepEqual(pipelineIds, [3, 1]);
      assert.strictEqual(collectionId, 1);

      return resolve();
    };

    this.set('removeMultiplePipelines', removeMultiplePipelinesMock);
    this.owner.register('service:store', storeStub);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        removeMultiplePipelines=removeMultiplePipelines
      }}
    `);

    // switch to list mode
    await click('.header__change-view button:nth-of-type(2)');

    // start organizing
    await click('.organize-button');

    // select the first two pipelines
    const checkboxes = findAll('.collection-pipeline__choose input');

    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // remove these selected pipelines
    await click('.operation-button:nth-of-type(1)');
  });

  test('it fails to remove multiple pipelines from collection in card mode', async function(assert) {
    assert.expect(3);

    const storeStub = Service.extend({
      query(model, filter) {
        if (filter.pipelineId === 1) {
          return resolve(mockMetrics);
        }

        return resolve([]);
      },
      findRecord(model, id) {
        assert.strictEqual(model, 'collection');
        assert.strictEqual(id, 1);

        return resolve(mockDefaultCollection);
      }
    });

    const removeMultiplePipelinesMock = (pipelineIds, collectionId) => {
      assert.deepEqual(pipelineIds, [3, 1]);
      assert.strictEqual(collectionId, 1);

      return reject({
        errors: [
          {
            detail: 'error when removing multiple pipelines'
          }
        ]
      });
    };

    this.set('removeMultiplePipelines', removeMultiplePipelinesMock);
    this.owner.register('service:store', storeStub);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        removeMultiplePipelines=removeMultiplePipelines
      }}
    `);

    // start organizing
    await click('.organize-button');

    // select the first two pipelines
    const checkboxes = findAll('.checkbox-container input');

    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // remove these selected pipelines
    await click('.operation-button:nth-of-type(1)');

    // assert the message is right
    assert.dom('.alert-warning > span').hasText('error when removing multiple pipelines');
  });

  test('it fails to remove multiple pipelines from collection in list mode', async function(assert) {
    assert.expect(4);

    const storeStub = Service.extend({
      query(model, filter) {
        if (filter.pipelineId === 1) {
          return resolve(mockMetrics);
        }

        return resolve([]);
      },
      findRecord(model, id) {
        assert.strictEqual(model, 'collection');
        assert.strictEqual(id, 1);

        return resolve(mockDefaultCollection);
      }
    });

    const removeMultiplePipelinesMock = (pipelineIds, collectionId) => {
      assert.deepEqual(pipelineIds, [3, 1]);
      assert.strictEqual(collectionId, 1);

      return reject({
        errors: [
          {
            detail: 'error when removing multiple pipelines'
          }
        ]
      });
    };

    this.set('removeMultiplePipelines', removeMultiplePipelinesMock);
    this.owner.register('service:store', storeStub);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        removeMultiplePipelines=removeMultiplePipelines
      }}
    `);

    // switch to list mode
    await click('.header__change-view button:nth-of-type(2)');
    assert.dom('.collection-list-view').exists({ count: 1 });

    // start organizing
    await click('.organize-button');

    // select the first two pipelines
    const checkboxes = findAll('.collection-pipeline__choose input');

    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // remove these selected pipelines
    await click('.operation-button:nth-of-type(1)');

    // assert the message is right
    assert.dom('.alert-warning > span').hasText('error when removing multiple pipelines');
  });

  test('it moves multiple pipelines to another collection in card mode', async function(assert) {
    assert.expect(2);

    const addMultipleToCollectionMock = (pipelineIds, collectionId) => {
      assert.deepEqual(pipelineIds, [3, 1]);
      assert.strictEqual(collectionId, 3);

      return resolve();
    };

    this.set('addMultipleToCollection', addMultipleToCollectionMock);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        addMultipleToCollection=addMultipleToCollection
      }}
    `);

    // start organizing
    await click('.organize-button');

    // select the first two pipelines
    const checkboxes = findAll('.checkbox-container input');

    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // remove these selected pipelines
    await click('.copy-pipeline button');
    await click('.copy-pipeline .dropdown-menu li:nth-of-type(2) span');
  });

  test('it moves multiple pipelines to another collection in list mode', async function(assert) {
    assert.expect(2);

    const addMultipleToCollectionMock = (pipelineIds, collectionId) => {
      assert.deepEqual(pipelineIds, [3, 1]);
      assert.strictEqual(collectionId, 3);

      return resolve();
    };

    this.set('addMultipleToCollection', addMultipleToCollectionMock);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        addMultipleToCollection=addMultipleToCollection
      }}
    `);

    // switch to list mode
    await click('.header__change-view button:nth-of-type(2)');

    // start organizing
    await click('.organize-button');

    // select the first two pipelines
    const checkboxes = findAll('.collection-pipeline__choose input');

    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // remove these selected pipelines
    await click('.copy-pipeline button');
    await click('.copy-pipeline .dropdown-menu li:nth-of-type(2) span');
  });

  test('it fails to move multiple pipelines to another collection in card mode', async function(assert) {
    assert.expect(3);

    const addMultipleToCollectionMock = (pipelineIds, collectionId) => {
      assert.deepEqual(pipelineIds, [3, 1]);
      assert.strictEqual(collectionId, 3);

      return reject();
    };

    this.set('addMultipleToCollection', addMultipleToCollectionMock);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        addMultipleToCollection=addMultipleToCollection
      }}
    `);

    // start organizing
    await click('.organize-button');

    // select the first two pipelines
    const checkboxes = findAll('.checkbox-container input');

    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // remove these selected pipelines
    await click('.copy-pipeline button');
    await click('.copy-pipeline .dropdown-menu li:nth-of-type(2) span');

    // assert the error message is correct
    assert
      .dom('.alert-warning > span')
      .hasText('Could not add Pipeline to Collection My Pipelines');
  });

  test('it fails to move multiple pipelines to another collection in list mode', async function(assert) {
    assert.expect(2);

    const addMultipleToCollectionMock = (pipelineIds, collectionId) => {
      assert.deepEqual(pipelineIds, [3, 1]);
      assert.strictEqual(collectionId, 3);

      return reject();
    };

    this.set('addMultipleToCollection', addMultipleToCollectionMock);
    injectSessionStub(this);
    injectScmServiceStub(this);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        addMultipleToCollection=addMultipleToCollection
      }}
    `);

    // switch to list mode
    await click('.header__change-view button:nth-of-type(2)');

    // start organizing
    await click('.organize-button');

    // select the first two pipelines
    const checkboxes = findAll('.collection-pipeline__choose input');

    await click(checkboxes[0]);
    await click(checkboxes[1]);

    // remove these selected pipelines
    await click('.copy-pipeline button');
    await click('.copy-pipeline .dropdown-menu li:nth-of-type(2) span');
  });

  test('it searches and adds pipelines into the collection', async function(assert) {
    assert.expect(19);

    const addMultipleToCollectionMock = (pipelineIds, collectionId) => {
      assert.deepEqual(pipelineIds, [1]);
      assert.strictEqual(collectionId, 2);

      return resolve();
    };

    const storeStub = Service.extend({
      query(model, filter) {
        if (model === 'pipeline') {
          return resolve(mockPipelines);
        }

        if (filter.pipelineId === 1) {
          return resolve(mockMetrics);
        }

        return resolve([]);
      },
      findRecord(model, id) {
        assert.strictEqual(model, 'collection');
        assert.strictEqual(id, 2);

        const updatedCollection = EmberObject.create({
          id: 2,
          name: 'collection1',
          description: 'Collection1',
          type: 'normal',
          userId: 1,
          pipelineIds: [1],
          pipelines: [
            {
              id: 1,
              scmUri: 'github.com:12345678:master',
              createTime: '2017-01-05T00:55:46.775Z',
              admins: {
                username: true
              },
              workflow: ['main'],
              scmRepo: {
                name: 'screwdriver-cd/screwdriver',
                branch: 'master',
                url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
              },
              scmContext: 'github:github.com',
              annotations: {},
              lastEventId: 12,
              lastBuilds: [
                {
                  id: 123,
                  status: 'SUCCESS',
                  // Most recent build
                  createTime: '2017-09-05T04:02:20.890Z'
                }
              ]
            }
          ]
        });

        return resolve(updatedCollection);
      }
    });

    this.set('collection', mockEmptyCollection);
    this.set('addMultipleToCollection', addMultipleToCollectionMock);
    this.owner.register('service:store', storeStub);
    injectSessionStub(this);
    injectScmServiceStub(this);

    // render an empty collection
    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
        addMultipleToCollection=addMultipleToCollection
      }}
    `);

    await wait();

    // open pipeline search modal
    await click('.add-pipeline-operation');
    assert.dom('.add-pipeline-modal .modal-body').exists({ count: 1 });
    assert.dom('.add-pipeline-modal .search-pipeline-searchbar').exists({ count: 1 });

    // search pipelines with the search term "screwdriver-cd"
    await fillIn('.search-pipeline-searchbar input', 'screwdriver-cd');
    await click('.search-pipeline-button');

    // check that all pipelines matched show up
    let searchedPipelines = findAll('.searched-pipeline span:nth-of-type(1)');

    assert.equal(searchedPipelines.length, 4);
    assert.dom(searchedPipelines[0]).hasText('screwdriver-cd/screwdriver');
    assert.dom(searchedPipelines[1]).hasText('screwdriver-cd/ui');
    assert.dom(searchedPipelines[2]).hasText('screwdriver-cd/models');
    assert.dom(searchedPipelines[3]).hasText('screwdriver-cd/zzz');

    // add the first pipeline to current collection
    await click('.searched-pipeline:nth-of-type(1) .add-pipeline-button');
    await click('.modal-content .close');

    await wait();
    // check the first pipeline is added
    assert.dom('.pipeline-card').exists({ count: 1 });
    assert.dom('.pipeline-card .branch-info a').hasText('screwdriver-cd/screwdriver');

    // search again with the same search item
    await click('.add-pipeline-operation');
    await fillIn('.search-pipeline-searchbar input', 'screwdriver-cd');
    await click('.search-pipeline-button');

    // check that the previously first pipeline no long shows up
    searchedPipelines = findAll('.searched-pipeline span:nth-of-type(1)');
    assert.equal(searchedPipelines.length, 3);
    assert.dom(searchedPipelines[0]).hasText('screwdriver-cd/ui');
    assert.dom(searchedPipelines[1]).hasText('screwdriver-cd/models');
    assert.dom(searchedPipelines[2]).hasText('screwdriver-cd/zzz');

    // close the modal
    await click('.modal-content .close');

    // check no new pipeline is added
    assert.dom('.pipeline-card').exists({ count: 1 });
    assert.dom('.pipeline-card .branch-info a').hasText('screwdriver-cd/screwdriver');
  });

  test('it changes the name and description of the normal collection', async function(assert) {
    assert.expect(11);

    const collectionSaveSpy = sinon.spy();

    this.collection.set('save', collectionSaveSpy);
    this.collection.set('type', 'normal');

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
      }}
    `);

    // open the setting modal
    await click('.settings-operation');
    assert.dom('.setting-modal .modal-body').exists({ count: 1 });

    // check the collection name and description is correct
    assert.dom('.form .form-group:nth-of-type(1) .form-control').hasValue('My Pipelines');
    assert.dom('.form .form-group:nth-of-type(2) .form-control').hasValue('Default Collection');

    // change two inputs and close the modal
    await fillIn('.form .form-group:nth-of-type(1) .form-control', 'New Name');
    await fillIn('.form .form-group:nth-of-type(1) .form-control', 'New Description');
    await click('.setting-modal .close');

    // check nothing changes
    assert.dom('.header__name').hasText('My Pipelines');
    assert.dom('.header__description').hasText('Default Collection');

    // open the modal again and check input default values aren't changed
    await click('.settings-operation');
    assert.dom('.form .form-group:nth-of-type(1) .form-control').hasValue('My Pipelines');
    assert.dom('.form .form-group:nth-of-type(2) .form-control').hasValue('Default Collection');

    // change two inputs and submit the form
    await fillIn('.form .form-group:nth-of-type(1) .form-control', 'New Name');
    await fillIn('.form .form-group:nth-of-type(2) .form-control', 'New Description');
    await click('.setting-modal .modal-footer button:nth-of-type(2)');

    // check the displayed name and description are changed
    assert.dom('.header__name').hasText('New Name');
    assert.dom('.header__description').hasText('New Description');

    // open the modal again and check input default values are also changed
    await click('.settings-operation');
    assert.dom('.form .form-group:nth-of-type(1) .form-control').hasValue('New Name');
    assert.dom('.form .form-group:nth-of-type(2) .form-control').hasValue('New Description');
  });

  test('it copies the collection url to the clipboard', async function(assert) {
    assert.expect(1);

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
      }}
    `);

    // click the copy button
    await click('.copy-operation');

    // check the banner is correct
    assert.dom('.alert-success > span').hasText(`
      The link of this collection is successfully copied to the clipboard.`);
  });

  test('it should verify collection edit modal', async function(assert) {
    this.collection.set('type', 'normal');

    await render(hbs`
      {{collection-view
        collection=collection
        collections=collections
        metricsMap=metricsMap
      }}
    `);

    await click('.collection-operation.settings-operation');

    assert.dom('.modal-title').hasText('Settings');
    assert.dom('.is-required .control-label').hasText('Name');
    assert.dom('.modal-footer .btn-default').hasText('Cancel');
    assert
      .dom('.modal-footer .btn-primary')
      .hasText('Save')
      .isDisabled('Should disable Save button when non of the options changes');

    await fillIn('.form-group input', 'Test 1');
    assert
      .dom('.modal-footer .btn-primary')
      .isEnabled('Should enable save when name value is changed');

    await fillIn('.form-group input', '');
    assert
      .dom('.modal-footer .btn-primary')
      .isDisabled('Should disable save when name value is empty');

    await fillIn('.form-group input', 'Test Collection');
    await click('.modal-footer .btn-primary');
    assert.dom('.header__name').hasText('Test Collection');

    await click('.collection-operation.settings-operation');
    await fillIn('.form-group textArea', 'Test Description');
    assert
      .dom('.modal-footer .btn-primary')
      .isEnabled('Should enable save when name value is changed');
    await fillIn('.form-group input', 'Test Collection Updated');

    await click('.modal-footer .btn-default');
    assert.dom('.header__name').hasText('Test Collection');
  });
});
