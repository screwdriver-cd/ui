import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import sinon from 'sinon';
import { createCollectionBody } from 'screwdriver-ui/components/pipeline/modal/add-to-collection/util';

module(
  'Integration | Component | pipeline/modal/add-to-collection',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders core components', async function (assert) {
      this.setProperties({
        pipeline: { id: 123 },
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::AddToCollection
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
        hbs`<Pipeline::Modal::AddToCollection
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
        hbs`<Pipeline::Modal::AddToCollection
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
        hbs`<Pipeline::Modal::AddToCollection
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
        hbs`<Pipeline::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @collections={{this.collections}}
            @closeModal={{this.closeModal}}
        />`
      );

      assert.dom('#submit-collections').isDisabled();

      await click('#collection-1');

      assert.dom('#submit-collections').isEnabled();
    });

    test('it makes show message indicating new collection was created successfully', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const shuttleStub = sinon.stub(shuttle, 'fetchFromApi').resolves();

      this.setProperties({
        pipeline: { id: 123 },
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#new-collection-name-input', 'New Collection');
      await click('#submit-collections');

      assert.equal(shuttleStub.calledOnce, true);
      assert.equal(
        shuttleStub.calledWith(
          'post',
          '/collections',
          createCollectionBody('New Collection', '', 123)
        ),
        true
      );
      assert.dom('.alert').exists({ count: 1 });
      assert
        .dom('.alert > span')
        .hasText('Successfully created new collection: New Collection');
    });

    test('it sets error message when creating a new collection fails', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(shuttle, 'fetchFromApi').rejects();

      this.setProperties({
        pipeline: { id: 123 },
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#new-collection-name-input', 'New Collection');
      await click('#submit-collections');

      assert.dom('.alert').exists({ count: 1 });
      assert
        .dom('.alert > span')
        .hasText('Failed to create new collection: New Collection');
    });

    test('it displays message indicating adding pipeline to existing collection was successful', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const shuttleStub = sinon.stub(shuttle, 'fetchFromApi').resolves();

      this.setProperties({
        pipeline: { id: 123 },
        collections: [{ id: 1, name: 'Test', pipelineIds: [] }],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @collections={{this.collections}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#collection-1');
      await click('#submit-collections');

      assert.equal(shuttleStub.calledOnce, true);
      assert.equal(
        shuttleStub.calledWith('put', '/collections/1', { pipelineIds: [123] }),
        true
      );
      assert.dom('.alert').exists({ count: 1 });
      assert
        .dom('.alert > span')
        .hasText('Successfully added pipeline to collections: Test');
    });

    test('it sets error message when adding to an existing collection fails', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(shuttle, 'fetchFromApi').rejects();

      this.setProperties({
        pipeline: { id: 123 },
        collections: [{ id: 1, name: 'Test', pipelineIds: [] }],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @collections={{this.collections}}
            @closeModal={{this.closeModal}}
        />`
      );
      await click('#collection-1');
      await click('#submit-collections');

      assert.dom('.alert').exists({ count: 1 });
      assert
        .dom('.alert > span')
        .hasText('Failed to add pipeline to collections: Test');
    });

    test('it displays message indicating creating and adding to collections was successful', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');
      const shuttleStub = sinon.stub(shuttle, 'fetchFromApi').resolves();

      this.setProperties({
        pipeline: { id: 123 },
        collections: [
          { id: 1, name: 'Test', pipelineIds: [] },
          { id: 2, name: 'Funny', pipelineIds: [] }
        ],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @collections={{this.collections}}
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#new-collection-name-input', 'New Collection');
      await click('#collection-1');
      await click('#collection-2');
      await click('#submit-collections');

      assert.equal(shuttleStub.callCount, 3);
      assert.dom('.alert').exists({ count: 1 });
      assert
        .dom('.alert > span')
        .hasText(
          'Successfully created new collection: New Collection.  Also added pipeline to collections: Test, Funny'
        );
    });

    test('it sets error messages when creating and adding to collections fails', async function (assert) {
      const shuttle = this.owner.lookup('service:shuttle');

      sinon.stub(shuttle, 'fetchFromApi').rejects();

      this.setProperties({
        pipeline: { id: 123 },
        collections: [
          { id: 1, name: 'Test', pipelineIds: [] },
          { id: 2, name: 'Funny', pipelineIds: [] }
        ],
        closeModal: () => {}
      });

      await render(
        hbs`<Pipeline::Modal::AddToCollection
            @pipeline={{this.pipeline}}
            @collections={{this.collections}}
            @closeModal={{this.closeModal}}
        />`
      );
      await fillIn('#new-collection-name-input', 'New Collection');
      await click('#collection-1');
      await click('#collection-2');
      await click('#submit-collections');

      assert.dom('.alert').exists({ count: 1 });
      assert
        .dom('.alert > span')
        .hasText(
          'Failed to create new collection: New Collection.  Also failed to add pipeline to collections: Test, Funny'
        );
    });
  }
);
