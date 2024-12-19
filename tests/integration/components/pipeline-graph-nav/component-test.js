import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { set } from '@ember/object';
import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';

const userSettingsMock = {
  1018240: {
    showPRJobs: true
  },
  1048190: {
    showPRJobs: false
  },
  displayJobNameLength: 30,
  timestampFormat: 'UTC'
};

module('Integration | Component | pipeline graph nav', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    set(this, 'obj', {
      sha: 'abc123',
      baseBranch: 'main',
      truncatedSha: 'abc123',
      status: 'SUCCESS',
      commit: {
        author: { name: 'anonymous' }
      },
      createTime: '04/11/2016, 08:09 PM',
      createTimeExact: '04/11/2016, 08:09 PM',
      truncatedMessage: 'test message',
      durationText: '10 seconds'
    });
    set(this, 'selected', 2);
    set(this, 'latestCommit', {
      sha: 'latestSha'
    });
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setDownstreamTrigger', () => {
      assert.ok(true);
    });
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @graphType={{this.currentEventType}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setDownstreamTrigger={{this.setDownstreamTrigger}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('.nav-button-container button').exists({ count: 4 });

    const $columnTitles = this.element.querySelectorAll(
      '.event-info-container .info-col .title'
    );
    const $columnValues = this.element.querySelectorAll(
      '.event-info-container .info-col .title ~ :nth-child(2)'
    );
    const $links = this.element.querySelectorAll(
      '.event-info-container .info-col a'
    );

    const compare = (elem, expected) => {
      const actual = elem.innerText.trim() || elem.innerHTML.trim();

      assert.strictEqual(actual, expected);
    };

    compare($columnTitles[0], 'COMMIT');
    compare($columnTitles[1], 'MESSAGE');
    compare($columnTitles[2], 'BRANCH');
    compare($columnTitles[3], 'STATUS');
    compare($columnTitles[4], 'COMMITTER');
    compare($columnTitles[5], 'START DATE');
    compare($columnTitles[6], 'DURATION');

    compare($columnValues[0], '#abc123');
    compare($columnValues[1], 'test message');
    compare($columnValues[2], 'main');
    compare($columnValues[3], 'SUCCESS');
    compare($columnValues[4], 'anonymous');
    compare(
      $columnValues[5],
      `${toCustomLocaleString(new Date('04/11/2016, 08:09 PM'))}`
    );
    compare($columnValues[6], '10 seconds');

    compare($links[0], '#abc123');
    compare($links[1], 'anonymous');

    assert.dom('.SUCCESS').exists({ count: 1 });

    assert.dom('.latest-commit').doesNotExist();

    assert.dom('.event-options-toggle').hasText('Most Recent Last Successful');

    assert.dom('.x-toggle-component').includesText('Show triggers');
  });

  test('it renders UTC timestamp', async function (assert) {
    const userSettingsStub = Service.extend({
      getUserPreference() {
        return new EmberPromise(resolve => resolve(userSettingsMock));
      },
      getDisplayJobNameLength() {
        return null;
      },
      getAllowNotification() {
        return new EmberPromise(resolve => resolve(false));
      }
    });

    this.owner.unregister('service:userSettings');
    this.owner.register('service:userSettings', userSettingsStub);
    set(this, 'obj', {
      sha: 'abc123',
      baseBranch: 'main',
      truncatedSha: 'abc123',
      status: 'SUCCESS',
      commit: {
        author: { name: 'anonymous' }
      },
      createTime: '04/11/2016, 08:09 PM',
      createTimeExact: '04/11/2016, 08:09 PM',
      truncatedMessage: 'test message',
      durationText: '10 seconds'
    });
    set(this, 'selected', 2);
    set(this, 'latestCommit', {
      sha: 'latestSha'
    });
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setDownstreamTrigger', () => {
      assert.ok(true);
    });
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @graphType={{this.currentEventType}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setDownstreamTrigger={{this.setDownstreamTrigger}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('.nav-button-container button').exists({ count: 4 });

    const $columnTitles = this.element.querySelectorAll(
      '.event-info-container .info-col .title'
    );
    const $columnValues = this.element.querySelectorAll(
      '.event-info-container .info-col .title ~ :nth-child(2)'
    );

    const compare = (elem, expected) => {
      const actual = elem.innerText.trim() || elem.innerHTML.trim();

      assert.strictEqual(actual, expected);
    };

    compare($columnTitles[5], 'START DATE');

    compare(
      $columnValues[5],
      `${toCustomLocaleString(new Date('04/11/2016, 08:09 PM'), {
        timeZone: 'UTC'
      })}`
    );
  });

  test('it updates selected event id', async function (assert) {
    assert.expect(1);
    set(this, 'obj', { truncatedSha: 'abc123' });
    set(this, 'selected', 2);
    set(this, 'latestCommit', {
      sha: 'latestSha'
    });
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setDownstreamTrigger', () => {
      assert.ok(true);
    });
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @graphType={{this.currentEventType}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setDownstreamTrigger={{this.setDownstreamTrigger}}
      @setShowListView={{this.setShowListView}}
    />`);

    this.element.querySelectorAll('button')[2].click();
    assert.equal(this.selected, 3);
  });

  test('it renders when selectedEvent is a PR event', async function (assert) {
    assert.expect(2);
    set(this, 'obj', {
      truncatedSha: 'abc123',
      status: 'SUCCESS',
      creator: { name: 'anonymous' },
      prNum: 1,
      type: 'pr'
    });
    set(this, 'selected', 2);
    set(this, 'latestCommit', {
      sha: 'latestSha'
    });
    set(this, 'startBuild', (prNum, jobs) => {
      assert.equal(prNum, 1);
      assert.equal(jobs[0].group, 1);
    });
    set(this, 'currentEventType', 'pr');
    set(this, 'pullRequestGroups', {
      1: [
        { name: 'PR-1:foo', isPR: true, group: 1 },
        { name: 'PR-1:bar', isPR: true, group: 1 }
      ],
      2: [{ name: 'PR-2:foo', isPR: true, group: 2 }]
    });
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setDownstreamTrigger', () => {
      assert.ok(true);
    });
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });
    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @graphType={{this.currentEventType}}
      @prGroups={{this.pullrequestGroups}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setDownstreamTrigger={{this.setDownstreamTrigger}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('.nav-button-container strong').hasText('Pull Requests');
    assert.dom('.nav-button-container button').exists({ count: 2 });
  });

  test('it renders when selectedEvent is a skipped event', async function (assert) {
    set(this, 'obj', {
      truncatedSha: 'abc123',
      status: 'SKIPPED',
      commit: { message: '[skip ci] skip ci build.' },
      creator: { name: 'anonymous' },
      type: 'pipeline'
    });
    set(this, 'selected', 2);
    set(this, 'latestCommit', {
      sha: 'latestSha'
    });
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setDownstreamTrigger', () => {
      assert.ok(true);
    });
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });
    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @graphType={{this.currentEventType}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setDownstreamTrigger={{this.setDownstreamTrigger}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('.nav-button-container button').exists({ count: 4 });
    assert.dom('.SKIPPED').exists({ count: 1 });
    assert.dom('.event-options-toggle').hasText('Most Recent Last Successful');
    assert.dom('.x-toggle-component').includesText('Show triggers');
  });

  test('it handles toggling triggers', async function (assert) {
    assert.expect(2);
    set(this, 'obj', { truncatedSha: 'abc123' });
    set(this, 'selected', 2);
    set(this, 'latestCommit', {
      sha: 'latestSha'
    });
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'setTrigger', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });
    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @graphType={{this.currentEventType}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @setDownstreamTrigger={{this.setTrigger}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('.x-toggle-component').includesText('Show triggers');
    await click('.x-toggle-btn');
  });

  test('it renders when selectedEvent is a FAILURE event', async function (assert) {
    set(this, 'obj', {
      truncatedSha: 'abc123',
      status: 'FAILURE',
      commit: { message: 'somthing went wrong and result into FAILURE state.' },
      creator: { name: 'anonymous' },
      type: 'pipeline'
    });
    set(this, 'selected', 2);
    set(this, 'latestCommit', {
      sha: 'latestSha'
    });
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setDownstreamTrigger', () => {
      assert.ok(true);
    });
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });
    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @graphType={{this.currentEventType}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setDownstreamTrigger={{this.setDownstreamTrigger}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('.FAILURE').exists({ count: 1 });
    assert.dom('.status .fa-circle-xmark').exists({ count: 1 });
  });

  test('it renders when selectedEvent is a ABORTED event', async function (assert) {
    set(this, 'obj', {
      truncatedSha: 'abc123',
      status: 'ABORTED',
      commit: { message: 'someone ABORTED the event.' },
      creator: { name: 'anonymous' },
      type: 'pipeline'
    });
    set(this, 'selected', 2);
    set(this, 'latestCommit', {
      sha: 'latestSha'
    });
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setDownstreamTrigger', () => {
      assert.ok(true);
    });
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @graphType={{this.currentEventType}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setDownstreamTrigger={{this.setDownstreamTrigger}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('.ABORTED').exists({ count: 1 });
    assert.dom('.status .fa-circle-stop').exists({ count: 1 });
  });

  test('it renders when selectedEvent is latestCommit event', async function (assert) {
    set(this, 'obj', {
      sha: 'latestSha',
      truncatedSha: 'latestSha',
      status: 'SUCCESS',
      commit: { message: 'this is success event.' },
      creator: { name: 'anonymous' },
      type: 'pipeline'
    });
    set(this, 'selected', 2);
    set(this, 'latestCommit', {
      sha: 'latestSha'
    });
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setDownstreamTrigger', () => {
      assert.ok(true);
    });
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });

    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @graphType={{this.currentEventType}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setDownstreamTrigger={{this.setDownstreamTrigger}}
      @setShowListView={{this.setShowListView}}
    />`);

    assert.dom('.latest-commit').exists({ count: 1 });
  });

  test('label does not contain any URLs', async function (assert) {
    this.setProperties({
      obj: {
        sha: 'abc123',
        baseBranch: 'main',
        truncatedSha: 'abc123',
        status: 'SUCCESS',
        commit: {
          author: { name: 'anonymous' }
        },
        createTime: '04/11/2016, 08:09 PM',
        createTimeExact: '04/11/2016, 08:09 PM',
        truncatedMessage: 'test message',
        durationText: '10 seconds',
        label: 'Yahoo new project, and Version #2.0'
      },
      selected: 2,
      latestCommit: {
        sha: 'latestSha'
      },
      startBuild: () => {
        assert.ok(true);
      },
      currentEventType: 'pipeline',
      showDownstreamTriggers: false,
      setDownstreamTrigger: () => {
        assert.ok(true);
      },
      setShowListView: () => {
        assert.ok(true);
      }
    });

    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @graphType={{this.currentEventType}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setDownstreamTrigger={{this.setDownstreamTrigger}}
      @setShowListView={{this.setShowListView}}
  />`);

    assert
      .dom('.info-col .customize-label')
      .hasText('Yahoo new project, and Version #2.0');
  });

  test('label contain URLs', async function (assert) {
    this.setProperties({
      obj: {
        sha: 'abc123',
        baseBranch: 'main',
        truncatedSha: 'abc123',
        status: 'SUCCESS',
        commit: {
          author: { name: 'anonymous' }
        },
        createTime: '04/11/2016, 08:09 PM',
        createTimeExact: '04/11/2016, 08:09 PM',
        truncatedMessage: 'test message',
        durationText: '10 seconds',
        label: 'Yahoo http://yahoo.com, and Version #2.0'
      },
      selected: 2,
      latestCommit: {
        sha: 'latestSha'
      },
      startBuild: () => {
        assert.ok(true);
      },
      currentEventType: 'pipeline',
      showDownstreamTriggers: false,
      setDownstreamTrigger: () => {
        assert.ok(true);
      },
      setShowListView: () => {
        assert.ok(true);
      }
    });

    await render(hbs`<PipelineGraphNav
      @mostRecent={{3}}
      @latestCommit={{this.latestCommit}}
      @lastSuccessful={{2}}
      @selectedEvent={{2}}
      @selectedEventObj={{this.obj}}
      @selected={{this.selected}}
      @startMainBuild={{this.startBuild}}
      @startPRBuild={{this.startBuild}}
      @graphType={{this.currentEventType}}
      @showDownstreamTriggers={{this.showDownstreamTriggers}}
      @setDownstreamTrigger={{this.setDownstreamTrigger}}
      @setShowListView={{this.setShowListView}}
    />`);
    const compare = (elem, expected) => {
      assert.strictEqual(elem, expected);
    };
    const labelColumn = this.element
      .querySelector('.info-col .customize-label')
      .innerHTML.trim();

    compare(
      labelColumn,
      'Yahoo <a href="http://yahoo.com" rel="nofollow" target="_blank" urllength="30">http://yahoo.com</a>, and Version #2.0'
    );
  });
});
