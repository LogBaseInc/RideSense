define(['angular',
    'config.route',
    'views/services/loginservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('changepassword', ['$rootScope', '$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'loginservice', changepassword]);
        function changepassword($rootScope, $scope, $location, config, notify, spinner, sessionservice, loginservice) {
            var submitted = false;
            var email = ""
            var vm = this;
            vm.repeatpwderror= false;

            Object.defineProperty(vm, 'canchangepassword', {
                get: canchangepassword
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate() {
                var accountemailfbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/email');
                accountemailfbref.on("value", function(snapshot) {
                    email = snapshot.val();
                }, function (errorObject) {
                    console.log("The account name read failed: " + errorObject.code);
                });
            }

            function canchangepassword() {
                if($scope.passform.$valid)
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
                return $scope.passform.$valid && !submitted;
            }

            vm.changepassword = function () {
                submitted = true;
                spinner.show();
                loginservice.changepassword(email, vm.currentpassword, 'vm.password').then(changepasswordCompleted, changepasswordFailed);
            }

            function changepasswordCompleted() {
                submitted = false;
                spinner.hide();
                notify.success('Password changed successfully');
                $rootScope.$emit('logout');
            }

            function changepasswordFailed(error) {
                submitted = false;
                spinner.hide();
                switch (error.code) {
                    case "INVALID_PASSWORD":
                        notify.error("The current password is incorrect.");
                        break;
                    case "INVALID_USER":
                        notify.error("The specified user account does not exist.");
                        break;
                    default:
                        notify.error("Error changing password, please try after some time");
                }

            }
        }
    })();
});