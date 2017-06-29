define(['angular'], function (angular) {
    (function () {
        'use strict';
        var module = angular.module('rideSenseApp');
        module.factory('spinner', ['$rootScope', spinner]);

        function spinner($rootScope) {
            var service = {
                show: show,
                hide: hide,               
            };
            return service;

            function show() {
                spinnerToggle(true);
            }

            function hide() {
                spinnerToggle(false);
            }

            function spinnerToggle(isShow) {
                $rootScope.$broadcast('spinner:toggle', { isShow: isShow });
            }
        }
    })();
});
