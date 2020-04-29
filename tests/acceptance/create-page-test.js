import { click, fillIn, currentURL, triggerEvent, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'ember-simple-auth/test-support';
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

    server.get('http://localhost:8080/v4/pipelines/1/triggers', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/templates', () => {
      return [200, { 'Content-Type': 'application/json' }, JSON.stringify([])];
    });

    await authenticateSession({ token: 'faketoken' });
    await visit('/create');

    assert.equal(currentURL(), '/create');
    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');
    await click('button.blue-button');
    assert.equal(currentURL(), '/pipelines/1/events');
  });

  test('/create a pipeline with rootDir: SUCCESS', async function(assert) {
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

    server.get('http://localhost:8080/v4/pipelines/1/triggers', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/templates', () => {
      return [200, { 'Content-Type': 'application/json' }, JSON.stringify([])];
    });

    await authenticateSession({ token: 'faketoken' });
    await visit('/create');

    assert.equal(currentURL(), '/create');
    await fillIn('.scm-url', 'git@github.com:foo/bar.git');
    await triggerEvent('.scm-url', 'keyup');
    await click('.checkbox-input');
    await fillIn('.root-dir', 'lib');
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
    server.get('http://localhost:8080/v4/templates', () => {
      return [200, { 'Content-Type': 'application/json' }, JSON.stringify([])];
    });

    await authenticateSession({ token: 'faketoken' });
    await visit('/create');

    assert.equal(currentURL(), '/create');
    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');
    await click('button.blue-button');
    assert.equal(currentURL(), '/create');
    assert.dom('.alert > span').hasText('something conflicting');
  });

  test('Create Screwdriver.yaml', async function(assert) {
    server.post('http://localhost:8080/v4/pipelines', () => [
      409,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        statusCode: 409,
        error: 'Conflict',
        message: 'something conflicting'
      })
    ]);

    server.get('http://localhost:8080/v4/templates', () => {
      return [200, { 'Content-Type': 'application/json' }, JSON.stringify([])];
    });

    await authenticateSession({ token: 'faketoken' });
    await visit('/create');

    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');
    await click('input.create-screwdriver-yaml');

    assert.dom('.select-template').hasText('template');
    assert.dom('.templates-dropdown').exists();
    assert.dom('.ace_editor').exists();
    assert.dom('#template-validate-results').exists();
  });

  test('Quick start guide', async function(assert) {
    server.post('http://localhost:8080/v4/pipelines', () => [
      409,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        statusCode: 409,
        error: 'Conflict',
        message: 'something conflicting'
      })
    ]);

    server.get('http://localhost:8080/v4/templates', () => {
      return [200, { 'Content-Type': 'application/json' }, JSON.stringify([])];
    });

    await authenticateSession({ token: 'faketoken' });
    await visit('/create');
    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');

    // default toggle button is closed
    assert.dom('.quickstart-guide-menu').exists();
    assert.dom('.quickstart-guide.menu-open').doesNotExist();
    assert.dom('.quickstart-guide.menu-close').exists();

    await click('.quickstart-guide-menu');
    // after click toggle-button, menu now is open
    assert.dom('.quickstart-guide.menu-open').exists();
    assert.dom('.quickstart-guide.menu-close').doesNotExist();
  });
});
