import { merge } from '@ember/polyfills';
import { copy } from '@ember/object/internals';
import { test } from 'qunit';
import { authenticateSession } from 'screwdriver-ui/tests/helpers/ember-simple-auth';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import Pretender from 'pretender';
let server;

const BUILD = {
  id: '1234',
  jobId: '1',
  number: 1474649580274,
  container: 'node:6',
  cause: 'Started by user batman',
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
  status: 'FAILURE'
};

const GRAPH = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { id: 12345, name: 'main' },
    { is: 123456, name: 'publish' }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'publish' }
  ]
};

const events = [
  {
    id: '2',
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
    startFrom: '~commit',
    pipelineId: '12345',
    sha: 'abcdef1029384',
    type: 'pipeline',
    workflowGraph: GRAPH
  }, {
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
      url: 'http://example.com/batcave/batmobile/commit/1029384aaa'
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
    sha: '1029384aaa',
    type: 'pipeline',
    workflowGraph: GRAPH
  }
];

const jobs = [
  {
    id: '12345',
    name: 'main',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  },
  {
    id: '12346',
    name: 'publish',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  },
  {
    id: '12347',
    name: 'PR-42:main',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  }
];

const shas = [
  'abcd1234567890',
  'bcd1234567890a',
  'cd1234567890ab',
  'd1234567890abc',
  '1234567890abcd'
];

const makeBuilds = (eventId) => {
  const builds = [];

  shas.forEach((sha) => {
    const b = copy(BUILD, true);
    const config = {
      id: Math.floor(Math.random() * 99999999999),
      eventId,
      sha,
      number: Date.now(),
      status: ['SUCCESS', 'FAILURE', 'RUNNING'][Math.floor(Math.random() * 2)]
    };

    merge(b, config);

    builds.push(b);
  });

  return builds;
};

moduleForAcceptance('Acceptance | pipeline build', {
  beforeEach() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/pipelines/4', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: '4',
        scmUrl: 'git@github.com:foo/bar.git#master',
        scmRepo: {
          name: 'foo/bar',
          branch: 'master',
          url: 'https://github.com/foo/bar'
        },
        createTime: '2016-09-15T23:12:23.760Z',
        admins: { batman: true },
        workflowGraph: GRAPH
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines/4/jobs', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(jobs)
    ]);

    server.get('http://localhost:8080/v4/pipelines/4/events', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(events)
    ]);

    server.get('http://localhost:8080/v4/events/2/builds', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(makeBuilds('2'))
    ]);

    server.get('http://localhost:8080/v4/events/3/builds', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(makeBuilds('3'))
    ]);

    server.get('http://localhost:8080/v4/jobs/12345/builds', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(makeBuilds(12345))
    ]);

    server.get('http://localhost:8080/v4/jobs/12346/builds', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(makeBuilds(12346))
    ]);

    server.get('http://localhost:8080/v4/jobs/12347/builds', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(makeBuilds(12347))
    ]);

    server.get('http://localhost:8080/v4/collections', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify([])
    ]);
  },
  afterEach() {
    server.shutdown();
  }
});

test('visiting /pipelines/4 when not logged in', function (assert) {
  visit('/pipelines/4');

  andThen(() => {
    assert.equal(currentURL(), '/login');
  });
});

test('visiting /pipelines/4 when logged in', function (assert) {
  authenticateSession(this.application, { token: 'fakeToken' });

  visit('/pipelines/4');

  andThen(() => {
    assert.equal(currentURL(), '/pipelines/4/events');
    assert.equal(find('a h1').text().trim(), 'foo/bar', 'incorrect pipeline name');
    assert.equal(find('.pipelineWorkflow svg').length, 1, 'not enough workflow');
    assert.equal(find('button.start-button').length, 1, 'should have a start button');
    assert.equal(find('ul.nav-pills').length, 1, 'should show tabs');
    assert.equal(find('.col-md-3 h2').text().trim(), 'Pull Requests');
    assert.equal(find('tbody tr').length, 2);
  });
});
