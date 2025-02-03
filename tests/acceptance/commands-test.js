import { visit, currentURL } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'screwdriver-ui/tests/helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';
import Pretender from 'pretender';
import { getPageTitle } from 'ember-page-title/test-support';
import { hasCollections } from 'screwdriver-ui/tests/mock/collections';
import { adminJWT } from '../mock/jwt';

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

let server;

module('Acceptance | commands', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/collections', hasCollections);
    server.get('http://localhost:8080/v4/commands', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(dummyCommands)
    ]);
    server.get('http://localhost:8080/v4/commands/foo/bar', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(dummyCommands)
    ]);
    server.get('http://localhost:8080/v4/commands/foo/bar/tags', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(dummyCommands)
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

  test('visiting /commands', async assert => {
    await authenticateSession({ token: 'faketoken' });
    await visit('/commands');

    assert.dom('.models-table-wrapper').exists({ count: 1 });
    assert.equal(currentURL(), '/commands');
    assert.equal(getPageTitle(), 'Commands', 'Page title is correct');
  });

  test('visiting /commands/foo/bar', async assert => {
    await authenticateSession({ token: adminJWT });
    await visit('/commands/foo/bar');

    assert.equal(currentURL(), '/commands/foo/bar');
    assert.equal(getPageTitle(), 'Commands > foo/bar', 'Page title is correct');
  });

  test('visiting /commands/foo/bar/1.0.0', async assert => {
    await authenticateSession({ token: adminJWT });
    await visit('/commands/foo/bar/1.0.0');

    assert.equal(currentURL(), '/commands/foo/bar/1.0.0');
    assert.equal(
      getPageTitle(),
      'Commands > foo/bar@1.0.0',
      'Page title is correct'
    );
  });

  test('visiting /commands has headers and description', async assert => {
    await authenticateSession({ token: adminJWT });
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
});
