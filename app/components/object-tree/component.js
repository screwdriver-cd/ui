import Component from '@ember/component';

export default Component.extend({
  get entries() {
    const data = this.get('data');

    if (!this.isListableObject) return [];

    return Object.entries(data).map(([key, value]) => {
      if (Array.isArray(value)) {
        return { key, kind: 'array', value: value.join(', ') };
      }

      if (value && typeof value === 'object') {
        return { key, kind: 'object', value };
      }

      return { key, kind: 'primitive', value };
    });
  },

  get isListableObject() {
    const data = this.get('data');

    return typeof data === 'object' && Object.keys(data).length > 0;
  }
});
