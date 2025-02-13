import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import { visit, currentURL } from '@ember/test-helpers';
import { authenticateSession } from 'ember-simple-auth/test-support';

module('Unit | Route | templates/catch-all', function (hooks) {
  setupTest(hooks);

  test('visiting /templates/namespace', async function (assert) {
    assert.expect(3);

    const shuttleService = Service.extend({
      fetchBanners: (scope, scopeId) => {
        assert.equal(scope, 'GLOBAL');
        assert.equal(scopeId, undefined);

        return new EmberPromise(resolve => resolve([]));
      }
    });

    this.owner.register('service:shuttle', shuttleService);

    await visit('/templates/job/namespace');

    assert.equal(currentURL(), '/login');
  });

  test('visiting /templates/namespace/name', async function (assert) {
    const shuttleService = Service.extend({
      fetchBanners: (scope, scopeId) => {
        assert.equal(scope, 'GLOBAL');
        assert.equal(scopeId, undefined);

        return new EmberPromise(resolve => resolve([]));
      }
    });

    this.owner.register('service:shuttle', shuttleService);

    await visit('/templates/job/namespace/name');

    assert.equal(currentURL(), '/login');
  });

  test('visiting authed /templates/namespace', async function (assert) {
    const shuttleService = Service.extend({
      fetchBanners: (scope, scopeId) => {
        assert.equal(scope, 'GLOBAL');
        assert.equal(scopeId, undefined);

        return new EmberPromise(resolve => resolve([]));
      }
    });

    this.owner.register('service:shuttle', shuttleService);

    await authenticateSession({ token: 'fakeToken' });
    await visit('/templates/job/namespace');

    assert.equal(currentURL(), '/templates/job/namespace');
  });

  test('visiting authed /templates/namespace', async function (assert) {
    const shuttleService = Service.extend({
      fetchBanners: (scope, scopeId) => {
        assert.equal(scope, 'GLOBAL');
        assert.equal(scopeId, undefined);

        return new EmberPromise(resolve => resolve([]));
      }
    });

    this.owner.register('service:shuttle', shuttleService);

    await authenticateSession({ token: 'fakeToken' });
    await visit('/templates/job/namespace/name');

    assert.equal(currentURL(), '/templates/job/namespace/name');
  });
});
