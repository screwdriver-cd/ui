import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, find } from '@ember/test-helpers';
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
    this.actions.mockAction = function () {};

    await render(hbs`{{template-versions templates=mock changeVersion=(action "mockAction")}}`);

    assert.equal(find('h4').textContent.trim(), 'Versions:');
    assert.equal(find('ul li').textContent.trim(), '3.0.0 - latest stable2.0.0 - meeseeks1.0.0');
  });

  test('it handles clicks on versions', async function(assert) {
    assert.expect(3);

    this.set('mock', TEMPLATES);
    this.actions.mockAction = function (ver) {
      assert.equal(ver, '1.0.0');
    };

    await render(hbs`{{template-versions templates=mock changeVersion=(action "mockAction")}}`);

    assert.equal(find('h4').textContent.trim(), 'Versions:');
    assert.equal(find('ul li').textContent.trim(), '3.0.0 - latest stable2.0.0 - meeseeks1.0.0');
    await click('ul li:last-child span');
  });
});
