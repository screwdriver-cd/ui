import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/start-event',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders when pipeline has no parameters', async function (assert) {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon.stub(pipelinePageState, 'getPipeline').returns({});

      this.setProperties({
        jobs: [],
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::StartEvent
            @jobs={{this.jobs}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.no-parameters-title').exists({ count: 1 });
    });

    test('it renders when pipeline has parameters', async function (assert) {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon
        .stub(pipelinePageState, 'getPipeline')
        .returns({ parameters: { p1: ['abc', '123'] } });

      this.setProperties({
        jobs: [
          {
            name: 'main',
            permutations: [{ parameters: { j1: ['yes', 'no'] } }]
          }
        ],
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::StartEvent
            @jobs={{this.jobs}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.no-parameters-title').doesNotExist();
      assert.dom('.parameter-group').exists({ count: 2 });
    });

    test('it renders optional notice', async function (assert) {
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon.stub(pipelinePageState, 'getPipeline').returns({});

      this.setProperties({
        jobs: [],
        closeModal: () => {}
      });
      await render(
        hbs`<Pipeline::Modal::StartEvent
            @jobs={{this.jobs}}
            @closeModal={{this.closeModal}}
            @notice="This is a notice to the user"
        />`
      );

      assert.dom('#user-notice').exists({ count: 1 });
    });

    test('it closes modal on success', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      const shuttleStub = sinon.stub(shuttle, 'fetchFromApi').resolves();
      const closeModalSpy = sinon.spy();

      sinon.stub(pipelinePageState, 'getPipeline').returns({});

      this.setProperties({
        jobs: [],
        closeModal: closeModalSpy
      });
      await render(
        hbs`<Pipeline::Modal::StartEvent
            @jobs={{this.jobs}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#submit-action');

      assert.equal(shuttleStub.calledOnce, true);
      assert.equal(closeModalSpy.calledOnce, true);
    });
  }
);
