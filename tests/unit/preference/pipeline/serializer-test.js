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
  displayJobNameLength: 30
};

module('Unit | Serializer | Preference Pipeline', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();

    server.get('http://localhost:8080/v4/users/settings', function () {
      return [200, {}, JSON.stringify(userSettingsMock)];
    });

    server.put('http://localhost:8080/v4/users/settings', function (request) {
      const payload = JSON.parse(request.requestBody);

      return [200, {}, JSON.stringify(payload)];
    });
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it converts', async function (assert) {
    assert.expect(2);

    const pipelineId = 1048190;
    const showPRJobs = true;
    const pipelinePreference = await this.owner
      .lookup('service:store')
      .createRecord('preference/pipeline', { id: pipelineId, showPRJobs });

    const result = await pipelinePreference.save();

    assert.equal(result.id, pipelineId);
    assert.equal(result.showPRJobs, true);
  });
});
