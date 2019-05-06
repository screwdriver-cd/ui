import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { get, set } from '@ember/object';

module('Integration | Component | pipeline graph nav', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    set(this, 'obj', { truncatedSha: 'abc123', status: 'SUCCESS', creator: { name: 'anonymous' } });
    set(this, 'selected', 2);
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');

    await render(hbs`{{pipeline-graph-nav
      mostRecent=3
      lastSuccessful=2
      selectedEvent=2
      selectedEventObj=obj
      selected=selected
      startMainBuild=startBuild
      startPRBuild=startBuild
      graphType=currentEventType
    }}`);

    assert.dom('.row strong').hasText('Pipeline');
    assert.dom('.row button').exists({ count: 3 });

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
      'User'
    );
    assert.equal(
      $columnTitles
        .eq(4)
        .text()
        .trim(),
      'Start Time'
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

    assert.dom('.btn-group').hasText('Most Recent Last Successful Aggregate');
  });

  test('it updates selected event id', async function(assert) {
    assert.expect(1);
    set(this, 'obj', { truncatedSha: 'abc123' });
    set(this, 'selected', 2);
    set(this, 'startBuild', () => {
      assert.ok(true);
    });
    set(this, 'currentEventType', 'pipeline');

    await render(hbs`{{pipeline-graph-nav
      mostRecent=3
      lastSuccessful=2
      selectedEvent=2
      selectedEventObj=obj
      selected=selected
      startMainBuild=startBuild
      startPRBuild=startBuild
      graphType=currentEventType
    }}`);

    this.$('button')
      .filter(':first')
      .click();
    assert.equal(get(this, 'selected'), 3);
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
    }}`);

    assert.dom('.row strong').hasText('Pull Requests');
    assert.dom('.row button').exists({ count: 2 });
  });
});
