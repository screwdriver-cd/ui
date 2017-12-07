import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { get, set } from '@ember/object';

moduleForComponent('pipeline-graph-nav', 'Integration | Component | pipeline graph nav', {
  integration: true
});

test('it renders', function (assert) {
  set(this, 'obj', { truncatedSha: 'abc123' });
  set(this, 'selected', 2);
  set(this, 'startBuild', () => {
    assert.ok(true);
  });

  this.render(hbs`{{pipeline-graph-nav
    mostRecent=3
    lastSuccessful=2
    selectedEvent=2
    selectedEventObj=obj
    selected=selected
    startBuild=startBuild
  }}`);

  assert.equal(this.$('strong').filter(':first').text().trim(), 'Pipeline');
  assert.equal(this.$('strong').filter(':last').text().trim(), 'Commit');
  assert.equal(this.$('.btn-group').text()
    .trim(), 'Most Recent\n      Last Successful\n      Aggregate');
  assert.equal(this.$('a').text().trim(), '#abc123');
});

test('it updates selected event id', function (assert) {
  assert.expect(1);
  set(this, 'obj', { truncatedSha: 'abc123' });
  set(this, 'selected', 2);
  set(this, 'startBuild', () => {
    assert.ok(true);
  });

  this.render(hbs`{{pipeline-graph-nav
    mostRecent=3
    lastSuccessful=2
    selectedEvent=2
    selectedEventObj=obj
    selected=selected
    startBuild=startBuild
  }}`);

  this.$('button').filter(':first').click();
  assert.equal(get(this, 'selected'), 3);
});
