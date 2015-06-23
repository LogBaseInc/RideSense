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
            // $scope.style_fixedHeader = $global.get('fixedHeader');
            // $scope.style_headerBarHidden = $global.get('headerBarHidden');
            // $scope.style_layoutBoxed = $global.get('layoutBoxed');
            // $scope.style_fullscreen = $global.get('fullscreen');
            // $scope.style_leftbarCollapsed = $global.get('leftbarCollapsed');
            // $scope.style_leftbarShown = $global.get('leftbarShown');
            // $scope.style_rightbarCollapsed = $global.get('rightbarCollapsed');
            // $scope.style_isSmallScreen = false;
            // $scope.style_showSearchCollapsed = $global.get('showSearchCollapsed');

            // $scope.hideSearchBar = function () {
            //     $global.set('showSearchCollapsed', false);
            // };

            // $scope.hideHeaderBar = function () {
            //     $global.set('headerBarHidden', true);
            // };

            // $scope.showHeaderBar = function ($event) {
            //     $event.stopPropagation();
            //     $global.set('headerBarHidden', false);
            // };

            // $scope.toggleLeftBar = function () {
            //     if ($scope.style_isSmallScreen) {
            //         return $global.set('leftbarShown', !$scope.style_leftbarShown);
            //     }
            //     $global.set('leftbarCollapsed', !$scope.style_leftbarCollapsed);
            // };

            // $scope.toggleRightBar = function () {
            //     $global.set('rightbarCollapsed', !$scope.style_rightbarCollapsed);
            // };

            $scope.$on('globalStyles:changed', function (event, newVal) {
                $scope['style_' + newVal.key] = newVal.value;
            });
            // $scope.$on('globalStyles:maxWidth767', function (event, newVal) {
            //     $timeout(function () {
            //         $scope.style_isSmallScreen = newVal;
            //         if (!newVal) {
            //             $global.set('leftbarShown', false);
            //         } else {
            //             $global.set('leftbarCollapsed', false);
            //         }
            //     });
            // });

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