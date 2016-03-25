define(['angular', 'config.route'], function (angular, configroute) {
    (function () {
        'use strict';
        var serviceId = 'orderservice';
        configroute.register.factory(serviceId, ['$http', '$q', 'config', orderservice]);

        function orderservice($http, $q, config) {
            var apiurl = config.customerapiUrl;
            var service = {
                saveOrder: saveOrder,
            };
            return service;

            function saveOrder(orders, token) {
                return $http({
                    method: 'POST',
                    url: apiurl + 'orders/batch/' + token,
                    data: orders
                }).then(function (response) {
                    return response.data;
                }, function (error) {
                    return $q.reject(error);
                });
            }
        }
    })();
});