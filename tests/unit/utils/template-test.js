import templateHelper from 'screwdriver-ui/utils/template';
import { module, test } from 'qunit';
const { getFullName, getLastUpdatedTime, templatesFormatter } = templateHelper;

module('Unit | Utility | template', function () {
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
    const expectedOutput = `${humanizeDuration(timeDiff, {
      round: true,
      largest: 1
    })} ago`;
    const result = getLastUpdatedTime({
      updateTime: createTime
    });

    assert.deepEqual(result, expectedOutput);
  });

  test('it gets formated template list', function (assert) {
    const actualTime = '2020-01-01T00:00:00.000Z';
    const dummyTime = '2000-01-01T00:00:00.000Z';
    const timeDiff = Date.now() - new Date(actualTime).getTime();
    const expectedTimeDiff = `${humanizeDuration(timeDiff, {
      round: true,
      largest: 1
    })} ago`;

    const templateList = [
      {
        name: 'test-1',
        namespace: 'test-namespace',
        updateTime: actualTime,
        createTime: dummyTime,
        description: 'test description'
      },
      {
        name: 'test-2',
        namespace: 'test-namespace',
        updateTime: actualTime
      },
      {
        name: 'test-3',
        namespace: 'test-namespace',
        createTime: actualTime,
        description: 'test description'
      }
    ];

    const expectedOutput = [
      {
        ...templateList[0],
        fullName: 'test-namespace/test-1',
        lastUpdated: expectedTimeDiff
      },
      {
        ...templateList[1],
        fullName: 'test-namespace/test-2',
        lastUpdated: expectedTimeDiff,
        description: ''
      },
      {
        ...templateList[2],
        fullName: 'test-namespace/test-3',
        lastUpdated: expectedTimeDiff
      }
    ];

    const result = templatesFormatter(templateList);

    assert.deepEqual(result, expectedOutput);
  });
});
