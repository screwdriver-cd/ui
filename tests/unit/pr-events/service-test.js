import Pretender from 'pretender';
import Service from '@ember/service';
import { moduleFor, test } from 'ember-qunit';

let server;

const initServer = () => {
  server.get('http://localhost:8080/v4/pipelines/12345/events', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify([{
      id: 'abcd',
      causeMessage: 'Merged by batman',
      commit: {
        message: 'Merge pull request #2 from batcave/batmobile',
        author: {
          username: 'batman',
          name: 'Bruce W',
          avatar: 'http://example.com/u/batman/avatar',
          url: 'http://example.com/u/batman'
        },
        url: 'http://example.com/batcave/batmobile/commit/abcdef1029384'
      },
      truncatedMessage: 'Merge it',
      createTime: '2016-11-04T20:09:41.238Z',
      creator: {
        username: 'batman',
        name: 'Bruce W',
        avatar: 'http://example.com/u/batman/avatar',
        url: 'http://example.com/u/batman'
      },
      pr: {
        url: 'https://github.com/screwdriver-cd/ui/pull/292'
      },
      pipelineId: '12345',
      sha: 'abcdef1029384',
      truncatedSha: 'abcdef',
      type: 'pr',
      workflow: ['main', 'publish'],
      builds: ['build1', 'build2']
    }])
  ]);

  server.get('http://localhost:8080/v4/jobs/2/builds', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify([{
      eventId: 'abcd',
      id: '2'
    }])
  ]);
};

const sessionServiceMock = Service.extend({
  isAuthenticated: true,
  data: {
    authenticated: {
      token: 'banana'
    }
  }
});

moduleFor('service:pr-events', 'Unit | Service | pr events', {
  beforeEach() {
    server = new Pretender();
    this.register('service:session', sessionServiceMock);
    this.inject.service('session', { as: 'session' });
    this.session.set('isAuthenticated', true);
  },

  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  const service = this.subject();

  assert.ok(service);
});

test('it fetches events with type pr', function (assert) {
  initServer();

  assert.expect(3);
  const service = this.subject();
  const b = service.getPRevents(12345, 'https://github.com/screwdriver-cd/ui/pull/292', 2);

  b.then((pair) => {
    assert.equal(pair[0].event.id, 'abcd');
    assert.equal(pair[0].build.eventId, 'abcd');
    assert.equal(pair[0].build.id, 2);
  });
});
