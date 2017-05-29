define(['angular', 'config.route'], function (angular, configroute) {
    (function () {
        'use strict';
        var serviceId = 'triphistory';
        configroute.register.factory(serviceId, ['$http', '$q', 'config', triphistory]);

        function triphistory($http, $q, config) {
            var url = config.apiUrl;
            var service = {
                getTripHistory: getTripHistory,

            };
            return service;

            function getTripHistory(device, from, to) {
              return $http.get(url + 'location/history/'+device+'?from='+from+'&to='+to)
                 .then(function (response) {
                     return response.data;
                 }, function (error, code) {
                     return $q.reject(error);
              });
            }
        }
    })();
});