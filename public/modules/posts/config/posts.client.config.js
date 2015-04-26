'use strict';

// Configuring the Articles module

angular.module('posts').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'My Posts', 'posts', 'item', '/posts?', false);
		//Menus.addSubMenuItem('topbar', 'posts', 'List Posts', 'posts');
		//Menus.addSubMenuItem('topbar', 'posts', 'New Post', 'posts/create');
	}
]);