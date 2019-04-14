import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, findAll, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

import injectScmServiceStub from '../../../helpers/inject-scm';

module('Integration | Component | app header', function(hooks) {
  setupRenderingTest(hooks);

  // this test should pass when search bar feature flag is turned off
  test('it renders when search flag is off', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    this.set('sessionMock', {
      isAuthenticated: false
    });

    await render(hbs`{{app-header session=sessionMock}}`);

    assert.equal(find('.logo').title, 'Screwdriver Home');
    assert.dom('.icon.create').exists({ count: 1 });
    assert.dom('.icon.docs').exists({ count: 1 });
    assert.dom('.icon.blog').exists({ count: 1 });
    assert.dom('.icon.community').exists({ count: 1 });
    assert.dom('.icon.github').exists({ count: 1 });
    assert.dom('.icon.profile-outline').exists({ count: 1 });
    assert.dom('.search-input').doesNotExist();

    // check that user has not logged in yet
    assert.equal(find('.icon.profile-outline').title, 'Sign in to Screwdriver');
  });

  test('it shows user github username', async function(assert) {
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

    await render(hbs`{{app-header session=sessionMock onInvalidate=(action invalidateSession)}}`);
    assert.dom('.profile-outline > .icontitle').hasText('foofoo');
    await click('.logout');
  });

  test('it calls the logout method on logout', async function(assert) {
    assert.expect(2);
    this.set('sessionMock', {
      isAuthenticated: true
    });
    this.set('invalidateSession', () => {
      assert.ok(true);
    });

    await render(hbs`{{app-header session=sessionMock onInvalidate=(action invalidateSession)}}`);
    assert.equal(find('.logout').title, 'Sign out of Screwdriver');
    await click('.logout');
  });

  test('it shows scm list and which scm is signed in', async function(assert) {
    assert.expect(3);

    injectScmServiceStub(this);

    this.set('sessionMock', {
      isAuthenticated: true
    });
    this.set('scmMock', this.get('scm').getScms());

    await render(hbs`{{app-header session=sessionMock scmContexts=scmMock}}`);
    assert.dom('span.title').hasText('ACCOUNTS');
    assert.dom('a.active').hasText('github.com active');
    assert.dom('a.active > .fa-github').exists({ count: 1 });
  });

  test('it shows the search bar', async function(assert) {
    this.set('sessionMock', {
      isAuthenticated: false
    });

    await render(hbs`{{app-header session=sessionMock showSearch=true}}`);

    assert.dom('.search-input').exists({ count: 1 });
  });

  test('it navigates to search page upon clicking the search button', async function(assert) {
    this.set('search', () => {
      assert.ok(true);
    });

    await render(hbs`{{app-header showSearch=true searchPipelines=(action search)}}`);

    find('.search-input').textContent;
    await click('.search-button');
  });
});
