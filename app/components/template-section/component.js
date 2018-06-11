import Component from '@ember/component';

export default Component.extend({
  classNames: ['col-sm-3'],
  actions: {

    changeTemplates(namespace) {
   
    	console.log('fadsfasdfas')
    	console.log(namespace)
      let temp = this.get('changeTemplatesShowed');
      let templates = this.get('templates');
      console.log(templates)
      temp(namespace);
    },

    
  }
});
