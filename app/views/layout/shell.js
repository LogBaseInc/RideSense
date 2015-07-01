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

            activate();
            function activate() {

                alertsfbref.on("value", function(snapshot) {
                    var data = snapshot.val();
                    if(data !== null) {
                        if(vm.alerts != null) {
                            for(var i=0; i < data.length; i++) {
                                if(_.filter(vm.alerts, function(alert){ return alert.alertid == data[i].alertid}).length == 0) {
                                    if(data[i].status == 'Open') {
                                        notify.error('Car #'+data[i].devicenumber+": "+ getAlertText(data[i].alerttype));
                                    }
                                }
                            }
                        }
                    }

                    vm.alerts = data === null ? [] : data;
                    vm.openAlertsCount = _.filter(data, function(alert){ return alert.status == 'Open'}).length;
                    $scope.$apply();

                }, function (errorObject) {
                    console.log("The alerts read failed: " + errorObject.code);
                });
            }

            function getAlertText(alertType) {
                var alerttext = '';
                if(alertType == 'Panic')
                    alerttext = 'Panic button pressed';
                else if (alertType == 'AccidentProne')
                    alerttext = 'Accident prone driving';
                else if (alertType == 'Crashed')
                    alerttext = 'Car crashed';
                return alerttext;
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