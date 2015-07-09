define(['angular'], function (angular) {
    (function () {
        'use strict';
        var module = angular.module('rideSenseApp');
        module.factory('sessionservice', ['$rootScope', 'config', sessionservice]);

        function sessionservice($rootScope, config) {
            var userIdentity = getSession();

            return {
                applyscope : applyscope,
                clear: clear,
                isLoggedIn: isLoggedIn,
                setSession: setSession,
                setAlertsLocation : setAlertsLocation,
                getAccountDevices : getAccountDevices,
                getAlertsLocation : getAlertsLocation,
                getSessionExpiry : getSessionExpiry,
                getaccountId : getaccountId,
                generateUUID : generateUUID
            };
            
            function getDevices() {
                var ref = new Firebase(config.firebaseUrl+'accounts/'+getaccountId()+'/devices');
                ref.on("value", function(snapshot) {
                    sessionStorage.setItem('devices', angular.toJson(snapshot.val(), true));
                }, function (errorObject) {
                    console.log("The devices read failed: " + errorObject.code);
                });
            }

            function applyscope($scope) {
                if ($scope.$root && $scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') 
                    $scope.$apply();
            }

            function clear() {
                //sessionStorage.clear();
                sessionStorage.setItem('loginstatus', false);
                userIdentity = null;
                $rootScope.$emit('login:status', {isloggedIn:false});
                sessionStorage.setItem('accountid', null);
                sessionStorage.setItem('devices', null);
                $('body').addClass('login-layout light-login');
            }
           
            function isLoggedIn() {
                return sessionStorage.getItem('loginstatus');
            }

            function setSession(authdata, accountId) {
                userIdentity = authdata;
                sessionStorage.setItem('loginstatus', true);
                sessionStorage.setItem('useridentity', angular.toJson(userIdentity, true));
                sessionStorage.setItem('accountid', accountId);
                getDevices();
                $rootScope.$emit('login:status', {isloggedIn:true});
                $('body').removeClass('login-layout light-login');
            }

            function getaccountId() {
                return  sessionStorage.getItem('accountid');
            }

            function getSession() {
                var session = null;
                var user = sessionStorage.getItem('useridentity');
                if (user)
                    session = angular.fromJson(user);                
                return session
            }

            function getSessionExpiry() {
                var user = sessionStorage.getItem('useridentity');
                if(user)
                    return angular.fromJson(user).expires;
                else
                    return null; 
            }

            function getAccountDevices() {
                var devices = sessionStorage.getItem('devices');
                if (devices)
                    devices = angular.fromJson(devices);                
                return (devices == null ? [] : devices);
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

            function generateUUID() {
                // http://www.ietf.org/rfc/rfc4122.txt
                var s = [];
                var hexDigits = "0123456789abcdef";
                for (var i = 0; i < 36; i++) {
                    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
                }
                s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
                s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
                s[8] = s[13] = s[18] = s[23] = "-";

                var uuid = s.join("");
                return uuid;

             }
         }

    })();
});