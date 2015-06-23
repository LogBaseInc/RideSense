define(['angular'], function (angular) {
    (function () {
        'use strict';
        var module = angular.module('rideSenseApp');
        
        module.directive("lbSpinner", function () {
            return {
                restrict: "EA",
                replace: true,
                link: link,
                scope: {
                    isBusy: "=",
                },
                template: '<div data-ng-show="isBusy" class="page-splash"><div data-cc-spinner="spinnerOptions"></div></div>'
            };
            function link(scope, element, attrs) {
                scope.spinnerOptions = {
                    radius: 10,
                    lines: 10,
                    length: 8,
                    width: 3,
                    speed: 1.7,
                    corners: 1.0,
                    trail: 100,
                    color: '#FFA500'
                };
            }
        });  

         module.directive('ccSpinner', ['$window', function ($window) {
            var directive = {
                link: link,
                restrict: 'A'
            };
            return directive;

            function link(scope, element, attrs) {
                scope.spinner = null;
                scope.$watch(attrs.ccSpinner, function (options) {
                    if (scope.spinner) {
                        scope.spinner.stop();
                    }
                    scope.spinner = new $window.Spinner(options);
                    scope.spinner.spin(element[0]);
                }, true);
            }
        }]);    

    })();
});