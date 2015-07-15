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
                     url: '/account/devices',
                     config: {
                         templateUrl: 'views/account/devices/devices.html',
                         title: 'devices',
                         controllerUrl: 'views/account/devices/devices',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/account/device',
                     config: {
                         templateUrl: 'views/account/device/device.html',
                         title: 'device',
                         controllerUrl: 'views/account/device/device',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/account/detail',
                     config: {
                         templateUrl: 'views/account/detail/detail.html',
                         title: 'detail',
                         controllerUrl: 'views/account/detail/detail',
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
                         title: 'cars',
                         controllerUrl: 'views/metrics/cars/carmetrics',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/metrics/trips',
                     config: {
                         templateUrl: 'views/metrics/trips/tripmetrics.html',
                         title: 'trips',
                         controllerUrl: 'views/metrics/trips/tripmetrics',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/report',
                     config: {
                         templateUrl: 'views/tripreport/tripreport.html',
                         title: 'reports',
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
                 },
                 {
                     url: '/account/changepassword',
                     config: {
                         templateUrl: 'views/account/changepassword/changepassword.html',
                         title: 'changepassword',
                         controllerUrl: 'views/account/changepassword/changepassword',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/cars',
                     config: {
                         templateUrl: 'views/cars/cardetails.html',
                         title: 'cars',
                         controllerUrl: 'views/cars/cardetails',
                         allowAnonymous: false
                     }
                 },
            ];

            return routs;
        }
        return app;
    });

