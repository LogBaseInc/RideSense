define(['angular',
    'angularAMD'], function (
        angular,
        angularAMD) {

        var app = angular.module('rideSenseApp');

        // Collect the routes
        app.constant('routes', getRoutes());

        app.run(['$templateCache', function ($templateCache) {
            app.$templateCache = $templateCache;
        }]);

        app.config(function(uiGmapGoogleMapApiProvider) {
            uiGmapGoogleMapApiProvider.configure({
                key: 'AIzaSyD0aOSSRwYlmV586w1uIPaOxGIV-6123LU',
                v: '3.17',
                libraries: 'weather,geometry,visualization'
            });
        });

        // Configure the routes and route resolvers
        app.config(['$routeProvider', 'routes', '$controllerProvider', '$compileProvider', '$filterProvider', '$provide', '$httpProvider', routeConfigurator]);

        function routeConfigurator($routeProvider, routes, $controllerProvider, $compileProvider, $filterProvider, $provide, $httpProvider) {
            $httpProvider.defaults.cache = false;
            app.register =
            {
                controller: $controllerProvider.register,
                directive: $compileProvider.directive,
                filter: $filterProvider.register,
                factory: $provide.factory,
                service: $provide.service
            };

            routes.forEach(function (r) {
                var definition = r.config;
                $routeProvider.when(r.url, angularAMD.route(r.config));
                definition.resolve = angular.extend(definition.resolve || {}, {});
                $routeProvider.when(r.url, definition);
                return $routeProvider;
            });
            $routeProvider.otherwise({ redirectTo: '/login' });
        }

        // Define the routes 
        function getRoutes() {
            var routs = [
                 {
                     url: '/login',
                     config: {
                         templateUrl: 'views/login/login.html',
                         title: 'login',
                         controllerUrl: 'views/login/login',
                         allowAnonymous: true
                     }
                 },
                 {
                     url: '/account',
                     config: {
                         templateUrl: 'views/account/account.html',
                         title: 'account',
                         controllerUrl: 'views/account/account',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/live',
                     config: {
                         templateUrl: 'views/live/live.html',
                         title: 'live',
                         controllerUrl: 'views/live/live',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/alerts',
                     config: {
                         templateUrl: 'views/alerts/alerts.html',
                         title: 'alerts',
                         controllerUrl: 'views/alerts/alerts',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/metrics/cars',
                     config: {
                         templateUrl: 'views/metrics/cars/carmetrics.html',
                         title: 'alerts',
                         controllerUrl: 'views/metrics/cars/carmetrics',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/metrics/trips',
                     config: {
                         templateUrl: 'views/metrics/trips/tripmetrics.html',
                         title: 'alerts',
                         controllerUrl: 'views/metrics/trips/tripmetrics',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/report',
                     config: {
                         templateUrl: 'views/tripreport/tripreport.html',
                         title: 'alerts',
                         controllerUrl: 'views/tripreport/tripreport',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/alertdetail',
                     config: {
                         templateUrl: 'views/alerts/alertdetail/alertdetails.html',
                         title: 'alerts',
                         controllerUrl: 'views/alerts/alertdetail/alertdetails',
                         allowAnonymous: false
                     }
                 }
            ];

            return routs;
        }
        return app;
    });

