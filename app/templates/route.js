import Route from '@ember/routing/route';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';

export default Route.extend(AuthenticatedRouteMixin, {
  routeAfterAuthentication: 'templates',
  model(params) {
 //    console.log('ayyyyyyy')
 //    console.log(this.get('router.url').split('/'))
 //    let breadcrumbs = [];

 //    breadcrumbs.push({
 //    	model: 'templates',
 //    	name: 'templates',
 //    	transition() {
 //    		this.transitionToRoute('templates')
 //    	},
 //    	route: 'templates',
 //    	args: []
 //    })

 //    let url = this.get('router.url').split('/');
 //    console.log('THIS IS ROUTER')
 //    console.log(this.get('currentPath'));
 //    let urlParams;

 //    if(url.length == 2) {
 //      urlParams = this.paramsFor('templates');
 //    }
 //    else if (url.length == 4) {
 //      urlParams = this.paramsFor('templates.namespace');
 //    }
 //    else if (url.length == 6) {
 //      urlParams = this.paramsFor('templates.detail');
 //    }
 //    let size = Object.keys(urlParams).length;


	// if(size >= 1) {
	//   breadcrumbs.push({
 //    	model: 'templates',
 //    	name: urlParams.namespace,
 //    	route: `templates.namespace`,
 //    	args: [urlParams.namespace]
 //      })
	// }

	// if(size >= 2) {
	//   breadcrumbs.push({
 //    	model: 'templates',
 //    	name: urlParams.name,
 //    	route: `templates.detail`,
 //    	args: [
 //    		urlParams.namespace,
 //    		urlParams.name
 //    	]
 //      })
	// }
	// console.log('BREADCRUMBS')
	// console.log(breadcrumbs);

	// return breadcrumbs;
	// this.controller.set('urlParams', params)
	return {params};
  },
  actions: {
  	didTransition(transition) {
  		// debugger;
  		console.log(" inside didTransition at root")
  		// this.refresh();
  	}
  }
});
