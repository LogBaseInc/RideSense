define(['angular',
    'config.route',
    'views/services/loginservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('activateuser', ['$rootScope', '$routeParams', '$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'loginservice', activateuser]);
        function activateuser($rootScope, $routeParams, $scope, $location, config, notify, spinner, sessionservice, loginservice) {
            var submitted = false;
            var vm = this;
            var accountId;
            vm.repeatpwderror= false;

            Object.defineProperty(vm, 'canactivate', {
                get: canactivate
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate() {
                sessionservice.clear();
                vm.email = sessionservice.getDecodeString($routeParams.email);
                accountId = sessionservice.getDecodeString($routeParams.accountId);
            }

            function canactivate() {
                if($scope.signupform.$valid)
                {
                    if(vm.password != null && vm.password != undefined &&
                       vm.repeatpassword != null && vm.repeatpassword != undefined)
                    {
                        if(vm.password !== vm.repeatpassword)
                            vm.repeatpwderror = true;
                        else
                            vm.repeatpwderror = false;
                    }
                }
                return $scope.signupform.$valid && !submitted && !vm.repeatpwderror;
            }

            vm.activate = function () {
                submitted = true;
                spinner.show();
                loginservice.signup('kalaivanisrec@gmail.com', vm.password).then(signupcompleted, signupfailed)
            }

            function signupcompleted(userData) {
                var usersref = new Firebase(config.firebaseUrl+'users/'+userData.uid+'/');
                usersref.set(accountId);

                var userref = new Firebase(config.firebaseUrl+'accounts/'+accountId + '/users/' +$routeParams.email+'/joined');
                userref.set(true);

                var userref1 = new Firebase(config.firebaseUrl+'accounts/'+accountId + '/users/' +$routeParams.email +'/joinedon');
                userref1.set(new Date().getTime());

                spinner.hide();
                submitted = false;
                notify.success('Activated successfully!');
                $location.path('/login');
            }

            function signupfailed(error) {
                spinner.hide();
                submitted = false;
                if(error.message.indexOf('The specified email address is already in use') >= 0) {
                    notify.error('Account already activated');
                    $location.path('/login');
                }
                else
                    notify.error('Activation failed, please try after some time');
            }
        }
    })();
});