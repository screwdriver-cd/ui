import {
  click,
  fillIn,
  findAll,
  currentURL,
  triggerEvent,
  visit,
  waitFor,
  waitUntil
} from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { invalidateSession } from 'ember-simple-auth/test-support';
import { getPageTitle } from 'ember-page-title/test-support';

import { pipeline } from '../mock/pipeline';

module('Acceptance | dashboards', function (hooks) {
  const mockApi = setupApplicationTest(hooks);

  const mockCollections = [
    {
      id: 2,
      name: 'collection1',
      description: 'description1',
      type: 'normal',
      userId: 1,
      pipelineIds: [12742, 12743]
    },
    {
      id: 1,
      name: 'My Pipelines',
      description: 'default collection description',
      type: 'default',
      userId: 1,
      pipelineIds: [12742, 12743]
    }
  ];

  const mockDefaultCollection = {
    id: 1,
    name: 'My Pipelines',
    description: 'default collection description',
    type: 'default',
    pipelineIds: [12742, 12743],
    pipelines: [
      {
        id: 12742,
        scmUri: 'github.com:12345678:master',
        createTime: '2017-01-05T00:55:46.775Z',
        admins: {
          username: true
        },
        workflow: ['main', 'publish'],
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
            status: 'SUCCESS'
          },
          {
            id: 124,
            status: 'FAILURE'
          }
        ]
      },
      {
        id: 12743,
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
      }
    ]
  };

  const mockCollection = {
    ...mockDefaultCollection,
    id: 2,
    name: 'collection1',
    description: 'description1',
    type: 'normal'
  };

  const mockEmptyDefaultCollection = {
    ...mockDefaultCollection,
    pipelineIds: [],
    pipelines: []
  };

  const mockEmptyCollection = {
    ...mockCollection,
    pipelineIds: [],
    pipelines: []
  };

  hooks.beforeEach(function () {
    mockApi.get('/collections', () => [200, mockCollections]);
    mockApi.get('/collections/:id', req => {
      const id = parseInt(req.params.id, 10);

      if (id === 1) {
        return [200, mockDefaultCollection];
      }

      return [200, mockCollection];
    });
    mockApi.get('/pipelines/:id/metrics', () => [200, []]);
  });

  hooks.afterEach(function () {
    localStorage.removeItem('lastViewedCollectionId');
    localStorage.removeItem('activeViewOptionValue');
  });

  test('visiting / when not logged in', async function (assert) {
    await invalidateSession();
    await visit('/');

    assert.equal(currentURL(), '/login');
  });

  test('visiting / when logged in and have collections among which the default collection is empty', async function (assert) {
    mockApi.get('/collections/1', () => [200, mockEmptyDefaultCollection]);
    localStorage.setItem('lastViewedCollectionId', 1);
    await visit('/');
    await waitFor('h2.header__name');
    assert.equal(currentURL(), '/dashboards/1');
    assert.equal(getPageTitle(), 'Dashboard', 'Page title is correct');
    assert.dom('.header__name').hasText('My Pipelines');
    assert
      .dom('.header__description')
      .hasText('default collection description');
    assert.dom('.collection-empty-view').exists({ count: 1 });
  });

  test('visiting / when logged in and have collections among which the default collection is not empty', async function (assert) {
    localStorage.setItem('lastViewedCollectionId', 1);
    localStorage.setItem('activeViewOptionValue', 'Card');
    await visit('/');
    await waitFor('h2.header__name');
    assert.equal(currentURL(), '/dashboards/1');
    assert.dom('.header__name').hasText('My Pipelines');
    assert
      .dom('.header__description')
      .hasText('default collection description');
    assert.dom('.collection-operation').exists({ count: 1 });
    assert.dom('.collection-card-view').exists({ count: 1 });
    assert.dom('.pipeline-card').exists({ count: 2 });
  });

  test('visiting /dashboards when not logged in', async function (assert) {
    await invalidateSession();
    await visit('/dashboards');

    assert.equal(currentURL(), '/login');
  });

  test('visiting /dashboards/2 when collection 2 is empty', async function (assert) {
    mockApi.get('/collections/2', () => [200, mockEmptyCollection]);
    await visit('/dashboards/2');

    assert.equal(currentURL(), '/dashboards/2');
    assert.dom('.header__name').hasText('collection1');
    assert.dom('.header__description').hasText('description1');
    assert.dom('.collection-empty-view').exists({ count: 1 });
  });

  test('visiting /dashboards/2 when collection 2 is not empty', async function (assert) {
    await visit('/dashboards/2');

    assert.equal(currentURL(), '/dashboards/2');
    assert.dom('.header__name').hasText('collection1');
    assert.dom('.header__description').hasText('description1');
    assert.dom('.collection-operation').exists({ count: 3 });
    assert.dom('.collection-card-view').exists({ count: 1 });
    assert.dom('.pipeline-card').exists({ count: 2 });
  });

  test('visiting /dashboards/404', async function (assert) {
    mockApi.get('/collections/404', () => [404, {}]);
    await visit('/dashboards/404');

    assert.equal(currentURL(), '/dashboards/404');
    assert.dom('.code').hasText('404');
  });

  test('creating a collection', async function (assert) {
    assert.expect(7);

    const expectedRequestBody = {
      name: 'collection2',
      description: 'description2',
      type: 'normal'
    };

    mockApi.post('/collections', request => {
      assert.deepEqual(JSON.parse(request.requestBody), expectedRequestBody);

      return [
        201,
        {
          id: 3,
          name: 'collection2',
          description: 'description2'
        }
      ];
    });

    // GET request made in the search route for pipelines
    mockApi.get('/pipelines', () => [200, [pipeline]]);

    localStorage.setItem('lastViewedCollectionId', 1);
    await visit('/');
    await waitFor('h2.header__name');
    // Logged in but no collections, url should be `/`
    assert.equal(currentURL(), '/dashboards/1');

    await visit('/search');
    assert.dom('.flyout').exists({ count: 1 });
    assert.strictEqual(findAll('.modal').length, 0);
    assert.strictEqual(findAll('.collection-wrapper row').length, 0);

    await click('.header__create');
    assert.dom('.modal').exists({ count: 1 });
    await fillIn('.name-input', 'collection2');
    await triggerEvent('.name-input', 'keyup');
    await fillIn('.description-input', 'description2');
    await triggerEvent('.description-input', 'keyup');
    await click('.collection-form__create');
    // The modal should disappear
    await waitUntil(() => findAll('.modal').length === 0);
    assert.strictEqual(findAll('.modal').length, 0);
  });
});
