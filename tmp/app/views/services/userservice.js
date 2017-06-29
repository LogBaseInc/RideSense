define(['angular', 'config.route'], function (angular, configroute) {
    (function () {
        'use strict';
        var serviceId = 'userservice';
        configroute.register.factory(serviceId, ['$http', '$q', 'config', userservice]);

        function userservice($http, $q, config) {
            var apiurl = config.apiUrl;
            var service = {
                sendUserInviteEmail: sendUserInviteEmail,
                sendUserVerifyEmail : sendUserVerifyEmail
            };
            return service;

            function sendUserInviteEmail(email, account, url) {
                var data ={};
                data.email = email;
                data.account = account;
                data.url = url;

                return $http({
                    method: 'POST',
                    url: apiurl + 'user/invite',
                    data: angular.toJson(data, true)
                }).then(function (response) {
                    return response.data;
                }, function (error) {
                    return $q.reject(error);
                });
            }

            function sendUserVerifyEmail(email, account, url) {
                var data ={};
                data.email = email;
                data.account = account;
                data.url = url;

                return $http({
                    method: 'POST',
                    url: apiurl + 'user/verify',
                    data: angular.toJson(data, true)
                }).then(function (response) {
                    return response.data;
                }, function (error) {
                    return $q.reject(error);
                });
            }
        }
    })();
});