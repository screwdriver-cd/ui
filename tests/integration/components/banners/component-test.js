import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | banners', function (hooks) {
  setupRenderingTest(hooks);

  let bannersService;

  hooks.beforeEach(function () {
    bannersService = this.owner.lookup('service:banners');
  });

  test('it renders', async function (assert) {
    bannersService.globalBanners = [];

    await render(hbs`<Banners />`);

    assert.dom('#banners').exists({ count: 1 });
    assert.dom('#banner').doesNotExist();
  });

  test('it renders single banner', async function (assert) {
    bannersService.globalBanners = [{ message: 'abc' }];

    await render(hbs`<Banners />`);

    assert.dom('#banner').hasText('abc');
    assert.dom('#banner-count').exists({ count: 1 });
    assert.dom('#banner-count').hasText('1 of 1');
  });

  test('it renders banners', async function (assert) {
    bannersService.globalBanners = [
      {
        message: 'abc'
      },
      {
        message: '123'
      }
    ];

    await render(hbs`<Banners />`);

    assert.dom('#banner').hasText('abc');
    assert.dom('#banner-count').exists({ count: 1 });
    assert.dom('#banner-count').hasText('1 of 2');
    assert.dom('#next-banner').exists({ count: 1 });
    assert.dom('#previous-banner').exists({ count: 1 });
  });

  test('it cycles banners', async function (assert) {
    const message1 = 'abc';
    const message2 = '123';

    bannersService.globalBanners = [
      {
        message: message1
      },
      {
        message: message2
      }
    ];

    await render(hbs`<Banners />`);
    assert.dom('#banner').hasText(message1);
    assert.dom('#banner-count').hasText('1 of 2');

    await click('#next-banner');
    assert.dom('#banner').hasText(message2);
    assert.dom('#banner-count').hasText('2 of 2');

    await click('#next-banner');
    assert.dom('#banner').hasText(message1);
    assert.dom('#banner-count').hasText('1 of 2');

    await click('#previous-banner');
    assert.dom('#banner').hasText(message2);
    assert.dom('#banner-count').hasText('2 of 2');

    await click('#previous-banner');
    assert.dom('#banner').hasText(message1);
    assert.dom('#banner-count').hasText('1 of 2');
  });

  test('it renders banner with image tag', async function (assert) {
    bannersService.globalBanners = [
      {
        message: `Image tag: <img src="#notanimage" onerror="alert('unsafe script injection from warning!')" />`
      }
    ];

    await render(hbs`<Banners />`);

    assert.dom('.message').hasText('Image tag:');
  });

  test('it renders with link', async function (assert) {
    bannersService.globalBanners = [
      {
        message: `test - <a href="https://docs.screwdriver.cd/" onclick="alert('xss test');">screwdriver docs</a>`
      }
    ];

    await render(hbs`<Banners />`);

    assert.dom('.message').hasText('test - screwdriver docs');
    assert
      .dom('.message > a')
      .hasAttribute('href', 'https://docs.screwdriver.cd/');
    assert.dom('.message > a').hasNoAttribute('rel');
    assert.dom('.message > a').hasNoAttribute('onclick');
  });
});
