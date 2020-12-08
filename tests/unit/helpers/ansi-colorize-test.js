import { ansiColorize } from 'screwdriver-ui/helpers/ansi-colorize';
import { module, test } from 'qunit';

module.only('Unit | Helper | ansi colorize', function() {
  test('colorizes ansi codes', function(assert) {
    let result = ansiColorize(['\u001b[32m&lt;main&gt;\u001b[0m']);

    assert.equal(result.toString(), '<span class="ansi-green-fg">&lt;main&gt;</span>');
  });
});
