import { click, fillIn, findAll, currentURL, triggerEvent, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';

import {
  hasCollections,
  hasEmptyCollections,
  hasCollection
} from 'screwdriver-ui/tests/mock/collections';
import { hasPipelines } from 'screwdriver-ui/tests/mock/pipeline';

let server;

module('Acceptance | dashboards', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/collections', hasCollections);
    server.get('http://localhost:8080/v4/collections/1', hasCollection);
    server.get('http://localhost:8080/v4/pipelines', hasPipelines);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('visiting / when not logged in', async function(assert) {
    await visit('/');

    assert.equal(currentURL(), '/login');
  });

  test('visiting / when logged in and no collections', async function(assert) {
    server.get('http://localhost:8080/v4/collections', hasEmptyCollections);

    await authenticateSession({ token: 'fakeToken' });
    await visit('/');
    assert.equal(currentURL(), '/');
  });

  test('visiting / when logged in and have collections', async function(assert) {
    server.get('http://localhost:8080/v4/collections', hasCollections);
    await authenticateSession({ token: 'fakeToken' });
    await visit('/');

    assert.equal(currentURL(), '/dashboards/1');
    assert.dom('.header__name').hasText('collection1');
    assert.dom('.header__description').hasText('description1');
    assert.dom('table').exists({ count: 1 });
    assert.dom('th.app-id').hasText('Name');
    assert.dom('th.branch').hasText('Branch');
    assert.dom('th.account').hasText('Account');
    assert.dom('tr').exists({ count: 4 });
    assert.dom('td').exists({ count: 14 });
  });

  test('visiting /dashboards when not logged in', async function(assert) {
    await visit('/dashboards');

    assert.equal(currentURL(), '/login');
  });

  test('visiting /dashboards when logged in and no collections', async function(assert) {
    server.get('http://localhost:8080/v4/collections', hasEmptyCollections);
    await authenticateSession({ token: 'fakeToken' });
    await visit('/dashboards');

    assert.equal(currentURL(), '/search');
  });

  test('visiting /dashboards/1', async function(assert) {
    await authenticateSession({ token: 'fakeToken' });
    await visit('/dashboards/1');

    assert.equal(currentURL(), '/dashboards/1');
    assert.dom('.header__name').hasText('collection1');
    assert.dom('.header__description').hasText('description1');
    assert.dom('table').exists({ count: 1 });
    assert.dom('th.app-id').hasText('Name');
    assert.dom('th.branch').hasText('Branch');
    assert.dom('th.account').hasText('Account');
    assert.dom('tr').exists({ count: 4 });
    assert.dom('td').exists({ count: 14 });
  });

  test('creating a collection', async function(assert) {
    assert.expect(7);

    const expectedRequestBody = {
      name: 'collection3',
      description: 'description3'
    };

    server.get('http://localhost:8080/v4/collections', hasEmptyCollections);
    server.post('http://localhost:8080/v4/collections', request => {
      assert.deepEqual(JSON.parse(request.requestBody), expectedRequestBody);

      return [
        201,
        { 'Content-Type': 'application/json' },
        JSON.stringify({
          id: 3,
          name: 'collection3',
          description: 'description3'
        })
      ];
    });

    // GET request made in the search route for pipelines
    server.get('http://localhost:8080/v4/pipelines', hasPipelines);

    await authenticateSession({ token: 'fakeToken' });
    await visit('/');
    // Logged in but no collections, url should be `/`
    assert.equal(currentURL(), '/');

    await visit('/search');
    assert.dom('.flyout').exists({ count: 1 });
    assert.notOk(findAll('.modal').length);
    assert.notOk(findAll('.collection-wrapper row').length);

    await click('.new');
    assert.dom('.modal').exists({ count: 1 });
    await fillIn('.name input', 'collection3');
    await triggerEvent('.name input', 'keyup');
    await fillIn('.description textarea', 'description3');
    await triggerEvent('.description textarea', 'keyup');
    await click('.collection-form__create');
    // The modal should disappear
    assert.notOk(findAll('.modal').length);
  });
});
