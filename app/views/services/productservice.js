define(['angular', 'config.route'], function (angular, configroute) {
    (function () {
        'use strict';
        var serviceId = 'productservice';
        configroute.register.factory(serviceId, ['$http', '$q', '$log', 'config', productservice]);

        function productservice($http, $q, $log, config) {
            var url = config.customerapiUrl;
            var service = {
                getProductsBrief: getProductsBrief,
                getProductsDetail : getProductsDetail,
                deleteProduct : deleteProduct,
                saveProducts : saveProducts,
                updateProuctsInvetory : updateProuctsInvetory
            };
            return service;

            function getProductsBrief(accountid) {
              var urlstr = url + 'products/brief/'+accountid;
              return $http.get(urlstr)
                 .then(function (response) {
                     return response.data;
                 }, function (error, code) {
                    $log.error(urlstr +" Error :" + error);
                    return $q.reject(error);
              });
            }

            function getProductsDetail(accountid) {
              var urlstr = url + 'products/'+accountid;
              return $http.get(urlstr)
                 .then(function (response) {
                     return response.data;
                }, function (error, code) {
                    $log.error(urlstr +" Error :" + error);
                    return $q.reject(error);
                });
            }

            function deleteProduct(accountid, uuid) {
              var urlstr = (url + 'products/'+accountid +'/'+ uuid);
              return $http({
                    url: urlstr,
                    method: "DELETE"
                })
                .then(function(response) {
                    return response.data;
                }, function(error, code) {
                    $log.error(urlstr +" Error :" + error);
                    return $q.reject(error);
                });
            }


            function saveProducts(accountid, products) {
                var urlstr =  url + 'products/'+accountid;
                return $http({
                    url: urlstr,
                    method: "POST",
                    data: products
                })
                .then(function(response) {
                    return response.data;
                }, function(error, code) {
                    $log.error(urlstr +" Error :" + error);
                    return $q.reject(error);
                });
            }

            function updateProuctsInvetory(accountid, inventories) {
                var urlstr =  url + 'products/update/'+accountid;
                return $http({
                    url: urlstr,
                    method: "POST",
                    data: inventories
                })
                .then(function(response) {
                    return response.data;
                }, function(error, code) {
                    $log.error(urlstr +" Error :" + error);
                    return $q.reject(error);
                });
            }
        }
    })();
});