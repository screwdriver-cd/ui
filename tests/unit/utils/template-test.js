import templateHelper from 'screwdriver-ui/utils/template';
import { module, test } from 'qunit';
const { getFullName, getLastUpdatedTime } = templateHelper;

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

test('it gets the last updated time', function (assert) {
  const createTime = '2016-09-23T16:53:00.274Z';
  const timeDiff = Date.now() - new Date(createTime).getTime();
  const expectedOutput = `${humanizeDuration(timeDiff, { round: true, largest: 1 })} ago`;
  const result = getLastUpdatedTime({
    createTime
  });

  assert.deepEqual(result, expectedOutput);
});
