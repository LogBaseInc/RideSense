  define(['angular',
    'angularAMD'],
    function (angular, angularAMD) {
        (function () {
            'use strict';

            var app = angular.module('rideSenseApp', [
                // Angular modules 
               'ngAnimate',        
               'ngCookies',
               'ngRoute',         
               'ngSanitize',       
               'ngMessages',
               'ngDialog',

               // 3rd Party Modules
               'ui.bootstrap',     
               'toaster',
               'uiGmapgoogle-maps',
            ]);

             app.run(['$route', function ($route) {
                
            }]);

            require([
                'config',
                'config.route',
                'views/layout/shell',
                'views/component/spinner/spinner',
                'views/component/notify/notify',
                'views/component/sessionservice',
                'views/directives/startupdirectives'
            ], function () {
                angular.element(document).ready(function () {
                    return angularAMD.bootstrap(app);
                });
            });
        })();
    });
