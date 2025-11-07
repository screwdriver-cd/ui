import { currentURL, visit, fillIn, click } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { getPageTitle } from 'ember-page-title/test-support';
import sinon from 'sinon';

module('Acceptance | user-settings', function (hooks) {
  const testUrl = '/user-settings/preferences';
  const mockApi = setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    mockApi.get('/tokens', () => [
      200,
      {
        id: '1'
      }
    ]);
  });

  test('visiting /user-settings/preferences', async function (assert) {
    await visit(testUrl);

    assert.equal(currentURL(), testUrl);
    assert.dom('section.preference li').exists({ count: 4 });
  });

  test('update user preferences', async function (assert) {
    await visit(testUrl);

    assert.equal(currentURL(), testUrl);
    assert.equal(
      getPageTitle(),
      'User Settings > Preferences',
      'Page title is correct'
    );
    assert.dom('.ember-power-select-selected-item').hasText('Local Timezone');
    assert.dom('.display-job-name').hasProperty('placeholder', '20');

    await click('.ember-basic-dropdown-trigger');
    await click('.ember-power-select-options li:last-child');
    await fillIn('.display-job-name', 50);
    await click('button.blue-button');

    assert.dom('.ember-power-select-selected-item').hasText('UTC');
    assert.dom('.display-job-name').hasValue('50');
    assert
      .dom('.alert-success span:not(button span)')
      .hasText('User settings updated successfully!');
  });

  test('update display job name length by overflowing value', async function (assert) {
    await visit(testUrl);

    assert.equal(currentURL(), testUrl);

    await fillIn('.display-job-name', 300);
    await click('button.blue-button');

    assert.dom('.display-job-name').hasValue('99');
    assert
      .dom('.alert-success span:not(button span)')
      .hasText('User settings updated successfully!');
  });

  test('update display job name length by underflow value', async function (assert) {
    await visit(testUrl);

    assert.equal(currentURL(), testUrl);

    await fillIn('.display-job-name', -1);
    await click('button.blue-button');

    assert.dom('.display-job-name').hasValue('20');
    assert
      .dom('.alert-success span:not(button span)')
      .hasText('User settings updated successfully!');
  });

  test('enable notifications', async function (assert) {
    sinon.stub(Notification, 'permission').value('granted');

    await visit(testUrl);

    assert.equal(currentURL(), testUrl);
    assert.equal(
      getPageTitle(),
      'User Settings > Preferences',
      'Page title is correct'
    );
    assert.dom('.ember-power-select-selected-item').hasText('Local Timezone');
    assert.dom('.display-job-name').hasProperty('placeholder', '20');
    assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');

    await click('.x-toggle-btn');

    assert
      .dom('.alert-success span:not(button span)')
      .hasText('User settings updated successfully!');
    assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');
  });
});
