import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('pipeline-secret-settings',
  'Integration | Component | pipeline secret settings', {
    integration: true
  }
);

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const testSecret = Ember.Object.create({
    name: 'TEST_SECRET',
    pipelineId: 123245,
    value: 'banana',
    allowInPR: false
  });

  this.set('mockSecrets', [testSecret]);

  this.set('mockPipeline', { id: 'abcd' });
  this.render(hbs`{{pipeline-secret-settings secrets=mockSecrets pipeline=mockPipeline}}`);

  // the table is present
  assert.equal(this.$('table').length, 1);
  assert.equal(this.$('tbody tr').length, 1);
  assert.equal(this.$('tfoot tr').length, 1);
});

test('it updates the add button properly', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('mockPipeline', { id: 'abcd' });
  this.render(hbs`{{pipeline-secret-settings pipeline=mockPipeline}}`);

  // starts disabled
  assert.ok(this.$('tfoot button').prop('disabled'));

  // disabled when no value
  this.$('.key input').val('SECRET_KEY').keyup();
  assert.ok(this.$('tfoot button').prop('disabled'));

  // disabled when no key
  this.$('.key input').val('').keyup();
  this.$('.pass input').val('SECRET_VAL').keyup();
  assert.ok(this.$('tfoot button').prop('disabled'));

  // enabled when both present
  this.$('.key input').val('SECRET_KEY').keyup();
  assert.ok(!this.$('tfoot button').prop('disabled'));

  // disabled again when no key
  this.$('.key input').val('').keyup();
  assert.ok(this.$('tfoot button').prop('disabled'));
});

test('it calls action to create secret', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('mockPipeline', { id: 'abcd' });
  this.set('externalAction', (name, value, id) => {
    assert.equal(name, 'SECRET_KEY');
    assert.equal(value, 'SECRET_VAL');
    assert.equal(id, 'abcd');
  });

  // eslint-disable-next-line max-len
  this.render(hbs`{{pipeline-secret-settings pipeline=mockPipeline onCreateSecret=(action externalAction)}}`);

  this.$('.key input').val('SECRET_KEY').keyup();
  this.$('.pass input').val('SECRET_VAL').keyup();
  this.$('tfoot button').click();

  // and clears the new secret form elements
  assert.equal(this.$('.key input').val(), '');
  assert.equal(this.$('.pass input').val(), '');
  assert.ok(this.$('tfoot button').prop('disabled'), 'not disabled');
});

test('it displays an error', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('mockPipeline', { id: 'abcd' });
  this.set('externalAction', () => {
    assert.fail('should not get here');
  });

  // eslint-disable-next-line max-len
  this.render(hbs`{{pipeline-secret-settings pipeline=mockPipeline onCreateSecret=(action externalAction)}}`);

  this.$('.key input').val('0banana').keyup();
  this.$('.pass input').val('0value').keyup();
  this.$('tfoot button').click();

  // and clears the new secret form elements
  assert.equal(this.$('.info-message span').text().trim(),
    'Secret keys can only consist of numbers, uppercase letters and underscores, ' +
    'and cannot begin with a number.');
});
