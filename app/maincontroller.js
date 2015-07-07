define(['angular', 
    'views/component/sessionservice'], function (angular, require) {
    (function () {
        'use strict';

        var controllerId = 'mainController';
        var module = angular.module('rideSenseApp');
        module.controller(controllerId, ['$rootScope', '$scope', '$location', '$timeout', 'sessionservice', mainController]);

        function mainController($rootScope, $scope, $location, $timeout, sessionservice) {
            var layoutpath = 'views/layout/';
            $scope.shelltmp = getLayoutUrl();
            
            $scope.$on('globalStyles:changed', function (event, newVal) {
                $scope['style_' + newVal.key] = newVal.value;
            });
            
            $scope.isLoggedIn = sessionservice.isLoggedIn();
            $scope.logOut = function () {
                $scope.isLoggedIn = false;
                sessionservice.clear();
                $scope.shelltmp = getLayoutUrl("shell");
                $location.path('/login');
            };

            $scope.rightbarAccordionsShowOne = false;
            $scope.rightbarAccordions = [{ open: true }, { open: true }, { open: true }, { open: true }, { open: true }, { open: true }, { open: true }];

            $scope.$on('$routeChangeStart', function (event, next, current) {
                var isAnonymous = false;
                if (next.$$route && next.$$route.allowAnonymous)
                    isAnonymous = next.$$route.allowAnonymous;
                if (!isAnonymous && !$scope.isLoggedIn) {
                    event.preventDefault();
                    $rootScope.$evalAsync(function () {
                        $location.path('/login');
                    });
                }
                //progressLoader.start();
                //progressLoader.set(50);
            });
            $scope.$on('$routeChangeSuccess', function (e) {
                //progressLoader.end();
            });

            function getLayoutUrl() {
                var name = 'shell';
                if (sessionservice.isLoggedIn())
                    name = 'mainshell';
                return layoutpath + name + '.html';
            }

            $rootScope.$on('loginSuccess', function (e, isLoggedIn) {
                $scope.isLoggedIn = isLoggedIn;
                $scope.shelltmp = getLayoutUrl();
            });
        }
    })();
});