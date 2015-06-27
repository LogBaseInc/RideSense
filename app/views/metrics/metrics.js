define(['angular',
    'config.route',
    'views/account/metrics/cars/carsmetrics',
    'views/account/metrics/trips/tripmetric'], function (angular, configroute) {
    (function () {

        configroute.register.controller('metrics', ['$rootScope',metrics]);
        function metrics($rootScope) {
            $rootScope.routeSelection = 'metrics'

        }
    })();
});