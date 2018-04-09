import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

import injectScmServiceStub from '../../../helpers/inject-scm';

moduleForComponent('app-header', 'Integration | Component | app header', {
  integration: true
});

// this test should pass when search bar feature flag is turned off
test('it renders when search flag is off', function (assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('sessionMock', {
    isAuthenticated: false
  });

  this.render(hbs`{{app-header session=sessionMock}}`);

  assert.equal(this.$('.logo').prop('title'), 'Screwdriver Home');
  assert.equal(this.$('.icon.create').length, 1);
  assert.equal(this.$('.icon.docs').length, 1);
  assert.equal(this.$('.icon.blog').length, 1);
  assert.equal(this.$('.icon.community').length, 1);
  assert.equal(this.$('.icon.github').length, 1);
  assert.equal(this.$('.icon.profile-outline').length, 1);
  assert.equal(this.$('.search-input').length, 0);

  // check that user has not logged in yet
  assert.equal(this.$('.icon.profile-outline').prop('title'), 'Sign in to Screwdriver');
});

test('it shows user github username', function (assert) {
  assert.expect(2);
  this.set('sessionMock', {
    isAuthenticated: true,
    data: {
      authenticated: {
        username: 'foofoo'
      }
    }
  });
  this.set('invalidateSession', () => {
    assert.ok(true);
  });

  this.render(hbs`{{app-header session=sessionMock onInvalidate=(action invalidateSession)}}`);
  assert.equal(this.$('.profile-outline > .icontitle').text(), 'foofoo');
  this.$('.logout').click();
});

test('it calls the logout method on logout', function (assert) {
  assert.expect(2);
  this.set('sessionMock', {
    isAuthenticated: true
  });
  this.set('invalidateSession', () => {
    assert.ok(true);
  });

  this.render(hbs`{{app-header session=sessionMock onInvalidate=(action invalidateSession)}}`);
  assert.equal(this.$('.logout').prop('title'), 'Sign out of Screwdriver');
  this.$('.logout').click();
});

test('it shows scm list and which scm is signed in', function (assert) {
  assert.expect(3);

  injectScmServiceStub(this);

  this.set('sessionMock', {
    isAuthenticated: true
  });
  this.set('scmMock', this.get('scm').getScms());

  this.render(hbs`{{app-header session=sessionMock scmContexts=scmMock}}`);
  assert.equal(this.$('span.title').text(), 'ACCOUNTS');
  assert.equal(this.$('a.active').text().trim(), 'github.com active');
  assert.equal(this.$('a.active > .fa-github').length, 1);
});

test('it shows the search bar', function (assert) {
  this.set('sessionMock', {
    isAuthenticated: false
  });

  this.render(hbs`{{app-header session=sessionMock showSearch=true}}`);

  assert.equal(this.$('.search-input').length, 1);
});

test('it navigates to search page upon clicking the search button', function (assert) {
  this.set('search', () => {
    assert.ok(true);
  });

  this.render(hbs`{{app-header showSearch=true searchPipelines=(action search)}}`);

  this.$('.search-input').text('myquery');
  this.$('.search-button').click();
});
