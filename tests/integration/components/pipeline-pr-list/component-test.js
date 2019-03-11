import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-pr-list', 'Integration | Component | pipeline pr list', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const jobs = [[
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
  ]];

  this.set('jobsMock', jobs);

  this.render(hbs`{{pipeline-pr-list pullRequestGroups=jobsMock}}`);

  assert.equal(this.$('.view .detail .view').length, 2);
  assert.equal(this.$('.title').text().trim(), 'update readme');
  assert.equal(this.$('.by').text().trim(), 'anonymous');

  this.set('jobsMock', []);

  assert.equal(this.$('.alert').text().trim(), 'No open pull requests');
});

test('it renders start build for restricted PR pipeline', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const jobs = [[
    EmberObject.create({
      id: 'abcd',
      name: 'PR-1234:main',
      createTimeWords: 'now',
      title: 'update readme',
      username: 'anonymous',
      builds: []
    })
  ]];

  this.set('jobsMock', jobs);
  this.set('isRestricted', true);
  this.set('startBuild', Function.prototype);

  this.render(hbs`{{pipeline-pr-list
    pullRequestGroups=jobsMock
    isRestricted=isRestricted
    startBuild=startBuild}}`);

  assert.equal(this.$('.view .detail .view').length, 0);
  assert.equal(this.$('.title').text().trim(), 'update readme');
  assert.equal(this.$('.by').text().trim(), 'anonymous');
  assert.equal(this.$('.view .startButton').length, 0);
});
