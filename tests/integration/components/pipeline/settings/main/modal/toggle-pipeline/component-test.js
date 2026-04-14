import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/settings/main/modal/toggle-pipeline',
  function (hooks) {
    setupRenderingTest(hooks);

    let pipelinePageState;

    let shuttle;

    hooks.beforeEach(function () {
      pipelinePageState = this.owner.lookup('service:pipeline-page-state');
      shuttle = this.owner.lookup('service:shuttle');
    });

    test('it renders core components', async function (assert) {
      const pipelineMock = {
        id: 123,
        name: 'myOrg/myRepo',
        state: 'ACTIVE'
      };

      sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
      this.setProperties({ closeModal: () => {} });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::TogglePipeline
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists({ count: 1 });
      assert.dom('.modal-title').exists({ count: 1 });
      assert.dom('.alert').doesNotExist();
      assert.dom('#toggle-pipeline-message').exists({ count: 1 });
      assert.dom('.modal-footer').exists({ count: 1 });
      assert.dom('#toggle-pipeline-action').exists({ count: 1 });
    });

    test('it renders disable confirmation when pipeline is active', async function (assert) {
      const pipelineMock = {
        id: 123,
        name: 'myOrg/myRepo',
        state: 'ACTIVE'
      };

      sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
      this.setProperties({ closeModal: () => {} });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::TogglePipeline
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').hasText('Disable pipeline: myOrg/myRepo?');
      assert.dom('.toggle-pipeline-message-warning').exists({ count: 1 });
      assert
        .dom('#toggle-pipeline-action')
        .hasAttribute('data-default-text', 'Disable');
    });

    test('it renders enable confirmation when pipeline is disabled', async function (assert) {
      const pipelineMock = {
        id: 123,
        name: 'myOrg/myRepo',
        state: 'DISABLED'
      };

      sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
      this.setProperties({ closeModal: () => {} });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::TogglePipeline
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').hasText('Enable pipeline: myOrg/myRepo?');
      assert.dom('.toggle-pipeline-message-warning').doesNotExist();
      assert
        .dom('#toggle-pipeline-action')
        .hasAttribute('data-default-text', 'Enable');
    });

    test('it handles failed API call', async function (assert) {
      const pipelineMock = {
        id: 123,
        name: 'myOrg/myRepo',
        state: 'ACTIVE'
      };

      sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
      sinon
        .stub(shuttle, 'fetchFromApi')
        .rejects(new Error('Internal server error'));

      this.setProperties({ closeModal: () => {} });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::TogglePipeline
            @closeModal={{this.closeModal}}
        />`
      );

      await (
        await import('@ember/test-helpers')
      ).click('#toggle-pipeline-action');

      assert.dom('.alert').exists({ count: 1 });
    });

    test('it handles successful disable', async function (assert) {
      const pipelineMock = {
        id: 123,
        name: 'myOrg/myRepo',
        state: 'ACTIVE'
      };
      const updatedPipeline = { ...pipelineMock, state: 'DISABLED' };

      const getPipelineStub = sinon
        .stub(pipelinePageState, 'getPipeline')
        .returns(pipelineMock);
      const setPipelineStub = sinon.stub(pipelinePageState, 'setPipeline');

      sinon.stub(shuttle, 'fetchFromApi').resolves(updatedPipeline);

      let closedWith;

      this.setProperties({
        closeModal: result => {
          closedWith = result;
        }
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::TogglePipeline
            @closeModal={{this.closeModal}}
        />`
      );

      await (
        await import('@ember/test-helpers')
      ).click('#toggle-pipeline-action');

      assert.ok(
        setPipelineStub.calledWith(updatedPipeline),
        'setPipeline called with updated pipeline'
      );
      assert.strictEqual(closedWith, true, 'closeModal called with true');
      assert.ok(getPipelineStub.called);
    });

    test('it handles successful enable', async function (assert) {
      const pipelineMock = {
        id: 123,
        name: 'myOrg/myRepo',
        state: 'DISABLED'
      };
      const updatedPipeline = { ...pipelineMock, state: 'ACTIVE' };

      sinon.stub(pipelinePageState, 'getPipeline').returns(pipelineMock);
      const setPipelineStub = sinon.stub(pipelinePageState, 'setPipeline');

      sinon.stub(shuttle, 'fetchFromApi').resolves(updatedPipeline);

      let closedWith;

      this.setProperties({
        closeModal: result => {
          closedWith = result;
        }
      });

      await render(
        hbs`<Pipeline::Settings::Main::Modal::TogglePipeline
            @closeModal={{this.closeModal}}
        />`
      );

      await (
        await import('@ember/test-helpers')
      ).click('#toggle-pipeline-action');

      assert.ok(
        setPipelineStub.calledWith(updatedPipeline),
        'setPipeline called with updated pipeline'
      );
      assert.strictEqual(closedWith, true, 'closeModal called with true');
    });
  }
);
