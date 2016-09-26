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

  assert.equal(this.$('.logo').prop('title'), 'Screwdriver Home');
  assert.equal(this.$('.docs span').text().trim(), 'Docs');
  assert.equal(this.$('.community span').text().trim(), 'Slack');
  assert.equal(this.$('.blog span').text().trim(), 'Blog');
  assert.equal(this.$('.github span').text().trim(), 'GitHub');
  assert.equal(this.$('.auth span').text().trim(), 'Login');
  assert.equal(this.$('.search').length, 0, 'Search bar displayed');
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

  assert.ok(this.$('.auth span').text().trim(), 'Logout');
  this.$('.auth').click();
});

test('it shows the search bar', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('sessionMock', {
    isAuthenticated: false
  });

  this.render(hbs`{{app-header session=sessionMock showSearch=true}}`);

  assert.equal(this.$('.search').length, 1, 'Search bar displayed');
  this.$('.search input').focusin();
  assert.ok(this.$('.search').hasClass('search-focused'), 'focused');
  this.$('.search input').focusout();
  assert.notOk(this.$('.search').hasClass('search-focused'), 'blurred');
});
