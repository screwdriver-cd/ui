import { module, test } from 'qunit';
import {
  capitalizeFirstLetter,
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
});
