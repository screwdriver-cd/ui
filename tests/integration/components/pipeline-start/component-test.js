import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('pipeline-start', 'Integration | Component | pipeline start', {
  integration: true
});

test('it renders', function (assert) {
  assert.expect(2);
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('onStartBuild', () => {
    assert.ok(true);
  });
  this.render(hbs`{{pipeline-start startBuild=onStartBuild}}`);

  assert.equal(this.$('button').text().trim(), 'Start');
  this.$('button').click();
});

test('it renders start PR', function (assert) {
  assert.expect(3);
  // Starting PR job requires the PR number and PR jobs
  this.set('jobs', ['job1', 'job2']);
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('onPRStartBuild', (prNum, prJobs) => {
    assert.equal(prNum, 5);
    assert.equal(prJobs.length, 2);
  });
  this.render(hbs`{{pipeline-start startBuild=onPRStartBuild prNum=5 jobs=jobs}}`);

  assert.equal(this.$('button').text().trim(), 'Start PR-5');
  this.$('button').click();
});
