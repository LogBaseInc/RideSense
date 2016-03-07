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
            LogglyLoggerProvider.inputToken('7b9f6d3d-01ed-45c5-b4ed-e8d627764998')
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
                     url: '/detail',
                     config: {
                         templateUrl: 'views/layout/decidepage.html',
                         title: 'live',
                         controllerUrl: 'views/layout/decidepage',
                         allowAnonymous: true
                     }
                 },
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
                     url: '/tracking',
                     config: {
                         templateUrl: 'views/live/live.html',
                         title: 'tracking',
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
                         templateUrl: 'views/activity/activity.html',
                         title: 'activity',
                         controllerUrl: 'views/activity/activity',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/trip/:selectedcar?',
                     config: {
                         templateUrl: 'views/activity/tripdetail/tripdetail.html',
                         title: 'trip',
                         controllerUrl: 'views/activity/tripdetail/tripdetail',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/activity/detail/:devicenumber/:carnumber',
                     config: {
                         templateUrl: 'views/activity/agentmap/agentmap.html',
                         title: 'detail',
                         controllerUrl: 'views/activity/agentmap/agentmap',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/account/delete/:email',
                     config: {
                         templateUrl: 'views/account/delete/deleteaccount.html',
                         title: 'detail',
                         controllerUrl: 'views/account/delete/deleteaccount',
                         allowAnonymous: false
                     }
                 },
                
                 {
                     url: '/orders',
                     config: {
                         templateUrl: 'views/orders/orders.html',
                         title: 'orders',
                         controllerUrl: 'views/orders/orders',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/order',
                     config: {
                         templateUrl: 'views/orders/order.html',
                         title: 'orders',
                         controllerUrl: 'views/orders/order',
                         allowAnonymous: false
                     }
                 },
                 {
                     url: '/orders/upload',
                     config: {
                         templateUrl: 'views/orders/uploadorders.html',
                         title: 'uploadorders',
                         controllerUrl: 'views/orders/uploadorders',
                         allowAnonymous: false,
                     }
                 },
                 {
                     url: '/account/items',
                     config: {
                         templateUrl: 'views/products/products.html',
                         title: 'items',
                         controllerUrl: 'views/products/products',
                         allowAnonymous: false,
                     }
                 },
                 {
                     url: '/account/item',
                     config: {
                         templateUrl: 'views/products/product.html',
                         title: 'items',
                         controllerUrl: 'views/products/product',
                         allowAnonymous: false,
                     }
                 },
                 {
                     url: '/account/items/upload',
                     config: {
                         templateUrl: 'views/products/uploadproducts.html',
                         title: 'items',
                         controllerUrl: 'views/products/uploadproducts',
                         allowAnonymous: false,
                     }
                 },
            ];

            return routs;
        }
        return app;
    });

