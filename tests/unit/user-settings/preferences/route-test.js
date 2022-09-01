import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';

const userSettingsMock = {
  1018240: {
    showPRJobs: true
  },
  1048190: {
    showPRJobs: false
  },
  displayJobNameLength: 30
};

module('Unit | Route | user-settings/preferences', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:user-settings/preferences');

    assert.ok(route);
  });

  test('it returns model', function (assert) {
    assert.expect(1);

    const route = this.owner.lookup('route:user-settings/preferences');
    const shuttleStub = Service.extend({
      getUserSetting() {
        return userSettingsMock;
      }
    });

    this.owner.unregister('service:shuttle');
    this.owner.register('service:shuttle', shuttleStub);

    return route.model().then(results => {
      assert.equal(results.desiredJobNameLength, 30);
    });
  });
});
