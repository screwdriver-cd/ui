import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import $ from 'jquery';

module('Integration | Component | user setting', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`{{user-setting}}`);

    assert.dom('section.preference h3').hasText('User Preferences');
    assert.dom('section.preference li').exists({ count: 2 });
    assert
      .dom('section > ul > li:nth-child(1) p')
      .hasText('All settings to enhance your experience.');

    assert
      .dom('section > ul > li:nth-child(2) h4')
      .hasText('Choose timestamp format');
    assert
      .dom('section > ul > li:nth-child(2) p')
      .hasText('Choose your preferred timestamp format');
  });
});
