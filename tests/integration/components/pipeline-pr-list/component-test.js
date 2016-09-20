import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('pipeline-pr-list', 'Integration | Component | pipeline pr list', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const jobs = [
    Ember.Object.create({
      id: 'abcd',
      name: 'main',
      builds: [{
        id: '1234',
        status: 'SUCCESS'
      }]
    }),
    Ember.Object.create({
      id: 'abcde',
      name: 'publish',
      builds: [{
        id: '1234',
        status: 'FAILURE'
      }]
    })
  ];

  this.set('jobsMock', jobs);

  this.render(hbs`{{pipeline-pr-list jobs=jobsMock}}`);

  assert.equal(this.$('h2').text().trim(), 'Pull Requests');
  assert.equal(this.$('> div').length, 1);
});
