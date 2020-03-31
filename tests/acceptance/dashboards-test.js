import { click, fillIn, findAll, currentURL, triggerEvent, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';

import {
  hasCollections,
  hasCollection,
  hasDefaultCollection,
  hasEmptyDefaultCollection,
  hasEmptyCollection
} from 'screwdriver-ui/tests/mock/collections';
import { hasPipelines } from 'screwdriver-ui/tests/mock/pipeline';

let server;
const hasEmptyMetrics = () => [200, { 'Content-Type': 'application/json' }, JSON.stringify([])];

module('Acceptance | dashboards', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/collections', hasCollections);
    server.get('http://localhost:8080/v4/collections/1', hasDefaultCollection);
    server.get('http://localhost:8080/v4/collections/2', hasCollection);
    server.get('http://localhost:8080/v4/pipelines', hasPipelines);
    server.get('http://localhost:8080/v4/pipelines/12742/metrics', hasEmptyMetrics);
    server.get('http://localhost:8080/v4/pipelines/12743/metrics', hasEmptyMetrics);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('visiting / when not logged in', async function(assert) {
    await visit('/');

    assert.equal(currentURL(), '/login');
  });

  test('visiting / when logged in and have collections among which the default collection is empty', async function(assert) {
    server.get('http://localhost:8080/v4/collections/1', hasEmptyDefaultCollection);
    await authenticateSession({ token: 'fakeToken' });
    localStorage.setItem('lastViewedCollectionId', 1);
    await visit('/');

    assert.equal(currentURL(), '/dashboards/1');
    assert.dom('.header__name').hasText('My Pipelines');
    assert.dom('.header__description').hasText('default collection description');
    assert.dom('.collection-empty-view').exists({ count: 1 });
  });

  test('visiting / when logged in and have collections among which the default collection is not empty', async function(assert) {
    await authenticateSession({ token: 'fakeToken' });
    localStorage.setItem('lastViewedCollectionId', 1);
    await visit('/');

    assert.equal(currentURL(), '/dashboards/1');
    assert.dom('.header__name').hasText('My Pipelines');
    assert.dom('.header__description').hasText('default collection description');
    assert.dom('.collection-operation').exists({ count: 1 });
    assert.dom('.collection-card-view').exists({ count: 1 });
    assert.dom('.pipeline-card').exists({ count: 2 });
  });

  test('visiting /dashboards when not logged in', async function(assert) {
    await visit('/dashboards');

    assert.equal(currentURL(), '/login');
  });

  test('visiting /dashboards/2 when collection 2 is empty', async function(assert) {
    server.get('http://localhost:8080/v4/collections/2', hasEmptyCollection);
    await authenticateSession({ token: 'fakeToken' });
    await visit('/dashboards/2');

    assert.equal(currentURL(), '/dashboards/2');
    assert.dom('.header__name').hasText('collection1');
    assert.dom('.header__description').hasText('description1');
    assert.dom('.collection-empty-view').exists({ count: 1 });
  });

  test('visiting /dashboards/2 when collection 2 is not empty', async function(assert) {
    await authenticateSession({ token: 'fakeToken' });
    await visit('/dashboards/2');

    assert.equal(currentURL(), '/dashboards/2');
    assert.dom('.header__name').hasText('collection1');
    assert.dom('.header__description').hasText('description1');
    assert.dom('.collection-operation').exists({ count: 3 });
    assert.dom('.collection-card-view').exists({ count: 1 });
    assert.dom('.pipeline-card').exists({ count: 2 });
  });

  test('creating a collection', async function(assert) {
    assert.expect(7);

    const expectedRequestBody = {
      name: 'collection2',
      description: 'description2',
      type: 'normal'
    };

    server.get('http://localhost:8080/v4/collections', hasCollections);
    server.post('http://localhost:8080/v4/collections', request => {
      assert.deepEqual(JSON.parse(request.requestBody), expectedRequestBody);

      return [
        201,
        { 'Content-Type': 'application/json' },
        JSON.stringify({
          id: 3,
          name: 'collection2',
          description: 'description2'
        })
      ];
    });

    // GET request made in the search route for pipelines
    server.get('http://localhost:8080/v4/pipelines', hasPipelines);

    await authenticateSession({ token: 'fakeToken' });
    localStorage.setItem('lastViewedCollectionId', 1);
    await visit('/');
    // Logged in but no collections, url should be `/`
    assert.equal(currentURL(), '/dashboards/1');

    await visit('/search');
    assert.dom('.flyout').exists({ count: 1 });
    assert.notOk(findAll('.modal').length);
    assert.notOk(findAll('.collection-wrapper row').length);

    await click('.header__create');
    assert.dom('.modal').exists({ count: 1 });
    await fillIn('.name input', 'collection2');
    await triggerEvent('.name input', 'keyup');
    await fillIn('.description textarea', 'description2');
    await triggerEvent('.description textarea', 'keyup');
    await click('.collection-form__create');
    // The modal should disappear
    assert.notOk(findAll('.modal').length);
  });
});
