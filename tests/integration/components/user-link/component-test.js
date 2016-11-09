import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('user-link', 'Integration | Component | user link', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  const userMock = {
    username: 'batman',
    name: 'Bruce W',
    avatar: 'http://example.com/u/batman/avatar',
    url: 'http://example.com/u/batman'
  };

  this.set('userMock', userMock);

  this.render(hbs`{{user-link user=userMock causeMessage="merged it"}}`);

  assert.equal(this.$('a').prop('href'), 'http://example.com/u/batman');
  assert.equal(this.$('a').prop('title'), 'merged it');
  assert.equal(this.$('img').prop('src'), 'http://example.com/u/batman/avatar');
  assert.equal(this.$('a').text().trim(), 'Bruce W');
});
