import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { selectChoose } from 'ember-power-select/test-support';
import sinon from 'sinon';

module('Integration | Component | pipeline/parameters', function (hooks) {
  setupRenderingTest(hooks);

  test('it does not render title when no action is set', async function (assert) {
    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'bar' },
            job1: { p1: { value: 'abc' }, p2: { value: 'xyz' } }
          }
        }
      },
      job: { name: 'job1' },
      pipeline: { parameters: { foo: { value: 'foofoo' } } },
      jobs: [
        {
          name: 'job1',
          permutations: [
            { parameters: { p1: { value: 'p1' }, p2: { value: 'p2' } } }
          ]
        }
      ]
    });
    await render(
      hbs`<Pipeline::Parameters
        @event={{this.event}}
        @job={{this.job}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
      />`
    );

    assert.dom('.parameter-title').doesNotExist();
  });

  test('it renders title with correct action', async function (assert) {
    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'bar' },
            job1: { p1: { value: 'abc' }, p2: { value: 'xyz' } }
          }
        }
      },
      job: { name: 'job1' },
      pipeline: { parameters: { foo: { value: 'foofoo' } } },
      jobs: [
        {
          name: 'job1',
          permutations: [
            { parameters: { p1: { value: 'p1' }, p2: { value: 'p2' } } }
          ]
        }
      ]
    });
    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @job={{this.job}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
      />`
    );

    assert.dom('.parameter-title').hasText('START PIPELINE WITH PARAMETERS');
  });

  test('it renders parameters with shared group expanded from event', async function (assert) {
    this.setProperties({
      event: {
        meta: {
          parameters: {
            bar: { value: 'barzy' },
            foo: { value: 'foo' },
            job1: { p1: { value: 'abc' }, p2: { value: 'xyz' } }
          }
        }
      },
      pipeline: {
        parameters: {
          bar: ['barbar', 'bazbaz'],
          foo: { value: 'foo', description: 'awesome' }
        }
      },
      jobs: [
        {
          name: 'job1',
          permutations: [
            { parameters: { p1: { value: 'p1' }, p2: { value: 'p2' } } }
          ]
        }
      ]
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
      />`
    );

    assert.dom('.group-title').exists({ count: 2 });
    assert
      .dom(this.element.querySelectorAll('.group-title')[0])
      .hasText('Shared');
    assert.dom('.parameter-list.expanded .parameter').exists({ count: 2 });

    const parameters = this.element.querySelectorAll(
      '.parameter-list.expanded .parameter'
    );

    assert.dom(parameters[0].querySelector('label')).hasText('bar');
    assert
      .dom(parameters[0].querySelector('.dropdown-selection-container'))
      .hasText('barzy');
    assert.dom(parameters[1].querySelector('label')).hasText('foo awesome');
    assert.dom(parameters[1].querySelector('label svg')).exists({ count: 1 });
    assert.dom(parameters[1].querySelector('input')).hasValue('foo');
  });

  test('it renders parameters job group expanded from event', async function (assert) {
    this.setProperties({
      event: {
        meta: {
          parameters: {
            bar: { value: 'barzy' },
            foo: { value: 'foozy' },
            job1: { p1: { value: 'p1' }, p2: { value: 'xyz' } }
          }
        }
      },
      pipeline: {
        parameters: {
          bar: ['barbar', 'bazbaz'],
          foo: { value: 'foofoo' }
        }
      },
      jobs: [
        {
          name: 'job1',
          permutations: [
            { parameters: { p1: { value: 'p1' }, p2: { value: 'p2' } } }
          ]
        }
      ],
      job: { name: 'job1' }
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
        @job={{this.job}}
      />`
    );

    assert.dom('.group-title').exists({ count: 2 });
    assert
      .dom(this.element.querySelectorAll('.group-title')[0])
      .hasText('Job: job1');
    assert.dom('.parameter-list.expanded .parameter').exists({ count: 2 });

    const parameters = this.element.querySelectorAll(
      '.parameter-list.expanded .parameter'
    );

    assert.dom(parameters[0].querySelector('label')).hasText('p1');
    assert.dom(parameters[0].querySelector('input')).hasValue('p1');
    assert
      .dom(parameters[1].querySelector('label'))
      .hasText('p2 Default value: p2');
    assert.dom(parameters[1].querySelector('input')).hasValue('xyz');
  });

  test('it renders parameters with shared group expanded', async function (assert) {
    this.setProperties({
      pipelineParameters: { bar: { value: 'barbar' }, foo: { value: 'foo' } },
      pipeline: {
        parameters: {
          bar: ['barbar', 'bazbaz'],
          foo: { value: 'foo', description: 'awesome' }
        }
      },
      jobs: [{ name: 'job1' }]
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @pipelineParameters={{this.pipelineParameters}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
      />`
    );

    assert.dom('.group-title').exists({ count: 1 });
    assert
      .dom(this.element.querySelectorAll('.group-title')[0])
      .hasText('Shared');
    assert.dom('.parameter-list.expanded .parameter').exists({ count: 2 });

    const parameters = this.element.querySelectorAll(
      '.parameter-list.expanded .parameter'
    );

    assert.dom(parameters[0].querySelector('label')).hasText('bar');
    assert
      .dom(parameters[0].querySelector('.dropdown-selection-container'))
      .hasText('barbar');
    assert.dom(parameters[1].querySelector('label')).hasText('foo awesome');
    assert.dom(parameters[1].querySelector('label svg')).exists({ count: 1 });
    assert.dom(parameters[1].querySelector('input')).hasValue('foo');
  });

  test('it renders parameters job group expanded', async function (assert) {
    this.setProperties({
      jobParameters: {
        job1: { p1: { value: 'p1' } }
      },
      pipeline: {},
      jobs: [
        {
          name: 'job1',
          permutations: [{ parameters: { p1: { value: 'p1' } } }]
        }
      ]
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @jobParameters={{this.jobParameters}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
      />`
    );

    assert.dom('.group-title').exists({ count: 1 });
    assert
      .dom(this.element.querySelectorAll('.group-title')[0])
      .hasText('Job: job1');
    assert.dom('.parameter-list').exists({ count: 1 });
    assert.dom('.parameter-list.expanded').doesNotExist();
  });

  test('it updates parameter value on input', async function (assert) {
    const onUpdateParameters = sinon.spy();

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foozy' },
            job1: { p1: { value: 'abc' } }
          }
        }
      },
      pipeline: {
        parameters: {
          foo: { value: 'foofoo' }
        }
      },
      jobs: [
        {
          name: 'job1',
          permutations: [{ parameters: { p1: { value: 'p1' } } }]
        }
      ],
      onUpdateParameters
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
        @onUpdateParameters={{this.onUpdateParameters}}
      />`
    );
    await fillIn('.parameter-list.expanded input', 'foobar');

    assert.equal(onUpdateParameters.callCount, 1);
    assert.true(
      onUpdateParameters.calledWith({
        foo: 'foobar',
        job1: { p1: 'abc' }
      })
    );
  });

  test('it updates job parameter value on input', async function (assert) {
    const onUpdateParameters = sinon.spy();

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foozy' },
            job1: { p1: { value: 'abc' } }
          }
        }
      },
      pipeline: {
        parameters: {
          foo: { value: 'foofoo' }
        }
      },
      jobs: [
        {
          name: 'job1',
          permutations: [{ parameters: { p1: { value: 'p1' } } }]
        }
      ],
      job: { name: 'job1' },
      onUpdateParameters
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
        @job={{this.job}}
        @onUpdateParameters={{this.onUpdateParameters}}
      />`
    );
    await fillIn('.parameter-list.expanded input', 'job123abc');

    assert.equal(onUpdateParameters.callCount, 1);
    assert.true(
      onUpdateParameters.calledWith({
        foo: 'foozy',
        job1: { p1: 'job123abc' }
      })
    );
  });

  test('it updates parameter value on selection', async function (assert) {
    const onUpdateParameters = sinon.spy();

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foo' }
          }
        }
      },
      pipeline: {
        parameters: {
          foo: ['foo', 'bar']
        }
      },
      jobs: [],
      onUpdateParameters
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
        @onUpdateParameters={{this.onUpdateParameters}}
      />`
    );

    await selectChoose('.dropdown-selection-container', 'bar');

    assert.equal(onUpdateParameters.callCount, 1);
    assert.true(
      onUpdateParameters.calledWith({
        foo: 'bar'
      })
    );
  });

  test('it adds icon when input is not equal to default value', async function (assert) {
    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foobar' }
          }
        }
      },
      pipeline: {
        parameters: {
          foo: { value: 'foobar' }
        }
      },
      jobs: [],
      onUpdateParameters: () => {}
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
        @onUpdateParameters={{this.onUpdateParameters}}
      />`
    );

    assert
      .dom(
        '.parameter-list.expanded .parameter label svg.fa-exclamation-triangle'
      )
      .doesNotExist();

    await fillIn('.parameter-list.expanded input', 'foofoofoo');

    assert
      .dom(
        '.parameter-list.expanded .parameter label svg.fa-exclamation-triangle'
      )
      .exists({ count: 1 });
    assert
      .dom(
        '.parameter-list.expanded .parameter label svg.fa-exclamation-triangle title'
      )
      .hasText('Default value: foobar');
  });

  test('it renders inputs as read only when no action is set', async function (assert) {
    this.setProperties({
      event: {
        meta: {
          parameters: {
            bar: { value: 'barzy' },
            foo: { value: 'foo' }
          }
        }
      },
      pipeline: {
        parameters: {
          bar: ['barbar', 'bazbaz'],
          foo: { value: 'foo', description: 'awesome' }
        }
      },
      jobs: [
        {
          name: 'job1'
        }
      ]
    });

    await render(
      hbs`<Pipeline::Parameters
        @event={{this.event}}
        @pipeline={{this.pipeline}}
        @jobs={{this.jobs}}
      />`
    );

    const parameters = this.element.querySelectorAll(
      '.parameter-list.expanded .parameter'
    );

    assert.dom(parameters[0].querySelector('label')).hasText('bar');
    assert
      .dom(parameters[0].querySelector('.parameter-selector'))
      .hasAria('disabled', 'true');
    assert.dom(parameters[1].querySelector('label')).hasText('foo awesome');
    assert.dom(parameters[1].querySelector('input')).hasAttribute('disabled');
    assert.dom(parameters[1].querySelector('input')).hasValue('foo');
  });
});
