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
    }}`);

    assert.dom('.row strong').hasText('Pipeline');
    assert.dom('.row button').exists({ count: 4 });

    const $columnTitles = this.$('.event-info .title');
    const $links = this.$('.event-info a');

    assert.equal(
      $columnTitles
        .eq(0)
        .text()
        .trim(),
      'Commit'
    );
    assert.equal(
      $columnTitles
        .eq(1)
        .text()
        .trim(),
      'Message'
    );
    assert.equal(
      $columnTitles
        .eq(2)
        .text()
        .trim(),
      'Status'
    );
    assert.equal(
      $columnTitles
        .eq(3)
        .text()
        .trim(),
      'Committer'
    );
    assert.equal(
      $columnTitles
        .eq(4)
        .text()
        .trim(),
      'Start Date'
    );
    assert.equal(
      $columnTitles
        .eq(5)
        .text()
        .trim(),
      'Duration'
    );

    assert.equal(
      $links
        .eq(0)
        .text()
        .trim(),
      '#abc123'
    );
    assert.equal(
      $links
        .eq(1)
        .text()
        .trim(),
      'anonymous'
    );

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
    }}`);

    this.$('button')
      .filter(':first')
      .click();
    assert.equal(get(this, 'selected'), 3);
  });

  test('it updates showListView and disables event info', async function(assert) {
    assert.expect(6);
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
    }}`);

    assert.notOk(get(this, 'showListView'));
    assert.dom('.event-info').doesNotHaveClass('disabled');

    this.$('button')[3].click();
    assert.ok(get(this, 'showListView'));
    assert.dom('.event-info').hasClass('disabled');

    this.$('button')[2].click();
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
    }}`);

    assert.dom('.ABORTED').exists({ count: 1 });
    assert.dom('.status .fa-stop-circle').exists({ count: 1 });
  });
});
