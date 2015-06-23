define(['angular'], function () {
    (function () {
        'use strict';

        var controllerId = 'shell';
        angular.module('rideSenseApp').controller(controllerId, ['$rootScope', '$location', 'sessionservice', shell]);

        function shell($rootScope, $location, sessionservice) {
            var vm = this;
            vm.loadSpinner = false;
            vm.isloggedIn = sessionservice.isLoggedIn();

            vm.logout = function(){
                sessionservice.clear();
                vm.isloggedIn = false;
                $location.path('/login');
            }

            $rootScope.$on('spinner:toggle', function (event, data) {
                vm.loadSpinner = data.isShow;
            });

            $rootScope.$on('login:status', function (event, data) {
                vm.isloggedIn = data.isloggedIn;
            });
        }
    })();
});