import { visit, currentURL } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { getPageTitle } from 'ember-page-title/test-support';

const dummyCommands = [
  {
    id: 2,
    namespace: 'foo',
    version: '2.0.0',
    description: 'test command\n',
    maintainer: 'screwdriver@example.com',
    format: 'binary',
    binary: {
      file: 'tmpfile'
    },
    name: 'bar',
    pipelineId: 3,
    createTime: '2016-09-23T16:53:00.274Z',
    trusted: false,
    latest: true,
    lastUpdated: '4 days ago'
  },
  {
    id: 1,
    namespace: 'foo',
    version: '1.0.0',
    description: 'test command\n',
    maintainer: 'screwdriver@example.com',
    format: 'binary',
    binary: {
      file: 'tmpfile'
    },
    name: 'bar',
    pipelineId: 3,
    createTime: '2016-09-23T16:53:00.274Z',
    trusted: false,
    latest: true,
    lastUpdated: '4 days ago'
  }
];

module('Acceptance | commands', function (hooks) {
  const mockApi = setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    mockApi.get('/commands', () => [200, dummyCommands]);
    mockApi.get('/commands/foo/bar', () => [200, dummyCommands]);
    mockApi.get('/commands/foo/bar/tags', () => [200, dummyCommands]);
    mockApi.get('/commands/not/exist', () => [200, []]);
    mockApi.get('/commands/not/exist/tags', () => [200, []]);
    mockApi.get('/commands/foo/bar/not-exist', () => [200, []]);
  });

  test('visiting /commands', async assert => {
    await visit('/commands');

    assert.dom('.models-table-wrapper').exists({ count: 1 });
    assert.equal(currentURL(), '/commands');
    assert.equal(getPageTitle(), 'Commands', 'Page title is correct');
  });

  test('visiting /commands/foo/bar', async assert => {
    await visit('/commands/foo/bar');

    assert.equal(currentURL(), '/commands/foo/bar');
    assert.equal(getPageTitle(), 'Commands > foo/bar', 'Page title is correct');
  });

  test('visiting /commands/foo/bar/1.0.0', async assert => {
    await visit('/commands/foo/bar/1.0.0');

    assert.equal(currentURL(), '/commands/foo/bar/1.0.0');
    assert.equal(
      getPageTitle(),
      'Commands > foo/bar@1.0.0',
      'Page title is correct'
    );
  });

  test('visiting /commands has headers and description', async assert => {
    await visit('/commands');

    assert.strictEqual(currentURL(), '/commands');

    assert.equal(currentURL(), '/commands');
    assert.dom('.commands-header > h4').includesText('Commands');
    assert.dom('.commands-header > h4 > a').includesText('Commands Docs');
    assert
      .dom('.commands-header > .command-description')
      .includesText(
        'Commands share binaries (or scripts) across multiple jobs.'
      );
  });

  test('visiting /commands/not/exist', async assert => {
    await visit('/commands/not/exist');

    assert.equal(currentURL(), '/commands/not/exist');
    assert.dom('.code').hasText('404');
  });

  test('visiting /commands/foo/bar/not-exist', async assert => {
    await visit('/commands/foo/bar/not-exist');

    assert.equal(currentURL(), '/commands/foo/bar/not-exist');
    assert.dom('.code').hasText('404');
  });
});
