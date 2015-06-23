define(['angular', 'config.route'], function (angular, configroute) {
    (function () {
        'use strict';
        var serviceId = 'loginservice';
        configroute.register.factory(serviceId, ['$q', 'config', login]);

        function login($q, config) {
            var firebase = new Firebase(config.firebaseUrl);

            var service = {
                login: login,
                resetpasswordlink : resetpasswordlink,
                signup : signup
            };
            return service;

            
            function login(email, password) {
                var dfd = jQuery.Deferred();
                firebase.authWithPassword({
                  email    : email,
                  password : password
                }, function(error, authData) {
                  if(error)
                    return dfd.reject(error);
                  else
                    return dfd.resolve(authData);
                },{
                  remember: "sessionOnly"                  
                });
                return dfd.promise();
            }

            function resetpasswordlink(email)
            {
              var dfd = jQuery.Deferred();
              firebase.resetPassword({
                  email : email
                }, function(error) {
                if (error) 
                  return dfd.reject(error);
                else 
                  return dfd.resolve();
              });
              return dfd.promise();
            }

            function signup(email, password)
            {
              var dfd = jQuery.Deferred();
              firebase.createUser({
                email    : email,
                password : password
              },  function(error) {
                if (error) 
                  return dfd.reject(error);
                else 
                  return dfd.resolve();
              });
              return dfd.promise();
            }

        }
    })();
});
