import EmberObject from '@ember/object';
import { resolve } from 'rsvp';
import Service from '@ember/service';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
const actualMessage = 'shutdown imminent';
const testedMessage = '×shutdown imminent';

const bannerService = Service.extend({
  fetchBanners() {
    return resolve({
      banners: [
        { id: 1, isActive: true, message: actualMessage }
      ],
      done: true
    });
  }
});

moduleForComponent('nav-banner', 'Integration | Component | nav banner', {
  integration: true,

  beforeEach() {
    this.register('service:nav-banner', bannerService);
  }
});

test('it fetches active banners', function (assert) {
  const banners = [
    EmberObject.create({
      id: 1,
      isActive: true,
      message: actualMessage
    })
  ];

  this.set('bannerMock', banners);
  this.render(hbs`{{nav-banner banners=bannerMock}}`);

  assert.equal(this.$('span').text(), testedMessage);
});
