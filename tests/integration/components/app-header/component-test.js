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
    assert.equal(findAll('.icon.create').length, 1);
    assert.equal(findAll('.icon.docs').length, 1);
    assert.equal(findAll('.icon.blog').length, 1);
    assert.equal(findAll('.icon.community').length, 1);
    assert.equal(findAll('.icon.github').length, 1);
    assert.equal(findAll('.icon.profile-outline').length, 1);
    assert.equal(findAll('.search-input').length, 0);

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
    assert.equal(find('.profile-outline > .icontitle').textContent, 'foofoo');
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
    assert.equal(find('span.title').textContent, 'ACCOUNTS');
    assert.equal(find('a.active').textContent.trim(), 'github.com active');
    assert.equal(findAll('a.active > .fa-github').length, 1);
  });

  test('it shows the search bar', async function(assert) {
    this.set('sessionMock', {
      isAuthenticated: false
    });

    await render(hbs`{{app-header session=sessionMock showSearch=true}}`);

    assert.equal(findAll('.search-input').length, 1);
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
