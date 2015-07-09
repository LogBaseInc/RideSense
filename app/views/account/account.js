define(['angular',
    'config.route',
    'views/account/devices/devices',
    'views/account/device/device'], function (angular, configroute) {
    (function () {

        configroute.register.controller('account', ['$rootScope', account]);
        function account() {
            $rootScope.routeSelection = '';
        }
    })();
});