import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('validator-pipeline', 'Integration | Component | validator pipeline', {
  integration: true
});

test('it renders default empty settings', function (assert) {
  this.render(hbs`{{validator-pipeline}}`);

  assert.equal(this.$('h4.pipeline').text().trim(), 'Pipeline Settings');

  assert.equal(this.$('.annotations .label').text().trim(), 'Annotations:');
  assert.equal(this.$('.annotations ul li').text().trim(), 'None defined');

  assert.equal(this.$('.workflow .label').text().trim(), 'Workflow:');
  assert.ok(this.$('.workflow canvas'), 'workflow canvas');
});

test('it renders pipeline annotations and workflow', function (assert) {
  this.set('plMock', {
    annotations: {
      hello: 'hi'
    },
    workflow: [
      'firstjob',
      'secondjob'
    ]
  });

  this.render(hbs`{{validator-pipeline annotations=plMock.annotations workflow=plMock.workflow}}`);

  assert.equal(this.$('.annotations .label').text().trim(), 'Annotations:');
  assert.equal(this.$('.annotations ul li').text().trim(), 'hello: hi');

  assert.equal(this.$('.workflow .label').text().trim(), 'Workflow:');
  assert.ok(this.$('.workflow canvas'), 'workflow canvas');
});
