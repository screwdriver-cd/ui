import EmberObject from '@ember/object';
import Service from '@ember/service';
import { resolve } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | nav banner', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders banners', async function (assert) {
    const bannerStub = Service.extend({
      fetchBanners: () =>
        resolve([
          EmberObject.create({
            id: 1,
            isActive: true,
            message: 'shutdown imminent'
          })
        ])
    });

    this.owner.register('service:banner', bannerStub);

    await render(hbs`{{nav-banner}}`);

    assert.dom('.banner').hasText('× shutdown imminent');
  });
});
