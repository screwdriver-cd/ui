import { module, test } from 'qunit';
import {
  capitalizeFirstLetter,
  isParameterized,
  truncateMessage
} from 'screwdriver-ui/components/pipeline/modal/confirm-action/util';

module('Unit | Component | pipeline/modal/confirm-action/util', function () {
  test('truncateMessage truncates string', function (assert) {
    const shortMessage = 'short message';

    assert.equal(truncateMessage(shortMessage), shortMessage);

    const longMessage =
      'This commit message is really long and will exceed the expected character length; as such, it will be truncated in order to fit within the expected character length';

    assert.equal(
      truncateMessage(longMessage),
      'This commit message is really long and will exceed the expected character length; as such, it will be truncated in order to fit within the expected ch...'
    );
  });

  test('capitalizeFirstLetter capitalizes first letter of string', function (assert) {
    assert.equal(capitalizeFirstLetter('foo'), 'Foo');
  });

  test('isParameterized returns true if pipeline or event has parameters', function (assert) {
    assert.equal(isParameterized({}, {}), false);
    assert.equal(isParameterized({ parameters: { a: 4 } }, {}), true);
    assert.equal(isParameterized({}, { meta: {} }), false);
    assert.equal(
      isParameterized({}, { meta: { parameters: { p1: { value: 'foo' } } } }),
      true
    );
    assert.equal(
      isParameterized(
        { parameters: { a: 4 } },
        { meta: { parameters: { p1: { value: 'foo' } } } }
      ),
      true
    );
  });
});
