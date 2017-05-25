/* eslint-disable new-cap */
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('pipeline-event-view', 'Integration | Component | pipeline event view', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const event = Ember.Object.create({
    id: 'abcd',
    buildsSorted: Ember.A([]),
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
    truncatedMessage: 'Merge it',
    type: 'pipeline',
    workflow: ['main', 'publish']
  });

  this.set('eventMock', event);

  this.render(hbs`{{pipeline-event-view event=eventMock}}`);

  assert.equal(this.$('h6 a').text().trim(), '#abcdef');
  assert.equal(this.$('h6 a').prop('href'),
    'http://example.com/batcave/batmobile/commit/abcdef1029384');
  assert.equal(this.$('.cause').text().trim(), 'Merge it');
  assert.equal(this.$('.cause').prop('title'), 'Merge pull request #2 from batcave/batmobile');
  assert.equal(this.$('.build-bubble').length, 2, 'not enough work being done');
});
