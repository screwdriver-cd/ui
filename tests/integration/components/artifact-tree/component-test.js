import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, waitFor } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const parsedManifest = [
  {
    text: 'coverage',
    type: 'directory',
    children: [
      {
        text: 'coverage.json',
        type: 'file',
        a_attr: { href: 'http://foo.com/coverage.json' }
      }
    ]
  },
  {
    text: 'test.txt',
    type: 'file',
    a_attr: { href: 'http://foo.com/test.txt' }
  }
];

const artifactService = Service.extend({
  fetchManifest() {
    return resolve(parsedManifest);
  }
});

const routerService = Service.extend({
  transitionTo() {
    return true;
  }
});

module('Integration | Component | artifact tree', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:build-artifact', artifactService);
    this.owner.unregister('service:router');
    this.owner.register('service:router', routerService);
  });

  test('it renders only title when build is running', async function (assert) {
    await render(hbs`<ArtifactTree @buildStatus="RUNNING" />`);

    assert.dom('.artifact-tree h4').hasText('Artifacts');
    assert.dom('.artifact-tree span').hasText('No artifacts yet');
    assert.dom('.ember-basic-tree').doesNotExist();
  });

  test('it renders with artifacts if build finished', async function (assert) {
    await render(hbs`<ArtifactTree @buildStatus="SUCCESS" />`);

    await waitFor('.ember-basic-tree');

    assert.dom('.ember-basic-tree-node').exists({ count: 3 });

    // Check if the href is correctly set and then click the link
    assert
      .dom(
        '.ember-basic-tree > li > .ember-basic-tree-children > .ember-basic-tree-children > li > a'
      )
      .hasText('test.txt');
    await click(
      '.ember-basic-tree > li > .ember-basic-tree-children > .ember-basic-tree-children > li > a'
    );
  });

  test('it renders with artifacts with artifact preselected', async function (assert) {
    await render(
      hbs`<ArtifactTree @buildStatus="SUCCESS" @selectedArtifact="coverage/coverage.json" />`
    );

    await waitFor('.ember-basic-tree');

    assert.dom('.ember-basic-tree-node').exists({ count: 4 });
    assert
      .dom(
        '.ember-basic-tree > li > .ember-basic-tree-children > .ember-basic-tree-children > li > .ember-basic-tree-children > .ember-basic-tree-children > li > a'
      )
      .hasText('coverage.json');
  });
});
