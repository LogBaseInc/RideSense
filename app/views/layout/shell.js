define(['angular'], function () {
    (function () {
        'use strict';

        var controllerId = 'shell';
        angular.module('rideSenseApp').controller(controllerId, ['$rootScope', '$scope', '$location', 'sessionservice', shell]);

        function shell($rootScope, $scope, $location, sessionservice) {
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

            // $scope.$on('$routeChangeStart', function (event, next, current) {
            //     var isAnonymous = false;
            //     if (next.$$route && next.$$route.allowAnonymous)
            //         isAnonymous = next.$$route.allowAnonymous;
            //     //alert(isAnonymous +' '+ vm.isLoggedIn)
            //     if (!isAnonymous && !vm.isLoggedIn) {
            //         event.preventDefault();
            //         $rootScope.$evalAsync(function () {
            //             $location.path('/login');
            //         });
            //     }
            // });
        }
    })();
});