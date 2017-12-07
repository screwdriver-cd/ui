// TODO: enable this test again when we figure out how to handle the event model without observers

// import $ from 'jquery';
// import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
// import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import Pretender from 'pretender';
// import moment from 'moment';
let server;
const time = 1474649593036;
// const timeFormat = moment(time).format('HH:mm:ss');
const GRAPH = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { id: 2, name: 'main' }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' }
  ]
};

moduleForAcceptance('Acceptance | build', {
  beforeEach() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/pipelines/1', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        admins: { batman: true },
        annotations: {},
        createTime: '2016-09-15T23:12:23.760Z',
        id: '1',
        scmContext: 'github:github.com',
        scmRepo: {
          name: 'foo/bar',
          branch: 'master',
          url: 'https://github.com/foo/bar'
        },
        scmUri: 'github.com:123456:master',
        workflow: [],
        workflowGraph: GRAPH
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines/1/jobs', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([{
        id: '2',
        name: 'main',
        permutations: [{
          environment: {},
          secrets: [],
          annotations: {},
          settings: {},
          commands: [{
            name: 'install',
            command: 'npm install'
          }],
          image: 'node:6',
          requires: ['~pr', '~commit']
        }],
        pipelineId: '1',
        state: 'ENABLED',
        archived: false
      }])
    ]);

    const buildData = {
      id: '1234',
      jobId: '2',
      eventId: '3',
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
      statusMessage: 'Build failed to start due to infrastructure err',
      commit: {
        url: 'https://github.com/commit',
        message: 'merge this'
      }
    };

    server.get('http://localhost:8080/v4/events/3/builds', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([buildData])
    ]);

    server.get('http://localhost:8080/v4/builds/1234', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(buildData)
    ]);

    server.get('http://localhost:8080/v4/events/3', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '3',
        causeMessage: 'Merged by robin',
        commit: {
          message: 'Merge pull request #1 from batcave/batmobile',
          author: {
            username: 'robin',
            name: 'Tim D',
            avatar: 'http://example.com/u/robin/avatar',
            url: 'http://example.com/u/robin'
          },
          url: 'http://example.com/batcave/batmobile/commit/abcdef1234456'
        },
        createTime: '2016-11-04T20:09:41.238Z',
        creator: {
          username: 'robin',
          name: 'Tim D',
          avatar: 'http://example.com/u/robin/avatar',
          url: 'http://example.com/u/robin'
        },
        startFrom: '~commit',
        pipelineId: '12345',
        sha: 'abcdef1234456',
        type: 'pipeline',
        workflowGraph: GRAPH
      })
    ]);

    server.get('http://localhost:8080/v4/jobs/2', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '2',
        name: 'PR-50:main',
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
        pipelineId: '1',
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

// test('visiting /pipelines/:id/builds/:id', function (assert) {
//   const first = new RegExp(`${timeFormat}\\s+bad stuff`);
//   const second = new RegExp(`${timeFormat}\\s+fancy stuff`);
//
//   visit('/pipelines/1/builds/1234');
//
//   andThen(() => {
//     assert.equal(currentURL(), '/pipelines/1/builds/1234');
//     assert.equal(find('a h1').text().trim(), 'foo/bar', 'incorrect pipeline name');
//     assert.equal(find('.headerbar h1').text().trim(), 'PR-50:main', 'incorrect job name');
//     assert.equal($('.alert-warning > span').text().trim(),
//       'Build failed to start due to infrastructure err', 'incorrect statusMessage');
//     assert.equal(find('span.sha').text().trim(), '#abcdef', 'incorrect sha');
//     assert.ok(find('.is-open .logs').text().trim().match(first), 'incorrect logs open');
//
//     // This looks weird, but :nth-child(n) wasn't resolving properly.
//     // This does essentially the same thing by setting a context for looking up `.name`.
//     click('.name', $('.build-step-collection > div').get(2)); // close install step
//     click('.name', $('.build-step-collection > div').get(1)); // open sd-setup step
//
//     andThen(() => {
//       assert.ok(find('.is-open .logs').text().trim().match(second), 'incorrect logs open');
//     });
//   });
// });
