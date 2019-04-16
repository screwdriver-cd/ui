import EmberObject from '@ember/object';
import moment from 'moment';
import hbs from 'htmlbars-inline-precompile';
import { module } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, click } from '@ember/test-helpers';
import test from 'ember-sinon-qunit/test-support/test';
import { resolve, Promise as EmberPromise } from 'rsvp';
import Service from '@ember/service';

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

const buildStepsMock = [{ name: 'sd-setup-screwdriver-scm-bookend' }];

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
  truncatedSha: 'abcdef1',
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

module('Integration | Component | build banner', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:coverage', coverageService);
  });

  test('it renders', async function(assert) {
    assert.expect(10);

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
    await render(hbs`{{build-banner
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

    assert.dom('li.job-name .banner-value').hasText('PR-671');
    assert
      .dom('.commit a')
      .hasAttribute('href', 'http://example.com/batcave/batmobile/commit/abcdef1029384');
    assert.dom('.commit a').hasText('#abcdef1');
    assert
      .dom('.duration .banner-value')
      .hasAttribute(
        'title',
        'Total duration:\n            11 seconds\n            , Blocked time:\n            4 seconds\n            , Image pull time:\n            5 seconds\n            , Build time:\n            2 seconds'
      );
    assert.dom('.created .banner-value').hasText(expectedTime);
    assert.dom('.user .banner-value').hasText('Bruce W');
    assert.dom('.docker-container .banner-value').hasText('node:6');
    assert.dom('button').doesNotExist();
  });

  test('it renders pr link if pr url info is available', async function(assert) {
    assert.expect(12);

    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.set('reloadCb', () => {
      assert.ok(true);
    });

    this.set('buildStepsMock', buildStepsMock);
    this.set('eventMock', eventMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));

    await render(hbs`{{build-banner
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

    assert
      .dom('.pr .pr-url-holder a')
      .hasAttribute('href', 'https://github.com/screwdriver-cd/ui/pull/292');
    assert.dom('.pr .pr-url-holder a').hasText('PR#292');
    assert.dom('li.job-name .banner-value').hasText('PR-671');
    assert
      .dom('.commit a')
      .hasAttribute('href', 'http://example.com/batcave/batmobile/commit/abcdef1029384');
    assert.dom('.commit a').hasText('#abcdef1');
    assert
      .dom('.duration .banner-value')
      .hasAttribute(
        'title',
        'Total duration:\n            5 seconds\n            , Blocked time:\n            0 seconds\n            , Image pull time:\n            0 seconds\n            , Build time:\n            0 seconds'
      );
    assert.dom('.created .banner-value').hasText(expectedTime);
    assert.dom('.user .banner-value').hasText('Bruce W');
    assert.dom('.docker-container .banner-value').hasText('node:6');
    assert.dom('button').doesNotExist();
  });

  test('it renders prCommit dropdown if event type is pr', async function(assert) {
    assert.expect(13);

    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.set('reloadCb', () => {
      assert.ok(true);
    });

    this.set('buildStepsMock', buildStepsMock);
    this.set('eventMock', eventMock);
    this.set(
      'prEvents',
      new EmberPromise(resolves => resolves([{ build: buildMock, event: eventMock }]))
    );

    await render(hbs`{{build-banner
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

    assert
      .dom('.pr .pr-url-holder a')
      .hasAttribute('href', 'https://github.com/screwdriver-cd/ui/pull/292');
    assert.dom('.pr .pr-url-holder a').hasText('PR#292');
    assert.dom('li.job-name .banner-value').hasText('PR-671');
    assert
      .dom('.commit a')
      .hasAttribute('href', 'http://example.com/batcave/batmobile/commit/abcdef1029384');
    assert.dom('.commit .commit-sha').hasText('#abcdef1');
    assert.dom('.commit').hasText('1. abcdef1');
    assert
      .dom('.duration .banner-value')
      .hasAttribute(
        'title',
        'Total duration:\n            5 seconds\n            , Blocked time:\n            0 seconds\n            , Image pull time:\n            0 seconds\n            , Build time:\n            0 seconds'
      );
    assert.dom('.created .banner-value').hasText(expectedTime);
    assert.dom('.user .banner-value').hasText('Bruce W');
    assert.dom('.docker-container .banner-value').hasText('node:6');
    assert.dom('button').doesNotExist();
  });

  test('it renders a restart button for completed jobs when authenticated', async function(assert) {
    assert.expect(3);

    const reloadBuildSpy = this.spy();

    this.set('buildStepsMock', buildStepsMock);
    this.set('reloadCb', reloadBuildSpy);
    this.set('externalStart', () => {
      assert.ok(true);
    });
    this.set('eventMock', eventMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));

    await render(hbs`{{build-banner
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

    assert.dom('button').hasText('Restart');
    assert.notOk(reloadBuildSpy.called);
    await click('button');
  });

  test('it renders a stop button for running job when authenticated', async function(assert) {
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

    await render(hbs`{{build-banner
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

    assert.dom('button').hasText('Stop');
    await click('button');
  });

  test('it renders a stop button for blocked job when authenticated', async function(assert) {
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

    await render(hbs`{{build-banner
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

    assert.dom('button').hasText('Stop');
    await click('button');
  });

  test('it renders coverage info if coverage step finished', async function(assert) {
    const coverageStepsMock = [
      { name: 'sd-setup-screwdriver-scm-bookend', startTime: '2016-11-04T20:09:41.238Z' },
      {
        name: 'sd-teardown-screwdriver-coverage-bookend',
        endTime: '2016-11-04T21:09:41.238Z'
      }
    ];

    assert.expect(4);
    this.set('eventMock', eventMock);
    this.set('buildStepsMock', coverageStepsMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));

    await render(hbs`{{build-banner
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

    return settled().then(() => {
      assert.dom('.coverage .banner-value').hasText('98%');
      assert.dom('.tests .banner-value').hasText('7/10');
      assert.dom('.coverage a').hasAttribute('href', 'http://example.com/coverage/123');
      assert.dom('.tests a').hasAttribute('href', 'http://example.com/coverage/123');
    });
  });

  test('it renders default coverage info if coverage step has not finished', async function(assert) {
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

    await render(hbs`{{build-banner
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

    return settled().then(() => {
      assert.dom('button').hasText('Stop');
      assert.dom('.coverage .banner-value').hasText('N/A');
      assert.dom('.tests .banner-value').hasText('N/A');
      assert.dom('.coverage a').hasAttribute('title', 'Coverage report not generated');
      assert.dom('.tests a').hasAttribute('title', 'Tests report not generated');
    });
  });

  test('it overrides coverage info if it is set in build meta', async function(assert) {
    const coverageStepsMock = [
      { name: 'sd-setup-screwdriver-scm-bookend', startTime: '2016-11-04T20:09:41.238Z' },
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

    await render(hbs`{{build-banner
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

    return settled().then(() => {
      assert.dom('.coverage .banner-value').hasText('100%');
      assert.dom('.tests .banner-value').hasText('10/10');
    });
  });

  test('it does not override coverage info if build meta format is not correct', async function(assert) {
    const coverageStepsMock = [
      { name: 'sd-setup-screwdriver-scm-bookend', startTime: '2016-11-04T20:09:41.238Z' },
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

    await render(hbs`{{build-banner
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

    return settled().then(() => {
      assert.dom('.coverage .banner-value').hasText('98%');
      assert.dom('.tests .banner-value').hasText('7/10');
    });
  });

  test('it does not render coverage info if there is no coverage step', async function(assert) {
    assert.expect(1);

    this.set('eventMock', eventMock);
    this.set('buildStepsMock', buildStepsMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));

    await render(hbs`{{build-banner
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

    return settled().then(() => {
      assert.dom('li').doesNotHaveClass('coverage');
    });
  });

  test('it should show the stop button for a running UNSTABLE build', async function(assert) {
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

    await render(hbs`{{build-banner
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

    return settled().then(() => {
      assert.dom('button').hasText('Stop');
    });
  });
});
