import Component from '@ember/component';

export default Component.extend({
  get entries() {
    const data = this.get('data');

    if (!data || typeof data !== 'object' || this.isEmptyObject) return [];

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

  get isEmptyObject() {
    const data = this.get('data');

    return data && typeof data === 'object' && Object.keys(data).length === 0;
  }
});
