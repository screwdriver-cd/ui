import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | info message', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders an scm error when scmContext of a pipeline exists', async function (assert) {
    await render(
      hbs`<InfoMessage @message="This checkoutUrl is not supported for your current login host." @scmContext="github:github.com" />`
    );

    assert
      .dom('.alert > span')
      .hasText(
        'This checkoutUrl is not supported for your current login host. Please login to'
      );
    assert.dom('.alert > a').hasText('github:github.com');
  });

  test('it renders an scm error when scmContext of a pipeline does not exists', async function (assert) {
    await render(
      hbs`<InfoMessage @message="This checkoutUrl is not supported for your current login host." />`
    );

    assert
      .dom('.alert > span')
      .hasText(
        'This checkoutUrl is not supported for your current login host.'
      );
    assert.dom('.alert > a').doesNotExist();
  });

  test('it renders another error', async function (assert) {
    await render(hbs`<InfoMessage @message="batman" />`);

    assert.dom('.alert > span').hasText('batman');
  });

  test('it renders image tag with empty string', async function (assert) {
    const userInput = `Image tag: <img src="#notanimage" onerror="alert('unsafe script injection from warning!')" />`;

    this.userInput = userInput;

    await render(hbs`<InfoMessage @message={{this.userInput}} />`);

    assert.dom('.alert > span').hasText('Image tag:');
  });

  test('it renders link with href attribute only', async function (assert) {
    const userInput = `message - blocked by some builds, <a href="/builds/913516" rel="noopener" onclick="alert('xss test');">913516</a>`;

    this.userInput = userInput;

    await render(hbs`<InfoMessage @message={{this.userInput}} />`);

    assert
      .dom('.alert > span')
      .hasText('message - blocked by some builds, 913516');
    assert.dom('.alert > span > a').hasAttribute('href', '/builds/913516');
    assert.dom('.alert > span > a').hasNoAttribute('rel');
    assert.dom('.alert > span > a').hasNoAttribute('onclck');
  });
});
