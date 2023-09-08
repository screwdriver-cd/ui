import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  isTruncated: false,
  config: computed('column.title', 'record.truncatedCellConfig', {
    get() {
      return this.record.truncatedCellConfig[this.column.title] || {};
    }
  }),
  data: computed('config', {
    get() {
      return this.config.data || [];
    }
  }),
  delimiter: computed('config', {
    get() {
      return this.config.delimiter || ', ';
    }
  }),
  maxColumnWidth: computed('config', {
    get() {
      return this.config.maxColumnWidth || 40;
    }
  }),
  ellipsis: computed('config', 'delimiter', {
    get() {
      return this.config.ellipsis || `${this.delimiter}...`;
    }
  }),

  truncatedString: computed('data', 'delimiter', 'maxColumnWidth', 'ellipsis', {
    get() {
      const { ellipsis, data, delimiter, maxColumnWidth } = this;

      const truncatedArray = data.filter(
        (_, i, arr) =>
          arr.slice(0, i + 1).join(delimiter).length <=
          maxColumnWidth - ellipsis.length
      );

      const truncatedStr = truncatedArray.join(delimiter);

      if (truncatedArray.length !== data.length) {
        this.isTruncated = true;

        return truncatedStr + ellipsis;
      }

      return truncatedStr;
    }
  }),

  fullString: computed('data', 'delimiter', {
    get() {
      return this.data.join(this.delimiter);
    }
  })
});
