import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
// import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
import Ember from 'ember';
import moment from 'moment';
let server;
const time = 1474649593036;
const timeFormat = moment(time).format('HH:mm:ss');

moduleForAcceptance('Acceptance | build', {
  beforeEach() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/pipelines/abcd', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        admins: { batman: true },
        createTime: '2016-09-15T23:12:23.760Z',
        id: 'abcd',
        scmRepo: {
          name: 'foo/bar',
          branch: 'master',
          url: 'https://github.com/foo/bar'
        },
        scmUri: 'github.com:123456:master',
        workflow: ['main', 'publish', 'prod']
      })
    ]);

    server.get('http://localhost:8080/v4/builds/1234', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '1234',
        jobId: 'aabbcc',
        eventId: 'eeeeee',
        number: 1474649580274,
        container: 'node:6',
        cause: 'Started by user petey',
        sha: 'c96f36886e084d18bd068b8156d095cd9b31e1d6',
        createTime: '2016-09-23T16:53:00.274Z',
        startTime: '2016-09-23T16:53:08.601Z',
        endTime: '2016-09-23T16:58:47.355Z',
        meta: {},
        steps: [{
          startTime: '2016-09-23T16:53:07.497654442Z',
          name: 'sd-setup',
          code: 0,
          endTime: '2016-09-23T16:53:12.46806858Z'
        }, {
          startTime: '2016-09-23T16:53:12.902784483Z',
          name: 'install',
          code: 137,
          endTime: '2016-09-23T16:58:46.924844475Z'
        }, {
          name: 'bower'
        }, {
          name: 'test'
        }],
        status: 'FAILURE',
        commit: {
          url: 'https://github.com/commit',
          message: 'merge this'
        }
      })
    ]);

    server.get('http://localhost:8080/v4/events/eeeeee', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
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
        createTime: '2016-11-04T20:09:41.238Z',
        creator: {
          username: 'batman',
          name: 'Bruce W',
          avatar: 'http://example.com/u/batman/avatar',
          url: 'http://example.com/u/batman'
        },
        pipelineId: '12345',
        sha: 'abcdef1029384',
        type: 'pipeline',
        workflow: ['main', 'publish']
      })
    ]);

    server.get('http://localhost:8080/v4/jobs/aabbcc', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: 'aabbcc',
        name: 'PR-50',
        permutations: [{
          environment: {},
          secrets: [],
          commands: [{
            name: 'install',
            command: 'npm install'
          }, {
            name: 'bower',
            command: 'npm install bower && ./node_modules/.bin/bower install --allow-root'
          }, {
            name: 'test',
            command: 'npm test'
          }],
          image: 'node:6'
        }],
        pipelineId: '34b6834028c4c904dce3d9391c8b2dd4994ec6a9',
        state: 'ENABLED',
        archived: false
      })
    ]);

    server.get('http://localhost:8080/v4/builds/1234/steps/install/logs', () => [
      200,
      { 'Content-Type': 'application/json', 'x-more-data': 'false' },
      JSON.stringify([{ t: time, m: 'bad stuff', n: 0 }])
    ]);

    server.get('http://localhost:8080/v4/builds/1234/steps/sd-setup/logs', () => [
      200,
      { 'Content-Type': 'application/json', 'x-more-data': 'false' },
      JSON.stringify([{ t: time, m: 'fancy stuff', n: 0 }])
    ]);
  },
  afterEach() {
    server.shutdown();
  }
});

test('visiting /pipelines/:id/build/:id', function (assert) {
  const $ = Ember.$;

  visit('/pipelines/abcd/build/1234');

  andThen(() => {
    assert.equal(currentURL(), '/pipelines/abcd/build/1234');
    assert.equal(find('a h1').text().trim(), 'foo/bar', 'incorrect pipeline name');
    assert.equal(find('.line1 h1').text().trim(), 'PR-50', 'incorrect job name');
    assert.equal(find('span.sha').text().trim(), '#abcdef', 'incorrect sha');
    assert.equal(find('.is-open .logs').text().trim(),
      `${timeFormat}bad stuff`, 'incorrect logs open');

    // This looks weird, but :nth-child(n) wasn't resolving properly.
    // This does essentially the same thing by setting a context for looking up `.name`.
    click('.name', $('.build-step-collection > div').get(2)); // close install step
    click('.name', $('.build-step-collection > div').get(1)); // open sd-setup step

    andThen(() => {
      assert.equal(find('.is-open .logs').text().trim(),
        `${timeFormat}fancy stuff`, 'incorrect logs open');
    });
  });
});
