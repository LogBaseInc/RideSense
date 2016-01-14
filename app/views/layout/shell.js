define(['angular'], function () {
    (function () {
        'use strict';

        var controllerId = 'shell';
        angular.module('rideSenseApp').controller(controllerId, ['$rootScope', '$scope', '$location', 'config', 'notify', 'sessionservice', 'utility', shell]);

        function shell($rootScope, $scope, $location, config, notify, sessionservice, utility) {
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
            vm.accountname = sessionservice.getAccountName();
            vm.isAdmin = sessionservice.getRole();
            //vm.showorders = sessionservice.getOrderTracking();
            var timer;

            activate();

            function activate() { 
                checkIfLoggedIn();

                checkinternetstatus();
                readalerts();
                checkexpiry();
                if(vm.isloggedIn == 'true') {
                    sessionservice.getDevices();
                }
            }

            /*$rootScope.$on('login:ordertracking', function(event, data) {
                vm.showorders = data.ordertracking;
            });*/

            $rootScope.$on('alertcount', function (event, data) {
                alertsfbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/alerts');

                var accountnamefbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/name');
                accountnamefbref.on("value", function(snapshot) {
                    vm.accountname = snapshot.val();
                    sessionservice.setAccountName(vm.accountname);
                    utility.applyscope($scope);
                }, function (errorObject) {
                });

                readalerts();
            });

            $rootScope.$on('logout', function() {
                logout();
            });

            $rootScope.$on('login:role', function(event, data) {
                vm.isAdmin = data.role;
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
                    utility.applyscope($scope);

                }, function (errorObject) {
                    //utility.errorlog("The alerts read failed: " , errorObject);
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
                var ref = new Firebase(config.firebaseUrl);
                ref.unauth();
                ref.off();
                if(timer !=undefined && timer != null)
                    clearTimeout(timer);
                analytics.track('Logged Out');
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
                utility.applyscope($scope);
            }

            function isOffline () {
                vm.online = false;
                vm.offline = true;
                vm.reconnect = false;
                vm.notnet = true;
                utility.applyscope($scope);

                setTimeout(function(){
                    vm.reconnect = true;
                    vm.notnet = false;
                    utility.applyscope($scope);
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
                        utility.applyscope($scope);
                        logout();
                    }
                }
            }

            $(document).on('click','.navbar-collapse.in',function(e) {
                if( $(e.target).is('a') ) {
                    $(this).collapse('hide');
                }
            });

            $rootScope.$on('$routeChangeStart', function (event, next, current) {
                vm.isloggedIn = sessionservice.isLoggedIn();
                var isAnonymous = false;
                if (next.$$route && next.$$route.allowAnonymous)
                    isAnonymous = next.$$route.allowAnonymous;
                if (!isAnonymous && vm.isloggedIn == 'false') {
                    event.preventDefault();
                    $rootScope.$evalAsync(function () {
                        $location.path('/login');
                    });
                 }
            });

            $rootScope.$on('$routeChangeSuccess', function (event, next, current) {
                analytics.page($location.$$path);
            });

            function checkIfLoggedIn() {
                var isactivate = $location.$$path.indexOf('/user/activate') >=0 ;
                var islogin = $location.$$path.indexOf('login') >=0 ;
                if(vm.isloggedIn == 'false' && !isactivate && !islogin) {
                    $location.path('/login');
                }
            }
        }
    })();
});