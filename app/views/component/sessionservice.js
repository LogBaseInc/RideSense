define(['angular', 'utility'], function (angular) {
    (function () {
        var module = angular.module('rideSenseApp');
        module.factory('sessionservice', ['$rootScope', 'config', 'utility', sessionservice]);

        function sessionservice($rootScope, config, utility) {
            var userIdentity = getSession();
            var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

            return {
                clear: clear,
                isLoggedIn: isLoggedIn,
                setSession: setSession,
                getAccountDevices : getAccountDevices,
                getSessionExpiry : getSessionExpiry,
                getaccountId : getaccountId,
                getDevices : getDevices,
                getRole : getRole,
                setAccountName : setAccountName,
                getAccountName : getAccountName,
            };
            
            function getDevices() {
                var ref = new Firebase(config.firebaseUrl+'accounts/'+getaccountId()+'/devices');
                ref.on("value", function(snapshot) {
                    localStorage.setItem('devices', angular.toJson(snapshot.val(), true));
                }, function (errorObject) {
                    console.log("The devices read failed: " + errorObject.code);
                });
            }

            function clear() {
                localStorage.clear();
                localStorage.setItem('loginstatus', 'false');
                /*userIdentity = null;
                $rootScope.$emit('login:status', {isloggedIn:false});
                localStorage.setItem('accountid', null);
                localStorage.setItem('devices', null);
                localStorage.setItem('useridentity', null);
                localStorage.setItem('selecteddevice', null);
                localStorage.setItem('accountname', null);
                localStorage.setItem('role', true);*/

                $('body').addClass('login-layout light-login');
            }
           
            function isLoggedIn() {
                return localStorage.getItem('loginstatus');
            }

            function setSession(authdata, accountId) {
                userIdentity = authdata;
                localStorage.setItem('loginstatus', 'true');
                localStorage.setItem('useridentity', angular.toJson(userIdentity, true));
                localStorage.setItem('accountid', accountId);
                getDevices();
                setRole();
                $rootScope.$emit('login:status', {isloggedIn:'true'});
                $('body').removeClass('login-layout light-login');
            }

            function getaccountId() {
                return  localStorage.getItem('accountid');
            }

            function getSession() {
                var session = null;
                var user = localStorage.getItem('useridentity');
                if (user)
                    session = angular.fromJson(user);                
                return session
            }

            function getSessionExpiry() {
                var user = localStorage.getItem('useridentity');
                if(user)
                    return angular.fromJson(user).expires;
                else
                    return null; 
            }

            function getAccountDevices() {
                var devices = localStorage.getItem('devices');
                if (devices)
                    devices = angular.fromJson(devices);                
                return (devices == null ? [] : devices);
            }

            function setRole() {
                var username = getEncodedusername();
                if(username) {
                    var adminfbref = new Firebase(config.firebaseUrl+'accounts/'+getaccountId()+'/users/'+username+'/admin');
                    adminfbref.once("value", function(snapshot) {
                        var isadmin = snapshot.val() != null ? snapshot.val() : true;
                        localStorage.setItem('role', isadmin);
                        $rootScope.$emit('login:role', {role: isadmin});

                    }, function(errorObject) {
                        console.log("The admin role read failed: " + errorObject.code);
                    });
                }
            }

            function getEncodedusername() {
                var session = null;
                var user = localStorage.getItem('useridentity');
                if (user)
                    session = angular.fromJson(user);                
                return session != null ? utility.getEncodeString(session.password.email) : null;
            }

            function getRole() {
                var role = localStorage.getItem('role');
                return role != null ? (role == 'true' ? true : false) : true;
            }


            function setAccountName(name) {
                localStorage.setItem('accountname', name);
            }

            function getAccountName() {
                return localStorage.getItem('accountname');
            }
         }
    })();
});