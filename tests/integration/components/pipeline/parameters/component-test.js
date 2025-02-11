import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { selectChoose } from 'ember-power-select/test-support';
import sinon from 'sinon';

module('Integration | Component | pipeline/parameters', function (hooks) {
  setupRenderingTest(hooks);

  test('it does not render title when no action is set', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: { foo: { value: 'foofoo' } }
    });

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
        @jobs={{this.jobs}}
      />`
    );

    assert.dom('.parameter-title').doesNotExist();
  });

  test('it renders title with correct action', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        foo: { value: 'foofoo' }
      }
    });

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
        @jobs={{this.jobs}}
      />`
    );

    assert.dom('.parameter-title').hasText('START PIPELINE WITH PARAMETERS');
  });

  test('it renders parameters with shared group expanded from event', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        bar: ['barbar', 'bazbaz'],
        foo: { value: 'foo', description: 'awesome' }
      }
    });

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
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        bar: ['barbar', 'bazbaz'],
        foo: { value: 'foofoo' }
      }
    });

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
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        bar: ['barbar', 'bazbaz'],
        foo: { value: 'foo', description: 'awesome' }
      }
    });

    this.setProperties({
      pipelineParameters: { bar: { value: 'barbar' }, foo: { value: 'foo' } },
      jobs: [{ name: 'job1' }]
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @pipelineParameters={{this.pipelineParameters}}
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
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getPipeline').returns({});

    this.setProperties({
      jobParameters: {
        job1: { p1: { value: 'p1' } }
      },
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
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    const onUpdateParameters = sinon.spy();

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        foo: { value: 'foofoo' }
      }
    });

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foozy' },
            job1: { p1: { value: 'abc' } }
          }
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
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    const onUpdateParameters = sinon.spy();

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        foo: { value: 'foofoo' }
      }
    });

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foozy' },
            job1: { p1: { value: 'abc' } }
          }
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
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    const onUpdateParameters = sinon.spy();

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        foo: ['foo', 'bar']
      }
    });

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foo' }
          }
        }
      },
      jobs: [],
      onUpdateParameters
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
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
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        foo: { value: 'foobar' }
      }
    });

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foobar' }
          }
        }
      },
      jobs: [],
      onUpdateParameters: () => {}
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @jobs={{this.jobs}}
        @onUpdateParameters={{this.onUpdateParameters}}
      />`
    );

    assert
      .dom(
        '.parameter-list.expanded .parameter label svg.fa-triangle-exclamation'
      )
      .doesNotExist();

    await fillIn('.parameter-list.expanded input', 'foofoofoo');

    assert
      .dom(
        '.parameter-list.expanded .parameter label svg.fa-triangle-exclamation'
      )
      .exists({ count: 1 });
    assert
      .dom(
        '.parameter-list.expanded .parameter label svg.fa-triangle-exclamation title'
      )
      .hasText('Default value: foobar');
  });

  test('it renders inputs as read only when no action is set', async function (assert) {
    const pipelinePageState = this.owner.lookup('service:pipeline-page-state');

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        bar: ['barbar', 'bazbaz'],
        foo: { value: 'foo', description: 'awesome' }
      }
    });

    this.setProperties({
      event: {
        meta: {
          parameters: {
            bar: { value: 'barzy' },
            foo: { value: 'foo' }
          }
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
