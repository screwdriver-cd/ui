import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
const actualMessage = 'shutdown imminent';
const testedMessage = '×shutdown imminent';

moduleForComponent('nav-banner', 'Integration | Component | nav banner', {
  integration: true
});

test('it renders banners', function (assert) {
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
