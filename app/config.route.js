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
                     url: '/cars/:selectedcar?',
                     config: {
                         templateUrl: 'views/cars/cardetails.html',
                         title: 'cars',
                         controllerUrl: 'views/cars/cardetails',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/car/trip',
                     config: {
                         templateUrl: 'views/cars/tripdetail/tripdetail.html',
                         title: 'trip',
                         controllerUrl: 'views/cars/tripdetail/tripdetail',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/car/detail',
                     config: {
                         templateUrl: 'views/cars/carmap/carmap.html',
                         title: 'detail',
                         controllerUrl: 'views/cars/carmap/carmap',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/account/users',
                     config: {
                         templateUrl: 'views/account/users/users.html',
                         title: 'detail',
                         controllerUrl: 'views/account/users/users',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/account/user',
                     config: {
                         templateUrl: 'views/account/users/user.html',
                         title: 'detail',
                         controllerUrl: 'views/account/users/user',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/user/activate/:accountId/:email',
                     config: {
                         templateUrl: 'views/account/users/activateuser.html',
                         title: 'detail',
                         controllerUrl: 'views/account/users/activateuser',
                         allowAnonymous: true
                     }
                 },
            ];

            return routs;
        }
        return app;
    });

