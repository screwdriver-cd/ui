/* eslint-disable new-cap */
import { A } from '@ember/array';

import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-events-list', 'Integration | Component | pipeline events list', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const events = [
    EmberObject.create({
      id: '1',
      buildsSorted: A([]),
      causeMessage: 'Merged by batman',
      commit: {
        message: 'Merge pull request #2 from batcave/batmobile',
        author: {
          username: 'batman',
          name: 'Bruce W',
          avatar: 'http://example.com/u/batman/avatar',
          url: 'http://example.com/u/batman'
        },
        url: 'http://example.com/batcave/batmobile/commit/1ef1029384'
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
      type: 'pipeline',
      workflow: ['main', 'publish']
    }),
    EmberObject.create({
      id: '1',
      buildsSorted: A([]),
      causeMessage: 'Merged by robin',
      commit: {
        message: 'Merge pull request #1 from batcave/batmobile',
        author: {
          username: 'robin',
          name: 'Tim D',
          avatar: 'http://example.com/u/robin/avatar',
          url: 'http://example.com/u/robin'
        },
        url: 'http://example.com/batcave/batmobile/commit/1029384aaa'
      },
      createTime: '2016-11-04T20:09:41.238Z',
      creator: {
        username: 'robin',
        name: 'Tim D',
        avatar: 'http://example.com/u/robin/avatar',
        url: 'http://example.com/u/robin'
      },
      pipelineId: '12345',
      sha: '1029384aaa',
      type: 'pipeline',
      workflow: ['main', 'publish']
    })
  ];

  this.set('eventsMock', events);
  this.render(hbs`{{pipeline-events-list events=eventsMock}}`);

  assert.equal(this.$('h2').text().trim(), 'Events');
  assert.equal(this.$('> div').length, 1);
});
