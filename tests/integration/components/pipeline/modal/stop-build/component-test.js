import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | pipeline/modal/stop-build', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.setProperties({
      buildId: 1,
      closeModal: () => {}
    });

    await render(
      hbs`<Pipeline::Modal::StopBuild
        @buildId={{this.buildId}}
        @closeModal={{this.closeModal}}
      />`
    );

    assert.dom('.alert').doesNotExist();
    assert.dom('#stop-build').exists({ count: 1 });
    assert.dom('#stop-build').isEnabled();
  });

  test('it displays error message when stop fails', async function (assert) {
    const shuttle = this.owner.lookup('service:shuttle');
    const errorMessage = 'Failed to stop build';
    const shuttleStub = sinon
      .stub(shuttle, 'fetchFromApi')
      .rejects({ message: errorMessage });

    this.setProperties({
      buildId: 1,
      closeModal: () => {}
    });

    await render(
      hbs`<Pipeline::Modal::StopBuild
        @buildId={{this.buildId}}
        @closeModal={{this.closeModal}}
      />`
    );

    await click('#stop-build');

    assert.equal(shuttleStub.calledOnce, true);
    assert.dom('.alert').exists({ count: 1 });
    assert.dom('.alert > span').hasText(errorMessage);
  });

  test('it closes modal when stop succeeds', async function (assert) {
    const shuttle = this.owner.lookup('service:shuttle');
    const shuttleStub = sinon.stub(shuttle, 'fetchFromApi').resolves();
    const closeModalSpy = sinon.spy();

    this.setProperties({
      buildId: 1,
      closeModal: closeModalSpy
    });

    await render(
      hbs`<Pipeline::Modal::StopBuild
        @buildId={{this.buildId}}
        @closeModal={{this.closeModal}}
      />`
    );

    await click('#stop-build');

    assert.equal(shuttleStub.calledOnce, true);
    assert.equal(closeModalSpy.calledOnce, true);
  });

  test('it calls correct API when no builds are configured', async function (assert) {
    const shuttle = this.owner.lookup('service:shuttle');
    const shuttleStub = sinon.stub(shuttle, 'fetchFromApi').resolves();
    const eventId = 1;

    this.setProperties({
      eventId,
      closeModal: () => {}
    });

    await render(
      hbs`<Pipeline::Modal::StopBuild
        @eventId={{this.eventId}}
        @closeModal={{this.closeModal}}
      />`
    );

    await click('#stop-build');

    assert.equal(
      shuttleStub.calledWith('put', `/events/${eventId}/stop`),
      true
    );
  });
});
