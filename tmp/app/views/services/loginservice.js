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
                signup : signup,
                changepassword : changepassword,
                removeuser : removeuser
            };
            return service;

            
            function login(email, password) {
              var dfd =  $q.defer();
              firebase.authWithPassword({
                email    : email,
                password : password
              }, function(error, authData) {
                if(error)
                  dfd.reject(error);
                else
                  dfd.resolve(authData);
              });
              return dfd.promise;
            }

            function resetpasswordlink(email) {
              var dfd = $q.defer();
              firebase.resetPassword({
                  email : email
                }, function(error) {
                if (error) 
                  return dfd.reject(error);
                else 
                  return dfd.resolve();
              });
              return dfd.promise;
            }

            function signup(email, password) {
              var dfd = $q.defer();
              firebase.createUser({
                email    : email,
                password : password
              },  function(error, userData) {
                if (error) 
                  return dfd.reject(error);
                else 
                  return dfd.resolve(userData);
              });
              return dfd.promise;
            }

            function changepassword(email, oldpassword, newpassword) {
                var dfd = $q.defer();
                firebase.changePassword({
                  email: email,
                  oldPassword: oldpassword,
                  newPassword: newpassword
                }, function(error) {
                  if (error) 
                     return dfd.reject(error);
                  else 
                     return dfd.resolve();
                });
                return dfd.promise;
            }

            function removeuser(email, password) {
                var dfd = $q.defer();
                firebase.removeUser({
                  email: email,
                  password: password,
                }, function(error) {
                  if (error) 
                     return dfd.reject(error);
                  else 
                     return dfd.resolve();
                });
                return dfd.promise;
              }
          }
    })();
});
