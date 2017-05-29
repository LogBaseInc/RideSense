define(['angular'], function (angular) {
    (function () {
        'use strict';
        var module = angular.module('rideSenseApp');
        module.factory('notify', ['toaster', notify]);

        function notify(toaster) {
            var service = {
                success: success,
                error: error,   
                warning : warning,
                info :info        
            };
            return service;

            function success(message) {
               toaster.pop({
                    type: 'success',
                    body: message,
                    showCloseButton: true
                }); 
            }

            function error(message) {
               toaster.pop({
                    type: 'error',
                    body: message,
                    showCloseButton: true
                }); 
            }

            function warning(message) {
               toaster.pop({
                    type: 'warning',
                    body: message,
                    showCloseButton: true
                }); 
            }

            function info(message) {
               toaster.pop({
                    type: 'note',
                    body: message,
                    showCloseButton: true
                }); 
            }
        }
    })();
});
