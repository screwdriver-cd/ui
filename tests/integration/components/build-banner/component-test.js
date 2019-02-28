import EmberObject from '@ember/object';
import moment from 'moment';
import hbs from 'htmlbars-inline-precompile';
import { moduleForComponent } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';
import { resolve, Promise as EmberPromise } from 'rsvp';
import Service from '@ember/service';
import wait from 'ember-test-helpers/wait';

const coverageService = Service.extend({
  getCoverageInfo() {
    return resolve({
      coverage: '98%',
      coverageUrl: 'http://example.com/coverage/123',
      tests: '7/10',
      testsUrl: 'http://example.com/coverage/123'
    });
  }
});

const buildStepsMock = [
  { name: 'sd-setup-screwdriver-scm-bookend' }
];

const eventMock = EmberObject.create({
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
  type: 'pipelineId',
  workflow: ['main', 'publish'],
  builds: ['build1', 'build2']
});

const buildMock = EmberObject.create({
  eventId: 'abcd',
  id: '2'
});

const buildMetaMock = {
  tests: {
    coverage: '100',
    results: '10/10'
  }
};

moduleForComponent('build-banner', 'Integration | Component | build banner', {
  integration: true,

  beforeEach() {
    this.register('service:coverage', coverageService);
  }
});

test('it renders', function (assert) {
  assert.expect(10);
  const $ = this.$;

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('reloadCb', () => {
    assert.ok(true);
  });

  this.set('changeB', () => {
    assert.ok(true);
  });

  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.set('buildStepsMock', buildStepsMock);
  this.set('eventMock', eventMock);
  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="11 seconds"
    blockDuration="4 seconds"
    imagePullDuration="5 seconds"
    buildDuration="2 seconds"
    buildStatus="RUNNING"
    buildCreate="2016-11-04T20:08:41.238Z"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    jobName="PR-671"
    isAuthenticated=false
    event=eventMock
    prEvents=prEvents
    reloadBuild=(action reloadCb)
    changeBuild=(action changeB)
  }}`);
  const expectedTime = moment('2016-11-04T20:08:41.238Z').format('YYYY-MM-DD HH:mm:ss');

  assert.equal($('li.job-name .banner-value').text().trim(), 'PR-671');
  assert.equal($('.commit a').prop('href'),
    'http://example.com/batcave/batmobile/commit/abcdef1029384');
  assert.equal($('.commit a').text().trim(), '#abcdef');
  assert.equal($('.duration .banner-value').text().trim(), '11 seconds' +
  '4 seconds blocked5 seconds pulling image2 seconds in build');
  assert.equal($('.created .banner-value').text().trim(), expectedTime);
  assert.equal($('.user .banner-value').text().trim(), 'Bruce W');
  assert.equal($('.docker-container .banner-value').text().trim(), 'node:6');
  assert.equal($('button').length, 0);
});

test('it renders pr link if pr url info is available', function (assert) {
  assert.expect(12);
  const $ = this.$;

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('reloadCb', () => {
    assert.ok(true);
  });

  this.set('buildStepsMock', buildStepsMock);
  this.set('eventMock', eventMock);
  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    blockDuration="0 seconds"
    imagePullDuration="0 seconds"
    buildDuration="0 seconds"
    buildStatus="RUNNING"
    buildCreate="2016-11-04T20:08:41.238Z"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    jobName="PR-671"
    isAuthenticated=false
    event=eventMock
    prEvents=prEvents
    reloadBuild=(action reloadCb)
  }}`);
  const expectedTime = moment('2016-11-04T20:08:41.238Z').format('YYYY-MM-DD HH:mm:ss');

  assert.equal($('.pr .pr-url-holder a').prop('href'),
    'https://github.com/screwdriver-cd/ui/pull/292');
  assert.equal($('.pr .pr-url-holder a').text().trim(), 'PR#292');
  assert.equal($('li.job-name .banner-value').text().trim(), 'PR-671');
  assert.equal($('.commit a').prop('href'),
    'http://example.com/batcave/batmobile/commit/abcdef1029384');
  assert.equal($('.commit a').text().trim(), '#abcdef');
  assert.equal($('.duration .banner-value').text().trim(), '5 seconds0 seconds' +
  ' blocked0 seconds pulling image0 seconds in build');
  assert.equal($('.created .banner-value').text().trim(), expectedTime);
  assert.equal($('.user .banner-value').text().trim(), 'Bruce W');
  assert.equal($('.docker-container .banner-value').text().trim(), 'node:6');
  assert.equal($('button').length, 0);
});

test('it renders prCommit dropdown if event type is pr', function (assert) {
  assert.expect(13);
  const $ = this.$;

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('reloadCb', () => {
    assert.ok(true);
  });

  this.set('buildStepsMock', buildStepsMock);
  this.set('eventMock', eventMock);
  this.set('prEvents', new EmberPromise(resolves =>
    resolves([{ build: buildMock, event: eventMock }])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    blockDuration="0 seconds"
    imagePullDuration="0 seconds"
    buildDuration="0 seconds"
    buildStatus="RUNNING"
    buildCreate="2016-11-04T20:08:41.238Z"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    jobName="PR-671"
    isAuthenticated=false
    event=eventMock
    prEvents=prEvents
    reloadBuild=(action reloadCb)
  }}`);
  const expectedTime = moment('2016-11-04T20:08:41.238Z').format('YYYY-MM-DD HH:mm:ss');

  assert.equal($('.pr .pr-url-holder a').prop('href'),
    'https://github.com/screwdriver-cd/ui/pull/292');
  assert.equal($('.pr .pr-url-holder a').text().trim(), 'PR#292');
  assert.equal($('li.job-name .banner-value').text().trim(), 'PR-671');
  assert.equal($('.commit a').prop('href'),
    'http://example.com/batcave/batmobile/commit/abcdef1029384');
  assert.equal($('.commit .commit-sha').text().trim(), '#abcdef');
  assert.equal($('.commit ul li').text().trim(), '1. abcdef');
  assert.equal($('.duration .banner-value').text().trim(), '5 seconds0 seconds' +
  ' blocked0 seconds pulling image0 seconds in build');
  assert.equal($('.created .banner-value').text().trim(), expectedTime);
  assert.equal($('.user .banner-value').text().trim(), 'Bruce W');
  assert.equal($('.docker-container .banner-value').text().trim(), 'node:6');
  assert.equal($('button').length, 0);
});

test('it renders a restart button for completed jobs when authenticated', function (assert) {
  assert.expect(3);

  const reloadBuildSpy = this.spy();

  this.set('buildStepsMock', buildStepsMock);
  this.set('reloadCb', reloadBuildSpy);
  this.set('externalStart', () => {
    assert.ok(true);
  });
  this.set('eventMock', eventMock);
  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildStatus="ABORTED"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    jobName="PR-671"
    isAuthenticated=true
    event=eventMock
    prEvents=prEvents
    onStart=(action externalStart)
    reloadBuild=(action reloadCb)
  }}`);

  assert.equal(this.$('button').text().trim(), 'Restart');
  assert.notOk(reloadBuildSpy.called);
  this.$('button').click();
});

test('it renders a stop button for running job when authenticated', function (assert) {
  assert.expect(4);
  this.set('willRender', () => {
    assert.ok(true);
  });

  this.set('externalStop', () => {
    assert.ok(true);
  });
  this.set('buildStepsMock', buildStepsMock);
  this.set('eventMock', eventMock);
  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildStatus="RUNNING"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    jobName="main"
    isAuthenticated=true
    event=eventMock
    prEvents=prEvents
    onStop=(action externalStop)
    reloadBuild=(action willRender)
  }}`);

  assert.equal(this.$('button').text().trim(), 'Stop');
  this.$('button').click();
});

test('it renders a stop button for blocked job when authenticated', function (assert) {
  assert.expect(4);
  this.set('willRender', () => {
    assert.ok(true);
  });

  this.set('externalStop', () => {
    assert.ok(true);
  });
  this.set('buildStepsMock', buildStepsMock);
  this.set('eventMock', eventMock);
  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildStatus="BLOCKED"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    jobName="main"
    isAuthenticated=true
    event=eventMock
    prEvents=prEvents
    onStop=(action externalStop)
    reloadBuild=(action willRender)
  }}`);

  assert.equal(this.$('button').text().trim(), 'Stop');
  this.$('button').click();
});

test('it renders coverage info if coverage step finished', function (assert) {
  const $ = this.$;
  const coverageStepsMock = [
    { name: 'sd-setup-screwdriver-scm-bookend',
      startTime: '2016-11-04T20:09:41.238Z'
    },
    {
      name: 'sd-teardown-screwdriver-coverage-bookend',
      endTime: '2016-11-04T21:09:41.238Z'
    }
  ];

  assert.expect(4);
  this.set('eventMock', eventMock);
  this.set('buildStepsMock', coverageStepsMock);
  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildId=123
    buildStatus="SUCCESS"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    jobId=1
    jobName="main"
    isAuthenticated=true
    event=eventMock
    prEvents=prEvents
  }}`);

  return wait().then(() => {
    assert.equal($('.coverage .banner-value').text().trim(), '98%');
    assert.equal($('.tests .banner-value').text().trim(), '7/10');
    assert.equal($('.coverage a').prop('href'), 'http://example.com/coverage/123');
    assert.equal($('.tests a').prop('href'), 'http://example.com/coverage/123');
  });
});

test('it renders default coverage info if coverage step has not finished', function (assert) {
  const $ = this.$;
  const coverageStepsMock = [
    { name: 'sd-setup-screwdriver-scm-bookend' },
    { name: 'sd-teardown-screwdriver-coverage-bookend' }
  ];

  assert.expect(7);

  this.set('reloadCb', () => {
    assert.ok(true);
  });
  this.set('eventMock', eventMock);
  this.set('buildStepsMock', coverageStepsMock);
  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildId=123
    buildStatus="RUNNING"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    jobId=1
    jobName="main"
    isAuthenticated=true
    event=eventMock
    reloadBuild=(action reloadCb)
    prEvents=prEvents
  }}`);

  return wait().then(() => {
    assert.equal(this.$('button').text().trim(), 'Stop');
    assert.equal($('.coverage .banner-value').text().trim(), 'N/A');
    assert.equal($('.tests .banner-value').text().trim(), 'N/A');
    assert.equal($('.coverage a').prop('title'), 'Coverage report not generated');
    assert.equal($('.tests a').prop('title'), 'Tests report not generated');
  });
});

test('it overrides coverage info if it is set in build meta', function (assert) {
  const $ = this.$;
  const coverageStepsMock = [
    { name: 'sd-setup-screwdriver-scm-bookend',
      startTime: '2016-11-04T20:09:41.238Z'
    },
    {
      name: 'sd-teardown-screwdriver-coverage-bookend',
      endTime: '2016-11-04T21:09:41.238Z'
    }
  ];

  assert.expect(2);
  this.set('eventMock', eventMock);
  this.set('buildStepsMock', coverageStepsMock);
  this.set('buildMetaMock', buildMetaMock);
  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildId=123
    buildStatus="SUCCESS"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    buildMeta=buildMetaMock
    jobId=1
    jobName="main"
    isAuthenticated=true
    event=eventMock
    prEvents=prEvents
  }}`);

  return wait().then(() => {
    assert.equal($('.coverage .banner-value').text().trim(), '100%');
    assert.equal($('.tests .banner-value').text().trim(), '10/10');
  });
});

test('it does not override coverage info if build meta format is not correct', function (assert) {
  const $ = this.$;
  const coverageStepsMock = [
    { name: 'sd-setup-screwdriver-scm-bookend',
      startTime: '2016-11-04T20:09:41.238Z'
    },
    {
      name: 'sd-teardown-screwdriver-coverage-bookend',
      endTime: '2016-11-04T21:09:41.238Z'
    }
  ];

  buildMetaMock.tests = {
    coverage: 'nonsense',
    resulst: 'nonsense'
  };
  assert.expect(2);
  this.set('eventMock', eventMock);
  this.set('buildStepsMock', coverageStepsMock);
  this.set('buildMetaMock', buildMetaMock);
  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildId=123
    buildStatus="SUCCESS"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    buildMeta=buildMetaMock
    jobId=1
    jobName="main"
    isAuthenticated=true
    event=eventMock
    prEvents=prEvents
  }}`);

  return wait().then(() => {
    assert.equal($('.coverage .banner-value').text().trim(), '98%');
    assert.equal($('.tests .banner-value').text().trim(), '7/10');
  });
});

test('it does not render coverage info if there is no coverage step', function (assert) {
  const $ = this.$;

  assert.expect(1);
  this.set('eventMock', eventMock);
  this.set('buildStepsMock', buildStepsMock);
  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildId=123
    buildStatus="SUCCESS"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    jobId=1
    jobName="main"
    isAuthenticated=true
    event=eventMock
    prEvents=prEvents
  }}`);

  return wait().then(() => {
    assert.notOk($('li').hasClass('coverage'));
  });
});

test('it should show the stop button for a running UNSTABLE build', function (assert) {
  const coverageStepsMock = [
    { name: 'sd-setup-screwdriver-scm-bookend' },
    { name: 'sd-teardown-screwdriver-coverage-bookend' }
  ];

  assert.expect(3);

  this.set('reloadCb', () => {
    assert.ok(true);
  });
  this.set('eventMock', eventMock);
  this.set('buildStepsMock', coverageStepsMock);
  this.set('prEvents', new EmberPromise(resolves => resolves([])));

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildId=123
    buildStatus="UNSTABLE"
    buildStart="2016-11-04T20:09:41.238Z"
    buildSteps=buildStepsMock
    jobId=1
    jobName="main"
    isAuthenticated=true
    event=eventMock
    reloadBuild=(action reloadCb)
    prEvents=prEvents
  }}`);

  return wait().then(() => {
    assert.equal(this.$('button').text().trim(), 'Stop');
  });
});
