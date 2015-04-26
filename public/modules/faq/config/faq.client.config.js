'use strict';

angular.module('faq').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'FAQ', 'faq', 'item', '/faq(/create)?');
    }
]);