import { module, test } from 'qunit';
import { getDisplayedRows } from 'screwdriver-ui/utils/models-table/displayed-rows';

module('Unit | Utility | models-table/displayed-rows', function () {
  test('it returns filtered content when page size is not provided', function (assert) {
    const filteredContent = [{ id: 1 }, { id: 2 }];

    assert.deepEqual(getDisplayedRows({ filteredContent }), filteredContent);
  });

  test('it returns rows for the current page', function (assert) {
    const filteredContent = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 }
    ];

    assert.deepEqual(
      getDisplayedRows({
        filteredContent,
        currentPageNumber: 2,
        pageSize: 2
      }),
      [{ id: 3 }, { id: 4 }]
    );
  });

  test('it defaults to the first page when current page is not provided', function (assert) {
    const filteredContent = [{ id: 1 }, { id: 2 }, { id: 3 }];

    assert.deepEqual(
      getDisplayedRows({
        filteredContent,
        pageSize: 2
      }),
      [{ id: 1 }, { id: 2 }]
    );
  });
});
