import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ObjectProxy from '@ember/object/proxy';

const ObjectPromiseProxy = ObjectProxy.extend(PromiseProxyMixin);

export default Component.extend({
  banner: service('banner'),
  listdata: computed({
    get() {
      return ObjectPromiseProxy.create({
        promise: this.get('banner').fetchBanners()
      });
    }
  })
});
