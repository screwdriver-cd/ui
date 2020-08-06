import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { get, set } from '@ember/object';

module('Integration | Component | pipeline graph nav', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    set(this, 'obj', {
      truncatedSha: 'abc123',
      status: 'SUCCESS',
      commit: {
        author: { name: 'anonymous' }
      }
    });
    set(this, 'selected', 2);
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

    await render(hbs`{{pipeline-graph-nav
      mostRecent=3
      lastSuccessful=2
      selectedEvent=2
      selectedEventObj=obj
      selected=selected
      startMainBuild=startBuild
      startPRBuild=startBuild
      graphType=currentEventType
      showDownstreamTriggers=showDownstreamTriggers
      setDownstreamTrigger=setDownstreamTrigger
      setShowListView=setShowListView
    }}`);

    assert.dom('.row strong').hasText('Pipeline');
    assert.dom('.row button').exists({ count: 4 });

    const $columnTitles = this.element.querySelectorAll('.event-info .title');
    const $links = this.element.querySelectorAll('.event-info a');

    assert.equal($columnTitles[0].innerText.trim(), 'COMMIT');
    assert.equal($columnTitles[1].innerText.trim(), 'MESSAGE');
    assert.equal($columnTitles[2].innerText.trim(), 'STATUS');
    assert.equal($columnTitles[3].innerText.trim(), 'COMMITTER');
    assert.equal($columnTitles[4].innerText.trim(), 'START DATE');
    assert.equal($columnTitles[5].innerText.trim(), 'DURATION');

    assert.equal($links[0].innerText.trim(), '#abc123');
    assert.equal($links[1].innerText.trim(), 'anonymous');

    assert.dom('.SUCCESS').exists({ count: 1 });

    assert.dom('.btn-group').hasText('Most Recent Last Successful');

    assert.dom('.x-toggle-component').includesText('Show triggers');
  });

  test('it updates selected event id', async function(assert) {
    assert.expect(1);
    set(this, 'obj', { truncatedSha: 'abc123' });
    set(this, 'selected', 2);
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

    await render(hbs`{{pipeline-graph-nav
      mostRecent=3
      lastSuccessful=2
      selectedEvent=2
      selectedEventObj=obj
      selected=selected
      startMainBuild=startBuild
      startPRBuild=startBuild
      graphType=currentEventType
      showDownstreamTriggers=showDownstreamTriggers
      setDownstreamTrigger=setDownstreamTrigger
      setShowListView=setShowListView
    }}`);

    this.element.querySelector('button').click();
    assert.equal(get(this, 'selected'), 3);
  });

  test('it updates showListView and disables event info', async function(assert) {
    assert.expect(8);
    set(this, 'obj', { truncatedSha: 'abc123' });
    set(this, 'selected', 2);
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setDownstreamTrigger', () => {
      assert.ok(true);
    });
    set(this, 'showListView', false);
    set(this, 'setShowListView', () => {
      set(this, 'showListView', !this.showListView);
      assert.ok(true);
    });

    await render(hbs`{{pipeline-graph-nav
      mostRecent=3
      lastSuccessful=2
      selectedEvent=2
      selectedEventObj=obj
      selected=selected
      startMainBuild=startBuild
      startPRBuild=startBuild
      graphType=currentEventType
      showDownstreamTriggers=showDownstreamTriggers
      setDownstreamTrigger=setDownstreamTrigger
      showListView=showListView
      setShowListView=setShowListView
    }}`);

    assert.notOk(get(this, 'showListView'));
    assert.dom('.event-info').doesNotHaveClass('disabled');

    this.element.querySelectorAll('button')[3].click();
    assert.ok(get(this, 'showListView'));
    assert.dom('.event-info').hasClass('disabled');

    this.element.querySelectorAll('button')[2].click();
    assert.notOk(get(this, 'showListView'));
    assert.dom('.event-info').doesNotHaveClass('disabled');
  });

  test('it renders when selectedEvent is a PR event', async function(assert) {
    assert.expect(2);
    set(this, 'obj', {
      truncatedSha: 'abc123',
      status: 'SUCCESS',
      creator: { name: 'anonymous' },
      prNum: 1,
      type: 'pr'
    });
    set(this, 'selected', 2);
    set(this, 'startBuild', (prNum, jobs) => {
      assert.equal(prNum, 1);
      assert.equal(jobs[0].group, 1);
    });
    set(this, 'currentEventType', 'pr');
    set(this, 'pullRequestGroups', {
      1: [{ name: 'PR-1:foo', isPR: true, group: 1 }, { name: 'PR-1:bar', isPR: true, group: 1 }],
      2: [{ name: 'PR-2:foo', isPR: true, group: 2 }]
    });
    set(this, 'showDownstreamTriggers', false);
    set(this, 'setDownstreamTrigger', () => {
      assert.ok(true);
    });
    set(this, 'setShowListView', () => {
      assert.ok(true);
    });
    await render(hbs`{{pipeline-graph-nav
      mostRecent=3
      lastSuccessful=2
      selectedEvent=2
      selectedEventObj=obj
      selected=selected
      startMainBuild=startBuild
      startPRBuild=startBuild
      graphType=currentEventType
      prGroups=pullrequestGroups
      showDownstreamTriggers=showDownstreamTriggers
      setDownstreamTrigger=setDownstreamTrigger
      setShowListView=setShowListView
    }}`);

    assert.dom('.row strong').hasText('Pull Requests');
    assert.dom('.row button').exists({ count: 4 });
  });

  test('it renders when selectedEvent is a skipped event', async function(assert) {
    set(this, 'obj', {
      truncatedSha: 'abc123',
      status: 'SKIPPED',
      commit: { message: '[skip ci] skip ci build.' },
      creator: { name: 'anonymous' },
      type: 'pipeline'
    });
    set(this, 'selected', 2);
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
    await render(hbs`{{pipeline-graph-nav
      mostRecent=3
      lastSuccessful=2
      selectedEvent=2
      selectedEventObj=obj
      selected=selected
      startMainBuild=startBuild
      startPRBuild=startBuild
      graphType=currentEventType
      showDownstreamTriggers=showDownstreamTriggers
      setDownstreamTrigger=setDownstreamTrigger
      setShowListView=setShowListView
    }}`);

    assert.dom('.row strong').hasText('Pipeline');
    assert.dom('.row button').exists({ count: 4 });
    assert.dom('.SKIPPED').exists({ count: 1 });
    assert.dom('.btn-group').hasText('Most Recent Last Successful');
    assert.dom('.x-toggle-component').includesText('Show triggers');
  });

  test('it handles toggling triggers', async function(assert) {
    assert.expect(2);
    set(this, 'obj', { truncatedSha: 'abc123' });
    set(this, 'selected', 2);
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
    await render(hbs`{{pipeline-graph-nav
      mostRecent=3
      lastSuccessful=2
      graphType=currentEventType
      selectedEvent=2
      selectedEventObj=obj
      selected=selected
      startMainBuild=startBuild
      startPRBuild=startBuild
      setDownstreamTrigger=setTrigger
      showDownstreamTriggers=showDownstreamTriggers
      setShowListView=setShowListView
    }}`);

    assert.dom('.x-toggle-component').includesText('Show triggers');
    await click('.x-toggle-btn');
  });

  test('it renders when selectedEvent is a FAILURE event', async function(assert) {
    set(this, 'obj', {
      truncatedSha: 'abc123',
      status: 'FAILURE',
      commit: { message: 'somthing went wrong and result into FAILURE state.' },
      creator: { name: 'anonymous' },
      type: 'pipeline'
    });
    set(this, 'selected', 2);
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
    await render(hbs`{{pipeline-graph-nav
      mostRecent=3
      lastSuccessful=2
      selectedEvent=2
      selectedEventObj=obj
      selected=selected
      startMainBuild=startBuild
      startPRBuild=startBuild
      graphType=currentEventType
      showDownstreamTriggers=showDownstreamTriggers
      setDownstreamTrigger=setDownstreamTrigger
      setShowListView=setShowListView
    }}`);

    assert.dom('.FAILURE').exists({ count: 1 });
    assert.dom('.status .fa-times-circle').exists({ count: 1 });
  });

  test('it renders when selectedEvent is a ABORTED event', async function(assert) {
    set(this, 'obj', {
      truncatedSha: 'abc123',
      status: 'ABORTED',
      commit: { message: 'someone ABORTED the event.' },
      creator: { name: 'anonymous' },
      type: 'pipeline'
    });
    set(this, 'selected', 2);
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

    await render(hbs`{{pipeline-graph-nav
      mostRecent=3
      lastSuccessful=2
      selectedEvent=2
      selectedEventObj=obj
      selected=selected
      startMainBuild=startBuild
      startPRBuild=startBuild
      graphType=currentEventType
      showDownstreamTriggers=showDownstreamTriggers
      setDownstreamTrigger=setDownstreamTrigger
      setShowListView=setShowListView
    }}`);

    assert.dom('.ABORTED').exists({ count: 1 });
    assert.dom('.status .fa-stop-circle').exists({ count: 1 });
  });
});
