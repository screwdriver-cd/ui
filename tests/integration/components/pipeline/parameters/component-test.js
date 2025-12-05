import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { fillIn, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { selectChoose } from 'ember-power-select/test-support';
import sinon from 'sinon';

module('Integration | Component | pipeline/parameters', function (hooks) {
  setupRenderingTest(hooks);

  let pipelinePageState;

  hooks.beforeEach(function () {
    pipelinePageState = this.owner.lookup('service:pipeline-page-state');
  });

  test('it does not render title when no action is set', async function (assert) {
    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: { foo: { value: 'foofoo' } }
    });
    sinon.stub(pipelinePageState, 'getJobs').returns([
      {
        name: 'job1',
        permutations: [
          { parameters: { p1: { value: 'p1' }, p2: { value: 'p2' } } }
        ]
      }
    ]);

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'bar' },
            job1: { p1: { value: 'abc' }, p2: { value: 'xyz' } }
          }
        }
      },
      job: { name: 'job1' }
    });

    await render(
      hbs`<Pipeline::Parameters
        @event={{this.event}}
        @job={{this.job}}
      />`
    );

    assert.dom('.parameter-title').doesNotExist();
  });

  test('it renders title with correct action', async function (assert) {
    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        foo: { value: 'foofoo' }
      }
    });
    sinon.stub(pipelinePageState, 'getJobs').returns([
      {
        name: 'job1',
        permutations: [
          { parameters: { p1: { value: 'p1' }, p2: { value: 'p2' } } }
        ]
      }
    ]);

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'bar' },
            job1: { p1: { value: 'abc' }, p2: { value: 'xyz' } }
          }
        }
      },
      job: { name: 'job1' }
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @job={{this.job}}
      />`
    );

    assert.dom('.parameter-title').hasText('START PIPELINE WITH PARAMETERS');
  });

  test('it renders parameters with shared group expanded from event', async function (assert) {
    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        bar: ['barbar', 'bazbaz'],
        foo: { value: 'foo', description: 'awesome' }
      }
    });
    sinon.stub(pipelinePageState, 'getJobs').returns([
      {
        name: 'job1',
        permutations: [
          { parameters: { p1: { value: 'p1' }, p2: { value: 'p2' } } }
        ]
      }
    ]);

    this.setProperties({
      event: {
        meta: {
          parameters: {
            bar: { value: 'barzy' },
            foo: { value: 'foo' },
            job1: { p1: { value: 'abc' }, p2: { value: 'xyz' } }
          }
        }
      }
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
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
    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        bar: ['barbar', 'bazbaz'],
        foo: { value: 'foofoo' }
      }
    });
    sinon.stub(pipelinePageState, 'getJobs').returns([
      {
        name: 'job1',
        permutations: [
          { parameters: { p1: { value: 'p1' }, p2: { value: 'p2' } } }
        ]
      }
    ]);

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
      job: { name: 'job1' }
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
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
    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        bar: ['barbar', 'bazbaz'],
        foo: { value: 'foo', description: 'awesome' }
      }
    });
    sinon.stub(pipelinePageState, 'getJobs').returns([{ name: 'job1' }]);

    this.setProperties({
      pipelineParameters: { bar: { value: 'barbar' }, foo: { value: 'foo' } }
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @pipelineParameters={{this.pipelineParameters}}
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
    sinon.stub(pipelinePageState, 'getPipeline').returns({});
    sinon.stub(pipelinePageState, 'getJobs').returns([
      {
        name: 'job1',
        permutations: [{ parameters: { p1: { value: 'p1' } } }]
      }
    ]);

    this.setProperties({
      jobParameters: {
        job1: { p1: { value: 'p1' } }
      }
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @jobParameters={{this.jobParameters}}
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

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        foo: { value: 'foofoo' }
      }
    });
    sinon.stub(pipelinePageState, 'getJobs').returns([
      {
        name: 'job1',
        permutations: [{ parameters: { p1: { value: 'p1' } } }]
      }
    ]);

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foozy' },
            job1: { p1: { value: 'abc' } }
          }
        }
      },
      onUpdateParameters
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @onUpdateParameters={{this.onUpdateParameters}}
      />`
    );
    await fillIn('.parameter-list.expanded input', 'foobar');

    assert.equal(onUpdateParameters.callCount, 2);
    assert.true(
      onUpdateParameters.getCall(1).calledWith({
        foo: 'foobar',
        job1: { p1: 'abc' }
      })
    );
  });

  test('it updates job parameter value on input', async function (assert) {
    const onUpdateParameters = sinon.spy();

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        foo: { value: 'foofoo' }
      }
    });
    sinon.stub(pipelinePageState, 'getJobs').returns([
      {
        name: 'job1',
        permutations: [{ parameters: { p1: { value: 'p1' } } }]
      }
    ]);

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foozy' },
            job1: { p1: { value: 'abc' } }
          }
        }
      },
      job: { name: 'job1' },
      onUpdateParameters
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @job={{this.job}}
        @onUpdateParameters={{this.onUpdateParameters}}
      />`
    );
    await fillIn('.parameter-list.expanded input', 'job123abc');

    assert.equal(onUpdateParameters.callCount, 2);
    assert.true(
      onUpdateParameters.getCall(1).calledWith({
        foo: 'foozy',
        job1: { p1: 'job123abc' }
      })
    );
  });

  test('it updates parameter value on selection', async function (assert) {
    const onUpdateParameters = sinon.spy();

    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        foo: ['foo', 'bar']
      }
    });
    sinon.stub(pipelinePageState, 'getJobs').returns([]);

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foo' }
          }
        }
      },
      onUpdateParameters
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
        @onUpdateParameters={{this.onUpdateParameters}}
      />`
    );

    await selectChoose('.dropdown-selection-container', 'bar');

    assert.equal(onUpdateParameters.callCount, 2);
    assert.true(
      onUpdateParameters.getCall(1).calledWith({
        foo: 'bar'
      })
    );
  });

  test('it adds icon when input is not equal to default value', async function (assert) {
    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        foo: { value: 'foobar' }
      }
    });
    sinon.stub(pipelinePageState, 'getJobs').returns([]);

    this.setProperties({
      event: {
        meta: {
          parameters: {
            foo: { value: 'foobar' }
          }
        }
      },
      onUpdateParameters: () => {}
    });

    await render(
      hbs`<Pipeline::Parameters
        @action="start"
        @event={{this.event}}
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
    sinon.stub(pipelinePageState, 'getPipeline').returns({
      parameters: {
        bar: ['barbar', 'bazbaz'],
        foo: { value: 'foo', description: 'awesome' }
      }
    });
    sinon.stub(pipelinePageState, 'getJobs').returns([{ name: 'job1' }]);

    this.setProperties({
      event: {
        meta: {
          parameters: {
            bar: { value: 'barzy' },
            foo: { value: 'foo' }
          }
        }
      }
    });

    await render(
      hbs`<Pipeline::Parameters
        @event={{this.event}}
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
