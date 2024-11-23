import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { clearRender, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/modal/event-group-history',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      const router = this.owner.lookup('service:router');
      const shuttle = this.owner.lookup('service:shuttle');
      const groupEventId = 1;
      const mockEvent = {
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {},
        groupEventId
      };

      sinon.stub(router, 'currentURL').value('');
      sinon.stub(shuttle, 'fetchFromApi').resolves([
        { ...mockEvent, id: 3 },
        { ...mockEvent, id: 2 },
        { ...mockEvent, id: 1 }
      ]);

      this.setProperties({
        pipeline: {},
        event: { ...mockEvent, id: 1 },
        jobs: {},
        userSettings: {},
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::EventGroupHistory
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
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
      const router = this.owner.lookup('service:router');
      const shuttle = this.owner.lookup('service:shuttle');
      const prNum = 1;
      const mockEvent = {
        prNum,
        sha: 'abc123def456',
        commit: { author: { name: 'batman' }, message: 'Some amazing changes' },
        creator: { name: 'batman' },
        meta: {},
        groupEventId: 1
      };

      sinon.stub(router, 'currentURL').value('');
      sinon.stub(shuttle, 'fetchFromApi').resolves([]);

      this.setProperties({
        pipeline: {},
        event: { ...mockEvent, id: 1 },
        jobs: {},
        userSettings: {},
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::EventGroupHistory
            @pipeline={{this.pipeline}}
            @event={{this.event}}
            @jobs={{this.jobs}}
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
