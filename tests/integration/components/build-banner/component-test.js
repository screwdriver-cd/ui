import EmberObject from '@ember/object';
import hbs from 'htmlbars-inline-precompile';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, settled, click } from '@ember/test-helpers';
import { resolve, Promise as EmberPromise } from 'rsvp';
import Service from '@ember/service';
import sinon from 'sinon';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';

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
  pipelineId: '12345',
  groupEventId: '23450',
  sha: 'abcdef1029384',
  truncatedSha: 'abcdef1',
  type: 'pipelineId',
  workflow: ['main', 'publish'],
  builds: ['build1', 'build2']
});

const prEventMock = EmberObject.create({
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
    url: 'https://github.com/screwdriver-cd/ui/pull/292',
    title: 'feat: test pr title'
  },
  pipelineId: '12345',
  groupEventId: '23450',
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
  build: {},
  tests: {
    coverage: '100',
    coverageUrl: '/coverage/666',
    results: '10/10',
    resultsUrl: '/results/666'
  }
};

module('Integration | Component | build banner', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:coverage', coverageService);
  });

  test('it renders', async function (assert) {
    assert.expect(14);
    this.owner.setupRouter();

    this.set('reloadCb', () => {
      assert.ok(true);
    });

    this.set('changeB', () => {
      assert.ok(true);
    });

    this.set('prEvents', new EmberPromise(resolves => resolves([])));

    this.set('buildStepsMock', buildStepsMock);
    this.set('eventMock', prEventMock);
    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="11 seconds"
      @blockDuration="4 seconds"
      @imagePullDuration="5 seconds"
      @buildDuration="2 seconds"
      @buildStatus="RUNNING"
      @buildCreate="2016-11-04T20:08:41.238Z"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobId=1
      @jobName="PR-671"
      @isAuthenticated={{false}}
      @event={{this.eventMock}}
      @pipelineId=12345
      @prEvents={{this.prEvents}}
      @reloadBuild={{action this.reloadCb}}
      @changeBuild={{action this.changeB}}
    />`);

    const expectedTime = toCustomLocaleString(
      new Date('2016-11-04T20:08:41.238Z')
    );

    assert.dom('li.job-name a').hasAttribute('href', '/pipelines/12345/pulls');
    assert.dom('li.job-name .banner-value').hasText('PR-671');
    assert
      .dom('.commit a')
      .hasAttribute(
        'href',
        'http://example.com/batcave/batmobile/commit/abcdef1029384'
      );
    assert.dom('.commit a').hasText('#abcdef1');
    assert
      .dom('.duration .banner-value')
      .hasAttribute(
        'title',
        'Total duration: 11 seconds, Blocked time: 4 seconds, Image pull time: 5 seconds, Build time: 2 seconds'
      );
    assert.dom('.duration > a').hasText('See build metrics');
    assert.dom('.created .banner-value').hasText(expectedTime);
    assert.dom('.user .banner-value').hasText('Bruce W');
    assert.dom('.docker-container .banner-value').hasText('node:6');
    // template info doesnot exists because we haven't passed yet
    assert.dom('.template-info .banner-value').doesNotExist();
    assert.dom('button').doesNotExist();
  });

  test('it renders events list link if event is not pr', async function (assert) {
    assert.expect(4);
    this.owner.setupRouter();

    this.set('reloadCb', () => {
      assert.ok(true);
    });

    this.set('buildStepsMock', buildStepsMock);
    this.set('eventMock', eventMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildStatus="RUNNING"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobId=1
      @jobName="main"
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @pipelineId=12345
      @prEvents={{this.prEvents}}
      @reloadBuild={{action this.reloadCb}}
    />`);

    assert.dom('li.job-name .banner-value').hasText('main');
    assert
      .dom('li.job-name a')
      .hasAttribute('href', '/pipelines/12345/events/abcd?jobId=1');
  });

  test('it renders pr link if pr url info is available', async function (assert) {
    assert.expect(13);

    this.set('reloadCb', () => {
      assert.ok(true);
    });

    this.set('buildStepsMock', buildStepsMock);
    this.set('eventMock', prEventMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @blockDuration="0 seconds"
      @imagePullDuration="0 seconds"
      @buildDuration="0 seconds"
      @buildStatus="RUNNING"
      @buildCreate="2016-11-04T20:08:41.238Z"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobName="PR-671"
      @isAuthenticated={{false}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
      @reloadBuild={{action this.reloadCb}}
    />`);
    const expectedTime = toCustomLocaleString(
      new Date('2016-11-04T20:08:41.238Z')
    );

    assert
      .dom('.pr .pr-url-holder a')
      .hasAttribute('href', 'https://github.com/screwdriver-cd/ui/pull/292');
    assert.dom('.pr .pr-url-holder a').hasText('PR#292: feat: test pr title');
    assert.dom('li.job-name .banner-value').hasText('PR-671');
    assert
      .dom('.commit a')
      .hasAttribute(
        'href',
        'http://example.com/batcave/batmobile/commit/abcdef1029384'
      );
    assert.dom('.commit a').hasText('#abcdef1');
    assert
      .dom('.duration .banner-value')
      .hasAttribute(
        'title',
        'Total duration: 5 seconds, Blocked time: 0 seconds, Image pull time: 0 seconds, Build time: 0 seconds'
      );
    assert.dom('.created .banner-value').hasText(expectedTime);
    assert.dom('.user .banner-value').hasText('Bruce W');
    assert.dom('.docker-container .banner-value').hasText('node:6');
    assert.dom('button').doesNotExist();
  });

  test('it renders prCommit dropdown if event type is pr', async function (assert) {
    assert.expect(17);

    this.set('reloadCb', () => {
      assert.ok(true);
    });

    this.set('buildStepsMock', buildStepsMock);
    this.set('eventMock', prEventMock);
    this.set(
      'prEvents',
      new EmberPromise(resolves =>
        resolves([{ build: buildMock, event: eventMock }])
      )
    );

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @blockDuration="0 seconds"
      @imagePullDuration="0 seconds"
      @buildDuration="0 seconds"
      @buildStatus="RUNNING"
      @buildCreate="2016-11-04T20:08:41.238Z"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobName="PR-671"
      @isAuthenticated={{false}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
      @reloadBuild={{action this.reloadCb}}
    />`);
    const expectedTime = toCustomLocaleString(
      new Date('2016-11-04T20:08:41.238Z')
    );

    assert
      .dom('.pr .pr-url-holder a')
      .hasAttribute('href', 'https://github.com/screwdriver-cd/ui/pull/292');
    assert.dom('.pr .pr-url-holder a').hasText('PR#292: feat: test pr title');
    assert.dom('li.job-name .banner-value').hasText('PR-671');
    assert
      .dom('.commit a')
      .hasAttribute(
        'href',
        'http://example.com/batcave/batmobile/commit/abcdef1029384'
      );
    assert.dom('.commit .commit-sha').hasText('#abcdef1');

    await click('.commit .dropdown-toggle');

    assert.dom('.commit .dropdown-menu a').hasText('1. abcdef1');
    assert
      .dom('.duration .banner-value')
      .hasAttribute(
        'title',
        'Total duration: 5 seconds, Blocked time: 0 seconds, Image pull time: 0 seconds, Build time: 0 seconds'
      );
    assert.dom('.created .banner-value').hasText(expectedTime);
    assert.dom('.user .banner-value').hasText('Bruce W');
    assert.dom('.docker-container .banner-value').hasText('node:6');
    assert.dom('button').doesNotExist();
  });

  test('it renders a restart button for completed jobs when authenticated', async function (assert) {
    assert.expect(7);

    const reloadBuildSpy = sinon.spy();

    this.set('buildStepsMock', buildStepsMock);
    this.set('reloadCb', reloadBuildSpy);
    this.set('externalStart', () => {
      assert.ok(true);
    });
    this.set('eventMock', prEventMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('isButtonDisabledLoaded', true);
    this.set('jobDisabled', new EmberPromise(resolves => resolves(false)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildStatus="ABORTED"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobName="PR-671"
      @jobDisabled={{this.jobDisabled}}
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
      @onStart={{action this.externalStart}}
      @reloadBuild={{action this.reloadCb}}
    />`);

    assert.dom('button').hasText('Restart');
    assert.dom('.clicks-disabled').doesNotExist();
    assert.notOk(reloadBuildSpy.called);
    await click('button');
    assert.dom('.ember-modal-dialog').exists({ count: 1 });
    assert.dom('.job-info').hasText('Job: PR-671 Commit: Merge it #abcdef1');
    await click('button.build-action-yes');
    assert.dom('.ember-modal-dialog').doesNotExist();
  });

  test('it renders a disabled restart button for completed disabled jobs when authenticated', async function (assert) {
    assert.expect(3);

    const reloadBuildSpy = sinon.spy();

    this.set('buildStepsMock', buildStepsMock);
    this.set('reloadCb', reloadBuildSpy);
    this.set('externalStart', () => {
      assert.ok(true);
    });
    this.set('eventMock', prEventMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('isButtonDisabledLoaded', true);
    this.set('jobDisabled', new EmberPromise(resolves => resolves(true)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildStatus="ABORTED"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobName="PR-671"
      @jobDisabled={{this.jobDisabled}}
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
      @onStart={{action this.externalStart}}
      @reloadBuild={{action this.reloadCb}}
    />`);

    assert.dom('button').hasText('Restart');
    assert.dom('button').hasAttribute('disabled');
    assert.notOk(reloadBuildSpy.called);
  });

  test('it renders a stop button for running job when authenticated', async function (assert) {
    assert.expect(10);
    this.set('willRender', () => {
      console.log('will render');
      assert.ok(true);
    });

    this.set('externalStop', () => {
      assert.ok(true);
    });
    this.set('buildStepsMock', buildStepsMock);
    this.set('eventMock', prEventMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('isButtonDisabledLoaded', true);
    this.set('jobDisabled', new EmberPromise(resolves => resolves(false)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildStatus="RUNNING"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobName="main"
      @jobDisabled={{this.jobDisabled}}
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
      @onStop={{action this.externalStop}}
      @reloadBuild={{action this.willRender}}
    />`);

    assert.dom('button').hasText('Stop');
    await click('button');
    assert.dom('.ember-modal-dialog').exists({ count: 1 });
    assert.dom('.job-info').doesNotExist();
    await click('button.build-action-yes');
    assert.dom('.ember-modal-dialog').doesNotExist();
  });

  test('it renders a stop button for running disabled job when authenticated', async function (assert) {
    assert.expect(11);
    this.set('willRender', () => {
      assert.ok(true);
    });

    this.set('externalStop', () => {
      assert.ok(true);
    });
    this.set('buildStepsMock', buildStepsMock);
    this.set('eventMock', prEventMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('isButtonDisabledLoaded', true);
    this.set('jobDisabled', new EmberPromise(resolves => resolves(true)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildStatus="RUNNING"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobName="main"
      @jobDisabled={{this.jobDisabled}}
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
      @onStop={{action this.externalStop}}
      @reloadBuild={{action this.willRender}}
    />`);

    assert.dom('button').hasText('Stop');
    assert.dom('.clicks-disabled').doesNotExist();
    await click('button');
    assert.dom('.ember-modal-dialog').exists({ count: 1 });
    assert.dom('.job-info').doesNotExist();
    await click('button.build-action-yes');
    assert.dom('.ember-modal-dialog').doesNotExist();
  });

  test('it renders a stop button for blocked job when authenticated', async function (assert) {
    assert.expect(10);
    this.set('willRender', () => {
      assert.ok(true);
    });

    this.set('externalStop', () => {
      assert.ok(true);
    });
    this.set('buildStepsMock', buildStepsMock);
    this.set('eventMock', prEventMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('isButtonDisabledLoaded', true);
    this.set('jobDisabled', new EmberPromise(resolves => resolves(false)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildStatus="BLOCKED"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobName="main"
      @jobDisabled={{this.jobDisabled}}
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
      @onStop={{action this.externalStop}}
      @reloadBuild={{action this.willRender}}
    />`);

    assert.dom('button').hasText('Stop');
    await click('button');
    assert.dom('.ember-modal-dialog').exists({ count: 1 });
    assert.dom('.job-info').doesNotExist();
    await click('button.build-action-yes');
    assert.dom('.ember-modal-dialog').doesNotExist();
  });

  test('it renders coverage info if coverage step finished', async function (assert) {
    const coverageStepsMock = [
      {
        name: 'sd-setup-screwdriver-scm-bookend',
        startTime: '2016-11-04T20:09:41.238Z'
      },
      {
        name: 'sd-teardown-screwdriver-coverage-bookend',
        endTime: '2016-11-04T21:09:41.238Z'
      }
    ];

    buildMetaMock.tests = {};

    assert.expect(4);
    this.set('eventMock', prEventMock);
    this.set('buildStepsMock', coverageStepsMock);
    this.set('buildMetaMock', buildMetaMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('jobDisabled', new EmberPromise(resolves => resolves(false)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildId=123
      @buildMeta={{this.buildMetaMock}}
      @buildStatus="SUCCESS"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobId=1
      @jobDisabled={{this.jobDisabled}}
      @jobName="main"
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @pipelineId=456
      @pipelineName="d2lam/mytest"
      @prEvents={{this.prEvents}}
    />`);

    return settled().then(() => {
      assert.dom('.coverage .banner-value').hasText('98%');
      assert.dom('.tests .banner-value').hasText('7/10');
      assert
        .dom('.coverage a')
        .hasAttribute('href', 'http://example.com/coverage/123');
      assert
        .dom('.tests a')
        .hasAttribute('href', 'http://example.com/coverage/123');
    });
  });

  test('it renders default coverage info if coverage step has not finished', async function (assert) {
    const coverageStepsMock = [
      { name: 'sd-setup-screwdriver-scm-bookend' },
      { name: 'sd-teardown-screwdriver-coverage-bookend' }
    ];

    assert.expect(8);

    this.set('reloadCb', () => {
      assert.ok(true);
    });
    this.set('eventMock', prEventMock);
    this.set('buildStepsMock', coverageStepsMock);
    this.set('buildMetaMock', {}); // empty as build step is not finished
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('isButtonDisabledLoaded', true);
    this.set('jobDisabled', new EmberPromise(resolves => resolves(false)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildId=123
      @buildMeta={{this.buildMetaMock}}
      @buildStatus="RUNNING"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobId=1
      @jobDisabled={{this.jobDisabled}}
      @jobName="main"
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @reloadBuild={{action this.reloadCb}}
      @prEvents={{this.prEvents}}
    />`);

    return settled().then(() => {
      assert.dom('button').hasText('Stop');
      assert.dom('.coverage .banner-value').hasText('N/A');
      assert.dom('.tests .banner-value').hasText('N/A');
      assert
        .dom('.coverage a')
        .hasAttribute('title', 'Coverage report not generated');
      assert
        .dom('.tests a')
        .hasAttribute('title', 'Tests report not generated');
    });
  });

  test('it overrides coverage info if it is set in build meta', async function (assert) {
    const coverageStepsMock = [
      {
        name: 'sd-setup-screwdriver-scm-bookend',
        startTime: '2016-11-04T20:09:41.238Z'
      },
      {
        name: 'sd-teardown-screwdriver-coverage-bookend',
        endTime: '2016-11-04T21:09:41.238Z'
      }
    ];

    buildMetaMock.tests = {
      coverage: '100',
      coverageUrl: '/666',
      results: '10/10',
      resultsUrl: '/666'
    };

    assert.expect(2);
    this.setProperties({
      eventMock: prEventMock,
      buildStepsMock: coverageStepsMock,
      buildMetaMock,
      prEvents: new EmberPromise(resolves => resolves([])),
      jobDisabled: new EmberPromise(resolves => resolves(false))
    });

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildId=123
      @buildStatus="SUCCESS"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @buildMeta={{this.buildMetaMock}}
      @jobId=1
      @jobDisabled={{this.jobDisabled}}
      @jobName="main"
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
    />`);

    return settled().then(() => {
      assert.dom('.coverage .banner-value').hasText('100%');
      assert.dom('.tests .banner-value').hasText('10/10');
    });
  });

  test('it does not override coverage info if build meta format is not correct', async function (assert) {
    const coverageStepsMock = [
      {
        name: 'sd-setup-screwdriver-scm-bookend',
        startTime: '2016-11-04T20:09:41.238Z'
      },
      {
        name: 'sd-teardown-screwdriver-coverage-bookend',
        endTime: '2016-11-04T21:09:41.238Z'
      }
    ];

    buildMetaMock.tests = {
      coverage: 'nonsense',
      coverageUrl: 'nonsense',
      results: 'nonsense',
      resultsUrl: 'nonsense'
    };

    assert.expect(4);
    this.set('eventMock', prEventMock);
    this.set('buildStepsMock', coverageStepsMock);
    this.set('buildMetaMock', buildMetaMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('jobDisabled', new EmberPromise(resolves => resolves(false)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildId=123
      @buildStatus="SUCCESS"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @buildMeta={{this.buildMetaMock}}
      @jobId=1
      @jobDisabled={{this.jobDisabled}}
      @jobName="main"
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
    />`);

    assert.dom('.coverage .banner-value').hasText('98%');
    assert.dom('.tests .banner-value').hasText('7/10');
    assert
      .dom('.coverage a')
      .hasAttribute('href', 'http://example.com/coverage/123');
    assert
      .dom('.tests a')
      .hasAttribute('href', 'http://example.com/coverage/123');
  });

  test('it does not render coverage info if there is no coverage step', async function (assert) {
    assert.expect(1);

    this.set('eventMock', prEventMock);
    this.set('buildStepsMock', buildStepsMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('jobDisabled', new EmberPromise(resolves => resolves(false)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildId=123
      @buildStatus="SUCCESS"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobId=1
      @jobDisabled={{this.jobDisabled}}
      @jobName="main"
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
    />`);

    return settled().then(() => {
      assert.dom('li').doesNotHaveClass('coverage');
    });
  });

  test('it should show the stop button for a running UNSTABLE build', async function (assert) {
    const coverageStepsMock = [
      { name: 'sd-setup-screwdriver-scm-bookend' },
      { name: 'sd-teardown-screwdriver-coverage-bookend' }
    ];

    assert.expect(4);

    this.set('reloadCb', () => {
      assert.ok(true);
    });
    this.set('eventMock', prEventMock);
    this.set('buildStepsMock', coverageStepsMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('isButtonDisabledLoaded', true);
    this.set('jobDisabled', new EmberPromise(resolves => resolves(false)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildId=123
      @buildStatus="UNSTABLE"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobId=1
      @jobDisabled={{this.jobDisabled}}
      @jobName="main"
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @reloadBuild={{action this.reloadCb}}
      @prEvents={{this.prEvents}}
    />`);

    return settled().then(() => {
      assert.dom('button').hasText('Stop');
    });
  });

  test('it renders template info if user is using template', async function (assert) {
    assert.expect(16);
    this.owner.setupRouter();

    this.set('reloadCb', () => {
      assert.ok(true);
    });

    this.set('changeB', () => {
      assert.ok(true);
    });

    this.set('prEvents', new EmberPromise(resolves => resolves([])));

    this.set('buildStepsMock', buildStepsMock);
    this.set('eventMock', prEventMock);
    const shuttleStub = Service.extend({
      // eslint-disable-next-line no-unused-vars
      getTemplateDetails(templateId) {
        assert.ok(true, 'getTemplateDetails called');
        assert.equal(templateId, 9333);

        return resolve({
          namespace: 'nodejs',
          name: 'test',
          version: '2.0'
        });
      },
      getUserSetting() {
        return resolve({});
      }
    });

    this.owner.unregister('service:shuttle');
    this.owner.register('service:shuttle', shuttleStub);

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="11 seconds"
      @blockDuration="4 seconds"
      @imagePullDuration="5 seconds"
      @buildDuration="2 seconds"
      @buildStatus="RUNNING"
      @buildCreate="2016-11-04T20:08:41.238Z"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @jobId=1
      @jobName="PR-671"
      @isAuthenticated={{false}}
      @event={{this.eventMock}}
      @pipelineId=12345
      @prEvents={{this.prEvents}}
      @templateId=9333
      @reloadBuild={{action this.reloadCb}}
      @changeBuild={{action this.changeB}}
    />`);

    const expectedTime = toCustomLocaleString(
      new Date('2016-11-04T20:08:41.238Z')
    );

    assert.dom('li.job-name a').hasAttribute('href', '/pipelines/12345/pulls');
    assert.dom('li.job-name .banner-value').hasText('PR-671');
    assert
      .dom('.commit a')
      .hasAttribute(
        'href',
        'http://example.com/batcave/batmobile/commit/abcdef1029384'
      );
    assert.dom('.commit a').hasText('#abcdef1');
    assert
      .dom('.duration .banner-value')
      .hasAttribute(
        'title',
        'Total duration: 11 seconds, Blocked time: 4 seconds, Image pull time: 5 seconds, Build time: 2 seconds'
      );
    assert.dom('.duration > a').hasText('See build metrics');
    assert.dom('.created .banner-value').hasText(expectedTime);
    assert.dom('.user .banner-value').hasText('Bruce W');
    assert.dom('.docker-container .banner-value').hasText('node:6');
    assert.dom('.template-info .banner-value').hasText('test:2.0');
    assert
      .dom('.template-info > a')
      .hasAttribute('href', '/templates/job/nodejs/test/2.0');
    assert.dom('button').doesNotExist();
  });

  test('it overrides coverage info if build meta format has saucelabs info', async function (assert) {
    const coverageStepsMock = [
      {
        name: 'sd-setup-screwdriver-scm-bookend',
        startTime: '2016-11-04T20:09:41.238Z'
      },
      {
        name: 'sd-teardown-screwdriver-coverage-bookend',
        endTime: '2016-11-04T21:09:41.238Z'
      }
    ];

    buildMetaMock.tests = {
      coverage: '98%',
      coverageUrl: 'http://example.com/coverage/111222333',
      tests: '7/10',
      testsUrl: 'http://example.com/coverage/111222333',
      saucelabs: {
        buildId: 'aabbccddeeffggIsNotAReadBuildID',
        results: '2/2',
        resultsUrl:
          'https://app.saucelabs.com/builds/vdc/aabbccddeeffggIsNotAReadBuildID',
        status: 'success'
      }
    };

    assert.expect(4);
    this.set('eventMock', prEventMock);
    this.set('buildStepsMock', coverageStepsMock);
    this.set('buildMetaMock', buildMetaMock);
    this.set('prEvents', new EmberPromise(resolves => resolves([])));
    this.set('jobDisabled', new EmberPromise(resolves => resolves(false)));

    await render(hbs`<BuildBanner
      @buildContainer="node:6"
      @duration="5 seconds"
      @buildId=123
      @buildStatus="SUCCESS"
      @buildStart="2016-11-04T20:09:41.238Z"
      @buildSteps={{this.buildStepsMock}}
      @buildMeta={{this.buildMetaMock}}
      @jobId=1
      @jobDisabled={{this.jobDisabled}}
      @jobName="main"
      @isAuthenticated={{true}}
      @event={{this.eventMock}}
      @prEvents={{this.prEvents}}
    />`);

    assert.dom('.coverage .banner-value').hasText('98%');
    assert
      .dom('.coverage a')
      .hasAttribute('href', 'http://example.com/coverage/123');
    assert.dom('.tests .banner-value').hasText('2/2');
    assert
      .dom('.tests a')
      .hasAttribute(
        'href',
        'https://app.saucelabs.com/builds/vdc/aabbccddeeffggIsNotAReadBuildID'
      );
  });
});
