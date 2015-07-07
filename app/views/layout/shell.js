define(['angular'], function () {
    (function () {
        'use strict';

        var controllerId = 'shell';
        angular.module('rideSenseApp').controller(controllerId, ['$rootScope', '$scope', '$location', 'config', 'notify', 'sessionservice', shell]);

        function shell($rootScope, $scope, $location, config, notify, sessionservice) {
            var vm = this;
            vm.loadSpinner = false;
            vm.isloggedIn = sessionservice.isLoggedIn();
            vm.openAlertsCount = 0;
            vm.alerts = null;
            var alertsfbref = new Firebase(config.firebaseUrl+'account/'+sessionservice.getSessionUid()+'/alerts');
            vm.offline = false;
            vm.reconnect = false;
            vm.notnet = false;
            vm.online = false;

            checkinternetstatus();

            $rootScope.$on('alertcount', function (event, data) {
                activate();
            });

            activate();
            function activate() {

                alertsfbref.on("value", function(snapshot) {
                    var data = snapshot.val();
                    if(data !== null) {
                        if(vm.alerts != null) {
                            for(var i=0; i < data.length; i++) {
                                if(_.filter(vm.alerts, function(alert){ return alert.alertid == data[i].alertid}).length == 0) {
                                    if(data[i].status == 'Open') {
                                        notify.error('Car #555: '+ getAlertText(data[i].alerttype));
                                    }
                                }
                            }
                        }
                    }

                    vm.alerts = data === null ? [] : data;
                    vm.openAlertsCount = _.filter(data, function(alert){ return alert.status == 'Open'}).length;
                    applyscope();

                }, function (errorObject) {
                    console.log("The alerts read failed: " + errorObject.code);
                });
            }

           function getAlertText(alertType) {
                var alerttext = '';
                alertType = alertType.toLowerCase();
                if(alertType == 'panic')
                    alerttext = 'Panic button pressed';
                else if (alertType == 'accidentprone')
                    alerttext = 'Accident prone driving';
                else if (alertType == 'crashed')
                    alerttext = 'Car crashed';
                else if (alertType == 'plugged')
                    alerttext = 'Device plugged into car';
                else if (alertType == 'unplugged')
                    alerttext = 'Device unplugged from car';
                return alerttext;
            }

            function applyscope() {
                if ($scope.$root && $scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') 
                    $scope.$apply();
            }

            vm.logout = function(){
                sessionservice.clear();
                vm.isloggedIn = false;
                $location.path('/login');
            }

            $rootScope.$on('spinner:toggle', function (event, data) {
                vm.loadSpinner = data.isShow;
            });

            $rootScope.$on('login:status', function (event, data) {
                vm.isloggedIn = data.isloggedIn;
            });

            $rootScope.$on('login:status', function (event, data) {
                vm.isloggedIn = data.isloggedIn;
            });

            function isOnline () {
                vm.offline = false;
                vm.reconnect = false;
                vm.notnet = false;
                vm.online = true;
                applyscope();
            }

            function isOffline () {
                vm.online = false;
                vm.offline = true;
                vm.reconnect = false;
                vm.notnet = true;
                applyscope();

                setTimeout(function(){
                    vm.reconnect = true;
                    vm.notnet = false;
                    applyscope();
                }, 2000)
            };


            function checkinternetstatus () {
                if (window.addEventListener) {
                    /*
                        Works well in Firefox and Opera with the 
                        Work Offline option in the File menu.
                        Pulling the ethernet cable doesn't seem to trigger it.
                        Later Google Chrome and Safari seem to trigger it well
                    */
                    window.addEventListener("online", isOnline, false);
                    window.addEventListener("offline", isOffline, false);
                }
                else {
                    /*
                        Works in IE with the Work Offline option in the 
                        File menu and pulling the ethernet cable
                    */
                    document.body.ononline = isOnline;
                    document.body.onoffline = isOffline;
                }
            }

            // $scope.$on('$routeChangeStart', function (event, next, current) {
            //     var isAnonymous = false;
            //     if (next.$$route && next.$$route.allowAnonymous)
            //         isAnonymous = next.$$route.allowAnonymous;
            //     //alert(isAnonymous +' '+ vm.isLoggedIn)
            //     if (!isAnonymous && !vm.isLoggedIn) {
            //         event.preventDefault();
            //         $rootScope.$evalAsync(function () {
            //             $location.path('/login');
            //         });
            //     }
            // });
        }
    })();
});