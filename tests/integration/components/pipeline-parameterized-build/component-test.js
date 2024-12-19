import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module(
  'Integration | Component | pipeline parameterized build',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders inline', async function (assert) {
      this.setProperties({
        buildPipelineParameters: {
          p1: '1',
          p2: '2'
        },
        showSubmitButton: true
      });

      await render(hbs`<PipelineParameterizedBuild
        @buildPipelineParameters={{this.buildPipelineParameters}}
        @showSubmitButton={{this.showSubmitButton}}
      />`);
      assert.dom('input').exists({ count: 2 }, 'There are 2 parameters');
      assert
        .dom('button[type=submit]')
        .exists({ count: 1 }, 'There is 1 submit button');
    });

    test('it renders block', async function (assert) {
      // Set any properties with this.set('myProperty', 'value');
      // Handle any actions with this.set('myAction', function(val) { ... });
      this.setProperties({
        buildPipelineParameters: {
          p1: '1',
          p2: '2'
        },
        checkParameters: parameterizedModel => {
          assert.ok(
            typeof parameterizedModel === 'object',
            'parameterizedModel is object'
          );
          assert.equal(
            2,
            Object.keys(parameterizedModel).length,
            'parameterizedModel has length of 2'
          );
        }
      });

      // Template block usage:
      await render(hbs` <PipelineParameterizedBuild @buildPipelineParameters={{this.buildPipelineParameters}} as |parameterizedBuild| >
          <button class="test-button is-primary" {{on "click" (fn this.checkParameters parameterizedBuild.parameters)}}>
            Test
          </button>
        </PipelineParameterizedBuild>
      `);

      await click('button.test-button');
    });

    test('it renders as dropdown list', async function (assert) {
      this.setProperties({
        buildPipelineParameters: {
          from: 'latest',
          to: ['test', 'stable']
        },
        showSubmitButton: true
      });

      await render(hbs`<PipelineParameterizedBuild
        @buildPipelineParameters={{this.buildPipelineParameters}}
        @showSubmitButton={{this.showSubmitButton}}
      />`);
      assert.dom('.form-group').exists({ count: 2 }, 'There are 2 parameters');
      assert
        .dom('.ember-basic-dropdown')
        .exists({ count: 1 }, 'There is 1 dropdown list');
      assert
        .dom('.form-control')
        .exists({ count: 1 }, 'There is 1 input field');
      assert
        .dom('button[type=submit]')
        .exists({ count: 1 }, 'There is 1 submit button');
    });

    test('it renders description', async function (assert) {
      this.setProperties({
        buildPipelineParameters: {
          from: {
            value: 'latest',
            description: 'promote from tag'
          },
          to: {
            value: ['test', 'stable'],
            description: 'promote to tag'
          },
          image: 'test-image'
        },
        showSubmitButton: true
      });

      await render(hbs`<PipelineParameterizedBuild
        @buildPipelineParameters={{this.buildPipelineParameters}}
        @showSubmitButton={{this.showSubmitButton}}
      />`);
      assert.dom('.form-group').exists({ count: 3 }, 'There are 3 parameters');
      assert
        .dom('.fa-circle-question')
        .exists({ count: 2 }, 'Theare are 2 description info');
      assert
        .dom('.ember-basic-dropdown')
        .exists({ count: 1 }, 'There is 1 dropdown list');
      assert
        .dom('.form-control')
        .exists({ count: 2 }, 'There are 2 input field');
      assert
        .dom('button[type=submit]')
        .exists({ count: 1 }, 'There is 1 submit button');
    });

    test('it renders default parameter', async function (assert) {
      this.setProperties({
        pipeline: {
          parameters: {
            from: 'latest',
            to: {
              value: ['test', 'stable']
            },
            image: 'test-image'
          }
        },
        buildPipelineParameters: {
          from: 'foo',
          to: {
            value: ['bar', 'test', 'stable']
          },
          image: 'test-image'
        },
        showSubmitButton: true
      });

      await render(hbs`<PipelineParameterizedBuild
        @pipeline={{this.pipeline}}
        @buildPipelineParameters={{this.buildPipelineParameters}}
        @showSubmitButton={{this.showSubmitButton}}
      />`);
      assert.dom('.form-group').exists({ count: 3 }, 'There are 3 parameters');
      assert
        .dom('.fa-triangle-exclamation')
        .exists({ count: 2 }, 'There are are 2 default value warnings');
      assert
        .dom('.ember-basic-dropdown')
        .exists({ count: 1 }, 'There is 1 dropdown list');
      assert
        .dom('.form-control')
        .exists({ count: 2 }, 'There is 2 input field');
      assert
        .dom('button[type=submit]')
        .exists({ count: 1 }, 'There is 1 submit button');
    });
  }
);
