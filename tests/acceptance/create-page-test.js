import {
  click,
  fillIn,
  currentURL,
  triggerEvent,
  visit,
  waitFor
} from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
import { getPageTitle } from 'ember-page-title/test-support';

let server;

module('Acceptance | create', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/latestCommitEvent', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);

    server.get('http://localhost:8080/v4/banners', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('/create a pipeline: not logged in will redirect', async function (assert) {
    await visit('/create');

    assert.equal(currentURL(), '/login');
  });

  test('/create a pipeline: SUCCESS', async function (assert) {
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
        id: '1',
        workflowGraph: {
          nodes: ['dummy'],
          edges: ['dummy']
        }
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

    server.get('http://localhost:8080/v4/pipelines/1/stages', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/triggers', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);
    server.get('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);
    server.get('http://localhost:8080/v4/templates', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    await authenticateSession({ token: 'faketoken' });
    await visit('/create');

    assert.equal(currentURL(), '/create');
    assert.equal(getPageTitle(), 'Create Pipeline', 'Page title is correct');
    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');
    await click('button.blue-button');
    await waitFor('button.start-button');
    assert.equal(currentURL(), '/pipelines/1/events');
  });

  test('/create a pipeline with rootDir: SUCCESS', async function (assert) {
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
        id: '1',
        workflowGraph: {
          nodes: ['dummy'],
          edges: ['dummy']
        }
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

    server.get('http://localhost:8080/v4/pipelines/1/stages', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/triggers', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    server.get('http://localhost:8080/v4/users/settings', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);

    server.get('http://localhost:8080/v4/templates', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    await authenticateSession({ token: 'faketoken' });
    await visit('/create');

    assert.equal(currentURL(), '/create');
    await fillIn('.scm-url', 'git@github.com:foo/bar.git');
    await triggerEvent('.scm-url', 'keyup');
    await click('.checkbox-input');
    await fillIn('.root-dir', 'lib');
    await click('button.blue-button');
    await waitFor('button.start-button');
    assert.equal(currentURL(), '/pipelines/1/events');
  });

  test('/create a pipeline: FAILURE', async function (assert) {
    server.post('http://localhost:8080/v4/pipelines', () => [
      409,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        statusCode: 409,
        error: 'Conflict',
        message: 'something conflicting'
      })
    ]);
    server.get('http://localhost:8080/v4/templates', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    await authenticateSession({ token: 'faketoken' });
    await visit('/create');

    assert.equal(currentURL(), '/create');
    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');
    await click('button.blue-button');
    assert.equal(currentURL(), '/create');
    await waitFor('.alert > span');
    assert.dom('.alert > span').hasText('something conflicting');
  });

  test('Generate Screwdriver.yaml automatically', async function (assert) {
    server.post('http://localhost:8080/v4/pipelines', () => [
      409,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        statusCode: 409,
        error: 'Conflict',
        message: 'something conflicting'
      })
    ]);

    server.get('http://localhost:8080/v4/templates', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    await authenticateSession({ token: 'faketoken' });
    await visit('/create');

    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');
    await click('label.autogenerate-screwdriver-yaml');

    assert.dom('.select-template').hasText('template');
    assert.dom('.templates-dropdown').exists();
    assert.dom('.ace_editor').exists();
  });

  test('Create Screwdriver.yaml manually', async function (assert) {
    server.post('http://localhost:8080/v4/pipelines', () => [
      409,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        statusCode: 409,
        error: 'Conflict',
        message: 'something conflicting'
      })
    ]);

    server.get('http://localhost:8080/v4/templates', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

    await authenticateSession({ token: 'faketoken' });
    await visit('/create');

    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');

    assert.dom('.templates-dropdown').doesNotExist();
    assert.dom('.ace_editor').doesNotExist();
    assert.dom('#template-validate-results').doesNotExist();
  });

  test('Quick start guide', async function (assert) {
    server.post('http://localhost:8080/v4/pipelines', () => [
      409,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        statusCode: 409,
        error: 'Conflict',
        message: 'something conflicting'
      })
    ]);

    server.get('http://localhost:8080/v4/templates', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);

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
