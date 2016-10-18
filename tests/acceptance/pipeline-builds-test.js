import { test } from 'qunit';
import moduleForAcceptance from 'screwdriver-ui/tests/helpers/module-for-acceptance';
import Ember from 'ember';
import Pretender from 'pretender';
let server;

const BUILD = {
  id: '1234',
  jobId: 'aabbcc',
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

const jobs = [
  {
    id: '12345',
    name: 'main',
    pipelineId: 'abcd',
    state: 'ENABLED',
    archived: false
  },
  {
    id: '12346',
    name: 'publish',
    pipelineId: 'abcd',
    state: 'ENABLED',
    archived: false
  },
  {
    id: '12347',
    name: 'PR-42',
    pipelineId: 'abcd',
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

const makeBuilds = (jobId) => {
  const builds = [];

  shas.forEach((sha) => {
    const b = Ember.copy(BUILD, true);
    const config = {
      id: Math.floor(Math.random() * 99999999999),
      jobId,
      sha,
      number: Date.now(),
      status: ['SUCCESS', 'FAILURE', 'RUNNING'][Math.floor(Math.random() * 2)]
    };

    Ember.merge(b, config);

    builds.push(b);
  });

  return builds;
};

moduleForAcceptance('Acceptance | pipeline builds', {
  beforeEach() {
    server = new Pretender();

    server.get('http://localhost:8080/v4/pipelines/abcd', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify({
        id: 'abcd',
        scmUrl: 'git@github.com:foo/bar.git#master',
        scmRepo: {
          name: 'foo/bar',
          branch: 'master',
          url: 'https://github.com/foo/bar'
        },
        createTime: '2016-09-15T23:12:23.760Z',
        admins: { batman: true },
        workflow: ['main', 'publish']
      })
    ]);

    server.get('http://localhost:8080/v4/pipelines/abcd/jobs', () => [
      200,
      { 'Content-Type': 'application/json' },
      JSON.stringify(jobs)
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
  },
  afterEach() {
    server.shutdown();
  }
});

test('visiting /pipelines/abcd', function (assert) {
  visit('/pipelines/abcd');

  andThen(() => {
    assert.equal(currentURL(), '/pipelines/abcd');
    assert.equal(find('a h1').text().trim(), 'foo/bar', 'incorrect pipeline name');
    assert.equal(find('.arrow-right').length, 4, 'not enough workflow');
    assert.equal(find('.arrow-right').length, 4, 'not enough workflow');
    assert.equal(find('button').length, 0, 'should not have a start button');
    assert.equal(find('.pure-u-md-3-4 h2').text().trim(), 'Builds');
    assert.equal(find('.pure-u-md-1-4 h2').text().trim(), 'Pull Requests');
    assert.equal(find('.pure-u-md-3-4 > div > div.ember-view').length, 5);
  });
});
