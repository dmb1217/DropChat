'use strict';

angular.module('core').factory('Socket', ['socketFactory',
    function(socketFactory) {
        return socketFactory({
            prefix: '',
            //ioSocket: io.connect('http://d-pc:3000')
            ioSocket: io.connect('http://localhost:3000')
        });
    }
]);