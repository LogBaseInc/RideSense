define(['angular'], function () {
    (function () {
        'use strict';

        var controllerId = 'shell';
        angular.module('rideSenseApp').controller(controllerId, ['$rootScope', shell]);

        function shell($rootScope) {
            var vm = this;
            vm.loadSpinner = false;

             $rootScope.$on('spinner:toggle', function (event, data) {
                vm.loadSpinner = data.isShow;
            });
        }
    })();
});