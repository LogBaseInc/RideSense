define(['angular', 'config.route'], function (angular, configroute) {
    (function () {
        'use strict';
        var serviceId = 'orderservice';
        configroute.register.factory(serviceId, ['$http', '$q', 'config', '$log', 'sessionservice', orderservice]);

        function orderservice($http, $q, config, $log, sessionservice) {
            var apiurl = config.customerapiUrl;
            var accountid = sessionservice.getaccountId();
            var service = {
                saveOrder: saveOrder,
                updateOrderCount : updateOrderCount
            };
            return service;

            function saveOrder(orders, token) {
                var orderid = orders.length > 1 ? '' : orders[0].order_id;
                return $http({
                    method: 'POST',
                    url: apiurl + 'orders/batch/' + token,
                    data: orders
                }).then(function (response) {
                    $log.info({ordernumber:orderid, tags:['stick', 'order', 'ui', 'order_success', accountid], error: false});
                    return response.data;
                }, function (error) {
                    $log.error({ordernumber: orderid, tags:['stick', 'order', 'ui', 'order_error', accountid], error: angular.toJson(error)});
                    return $q.reject(error);
                });
            }

            function updateOrderCount(accountid) {
              var urlstr = apiurl + 'analytics/update/ordercount/'+accountid;
              return $http.get(urlstr)
                 .then(function (response) {
                     return response.data;
                 }, function (error, code) {
                    $log.error(urlstr +" Error :" + error);
                    return $q.reject(error);
              });
            }
        }
    })();
});