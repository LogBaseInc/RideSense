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

        app.config( function( LogglyLoggerProvider ) {
            LogglyLoggerProvider.inputToken('437c82a2-019f-4d20-858a-7dda1dd5a134')
                                .includeUrl(true)
                                .includeTimestamp(true)
                                .sendConsoleErrors(true)
        });

        /*app.config(function(IdleProvider, KeepaliveProvider) {
            // configure Idle settings
            IdleProvider.idle(3600); // in seconds - 1hour (3600)
            IdleProvider.timeout(5); // in seconds
            KeepaliveProvider.interval(2); // in seconds
        })
        app.run(function(Idle){
            // start watching when the app runs. also starts the Keepalive service by default.
            Idle.watch();
        });*/

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
            $routeProvider.otherwise({ redirectTo: '/detail' });
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
                     url: '/user/activate/:accountId?/:email?',
                     config: {
                        templateUrl: 'views/account/users/activateuser.html',
                        title: 'detail',
                        controllerUrl: 'views/account/users/activateuser',
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
                     url: '/activity/:selectedcar?',
                     config: {
                         templateUrl: 'views/cars/cardetails.html',
                         title: 'cars',
                         controllerUrl: 'views/cars/cardetails',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/activity/trip/:carnumber',
                     config: {
                         templateUrl: 'views/cars/tripdetail/tripdetail.html',
                         title: 'trip',
                         controllerUrl: 'views/cars/tripdetail/tripdetail',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/activity/detail/:devicenumber/:carnumber',
                     config: {
                         templateUrl: 'views/cars/carmap/carmap.html',
                         title: 'detail',
                         controllerUrl: 'views/cars/carmap/carmap',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/account/delete/:email',
                     config: {
                         templateUrl: 'views/account/delete/deleteaccount.html',
                         title: 'detail',
                         controllerUrl: 'views/account/delete/deleteaccount',
                         allowAnonymous: true
                     }
                 },
                 {
                     url: '/detail',
                     config: {
                         templateUrl: 'views/layout/decidepage.html',
                         title: 'live',
                         controllerUrl: 'views/layout/decidepage',
                         allowAnonymous: true
                     }
                 },
                 {
                     url: '/account/verify/:accountId?',
                     config: {
                         templateUrl: 'views/login/verifyemail.html',
                         title: 'verifyemail',
                         controllerUrl: 'views/login/verifyemail',
                         allowAnonymous: true
                     }
                 },
                 {
                     url: '/orders',
                     config: {
                         templateUrl: 'views/orders/orders.html',
                         title: 'orders',
                         controllerUrl: 'views/orders/orders',
                         allowAnonymous: true
                     }
                 },
                 {
                     url: '/order',
                     config: {
                         templateUrl: 'views/orders/order.html',
                         title: 'orders',
                         controllerUrl: 'views/orders/order',
                         allowAnonymous: true
                     }
                 },
                 {
                     url: '/order/trip',
                     config: {
                         templateUrl: 'views/orders/ordertrip.html',
                         title: 'orders',
                         controllerUrl: 'views/orders/ordertrip',
                         allowAnonymous: true,
                     }
                 },
                 {
                     url: '/orders/upload',
                     config: {
                         templateUrl: 'views/orders/uploadorders.html',
                         title: 'uploadorders',
                         controllerUrl: 'views/orders/uploadorders',
                         allowAnonymous: true,
                     }
                 },
            ];

            return routs;
        }
        return app;
    });

