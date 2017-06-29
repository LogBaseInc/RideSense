define(['angular', 'config.route'], function (angular, configroute) {
    (function () {
        'use strict';
        var serviceId = 'customerservice';
        configroute.register.factory(serviceId, ['$http', '$q', '$log', 'config', customerservice]);

        function customerservice($http, $q, $log, config) {
            var url = config.customerapiUrl;
            var service = {
                getAll : getAll,
                getAllMobileNumbers: getAllMobileNumbers,
                getAddressbyMobile : getAddressbyMobile,
                saveCustomer : saveCustomer
            };
            return service;

            function getAll(accountid) {
              var urlstr = url + 'customers/'+accountid;
              return $http.get(urlstr)
                 .then(function (response) {
                     return response.data;
                 }, function (error, code) {
                    $log.error(urlstr +" Error :" + error);
                    return $q.reject(error);
              });
            }

            function getAllMobileNumbers(accountid) {
              var urlstr = url + 'customers/mobilenos/'+accountid;
              return $http.get(urlstr)
                 .then(function (response) {
                     return response.data;
                 }, function (error, code) {
                    $log.error(urlstr +" Error :" + error);
                    return $q.reject(error);
              });
            }

            function getAddressbyMobile(accountid, mobilenumber) {
              var urlstr = url + 'customers/'+accountid+'/'+mobilenumber;
              return $http.get(urlstr)
                 .then(function (response) {
                     return response.data;
                }, function (error, code) {
                    $log.error(urlstr +" Error :" + error);
                    return $q.reject(error);
                });
            }

            function saveCustomer(accountid, mobile, name, address, zip) {
                var urlstr = url + 'customers/'+accountid;
                $http({
                    url: urlstr,
                    method: "POST",
                    data: {mobile_number: mobile.toString(), name: name, address: address, 
                           zip: (zip != null && zip != undefined && zip != "") ? zip.toString() : ""}
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