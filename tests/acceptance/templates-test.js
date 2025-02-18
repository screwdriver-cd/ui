import { visit, currentURL } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
import { getPageTitle } from 'ember-page-title/test-support';
import { hasCollections } from 'screwdriver-ui/tests/mock/collections';
import { adminJWT } from '../mock/jwt';

const dummyTemplates = [
  {
    id: 2,
    namespace: 'foo',
    name: 'bar',
    version: '2.0.0',
    description: 'test template\n',
    maintainer: 'screwdriver@example.com',
    pipelineId: 3,
    createTime: '2016-09-23T16:53:00.274Z',
    trusted: false,
    latest: true,
    lastUpdated: '4 days ago',
    metrics: {
      jobs: { count: 6 },
      builds: { count: 32 },
      pipelines: { count: 3 }
    }
  },
  {
    id: 1,
    namespace: 'foo',
    name: 'bar',
    version: '1.0.0',
    description: 'test template\n',
    maintainer: 'screwdriver@example.com',
    pipelineId: 3,
    createTime: '2016-09-23T16:53:00.274Z',
    trusted: false,
    latest: true,
    lastUpdated: '4 days ago',
    metrics: {
      jobs: { count: 2 },
      builds: { count: 235 },
      pipelines: { count: 1 }
    }
  }
];

let server;

module('Acceptance | templates', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/collections', hasCollections);
    server.get('http://localhost:8080/v4/templates', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(dummyTemplates)
    ]);
    server.get('http://localhost:8080/v4/templates/foo/bar', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(dummyTemplates)
    ]);
    server.get('http://localhost:8080/v4/templates/foo%2Fbar/metrics', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(dummyTemplates)
    ]);
    server.get('http://localhost:8080/v4/templates/foo%2Fbar/tags', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(dummyTemplates)
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

  test('visiting /templates', async assert => {
    await authenticateSession({ token: 'faketoken' });
    await visit('/templates/job');

    assert.dom('.models-table-wrapper').exists({ count: 1 });
    assert.equal(currentURL(), '/templates/job');
    assert.equal(getPageTitle(), 'Templates', 'Page title is correct');
  });

  test('visiting /templates/job/foo/bar', async assert => {
    await authenticateSession({ token: adminJWT });
    await visit('/templates/job/foo/bar');

    assert.equal(currentURL(), '/templates/job/foo/bar');
    assert.equal(
      getPageTitle(),
      'Templates > foo/bar',
      'Page title is correct'
    );
  });

  test('visiting /templates/job/foo/bar/1.0.0', async assert => {
    await authenticateSession({ token: adminJWT });
    await visit('/templates/job/foo/bar/1.0.0');

    assert.equal(currentURL(), '/templates/job/foo/bar/1.0.0');
    assert.equal(
      getPageTitle(),
      'Templates > foo/bar@1.0.0',
      'Page title is correct'
    );
  });
});
