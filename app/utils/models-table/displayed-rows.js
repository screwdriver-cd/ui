/**
 * Return the rows currently visible on the active models-table page.
 *
 * @param {Object} displaySettings models-table display settings snapshot
 * @returns {Array} visible rows for the current page
 */
export default function getDisplayedRows(displaySettings = {}) {
  const {
    filteredContent = [],
    currentPageNumber = 1,
    pageSize
  } = displaySettings;

  if (!pageSize) {
    return filteredContent;
  }

  const startIndex = (currentPageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return filteredContent.slice(startIndex, endIndex);
}
