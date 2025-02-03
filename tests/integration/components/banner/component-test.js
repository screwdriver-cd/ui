import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | banner', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders banners', async function (assert) {
    const bannerMessages = [
      EmberObject.create({
        id: 1,
        isActive: true,
        message: 'shutdown imminent'
      })
    ];

    this.setProperties({
      banners: bannerMessages
    });

    await render(hbs`<Banner @banners={{this.banners}}/>`);

    assert.dom('.banner').hasText('× shutdown imminent');
  });

  test('it renders banner with image tag', async function (assert) {
    const bannerMessages = [
      EmberObject.create({
        id: 2,
        isActive: true,
        message: `Image tag: <img src="#notanimage" onerror="alert('unsafe script injection from warning!')" />`
      })
    ];

    this.setProperties({
      banners: bannerMessages
    });

    await render(hbs`<Banner @banners={{this.banners}}/>`);

    assert.dom('.banner-message').hasText('Image tag:');
  });

  test('it renders with link', async function (assert) {
    const bannerMessages = [
      EmberObject.create({
        id: 3,
        isActive: true,
        message: `test - <a href="https://docs.screwdriver.cd/" onclick="alert('xss test');">screwdriver docs</a>`
      })
    ];

    this.setProperties({
      banners: bannerMessages
    });

    await render(hbs`<Banner @banners={{this.banners}}/>`);

    assert.dom('.banner-message').hasText('test - screwdriver docs');
    assert
      .dom('.banner-message > span > a')
      .hasAttribute('href', 'https://docs.screwdriver.cd/');
    assert.dom('.banner-message > span > a').hasNoAttribute('rel');
    assert.dom('.banner-message > span > a').hasNoAttribute('onclick');
  });
});
