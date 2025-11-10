import { visit, currentURL } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { getPageTitle } from 'ember-page-title/test-support';

module('Acceptance | templates', function (hooks) {
  const mockApi = setupApplicationTest(hooks);

  hooks.beforeEach(function () {
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

    mockApi.get('/templates', () => [200, dummyTemplates]);
    mockApi.get('/templates/foo/bar', () => [200, dummyTemplates]);
    mockApi.get('/templates/foo%2Fbar/metrics', () => [200, dummyTemplates]);
    mockApi.get('/templates/foo%2Fbar/tags', () => [200, dummyTemplates]);
    mockApi.get('/templates/not%2Fexist', () => [200, []]);
    mockApi.get('/templates/not%2Fexist/metrics', () => [200, []]);
    mockApi.get('/templates/not%2Fexist/tags', () => [200, []]);
  });

  test('visiting /templates', async assert => {
    await visit('/templates/job');

    assert.dom('.models-table-wrapper').exists({ count: 1 });
    assert.equal(currentURL(), '/templates/job');
    assert.equal(getPageTitle(), 'Templates', 'Page title is correct');
  });

  test('visiting /templates/job/foo/bar', async assert => {
    await visit('/templates/job/foo/bar');

    assert.equal(currentURL(), '/templates/job/foo/bar');
    assert.equal(
      getPageTitle(),
      'Templates > foo/bar',
      'Page title is correct'
    );
  });

  test('visiting /templates/job/foo/bar/1.0.0', async assert => {
    await visit('/templates/job/foo/bar/1.0.0');

    assert.equal(currentURL(), '/templates/job/foo/bar/1.0.0');
    assert.equal(
      getPageTitle(),
      'Templates > foo/bar@1.0.0',
      'Page title is correct'
    );
  });

  test('visiting /templates/job/not/exist', async assert => {
    await visit('/templates/job/not/exist');

    assert.equal(currentURL(), '/templates/job/not/exist');
    assert.dom('.code').hasText('404');
  });

  test('visiting /templates/job/foo/bar/not-exist', async assert => {
    await visit('/templates/job/foo/bar/not-exist');

    assert.equal(currentURL(), '/templates/job/foo/bar/not-exist');
    assert.dom('.code').hasText('404');
  });
});
