import EmberObject from '@ember/object';
import moment from 'moment';
import hbs from 'htmlbars-inline-precompile';
import { moduleForComponent } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';
import { resolve } from 'rsvp';
import Service from '@ember/service';
import wait from 'ember-test-helpers/wait';

const coverageService = Service.extend({
  getConverageInfo() {
    return resolve({
      coverage: 98,
      projectUrl: 'http://example.com/coverage/123'
    });
  }
});

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
  pipelineId: '12345',
  sha: 'abcdef1029384',
  truncatedSha: 'abcdef',
  type: 'pipeline',
  workflow: ['main', 'publish'],
  builds: ['build1', 'build2']
});

moduleForComponent('build-banner', 'Integration | Component | build banner', {
  integration: true,

  beforeEach() {
    this.register('service:coverage', coverageService);
  }
});

test('it renders', function (assert) {
  assert.expect(9);
  const $ = this.$;

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('reloadCb', () => {
    assert.ok(true);
  });

  this.set('eventMock', eventMock);
  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildStatus="RUNNING"
    buildStart="2016-11-04T20:09:41.238Z"
    jobName="PR-671"
    isAuthenticated=false
    event=eventMock
    reloadBuild=(action reloadCb)
  }}`);
  const expectedTime = moment('2016-11-04T20:09:41.238Z').format('YYYY-MM-DD HH:mm:ss');

  assert.equal($('li.job-name .banner-value').text().trim(), 'PR-671');
  assert.equal($('.commit a').prop('href'),
    'http://example.com/batcave/batmobile/commit/abcdef1029384');
  assert.equal($('.commit a').text().trim(), '#abcdef');
  assert.equal($('.duration .banner-value').text().trim(), '5 seconds');
  assert.equal($('.started .banner-value').text().trim(), expectedTime);
  assert.equal($('.user .banner-value').text().trim(), 'Bruce W');
  assert.equal($('.docker-container .banner-value').text().trim(), 'node:6');
  assert.equal($('button').length, 0);
});

test('it renders a restart button for completed jobs when authenticated', function (assert) {
  assert.expect(3);

  const reloadBuildSpy = this.spy();

  this.set('reloadCb', reloadBuildSpy);
  this.set('externalStart', () => {
    assert.ok(true);
  });
  this.set('eventMock', eventMock);

  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildStatus="ABORTED"
    buildStart="2016-11-04T20:09:41.238Z"
    jobName="PR-671"
    isAuthenticated=true
    event=eventMock
    onStart=(action externalStart)
    reloadBuild=(action reloadCb)
  }}`);

  assert.equal(this.$('button').text().trim(), 'Restart');
  assert.notOk(reloadBuildSpy.called);
  this.$('button').click();
});

test('it renders a stop button for running job when authenticated', function (assert) {
  assert.expect(3);
  this.set('willRender', () => {
    assert.ok(true);
  });

  this.set('externalStop', () => {
    assert.ok(true);
  });
  this.set('eventMock', eventMock);
  this.render(hbs`{{build-banner
    buildContainer="node:6"
    duration="5 seconds"
    buildStatus="RUNNING"
    buildStart="2016-11-04T20:09:41.238Z"
    jobName="main"
    isAuthenticated=true
    event=eventMock
    onStop=(action externalStop)
    reloadBuild=(action willRender)
  }}`);

  assert.equal(this.$('button').text().trim(), 'Stop');
  this.$('button').click();
});

test('it renders coverage info if there is a coverage step', function (assert) {
  const $ = this.$;
  const buildStepsMock = [
    { name: 'sd-setup-screwdriver-scm-bookend' },
    { name: 'sd-teardown-screwdriver-coverage-bookend' }
  ];

  assert.expect(2);
  this.set('eventMock', eventMock);
  this.set('buildStepsMock', buildStepsMock);
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
  }}`);

  return wait().then(() => {
    assert.equal($('.coverage .banner-value').text().trim(), '98%');
    assert.equal($('.coverage a').prop('href'), 'http://example.com/coverage/123');
  });
});

test('it does not render coverage info if there is no coverage step', function (assert) {
  const $ = this.$;
  const buildStepsMock = [
    { name: 'sd-setup-screwdriver-scm-bookend' }
  ];

  assert.expect(1);
  this.set('eventMock', eventMock);
  this.set('buildStepsMock', buildStepsMock);
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
  }}`);

  return wait().then(() => {
    assert.notOk($('li').hasClass('coverage'));
  });
});
