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
                getSessionUid : getSessionUid,
                setAlertsLocation : setAlertsLocation,
                getAlertsLocation : getAlertsLocation
            };

            function clear() {
                //sessionStorage.clear();
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

            function setAlertsLocation(data) {
                sessionStorage.setItem('alertlocation', angular.toJson(data, true));
            }

            function getAlertsLocation(data) {
                var alertslocation = [];
                var alertslocation = sessionStorage.getItem('alertlocation');
                if (alertslocation)
                    alertslocation = angular.fromJson(alertslocation); 
                else
                    alertslocation = [];               
                return alertslocation            
            }
        }

    })();
});