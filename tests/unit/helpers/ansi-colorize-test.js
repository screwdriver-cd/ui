
import { ansiColorize } from 'screwdriver-ui/helpers/ansi-colorize';
import { module, test } from 'qunit';

module('Unit | Helper | ansi colorize');

// Replace this with your real tests.
test('it escapes html', function (assert) {
  let result = ansiColorize(['<main>']);

  assert.equal(result.toString(), '&lt;main&gt;');
});

test('colorizes ansi codes', function (assert) {
  let result = ansiColorize(['\u001b[32m<main>\u001b[0m']);

  assert.equal(result.toString(), '<span style="color:rgb(0,187,0)">&lt;main&gt;</span>');
});
