import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module(
  'Integration | Component | collection/modal/add-to-collection',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders core components', async function (assert) {
      this.setProperties({
        pipeline: { id: 123 },
        closeModal: () => {}
      });

      await render(
        hbs`<Collection::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.modal-header').exists({ count: 1 });
      assert.dom('.alert').doesNotExist();
      assert.dom('.modal-title').hasText('Add to a new collection');
      assert.dom('.create-new-collection').exists({ count: 1 });
      assert.dom('.create-new-collection label').exists({ count: 2 });
      assert.dom('.create-new-collection input').exists({ count: 2 });
      assert.dom('.select-collections').doesNotExist();
      assert.dom('.modal-footer').exists({ count: 1 });
      assert.dom('#submit-collections').exists({ count: 1 });
    });

    test('it renders error message if provided', async function (assert) {
      this.setProperties({
        errorMessage: 'Oops, something went wrong',
        pipeline: { id: 123 },
        closeModal: () => {}
      });

      await render(
        hbs`<Collection::Modal::AddToCollection
            @errorMessage={{this.errorMessage}}
            @pipeline={{this.pipeline}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.alert').exists({ count: 1 });
    });

    test('it renders collections if they exist', async function (assert) {
      this.setProperties({
        pipeline: { id: 123 },
        collections: [
          { id: 1, name: 'collection1', pipelineIds: [999] },
          { id: 2, name: 'collection2', pipelineIds: [123, 987, 456] },
          { id: 3, name: 'collection3', pipelineIds: [999, 456] }
        ],
        closeModal: () => {}
      });

      await render(
        hbs`<Collection::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @collections={{this.collections}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('.select-collections').exists({ count: 1 });
      assert.dom('#collection-1').exists({ count: 1 });
      assert.dom('#collection-2').doesNotExist();
      assert.dom('#collection-3').exists({ count: 1 });
    });

    test('it enables submit button when new collection name is input', async function (assert) {
      this.setProperties({
        pipeline: { id: 123 },
        closeModal: () => {}
      });

      await render(
        hbs`<Collection::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-collections').isDisabled();

      await fillIn('#new-collection-name-input', 'New Collection');

      assert.dom('#submit-collections').isEnabled();
    });

    test('it enables submit button when existing collection is selected', async function (assert) {
      this.setProperties({
        pipeline: { id: 123 },
        collections: [{ id: 1, name: 'Test', pipelineIds: [] }],
        closeModal: () => {}
      });

      await render(
        hbs`<Collection::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @collections={{this.collections}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-collections').isDisabled();

      await click('#collection-1');

      assert.dom('#submit-collections').isEnabled();
    });
  }
);
