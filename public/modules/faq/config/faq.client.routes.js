'use strict';

//Setting up route
angular.module('faq').config(['$stateProvider',
	function($stateProvider) {
		// Faq state routing
		$stateProvider.
		state('faq', {
			url: '/faq',
			templateUrl: 'modules/faq/views/faq.client.view.html'
		});
	}
]);