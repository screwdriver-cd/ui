import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | user link', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    const userMock = {
      username: 'batman',
      name: 'Bruce W',
      avatar: 'http://example.com/u/batman/avatar',
      url: 'http://example.com/u/batman'
    };

    this.set('userMock', userMock);

    await render(hbs`{{user-link user=userMock causeMessage="merged it"}}`);

    assert.equal(find('a').href, 'http://example.com/u/batman');
    assert.equal(find('a').title, 'merged it');
    assert.equal(find('img').src, 'http://example.com/u/batman/avatar');
    assert.dom('a').hasText('Bruce W');
  });
});
