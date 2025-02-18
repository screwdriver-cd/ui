import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import injectScmServiceStub from '../../../helpers/inject-scm';

const fakeToken =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwianRpIjoiNTA1NTQzYTUtNDhjZi00OTAyLWE3YTktZGY0NTI1ODFjYWM0IiwiaWF0IjoxNTIxNTcyMDE5LCJleHAiOjE1MjE1NzU2MTl9.ImS1ajOnksl1X74uL85jOjzdUXmBW3HfMdPfP1vjrmc';

module('Integration | Component | app header', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const router = this.owner.lookup('service:router');

    sinon.stub(router, 'currentURL').value('');
    sinon.stub(router, 'currentRouteName').value('home');
  });

  // this test should pass when search bar feature flag is turned off
  test('it renders when search flag is off', async function (assert) {
    this.set('sessionMock', {
      isAuthenticated: false
    });

    await render(hbs`<AppHeader @session={{this.sessionMock}} />`);

    assert.dom('.logo').hasAttribute('title', 'Screwdriver Home');
    assert.dom('.icon.create').doesNotExist();

    await click('.icon.tools');
    assert.dom('.icon.validator').exists({ count: 1 });
    assert.dom('.icon.templates').exists({ count: 1 });
    assert.dom('.icon.templates .job-template').exists({ count: 1 });
    assert.dom('.icon.templates .pipeline-template').exists({ count: 1 });
    assert.dom('.icon.commands').exists({ count: 1 });

    await click('.icon.docs-outline');
    assert.dom('.icon.docs').exists({ count: 1 });
    assert.dom('.icon.blog').exists({ count: 1 });
    assert.dom('.icon.community').exists({ count: 1 });
    assert.dom('.icon.github').exists({ count: 1 });

    assert.dom('.icon.profile-outline').exists({ count: 1 });
    assert
      .dom('.icon.profile-outline')
      .hasAttribute('title', 'Sign in to Screwdriver');
    assert.dom('.search-input').doesNotExist();
  });

  test('it shows user github username', async function (assert) {
    assert.expect(3);
    this.set('sessionMock', {
      isAuthenticated: true,
      data: {
        authenticated: {
          username: 'foofoo',
          token: fakeToken
        }
      }
    });
    this.set('invalidateSession', () => {
      assert.ok(true);
    });

    await render(
      hbs`<AppHeader @session={{this.sessionMock}} @onInvalidate={{action this.invalidateSession}} />`
    );
    assert.dom('.profile-outline > .icontitle').hasText('foofoo');
    assert.dom('.icon.create').exists({ count: 1 });

    await click('.icon.profile-outline');
    await click('.logout');
  });

  test('it calls the logout method on logout', async function (assert) {
    assert.expect(2);
    this.set('sessionMock', {
      isAuthenticated: true,
      data: {
        authenticated: {
          username: 'foofoo',
          token: fakeToken
        }
      }
    });
    this.set('invalidateSession', () => {
      assert.ok(true);
    });

    await render(
      hbs`<AppHeader @session={{this.sessionMock}} @onInvalidate={{action this.invalidateSession}} />`
    );
    await click('.icon.profile-outline');

    assert.dom('.logout').hasAttribute('title', 'Sign out of Screwdriver');

    await click('.logout');
  });

  test('it shows scm list and which scm is signed in', async function (assert) {
    assert.expect(3);

    injectScmServiceStub(this);

    this.set('sessionMock', {
      isAuthenticated: true,
      data: {
        authenticated: {
          username: 'foofoo',
          token: fakeToken
        }
      }
    });
    this.set('scmMock', this.owner.lookup('service:scm').getScms());

    await render(
      hbs`<AppHeader @session={{this.sessionMock}} @scmContexts={{this.scmMock}} />`
    );
    await click('.icon.profile-outline');

    assert.dom('span.title').hasText('ACCOUNTS');
    assert.dom('a.active').hasText('github.com active');
    assert.dom('a.active > .fa-github').exists({ count: 1 });
  });

  test('it shows the search bar', async function (assert) {
    this.set('sessionMock', {
      isAuthenticated: false
    });

    await render(hbs`{{app-header session=this.sessionMock showSearch=true}}`);

    assert.dom('.search-input').exists({ count: 1 });
  });

  test('it navigates to search page upon clicking the search button', async function (assert) {
    this.set('search', () => {
      assert.ok(true);
    });

    await render(
      hbs`<AppHeader @showSearch=true @searchPipelines={{action this.search}} />`
    );

    assert.dom('.search-input').hasNoValue();

    await click('.search-button');
  });
});
