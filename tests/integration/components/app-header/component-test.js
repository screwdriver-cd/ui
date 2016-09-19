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

  assert.equal(this.$('.logo').text().trim(), 'Screwdriver Home');
  assert.equal(this.$('.docs a span').text().trim(), 'Docs');
  assert.equal(this.$('.community a span').text().trim(), 'Slack');
  assert.equal(this.$('.blog a span').text().trim(), 'Blog');
  assert.equal(this.$('.github a span').text().trim(), 'GitHub');
  assert.equal(this.$('.authButton a span').text().trim(), 'Login');
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

  assert.ok(this.$('.authButton a span').text().trim(), 'Logout');
  this.$('.authButton a').click();
});
