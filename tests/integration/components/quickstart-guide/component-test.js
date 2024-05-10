import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | quickstart-guide', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders open', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<QuickstartGuide @isOpen={{true}} />`);
    assert.dom('.quickstart-guide.menu-open').exists();
    assert.dom('.quickstart-guide.menu-close').doesNotExist();
  });

  test('it renders close', async function (assert) {
    await render(hbs`<QuickstartGuide @isOpen={{false}} />`);
    assert.dom('.quickstart-guide.menu-open').doesNotExist();
    assert.dom('.quickstart-guide.menu-close').exists();
  });
});
