import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, findAll, click, fillIn } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';

const searchPipelinesSpy = sinon.spy();
const selectSearchedPipelineSpy = sinon.spy();
const mockSearchedPipelines = [
  {
    id: 1,
    name: 'screwdriver-cd/screwdriver'
  },
  {
    id: 2,
    name: 'screwdriver-cd/ui'
  },
  {
    id: 3,
    name: 'screwdriver-cd/models'
  },
  {
    id: 4,
    name: 'screwdriver-cd/zzz'
  }
];

module('Integration | Component | pipeline search panel', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.setProperties({
      searchedPipelines: mockSearchedPipelines,
      searchPipelines: searchPipelinesSpy,
      selectSearchedPipeline: selectSearchedPipelineSpy
    });
  });

  test('it renders', async function (assert) {
    await render(hbs`
      {{pipeline-search-panel
        searchedPipelines=searchedPipelines
      }}
    `);

    assert.dom('.search-pipeline-searchbar').exists({ count: 1 });
    assert.dom('.searched-pipeline').exists({ count: 4 });

    const wrapperEls = findAll('.searched-pipeline');

    assert.dom(wrapperEls[0]).hasText(mockSearchedPipelines[0].name);
    assert.dom(wrapperEls[1]).hasText(mockSearchedPipelines[1].name);
    assert.dom(wrapperEls[2]).hasText(mockSearchedPipelines[2].name);
    assert.dom(wrapperEls[3]).hasText(mockSearchedPipelines[3].name);
  });

  test('it searches pipelines with a query', async function (assert) {
    await render(hbs`
      {{pipeline-search-panel
        searchedPipelines=searchedPipelines
        searchPipelines=searchPipelines
      }}
    `);

    const testQuery = 'screwdriver-cd';

    await fillIn('.search-pipeline-input', testQuery);

    await click('.search-pipeline-button');
    assert.ok(searchPipelinesSpy.calledWith(testQuery));
    assert.dom('.searched-pipeline').exists({ count: 4 });
  });

  test('it selects searhced pipeline', async function (assert) {
    await render(hbs`
      {{pipeline-search-panel
        searchedPipelines=searchedPipelines
        selectSearchedPipeline=selectSearchedPipeline
      }}
    `);

    const addPipelineButtons = findAll('.add-pipeline-button');

    assert.equal(addPipelineButtons.length, 4);

    const testAddPipelineButton = async idx => {
      await click(addPipelineButtons[idx]);
      assert.ok(
        selectSearchedPipelineSpy.calledWith(mockSearchedPipelines[idx].id)
      );
    };

    addPipelineButtons.forEach(async (addPipelineButton, idx) => {
      await testAddPipelineButton(idx);
    });
  });
});
