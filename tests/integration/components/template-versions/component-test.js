import { resolve } from 'rsvp';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'screwdriver-ui/tests/helpers';
import { click, render, waitFor } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import Service from '@ember/service';

const TEMPLATES = [
  {
    namespace: 'boo',
    name: 'baz',
    fullName: 'boo/baz',
    version: '3.0.0',
    tag: 'latest stable',
    trusted: true,
    createTime: '2023-05-12T16:21:37.500Z',
    metrics: {
      jobs: { count: 6 },
      builds: { count: 32 },
      pipelines: { count: 1 }
    }
  },
  {
    namespace: 'boo',
    name: 'baz',
    fullName: 'boo/baz',
    version: '2.0.0',
    tag: 'meeseeks',
    trusted: false,
    createTime: '2023-05-08T17:44:05.148Z',
    metrics: {
      jobs: { count: 2 },
      builds: { count: 235 },
      pipelines: { count: 12 }
    }
  },
  {
    namespace: 'boo',
    name: 'baz',
    fullName: 'boo/baz',
    version: '1.0.0',
    trusted: false,
    createTime: '2023-04-21T15:16:45.171Z',
    metrics: {
      jobs: { count: 0 },
      builds: { count: 44 },
      pipelines: { count: 40 }
    }
  }
];

const userSettingsMock = {
  displayJobNameLength: 30,
  timestampFormat: 'UTC'
};

module('Integration | Component | template versions', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const userSettingsStub = Service.extend({
      getUserPreference() {
        return resolve(userSettingsMock);
      },
      getDisplayJobNameLength() {
        return null;
      }
    });

    this.owner.unregister('service:userSettings');
    this.owner.register('service:userSettings', userSettingsStub);
  });

  test('it renders template versions in a table', async function (assert) {
    this.set('mock', TEMPLATES);
    this.set('selectedRange', '1yr');

    await render(
      hbs`<TemplateVersions @templates={{this.mock}} @selectedRange={{this.selectedRange}}/>;`
    );

    assert.dom('h4').hasText('All Versions');
    assert.dom('div.range-selection').exists();
    assert.dom('div.range-selection span').exists({ count: 1 });
    assert.dom('div.range-selection span').hasText('Time Range');
    assert.dom('div.range-selection div.btn-group').exists();
    assert.dom('div.range-selection div.btn-group button').exists({ count: 8 });
    assert
      .dom('div.range-selection div.btn-group button.active')
      .exists({ count: 1 });
    assert
      .dom('div.range-selection div.btn-group button.active')
      .hasText('1yr');
    assert.dom('div.custom-date-selection span').exists({ count: 1 });
    assert.dom('div.custom-date-selection span').hasText('Custom Date Range');
    assert
      .dom('div.custom-date-selection input.flatpickr-input')
      .exists({ count: 1 });
    assert
      .dom('div.custom-date-selection input.flatpickr-input')
      .isNotFocused();

    assert.dom('table').exists({ count: 1 });
    assert.dom('thead').exists({ count: 1 });
    assert.dom('thead tr th').exists({ count: 6 });
    assert.dom('thead tr th:nth-child(1)').hasText('VERSION');
    assert.dom('thead tr th:nth-child(2)').hasText('PUBLISHED');
    assert.dom('thead tr th:nth-child(3)').hasText('PIPELINES');
    assert.dom('thead tr th:nth-child(4)').hasText('JOBS');
    assert.dom('thead tr th:nth-child(5)').hasText('BUILDS');
    assert.dom('thead tr th:nth-child(6)').hasText('ACTIONS');

    assert.dom('tbody').exists({ count: 1 });
    assert.dom('tbody tr').exists({ count: 3 });

    assert.dom('tbody tr:nth-child(1) td').exists({ count: 6 });
    assert
      .dom('tbody tr:nth-child(1) td:nth-child(1)')
      .hasText('3.0.0 - latest stable');
    assert
      .dom('tbody tr:nth-child(1) td:nth-child(1) svg.trusted')
      .exists({ count: 1 });
    assert
      .dom('tbody tr:nth-child(1) td:nth-child(1) a')
      .hasAttribute('href', '/templates/job/boo/baz/3.0.0');
    assert
      .dom('tbody tr:nth-child(1) td:nth-child(2)')
      .hasText('05/12/2023, 04:21 PM UTC');
    assert.dom('tbody tr:nth-child(1) td:nth-child(3)').hasText('1');
    assert.dom('tbody tr:nth-child(1) td:nth-child(4)').hasText('6');
    assert.dom('tbody tr:nth-child(1) td:nth-child(5)').hasText('32');
    assert.dom('tbody tr:nth-child(1) td:nth-child(6)').hasText('');
    assert
      .dom('tbody tr:nth-child(1) td:nth-child(6) svg.fa-trash')
      .exists({ count: 1 });

    assert.dom('tbody tr:nth-child(2) td').exists({ count: 6 });
    assert.dom('tbody tr:nth-child(2) td').exists({ count: 6 });
    assert
      .dom('tbody tr:nth-child(2) td:nth-child(1)')
      .hasText('2.0.0 - meeseeks');
    assert
      .dom('tbody tr:nth-child(2) td:nth-child(1) svg.trusted')
      .doesNotExist();
    assert
      .dom('tbody tr:nth-child(2) td:nth-child(1) a')
      .hasAttribute('href', '/templates/job/boo/baz/2.0.0');
    assert
      .dom('tbody tr:nth-child(2) td:nth-child(2)')
      .hasText('05/08/2023, 05:44 PM UTC');
    assert.dom('tbody tr:nth-child(2) td:nth-child(3)').hasText('12');
    assert.dom('tbody tr:nth-child(2) td:nth-child(4)').hasText('2');
    assert.dom('tbody tr:nth-child(2) td:nth-child(5)').hasText('235');
    assert.dom('tbody tr:nth-child(2) td:nth-child(6)').hasText('');
    assert
      .dom('tbody tr:nth-child(2) td:nth-child(6) svg.fa-trash')
      .exists({ count: 1 });

    assert.dom('tbody tr:nth-child(3) td').exists({ count: 6 });
    assert.dom('tbody tr:nth-child(3) td').exists({ count: 6 });
    assert.dom('tbody tr:nth-child(3) td:nth-child(1)').hasText('1.0.0');
    assert
      .dom('tbody tr:nth-child(3) td:nth-child(1) svg.trusted')
      .doesNotExist();
    assert
      .dom('tbody tr:nth-child(3) td:nth-child(1) a')
      .hasAttribute('href', '/templates/job/boo/baz/1.0.0');
    assert
      .dom('tbody tr:nth-child(3) td:nth-child(2)')
      .hasText('04/21/2023, 03:16 PM UTC');
    assert.dom('tbody tr:nth-child(3) td:nth-child(3)').hasText('40');
    assert.dom('tbody tr:nth-child(3) td:nth-child(4)').hasText('0');
    assert.dom('tbody tr:nth-child(3) td:nth-child(5)').hasText('44');
    assert.dom('tbody tr:nth-child(3) td:nth-child(6)').hasText('');
    assert
      .dom('tbody tr:nth-child(3) td:nth-child(6) svg.fa-trash')
      .exists({ count: 1 });

    assert.dom('tfoot tr').exists({ count: 1 });
    assert.dom('tfoot tr td').exists({ count: 6 });
    assert.dom('tfoot tr td:nth-child(1)').hasText('');
    assert.dom('tfoot tr td:nth-child(2)').hasText('Total:');
    assert.dom('tfoot tr td:nth-child(3)').hasText('53');
    assert.dom('tfoot tr td:nth-child(4)').hasText('8');
    assert.dom('tfoot tr td:nth-child(5)').hasText('311');
    assert.dom('tfoot tr td:nth-child(6)').hasText('');

    await render(
      hbs`<TemplateVersions @templates={{this.mock}} @startTime="2024-11-30" @endTime="2024-12-01"/>;`
    );

    assert.dom('h4').hasText('All Versions');
    assert.dom('div.range-selection').exists();
    assert.dom('div.range-selection span').exists({ count: 1 });
    assert.dom('div.range-selection span').hasText('Time Range');
    assert.dom('div.range-selection div.btn-group').exists();
    assert.dom('div.range-selection div.btn-group button').exists({ count: 8 });
    assert
      .dom('div.range-selection div.btn-group button.active')
      .exists({ count: 0 });
    assert.dom('div.custom-date-selection span').exists({ count: 1 });
    assert.dom('div.custom-date-selection span').hasText('Custom Date Range');
    assert
      .dom('div.custom-date-selection input.flatpickr-input')
      .exists({ count: 1 });
    assert.dom('div.custom-date-selection input.flatpickr-input').isFocused();
  });

  test('it removes a version', async function (assert) {
    assert.expect(4);

    const onRemoveVersionMock = (fullName, version) => {
      assert.strictEqual(fullName, 'boo/baz');
      assert.strictEqual(version, '1.0.0');

      return resolve();
    };

    this.set('onRemoveVersion', onRemoveVersionMock);
    this.set('mock', TEMPLATES);

    await render(
      hbs`<TemplateVersions @templates={{this.mock}} @onRemoveVersion={{this.onRemoveVersion}}/>;`
    );

    await click('tbody tr:nth-child(3) td:nth-child(6) svg.fa-trash');
    await waitFor('.modal-dialog');
    assert
      .dom('.modal-dialog .modal-content .modal-body')
      .hasText(
        'You\'re about to delete the version "1.0.0". This action cannot be undone. Are you sure?'
      );
    assert
      .dom('.modal-dialog .modal-content .modal-footer button.btn-danger')
      .hasText('Confirm');
    await click('.modal-dialog .modal-content .modal-footer button.btn-danger');
  });
});
