import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { set } from '@ember/object';

const mockPipeline = EmberObject.create({
  id: 1,
});

module('Integration | Component | pipeline list job cell', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.setProperties({
      pipeline: mockPipeline,
    });
  });

  test('it renders', async function(assert) {
    set(this, 'value', {
      jobName: 'a',
      build: {
        id: 2,
        status: 'RUNNING'
      }
    });

    await render(hbs`{{pipeline-list-job-cell
      value=value
    }}`);

    assert.dom('a').hasAttribute(
      'href',
      `/pipelines/${mockPipeline.id}/builds/${this.value.build.id}`
    );
    assert.dom('.fa-spinner').exists({ count: 1 });
    assert.dom('.job-name').hasText('a');
  });

  test('it renders an aborted build', async function(assert) {
    set(this, 'value', {
      jobName: 'b',
      build: {
        id: 2,
        status: 'ABORTED'
      }
    });

    await render(hbs`{{pipeline-list-job-cell
      value=value
    }}`);

    assert.dom('a').hasAttribute(
      'href',
      `/pipelines/${mockPipeline.id}/builds/${this.value.build.id}`
    );
    assert.dom('.fa-stop-circle').exists({ count: 1 });
    assert.dom('.job-name').hasText('b');
  });

  test('it renders a successful build', async function(assert) {
    set(this, 'value', {
      jobName: 'b',
      build: {
        id: 2,
        status: 'SUCCESS'
      }
    });

    await render(hbs`{{pipeline-list-job-cell
      value=value
    }}`);

    assert.dom('a').hasAttribute(
      'href',
      `/pipelines/${mockPipeline.id}/builds/${this.value.build.id}`
    );
    assert.dom('.fa-check-circle').exists({ count: 1 });
    assert.dom('.job-name').hasText('b');
  });

  test('it renders a successful build', async function(assert) {
    set(this, 'value', {
      jobName: 'b',
      build: {
        id: 2,
        status: 'FAILURE'
      }
    });

    await render(hbs`{{pipeline-list-job-cell
      value=value
    }}`);

    assert.dom('a').hasAttribute(
      'href',
      `/pipelines/${mockPipeline.id}/builds/${this.value.build.id}`
    );
    assert.dom('.fa-check-circle').exists({ count: 1 });
    assert.dom('.job-name').hasText('b');
  });
});
