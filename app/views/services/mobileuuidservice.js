define(['angular', 'config.route'], function (angular, configroute) {
    (function () {
        'use strict';
        var serviceId = 'mobileuuidservice';
        configroute.register.factory(serviceId, ['$http', '$q', 'config', mobileuuidservice]);

        function mobileuuidservice($http, $q, config) {
            var url = config.apiUrl;
            var service = {
                getMobileUuid: getMobileUuid,

            };
            return service;

            function getMobileUuid(mobile, accountname) {
              return $http.get(url + 'mobile/uuid/'+mobile+'?account='+accountname)
                 .then(function (response) {
                     return response.data;
                 }, function (error, code) {
                     return $q.reject(error);
              });
            }
        }
    })();
});