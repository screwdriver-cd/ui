import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { render, triggerKeyEvent } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { selectChoose, selectSearch } from 'ember-power-select/test-support';
import sinon from 'sinon';

module(
  'Integration | Component | pipeline/parameters/selectable',
  function (hooks) {
    setupRenderingTest(hooks);

    test('it renders', async function (assert) {
      this.setProperties({
        parameter: {
          defaultValues: ['foo', 'bar'],
          value: 'foo'
        },
        onSelectValue: () => {}
      });

      await render(
        hbs`<Pipeline::Parameters::Selectable
            @parameter={{this.parameter}}
            @onSelectValue={{this.onSelectValue}}
        />`
      );

      assert.dom(this.element).hasText('foo');
    });

    test('it calls onSelectValue callback when selection is made', async function (assert) {
      const parameter = {
        defaultValues: ['foo', 'bar'],
        value: 'foo'
      };
      const onSelectValue = sinon.spy();

      this.setProperties({
        parameter,
        onSelectValue
      });

      await render(
        hbs`<Pipeline::Parameters::Selectable
            @parameter={{this.parameter}}
            @onSelectValue={{this.onSelectValue}}
        />`
      );

      await selectChoose('.parameter-selector', parameter.defaultValues[1]);

      assert.equal(onSelectValue.callCount, 1);
      assert.equal(
        onSelectValue.calledWith(parameter, parameter.defaultValues[1]),
        true
      );
    });

    test('it overrides default values when enter key is pressed', async function (assert) {
      const parameter = { defaultValues: ['foo', 'bar'], value: 'foo' };
      const newValue = 'abc123';
      const onSelectValue = sinon.spy();

      this.setProperties({
        parameter,
        onSelectValue
      });

      await render(
        hbs`<Pipeline::Parameters::Selectable
            @parameter={{this.parameter}}
            @onSelectValue={{this.onSelectValue}}
        />`
      );

      await selectSearch('.parameter-selector', newValue);
      await triggerKeyEvent('input', 'keydown', 13);

      await assert.equal(onSelectValue.callCount, 1);
      assert.equal(onSelectValue.calledWith(parameter, newValue), true);
    });
  }
);
