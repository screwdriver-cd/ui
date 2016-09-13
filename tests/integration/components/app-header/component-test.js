import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('app-header', 'Integration | Component | app header', {
  integration: true
});

test('it renders', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('sessionMock', {
    isAuthenticated: false
  });

  this.render(hbs`{{app-header session=sessionMock}}`);

  assert.ok(this.$('img').attr('src').match(/\/assets\/screwdriver\.png$/));
  assert.ok(this.$('.right a').text().trim(), 'Login');
});

test('it calls the logout method on logout', function (assert) {
  assert.expect(2);
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('sessionMock', {
    isAuthenticated: true
  });
  this.set('invalidateSession', () => {
    assert.ok(true);
  });

  this.render(hbs`{{app-header session=sessionMock onInvalidate=(action invalidateSession)}}`);

  assert.ok(this.$('.right a').text().trim(), 'Logout');
  this.$('.right a').click();
});
