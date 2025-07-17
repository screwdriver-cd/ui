import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

module('Unit | Service | settings', function (hooks) {
  setupTest(hooks);

  let service;

  let shuttle;

  let mockSettings;

  hooks.beforeEach(function () {
    service = this.owner.lookup('service:settings');
    shuttle = this.owner.lookup('service:shuttle');

    mockSettings = {
      displayJobNameLength: 20,
      timestampFormat: 'LOCAL_TIMEZONE',
      allowNotification: false
    };
  });

  test('it exists', function (assert) {
    assert.ok(service);
  });

  test('getSettings returns undefined initially', function (assert) {
    assert.equal(service.getSettings(), undefined);
  });

  test('getSettingsForPipeline returns empty object pipeline with no configurations', function (assert) {
    const pipelineId = 123;

    assert.deepEqual(service.getSettingsForPipeline(pipelineId), {});

    service.settings = mockSettings;
    assert.deepEqual(service.getSettingsForPipeline(pipelineId), {});
  });

  test('getSettingsForPipeline returns configuration for pipeline', function (assert) {
    const pipelineId = 123;
    const mockPipelineSettings = {
      showPRJobs: true
    };

    service.settings = mockSettings;
    service.settings[pipelineId] = mockPipelineSettings;

    assert.deepEqual(
      service.getSettingsForPipeline(pipelineId),
      mockPipelineSettings
    );
  });

  test('fetchSettings sets settings on successful API call', async function (assert) {
    sinon.stub(shuttle, 'fetchFromApi').resolves(mockSettings);

    await service.fetchSettings();
    assert.equal(service.getSettings(), mockSettings);
  });

  test('fetchSettings throws error on unsuccessful API call', async function (assert) {
    const mockError = new Error('API error');

    sinon.stub(shuttle, 'fetchFromApi').rejects(mockError);

    service
      .fetchSettings()
      .then(() => {
        assert.fail('Expected fetchSettings to throw an error');
      })
      .catch(err => {
        assert.equal(err, mockError);
      });
  });

  test('updateSettings updates settings on successful API call', async function (assert) {
    const updatedSettings = {
      ...mockSettings,
      displayJobNameLength: 30
    };

    sinon.stub(shuttle, 'fetchFromApi').resolves(updatedSettings);

    await service.updateSettings(updatedSettings);
    assert.equal(service.getSettings(), updatedSettings);
  });

  test('updateSettings throws error on unsuccessful API call', async function (assert) {
    const mockError = new Error('API error');

    sinon.stub(shuttle, 'fetchFromApi').rejects(mockError);

    service
      .updateSettings(mockSettings)
      .then(() => {
        assert.fail('Expected fetchSettings to throw an error');
      })
      .catch(err => {
        assert.equal(err, mockError);
      });
  });
});
