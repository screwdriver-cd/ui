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
import { getPageTitle } from 'ember-page-title/test-support';
import { invalidateSession } from 'ember-simple-auth/test-support';
import { PIPELINE_WITH_NO_EVENTS_ID } from '../mock/pipeline';

module('Acceptance | create', function (hooks) {
  const mockApi = setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    mockApi.get('/templates', () => [200, []]);
    mockApi.get(
      `/pipelines/${PIPELINE_WITH_NO_EVENTS_ID}/latestCommitEvent`,
      () => {
        return [200, {}];
      }
    );

    localStorage.setItem('oldUi', true);
  });

  hooks.afterEach(() => {
    localStorage.removeItem('oldUi');
  });

  test('/create a pipeline: not logged in will redirect', async function (assert) {
    await invalidateSession();
    await visit('/create');

    assert.equal(currentURL(), '/login');
  });

  test('/create a pipeline: SUCCESS', async function (assert) {
    await visit('/create');

    assert.equal(currentURL(), '/create');
    assert.equal(getPageTitle(), 'Create Pipeline', 'Page title is correct');
    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');
    await click('button.blue-button');
    await waitFor('button.start-button');
    assert.equal(
      currentURL(),
      `/pipelines/${PIPELINE_WITH_NO_EVENTS_ID}/events`
    );
  });

  test('/create a pipeline with rootDir: SUCCESS', async function (assert) {
    await visit('/create');

    assert.equal(currentURL(), '/create');
    await fillIn('.scm-url', 'git@github.com:foo/bar.git');
    await triggerEvent('.scm-url', 'keyup');
    await click('.checkbox-input');
    await fillIn('.root-dir', 'lib');
    await click('button.blue-button');
    await waitFor('button.start-button');
    assert.equal(
      currentURL(),
      `/pipelines/${PIPELINE_WITH_NO_EVENTS_ID}/events`
    );
  });

  test('/create a pipeline: FAILURE', async function (assert) {
    mockApi.post('/pipelines', () => [
      409,
      {
        statusCode: 409,
        error: 'Conflict',
        message: 'something conflicting'
      }
    ]);

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
    await visit('/create');

    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');
    await click('label.autogenerate-screwdriver-yaml');

    assert.dom('.select-template').hasText('template');
    assert.dom('.templates-dropdown').exists();
    assert.dom('.ace_editor').exists();
  });

  test('Create Screwdriver.yaml manually', async function (assert) {
    await visit('/create');

    await fillIn('.text-input', 'git@github.com:foo/bar.git');
    await triggerEvent('.text-input', 'keyup');

    assert.dom('.templates-dropdown').doesNotExist();
    assert.dom('.ace_editor').doesNotExist();
    assert.dom('#template-validate-results').doesNotExist();
  });

  test('Quick start guide', async function (assert) {
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
