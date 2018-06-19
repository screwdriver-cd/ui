import templateHelper from 'screwdriver-ui/utils/template';
import { module, test } from 'qunit';
const { getFullName } = templateHelper;

module('Unit | Utility | template');

test('it gets the name as full name when no namespace is passed in', function (assert) {
  const expectedOutput = 'myTemplateName';
  const result = getFullName({
    name: 'myTemplateName',
    namespace: null
  });

  assert.deepEqual(result, expectedOutput);
});

test('it gets the namespace/name as full name when namespace is passed in', function (assert) {
  const expectedOutput = 'myNamespace/myName';
  const result = getFullName({
    name: 'myName',
    namespace: 'myNamespace'
  });

  assert.deepEqual(result, expectedOutput);
});

test('it gets the name as full name when namespace is default', function (assert) {
  const expectedOutput = 'myName';
  const result = getFullName({
    name: 'myName',
    namespace: 'default'
  });

  assert.deepEqual(result, expectedOutput);
});
