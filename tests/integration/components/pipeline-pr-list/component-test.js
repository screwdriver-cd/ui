import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-pr-list', 'Integration | Component | pipeline pr list', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const jobs = [
    EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      title: 'update readme',
      username: 'anonymous',
      builds: [{
        id: '1234',
        status: 'SUCCESS'
      }]
    }),
    EmberObject.create({
      id: 'efgh',
      name: 'revert',
      createTimeWords: 'now',
      title: 'revert PR-1234',
      username: 'suomynona',
      builds: [{
        id: '1235',
        status: 'FAILURE'
      }]
    })
  ];

  this.set('jobsMock', jobs);

  this.render(hbs`{{pipeline-pr-list pullRequests=jobsMock}}`);

  assert.equal(this.$('.view').length, 2);

  this.set('jobsMock', []);

  assert.equal(this.$('.alert').text().trim(), 'No open pull requests');
});
