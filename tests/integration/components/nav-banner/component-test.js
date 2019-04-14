import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
const actualMessage = 'shutdown imminent';
const testedMessage = '×shutdown imminent';

module('Integration | Component | nav banner', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders banners', async function(assert) {
    const banners = [
      EmberObject.create({
        id: 1,
        isActive: true,
        message: actualMessage
      })
    ];

    this.set('bannerMock', banners);
    await render(hbs`{{nav-banner banners=bannerMock}}`);

    assert.equal(find('span').textContent, testedMessage);
  });
});
