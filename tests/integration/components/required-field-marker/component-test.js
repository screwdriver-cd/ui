import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { module, test } from 'qunit';

module('Integration | Component | required-field-marker', function (hooks) {
  setupRenderingTest(hooks);

  test('hidden is true', async function (assert) {
    await render(hbs`<RequiredFieldMarker @hidden={{true}} />`);

    assert.dom('.required-warning').hasClass('hidden');
  });

  test('should add asterisk when it render', async function (assert) {
    await render(hbs`<RequiredFieldMarker />`);

    assert.dom(this.element).hasText('*');
  });
});
