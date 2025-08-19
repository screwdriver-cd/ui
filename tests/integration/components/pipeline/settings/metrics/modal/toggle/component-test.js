import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/settings/metrics/modal/toggle',
  function (hooks) {
    setupRenderingTest(hooks);

    let shuttle;

    let pipelinePageState;

    let mockPipeline;

    hooks.beforeEach(function () {
      shuttle = this.owner.lookup('service:shuttle');
      pipelinePageState = this.owner.lookup('service:pipeline-page-state');

      mockPipeline = {
        id: 123,
        settings: {}
      };

      sinon.stub(pipelinePageState, 'getPipeline').returns(mockPipeline);
      sinon.stub(pipelinePageState, 'getPipelineId').returns(mockPipeline.id);
    });

    test('it renders', async function (assert) {
      this.setProperties({
        jobs: [{ id: 123, name: 'job1' }],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Metrics::Modal::Toggle
          @jobs={{this.jobs}}
          @isInclude={{true}}
          @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').exists();
      assert.dom('#modal-downtime-jobs-message').exists();
      assert.dom('.toggle-jobs-list').doesNotExist();
      assert.dom('#submit-action').exists();
    });

    test('it renders for multiple jobs', async function (assert) {
      this.setProperties({
        jobs: [
          { id: 123, name: 'job1' },
          { id: 987, name: 'job2' }
        ],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Metrics::Modal::Toggle
          @jobs={{this.jobs}}
          @isInclude={{true}}
          @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-title').exists();
      assert.dom('#modal-downtime-jobs-message').exists();
      assert.dom('.toggle-jobs-list').exists();
      assert.dom('#submit-action').exists();
    });

    test('it handles failed API call correctly', async function (assert) {
      sinon
        .stub(shuttle, 'fetchFromApi')
        .rejects({ message: 'API call failed' });

      this.setProperties({
        jobs: [{ id: 123, name: 'job1' }],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Settings::Metrics::Modal::Toggle
          @jobs={{this.jobs}}
          @isInclude={{true}}
          @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.dom('.modal-title').exists();
      assert.dom('#modal-downtime-jobs-message').exists();
      assert.dom('.toggle-jobs-list').doesNotExist();
      assert.dom('#submit-action').exists();
    });

    test('it handles successful API call correctly', async function (assert) {
      const setPipelineSpy = sinon.spy(pipelinePageState, 'setPipeline');
      const closeModalSpy = sinon.spy();
      const mockResponse = {
        id: 1
      };

      sinon.stub(shuttle, 'fetchFromApi').resolves(mockResponse);

      this.setProperties({
        jobs: [{ id: 123, name: 'job1' }],
        closeModal: closeModalSpy
      });

      await render(
        hbs`<Pipeline::Settings::Metrics::Modal::Toggle
          @jobs={{this.jobs}}
          @isInclude={{true}}
          @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.equal(setPipelineSpy.calledOnceWith(mockResponse), true);
      assert.equal(closeModalSpy.calledOnceWith(true), true);
    });
  }
);
