import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';
import { computed, observer } from '@ember/object';

export default Controller.extend({
	triggerChangeIndicator: 1,
	urlParams: null,
    location: Ember.computed.oneWay('router.location.path'),

	crumbs: computed('triggerChangeIndicator',{
		get(){
			 console.log('ayyyyyyy')
		    console.log(window.location.href)
		    let breadcrumbs = [];

		    breadcrumbs.push({
		    	model: 'templates',
		    	name: 'templates',
		    	transition() {
		    		this.transitionToRoute('templates')
		    	},
		    	route: 'templates',
		    	args: []
		    })

		    let url = window.location.href.split('/');
		    url.splice(0,3)
		    console.log('THIS IS ROUTER')
		    console.log(url);
		    let urlParams;

		    // if(url.length == 1) {
		    //   urlParams = this.paramsFor('templates');
		    // }
		    // else if (url.length == 3) {
		    //   urlParams = this.paramsFor('templates.namespace');
		    // }
		    // else if (url.length == 5) {
		    //   urlParams = this.paramsFor('templates.detail');
		    // }
		    // let size = Object.keys(urlParams).length;


			if(url.length >= 3) {
			  breadcrumbs.push({
		    	model: 'templates',
		    	name: url[2],
		    	route: `templates.namespace`,
		    	args: [url[2]]
		      })
			}

			if(url.length >= 5) {
			  breadcrumbs.push({
		    	model: 'templates',
		    	name: url[4],
		    	route: `templates.detail`,
		    	args: [
		    		url[2],
		    		url[4]
		    	]
		      })
			}
			console.log('BREADCRUMBS')
			console.log(breadcrumbs);

			return breadcrumbs;

		}
	}),

	actions:{

		transition(route, args) {
			//this.modelFor('templates').reload();
						this.set('triggerChangeIndicator', this.get('triggerChangeIndicator')+1);

			if(route == 'templates'){
				this.transitionToRoute('templates');
			}
			else if(route == 'templates.namespace'){
				this.transitionToRoute('templates.namespace', args[0])
			}
			else{
				this.transitionToRoute('templates.detail', args[0], args[1])
			}
						console.log('------IN ROOT CONTROLLER-----')

			console.log(this.get('triggerChangeIndicator'))

		}
	}
});
