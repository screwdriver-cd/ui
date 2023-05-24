import { visit, currentURL } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateSession } from 'ember-simple-auth/test-support';
import { getPageTitle } from 'ember-page-title/test-support';
import Pretender from 'pretender';

let server;

module('Acceptance | pipeline-visualizer', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
    server.get('http://localhost:8080/v4/auth/contexts', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);
    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1'
      })
    ]);
    server.get('http://localhost:8080/v4/banners', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({})
    ]);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('visiting /pipeline-visualizer', async assert => {
    await authenticateSession({ token: 'fakeToken' });
    await visit('/pipeline-visualizer');

    assert.equal(currentURL(), '/pipeline-visualizer');
    assert.equal(
      getPageTitle(),
      'Pipeline Visualizer',
      'Page title is correct'
    );
  });
});
