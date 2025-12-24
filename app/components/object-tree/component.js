import Component from '@glimmer/component';

export default class ObjectTreeComponent extends Component {
  get entries() {
    const { data } = this.args;

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
  }

  get isEmptyObject() {
    const { data } = this.args;

    return data && typeof data === 'object' && Object.keys(data).length === 0;
  }
}
