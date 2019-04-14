import { click, fillIn, currentURL, triggerEvent, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
let server;

module('Acceptance | create', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('/create a pipeline: not logged in will redirect', async function(assert) {
    await visit('/create');

    assert.equal(currentURL(), '/login');
  });

  test('/create a pipeline: SUCCESS', async function(assert) {
    server.post('http://localhost:8080/v4/pipelines', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1'
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines/1', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1'
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/events', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/builds', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/jobs', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    authenticateSession(this.application, { token: 'faketoken' });

    await visit('/create');

    assert.equal(currentURL(), '/create');
    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');
    await click('button.blue-button');
    assert.equal(currentURL(), '/pipelines/1/events');
  });

  test('/create a pipeline: FAILURE', async function(assert) {
    server.post('http://localhost:8080/v4/pipelines', () => [
      409,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        statusCode: 409,
        error: 'Conflict',
        message: 'something conflicting'
      })
    ]);

    authenticateSession(this.application, { token: 'faketoken' });

    await visit('/create');

    assert.equal(currentURL(), '/create');
    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');
    await click('button.blue-button');
    assert.equal(currentURL(), '/create');
    assert.dom('.alert > span').hasText('something conflicting');
  });
});
