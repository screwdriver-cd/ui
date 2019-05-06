import { resolve } from 'rsvp';
import Service from '@ember/service';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, click, find } from '@ember/test-helpers';
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

module('Integration | Component | artifact tree', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:build-artifact', artifactService);
  });

  test('it renders only title when build is running', async function(assert) {
    await render(hbs`
      {{artifact-tree
        buildStatus="RUNNING"
      }}
    `);

    assert.dom('.artifact-tree h4').hasText('Artifacts');
    assert.dom('.jstree-node').doesNotExist();
  });

  test('it renders with artifacts if build finished', async function(assert) {
    await render(hbs`
      {{artifact-tree
        buildStatus="SUCCESS"
      }}
    `);

    return settled().then(async () => {
      // Check if it has two nodes and one of them is a leaf/file
      assert.dom('.jstree-leaf').exists({ count: 1 });
      assert.dom('.jstree-node').exists({ count: 2 });

      // Check if the href is correctly set and then click the link
      assert.equal(find('.jstree-leaf a').href, parsedManifest[1].a_attr.href);
      await click('.jstree-leaf a');
    });
  });
});
