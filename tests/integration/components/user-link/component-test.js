import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | user link', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    const userMock = {
      username: 'batman',
      name: 'Bruce W',
      avatar: 'http://example.com/u/batman/avatar',
      url: 'http://example.com/u/batman'
    };

    this.set('userMock', userMock);

    await render(
      hbs`<UserLink @user={{this.userMock}} @causeMessage="merged it" />`
    );

    assert.equal(find('a').href, 'http://example.com/u/batman');
    assert.equal(find('a').title, 'merged it');
    assert.equal(find('img').src, 'http://example.com/u/batman/avatar');
    assert.dom('a').hasText('Bruce W');
  });

  test('it renders scheduler', async function (assert) {
    const userMock = {
      username: 'sd:scheduler',
      name: 'Screwdriver scheduler'
    };

    this.set('userMock', userMock);

    await render(
      hbs`<UserLink @user={{this.userMock}} @causeMessage="Automatically started by scheduler" />`
    );

    assert.equal(find('a').title, 'Automatically started by scheduler');
    assert.ok(find('img').src.endsWith('/favicon.ico'));
    assert.dom('a').hasText('Screwdriver scheduler');
  });
});
