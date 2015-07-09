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
            var alertsfbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/alerts');
            vm.offline = false;
            vm.reconnect = false;
            vm.notnet = false;
            vm.online = false;
            vm.logout = logout;
            var timer;

            activate();

            function activate() { 
                checkinternetstatus();
                readalerts();
                checkexpiry();
            }

            $rootScope.$on('alertcount', function (event, data) {
                alertsfbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/alerts');
                readalerts();
            });

            function readalerts() {
                alertsfbref.on("value", function(snapshot) {
                    var data = snapshot.val();
                    vm.openAlertsCount = 0;
                    if(data !== null) {
                        for(var property in data) {
                            if(vm.alerts != null && property != undefined && vm.alerts[property] != property) {
                                if(property.status == 'Open' && vm.isloggedIn) {
                                    notify.error('Car #555: '+ getAlertText(data[property].alerttype));
                                }
                            }
                            if(data[property].status == 'Open')
                                vm.openAlertsCount = vm.openAlertsCount+1;
                        }
                    }

                    vm.alerts = data === null ? {} : data;
                    sessionservice.applyscope($scope);

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

            function logout(){
                sessionservice.clear();
                vm.isloggedIn = false;
                vm.loadSpinner = false;
                $location.path('/login');
                var ref = new Firebase(config.firebaseUrl);
                ref.unauth();
                ref.off();
                if(timer !=undefined && timer != null)
                    clearTimeout(timer);
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
                sessionservice.applyscope($scope);
            }

            function isOffline () {
                vm.online = false;
                vm.offline = true;
                vm.reconnect = false;
                vm.notnet = true;
                sessionservice.applyscope($scope);

                setTimeout(function(){
                    vm.reconnect = true;
                    vm.notnet = false;
                    sessionservice.applyscope($scope);
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

            timer = setInterval(checkexpiry, 1000);
            function checkexpiry() {
                if(sessionservice.isLoggedIn() == 'true') {
                    if(new Date() > new Date((sessionservice.getSessionExpiry())*1000)) {
                        notify.warning('Session expired. Please login');
                        logout();
                    }
                }
            }

            $(document).on('click','.navbar-collapse.in',function(e) {
                if( $(e.target).is('a') ) {
                    $(this).collapse('hide');
                }
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