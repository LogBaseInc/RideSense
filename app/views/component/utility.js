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
                getVehicleImageUrl : getVehicleImageUrl,
                setGoogleMapConfig : setGoogleMapConfig,
                IsDesktop : IsDesktop,
                getTime1 : getTime1,
                getTime2 : getTime2,
                getTimeInMins : getTimeInMins,
                getOrderSelected : getOrderSelected,
                setOrderSelected : setOrderSelected,
                getDateFromString : getDateFromString
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
                if(date != null && date != undefined && date != "null") {
                    if(date.length > 10)
                        return new Date(date);
                    else {
                        var parts = date.split('/');
                        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
                    }
                }
                else
                    return null;
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

            function getOrderSelected() {
                var selectedorder = sessionStorage.getItem('selectedorder');
                if (selectedorder)
                    selectedorder = angular.fromJson(selectedorder);
                return selectedorder                
            }

            function setOrderSelected(order) {
                sessionStorage.setItem('selectedorder', (order != null ? angular.toJson(order, true) : null));
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
                $log.error(message + ((errorObject != null && errorObject != undefined) ? errorObject.code : ""));
                if(errorObject != null && errorObject != undefined && errorObject.code == 'PERMISSION_DENIED')
                    $rootScope.$emit('logout');
            }

            function getVehicleImageUrl(devicetype, isIdle) {
                var imageUrl = ''
                if(devicetype == 'car' && isIdle == true)
                    imageUrl = 'assets/images/car-moving.png';
                else if(devicetype == 'car' && isIdle == false)
                    imageUrl = 'assets/images/car-moving.png';
                else if(devicetype == 'bike' && isIdle == true)
                    imageUrl = 'assets/images/bike-moving.png';
                else if(devicetype == 'bike' && isIdle == false)
                    imageUrl = 'assets/images/bike-moving.png';
                /*else if(devicetype == 'person' && isIdle == true)
                    imageUrl = 'assets/images/person_idle.png';
                 else if(devicetype == 'person' && isIdle == false)
                    imageUrl = 'assets/images/person_moving.png';*/
                else if(devicetype == 'other')
                     imageUrl = 'assets/images/otherlive.png';
                return imageUrl;
            }

            function setGoogleMapConfig() {
                var app = angular.module('rideSenseApp');
                app.config(function(uiGmapGoogleMapApiProvider) {
                    uiGmapGoogleMapApiProvider.configure({
                        key: 'AIzaSyD0aOSSRwYlmV586w1uIPaOxGIV-6123LU',
                        v: '3.17',
                        libraries: 'weather,geometry,visualization'
                    });
                });
            }

            function IsDesktop() {
                if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
                    return false;               
                else
                    return true;
            }

             function getTime1(value) {
                var hours1 = Math.floor(value / 60);
                var minutes1 = value - (hours1 * 60);

                if (hours1.length == 1) hours1 = '0' + hours1;
                if (minutes1.length == 1) minutes1 = '0' + minutes1;
                if (minutes1 == 0) minutes1 = '00';
                if (hours1 >= 12) {
                    if (hours1 == 12) {
                        hours1 = hours1;
                        minutes1 = minutes1 + " PM";
                    } else {
                        hours1 = hours1 - 12;
                        minutes1 = minutes1 + " PM";
                    }
                } else {
                    hours1 = hours1;
                    minutes1 = minutes1 + " AM";
                }
                if (hours1 == 0) {
                    hours1 = 12;
                    minutes1 = minutes1;
                }
                return (hours1 + ':' + minutes1);
            }

            function getTime2(value) {
                var hours2 = Math.floor(value / 60);
                var minutes2 = value - (hours2 * 60);

                  if (hours2.length == 1) hours2 = '0' + hours2;
                  if (minutes2.length == 1) minutes2 = '0' + minutes2;
                  if (minutes2 == 0) minutes2 = '00';
                  if (hours2 >= 12) {
                      if (hours2 == 12) {
                          hours2 = hours2;
                          minutes2 = minutes2 + " PM";
                      } else if (hours2 == 24) {
                          hours2 = 11;
                          minutes2 = "59 PM";
                      } else {
                          hours2 = hours2 - 12;
                          minutes2 = minutes2 + " PM";
                      }
                  } else {
                      hours2 = hours2;
                      minutes2 = minutes2 + " AM";
                }
                return (hours2 + ':' + minutes2);
            }

            function getDateFromString(date) {
               var dsplit = date.split("/");
               return new Date(dsplit[2],dsplit[1]-1,dsplit[0]); 
            }

            function getTimeInMins(value) {
                var timesplit = value.split(':');
                var isPM = (timesplit[0]>=1 && timesplit[0]<12) && value.indexOf('PM')>=0;

                return  (isPM ? ((12 + parseInt(timesplit[0])) *60) : (parseInt(timesplit[0]) *60)) + (parseFloat("0."+timesplit[1]) *60);
            }
         }
    })();
});