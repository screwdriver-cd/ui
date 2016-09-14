import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('create-step', 'Integration | Component | create step', {
  integration: true
});

test('it renders', function (assert) {
  const $ = this.$;
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{create-step currentStep="1" step="1" title="batman"}}`);

  assert.equal($('.step-line').length, 1);
  assert.equal($('.step-number span').text().trim(), '1');
  assert.ok($($('.step-number i')[0]).hasClass('fa-check'));
  assert.equal($('.step-title').text().trim(), 'batman');

  // Template block usage:
  this.render(hbs`
    {{#create-step step="1" title="batman"}}
    hello
    {{/create-step}}
  `);

  assert.equal(this.$('.step-content').text().trim(), 'hello');
});

test('it renders hidden', function (assert) {
  this.render(hbs`{{create-step currentStep="1" step="5" title="batman"}}`);
  assert.equal(this.$('.create-step').hasClass('step-hidden'), true);
});

test('it renders done', function (assert) {
  this.render(hbs`{{create-step currentStep="5" step="1" title="batman"}}`);
  assert.equal(this.$('.create-step').hasClass('step-done'), true);
});
