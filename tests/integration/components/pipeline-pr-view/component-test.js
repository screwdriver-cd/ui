import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | pipeline pr view', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders a successful PR', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const job = EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      title: 'update readme',
      username: 'anonymous',
      builds: [
        {
          id: '1234',
          status: 'SUCCESS',
          startTimeWords: 'now'
        }
      ]
    });

    this.set('jobMock', job);

    await render(hbs`{{pipeline-pr-view job=jobMock}}`);

    assert.dom('.SUCCESS').exists({ count: 1 });
    assert.equal(
      find('.detail')
        .textContent.trim()
        .replace(/\s{2,}/g, ' '),
      'main Started now'
    );
    assert.dom('.date').hasText('Started now');
    assert.dom('.status .fa-check-circle-o').exists({ count: 1 });
  });

  // When a user sets a job to unstable, it should show unstable icon
  test('it renders an unstable PR', async function(assert) {
    const job = EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      title: 'update readme',
      username: 'anonymous',
      builds: [
        {
          id: '1234',
          status: 'UNSTABLE',
          startTimeWords: 'now'
        }
      ]
    });

    this.set('jobMock', job);

    await render(hbs`{{pipeline-pr-view job=jobMock}}`);

    assert.dom('.UNSTABLE').exists({ count: 1 });
    assert.dom('.fa-exclamation-circle').exists({ count: 1 });
  });

  test('it renders a failed PR', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const job = EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      title: 'update readme',
      username: 'anonymous',
      builds: [
        {
          id: '1234',
          status: 'FAILURE',
          startTimeWords: 'now'
        }
      ]
    });

    this.set('jobMock', job);

    await render(hbs`{{pipeline-pr-view job=jobMock}}`);

    assert.dom('.FAILURE').exists({ count: 1 });
    assert.dom('.fa-times-circle-o').exists({ count: 1 });
  });

  test('it renders a queued PR', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const job = EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      title: 'update readme',
      username: 'anonymous',
      builds: [
        {
          id: '1234',
          status: 'QUEUED',
          startTimeWords: 'now'
        }
      ]
    });

    this.set('jobMock', job);

    await render(hbs`{{pipeline-pr-view job=jobMock}}`);

    assert.dom('.QUEUED').exists({ count: 1 });
    assert.dom('.fa-spinner').exists({ count: 1 });
  });

  test('it renders a running PR', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const job = EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      title: 'update readme',
      username: 'anonymous',
      builds: [
        {
          id: '1234',
          status: 'RUNNING',
          startTimeWords: 'now'
        }
      ]
    });

    this.set('jobMock', job);

    await render(hbs`{{pipeline-pr-view job=jobMock}}`);

    assert.dom('.RUNNING').exists({ count: 1 });
    assert.dom('.fa-spinner').exists({ count: 1 });
  });
});
