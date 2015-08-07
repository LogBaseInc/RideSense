define(['angular'], function (angular) {
    (function () {
        var module = angular.module('rideSenseApp');
        module.factory('utility', ['$rootScope', '$log', 'config', utility]);

        function utility($rootScope, $log, config) {
            var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

            return {
                applyscope : applyscope,
                generateUUID : generateUUID,
                getDecodeString : getDecodeString,
                getEncodeString : getEncodeString,
                setAlertsLocation  : setAlertsLocation,
                getAlertsLocation : getAlertsLocation,
                setDeviceSelected : setDeviceSelected,
                getDeviceSelected : getDeviceSelected,
                setUserSelected : setUserSelected,
                getUserSelected : getUserSelected,
                setTripDate : setTripDate,
                getTripDate : getTripDate,
                getTripSelected : getTripSelected,
                setTripSelected : setTripSelected,
                closekeyboard : closekeyboard,
                scrollToTop : scrollToTop,
                errorlog : errorlog,
                getVehicleImageUrl : getVehicleImageUrl
            };
            
            function applyscope($scope) {
                if ($scope.$root && $scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') 
                    $scope.$apply();
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

            function getDecodeString (text) {
                Base64.encode('hello');
                return  Base64.decode(text);
            }

            function getEncodeString (text) {
                return  Base64.encode(text);
            }

            function setAlertsLocation(data) {
                sessionStorage.setItem('alertlocation', angular.toJson(data, true));
            }

            function getAlertsLocation() {
                var alertslocation = [];
                var alertslocation = sessionStorage.getItem('alertlocation');
                if (alertslocation)
                    alertslocation = angular.fromJson(alertslocation); 
                else
                    alertslocation = [];               
                return alertslocation            
            }

            function setDeviceSelected(device) {
                sessionStorage.setItem('selecteddevice', (device != null ? angular.toJson(device, true) : null));
            }

            function getDeviceSelected() {
                var selecteddevice = sessionStorage.getItem('selecteddevice');
                if (selecteddevice)
                    selecteddevice = angular.fromJson(selecteddevice);
                return selecteddevice                
            }

            function setUserSelected(user) {
                sessionStorage.setItem('selecteduser', (user != null ? angular.toJson(user, true) : null));
            }

            function getUserSelected() {
                var selecteduser= sessionStorage.getItem('selecteduser');
                if (selecteduser)
                    selecteduser = angular.fromJson(selecteduser);
                return selecteduser                
            }

            function setTripDate(date) {
                sessionStorage.setItem('tripdate', date);
            }

            function getTripDate() {
                var date = sessionStorage.getItem('tripdate');
                if(date)
                    date = new Date(date);
                return date;
            }

            function getTripSelected() {
                var selecteddtrip = sessionStorage.getItem('selecteddtrip');
                if (selecteddtrip)
                    selecteddtrip = angular.fromJson(selecteddtrip);
                return selecteddtrip                
            }

            function setTripSelected(trip) {
                sessionStorage.setItem('selecteddtrip', (trip != null ? angular.toJson(trip, true) : null));
            }

            function closekeyboard(element) {
                element.attr('readonly', 'readonly');
                element.attr('disabled', 'true');
                setTimeout(function() {
                    element.blur(); 
                    element.removeAttr('readonly');
                    element.removeAttr('disabled');
                }, 100);
            }

            function scrollToTop() {
                $("html, body").animate({ scrollTop: 0 }, "fast");
            }

            function errorlog(message, errorObject) {
                $log.error(message + errorObject ? errorObject.code : "");
                if(errorObject && errorObject.code == 'PERMISSION_DENIED')
                    $rootScope.$emit('logout');
            }

            function getVehicleImageUrl(devicetype, isIdle) {
                var imageUrl = ''
                if(devicetype == 'car' && isIdle == true)
                    imageUrl = 'assets/images/car-parked.png';
                else if(devicetype == 'car' && isIdle == false)
                    imageUrl = 'assets/images/car-moving.png';
                else if(devicetype == 'bike' && isIdle == true)
                    imageUrl = 'assets/images/bike-parked.png';
                else if(devicetype == 'bike' && isIdle == false)
                    imageUrl = 'assets/images/bike-moving.png';
                return imageUrl;
            }
         }
    })();
});