import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

module('Unit | Service | banners', function (hooks) {
  setupTest(hooks);

  let shuttle;

  let service;

  let spyCallback;

  hooks.beforeEach(function () {
    shuttle = this.owner.lookup('service:shuttle');
    service = this.owner.lookup('service:banners');
    spyCallback = sinon.spy();

    service.registerCallback(spyCallback);
  });

  test('it exists', function (assert) {
    assert.ok(service);
  });

  test('it sets callback correct', async function (assert) {
    assert.equal(service.bannerCallback, spyCallback);
  });

  test('it gets global banners and returns them in the callback', async function (assert) {
    const mockBanners = [
      {
        message: 'test message'
      }
    ];

    sinon.stub(shuttle, 'fetchFromApi').resolves(mockBanners);

    await service.getGlobalBanners();

    assert.equal(service.globalBanners, mockBanners);
    assert.equal(service.displayingBanners, mockBanners);
    assert.equal(spyCallback.calledOnce, true);
    assert.equal(spyCallback.calledWith(service.displayingBanners), true);
  });

  test('it returns global banners without re-fetching them in the callback', async function (assert) {
    const mockBanners = [
      {
        message: 'test message'
      }
    ];

    service.globalBanners = mockBanners;
    await service.getGlobalBanners();

    assert.equal(service.globalBanners, mockBanners);
    assert.equal(service.displayingBanners, mockBanners);
    assert.equal(spyCallback.calledOnce, true);
    assert.equal(spyCallback.calledWith(service.displayingBanners), true);
  });

  test('it gets pipeline banners and returns them in the callback', async function (assert) {
    const pipelineId = 123;
    const mockBanners = [
      {
        message: 'test message'
      }
    ];

    sinon.stub(shuttle, 'fetchFromApi').resolves(mockBanners);
    service.globalBanners = [];

    await service.getPipelineBanners(pipelineId);

    const { displayingBanners } = service;

    assert.equal(spyCallback.calledOnce, true);
    assert.equal(spyCallback.calledWith(displayingBanners), true);
    assert.equal(service.pipelineBanners.get(pipelineId), mockBanners);
    assert.equal(service.displayingBanners.length, 1);
  });

  test('it returns pipeline banners and global banners in the callback', async function (assert) {
    const pipelineId = 123;
    const mockBanners = [
      {
        message: 'test message'
      }
    ];

    sinon.stub(shuttle, 'fetchFromApi').resolves(mockBanners);
    service.globalBanners = [
      {
        message: 'global banner'
      }
    ];

    await service.getPipelineBanners(pipelineId);

    const { displayingBanners } = service;

    assert.equal(spyCallback.calledOnce, true);
    assert.equal(spyCallback.calledWith(displayingBanners), true);
    assert.equal(service.displayingBanners.length, 2);
    assert.equal(service.displayingBanners[0].message, mockBanners[0].message);
  });
});
