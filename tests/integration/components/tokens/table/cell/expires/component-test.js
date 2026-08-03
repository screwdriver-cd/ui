import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';

module('Integration | Component | tokens/table/cell/expires', function (hooks) {
  setupRenderingTest(hooks);
  let clock;

  hooks.beforeEach(() => {
    clock = sinon.useFakeTimers({
      now: new Date('2026-01-01T00:00:00Z')
    });
  });

  hooks.afterEach(() => {
    clock.restore();
  });

  test('it renders', async function (assert) {
    this.setProperties({
      record: {}
    });
    await render(
      hbs`<Tokens::Table::Cell::Expires
            @record={{this.record}}
        />`
    );

    assert.dom(this.element).hasText('No expiration');
  });

  test('it renders expired token', async function (assert) {
    this.setProperties({
      record: { expiresAt: '2020-01-01T00:00:00.000Z' }
    });
    await render(
      hbs`<Tokens::Table::Cell::Expires
            @record={{this.record}}
        />`
    );

    assert.dom(this.element).hasText('This token has expired');
  });

  test('it renders valid token', async function (assert) {
    this.setProperties({
      record: { expiresAt: '2026-01-02T00:00:00Z' }
    });
    await render(
      hbs`<Tokens::Table::Cell::Expires
            @record={{this.record}}
        />`
    );

    assert.dom(this.element).hasText('in a day');
  });
});
