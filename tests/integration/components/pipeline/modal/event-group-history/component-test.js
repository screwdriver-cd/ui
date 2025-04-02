import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { clearRender, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/event-group-history',
  function (hooks) {
    setupRenderingTest(hooks);

    const mockApiResponse = [];

    hooks.beforeEach(function () {
      const router = this.owner.lookup('service:router');
      const shuttle = this.owner.lookup('service:shuttle');
      const pipelinePageState = this.owner.lookup(
        'service:pipeline-page-state'
      );

      sinon.stub(router, 'currentURL').value('');
      sinon.stub(shuttle, 'fetchFromApi').resolves(mockApiResponse);
      sinon.stub(pipelinePageState, 'getPipelineId').returns(1);
    });

    hooks.afterEach(function () {
      mockApiResponse.splice(0);
    });

    test('it renders', async function (assert) {
      const groupEventId = 1;
      const mockEvent = {
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {},
        groupEventId
      };

      mockApiResponse.push(
        { ...mockEvent, id: 3 },
        { ...mockEvent, id: 2 },
        { ...mockEvent, id: 1 }
      );

      this.setProperties({
        event: { ...mockEvent, id: 1 },
        userSettings: {},
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::EventGroupHistory
            @event={{this.event}}
            @userSettings={{this.userSettings}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists({ count: 1 });
      assert.dom('.modal-header').hasText(`Events in group: ${groupEventId} ×`);
      assert.dom('.modal-body').exists({ count: 1 });
      assert.dom('.modal-footer').doesNotExist();

      await clearRender();
    });

    test('it renders correct modal header for pull request', async function (assert) {
      const prNum = 1;
      const mockEvent = {
        prNum,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {},
        groupEventId: 1
      };

      this.setProperties({
        event: { ...mockEvent, id: 1 },
        userSettings: {},
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::EventGroupHistory
            @event={{this.event}}
            @userSettings={{this.userSettings}}
            @isPR={{true}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').hasText(`Events in PR: ${prNum} ×`);

      await clearRender();
    });
  }
);
