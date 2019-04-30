import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const TEMPLATES = [
  { version: '3.0.0', tag: 'latest stable' },
  { version: '2.0.0', tag: 'meeseeks' },
  { version: '1.0.0' }
];

module('Integration | Component | template versions', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.actions = {};
    this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
  });

  test('it renders', async function(assert) {
    this.set('mock', TEMPLATES);
    this.actions.mockAction = function() {};

    await render(hbs`{{template-versions templates=mock changeVersion=(action "mockAction")}}`);

    assert.dom('h4').hasText('Versions:');
    assert.dom('ul li:first-child').hasText('3.0.0 - latest stable');
    assert.dom('ul li:nth-child(2)').hasText('2.0.0 - meeseeks');
    assert.dom('ul li:last-child').hasText('1.0.0');
  });

  test('it handles clicks on versions', async function(assert) {
    assert.expect(5);

    this.set('mock', TEMPLATES);
    this.actions.mockAction = function(ver) {
      assert.equal(ver, '1.0.0');
    };

    await render(hbs`{{template-versions templates=mock changeVersion=(action "mockAction")}}`);

    assert.dom('h4').hasText('Versions:');
    assert.dom('ul li:first-child').hasText('3.0.0 - latest stable');
    assert.dom('ul li:nth-child(2)').hasText('2.0.0 - meeseeks');
    assert.dom('ul li:last-child').hasText('1.0.0');

    await click('ul li:last-child span');
  });
});
