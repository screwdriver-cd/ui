import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
let server;

const userSettingsMock = {
  1018240: {
    showPRJobs: true
  },
  1048190: {
    showPRJobs: false
  },
  displayJobNameLength: 30,
  timestampFormat: 'LOCAL_TIMEZONE'
};

module('Unit | Serializer | preference/user', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/users/settings', function () {
      return [200, {}, JSON.stringify(userSettingsMock)];
    });
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it converts', async function (assert) {
    assert.expect(7);

    const userPreference = await this.owner
      .lookup('service:store')
      .queryRecord('preference/user', {});

    const {
      displayJobNameLength,
      timestampFormat,
      'preference/pipelines': preferencePipelines
    } = userPreference;

    assert.equal(displayJobNameLength, 30);
    assert.equal(timestampFormat, 'LOCAL_TIMEZONE');
    assert.equal(preferencePipelines.length, 2);

    const { firstObject } = preferencePipelines;

    assert.equal(firstObject.id, '1018240');
    assert.equal(firstObject.showPRJobs, true);

    const { lastObject } = preferencePipelines;

    assert.equal(lastObject.id, '1048190');
    assert.equal(lastObject.showPRJobs, false);
  });

  test('it saves preference/user', async function (assert) {
    assert.expect(4);

    server.put('http://localhost:8080/v4/users/settings', function (request) {
      const payload = JSON.parse(request.requestBody);

      assert.deepEqual(payload, {
        settings: {
          1018240: { showPRJobs: true },
          1048190: { showPRJobs: false },
          displayJobNameLength: 50,
          timestampFormat: 'UTC',
          allowNotification: true
        }
      });

      return [200, {}, JSON.stringify(payload)];
    });

    const userPreference = await this.owner
      .lookup('service:store')
      .queryRecord('preference/user', {});

    const displayJobNameLength = 50;
    const timestampFormat = 'UTC';
    const allowNotification = true;

    userPreference.setProperties({
      displayJobNameLength,
      timestampFormat,
      allowNotification
    });
    userPreference.save().then(userPref => {
      assert.equal(userPref.displayJobNameLength, displayJobNameLength);
      assert.equal(userPref.timestampFormat, timestampFormat);
      assert.equal(userPref.allowNotification, allowNotification);
    });
  });
});
