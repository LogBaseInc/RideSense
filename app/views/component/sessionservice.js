define(['angular'], function (angular) {
    (function () {
        'use strict';
        var module = angular.module('rideSenseApp');
        module.factory('sessionservice', ['$rootScope', sessionservice]);

        function sessionservice($rootScope) {
            var userIdentity = getSession();

            return {
                clear: clear,
                isLoggedIn: isLoggedIn,
                setSession: setSession,
                getSessionUid : getSessionUid
            };

            function clear() {
                sessionStorage.clear();
                sessionStorage.setItem('loginstatus', false);
                userIdentity = null;
                $rootScope.$emit('login:status', {isloggedIn:false});
                $('body').addClass('login-layout light-login');
            }
           
            function isLoggedIn() {
                return sessionStorage.getItem('loginstatus');
            }

            function setSession(authdata) {
                userIdentity = authdata;
                sessionStorage.setItem('loginstatus', true);
                sessionStorage.setItem('useridentity', angular.toJson(userIdentity, true));
                $rootScope.$emit('login:status', {isloggedIn:true});
                $('body').removeClass('login-layout light-login');
            }

             function getSession() {
                var session = null;
                var user = sessionStorage.getItem('useridentity');
                if (user)
                    session = angular.fromJson(user);                
                return session
            }

            function getSessionUid() {
                var user = sessionStorage.getItem('useridentity');
                if(user)
                    return angular.fromJson(user).uid;
                else
                    return null; 
            }
        }

    })();
});