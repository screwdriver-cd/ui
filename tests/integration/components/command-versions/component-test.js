import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const COMMANDS = {
  commandData: [
    { namespace: 'boo', name: 'baz', version: '3.0.0', tag: 'latest stable' },
    { namespace: 'boo', name: 'baz', version: '2.0.0', tag: 'meeseeks' },
    { namespace: 'boo', name: 'baz', version: '1.0.0' }
  ]
};

module('Integration | Component | command versions', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.actions = {};
    this.send = (actionName, ...args) =>
      this.actions[actionName].apply(this, args);
  });

  test('it renders', async function (assert) {
    this.set('mock', COMMANDS);
    this.actions.mockAction = function () {};

    await render(hbs`{{command-versions commands=mock}}`);

    assert.dom('h4').hasText('Versions:');
    assert.dom('ul li:first-child').hasText('3.0.0 - latest stable');
    assert.dom('ul li:nth-child(2)').hasText('2.0.0 - meeseeks');
    assert.dom('ul li:last-child').hasText('1.0.0');
  });

  test('Links of version exist', async function (assert) {
    assert.expect(10);

    this.owner.setupRouter();

    this.set('mock', COMMANDS);
    this.actions.mockAction = function (ver) {
      assert.equal(ver, '1.0.0');
    };

    await render(hbs`{{command-versions commands=mock }}`);

    assert.dom('h4').hasText('Versions:');
    assert.dom('ul li:first-child').hasText('3.0.0 - latest stable');
    assert.dom('ul li:nth-child(2)').hasText('2.0.0 - meeseeks');
    assert.dom('ul li:last-child').hasText('1.0.0');

    assert
      .dom('ul li:first-child a')
      .hasAttribute('href', '/commands/boo/baz/3.0.0');
    assert
      .dom('ul li:nth-child(2) a')
      .hasAttribute('href', '/commands/boo/baz/2.0.0');
    assert
      .dom('ul li:last-child a')
      .hasAttribute('href', '/commands/boo/baz/1.0.0');

    assert.dom('ul li:first-child a[href]').hasText('3.0.0 - latest stable');
    assert.dom('ul li:nth-child(2) a[href]').hasText('2.0.0 - meeseeks');
    assert.dom('ul li:last-child a[href]').hasText('1.0.0');
  });
});
