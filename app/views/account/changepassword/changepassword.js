  define(['angular',
    'config.route',
    'lib',
    'views/services/loginservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('changepassword', ['$rootScope', '$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'loginservice', 'utility', changepassword]);
        function changepassword($rootScope, $scope, $location, config, notify, spinner, sessionservice, loginservice, utility) {
            var submitted = false;
            var vm = this;
            vm.email = ""
            vm.repeatpwderror= false;
            vm.isPasswordGood = false;

            Object.defineProperty(vm, 'canchangepassword', {
                get: canchangepassword
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate() {
                $rootScope.routeSelection = '';
                utility.scrollToTop();
                vm.email = sessionservice.getSession().password.email;
            }

            $rootScope.$on('passwordStrength', function(event, data) {
                vm.isPasswordGood = data.isGood;
            });

            function canchangepassword() {
                if(vm.isPasswordGood) {
                    if(vm.password != null && vm.password != undefined &&
                       vm.repeatpassword != null && vm.repeatpassword != undefined)
                    {
                        if(vm.password !== vm.repeatpassword)
                            vm.repeatpwderror = true;
                        else
                            vm.repeatpwderror = false;
                    }
                }
                return $scope.passform.$valid && !submitted && !vm.repeatpwderror && vm.isPasswordGood;
            }

            vm.cancel = function() {
                var role = sessionservice.getRole();
                if(role.isAdmin == true)
                    $location.path("/account/detail");
                else
                     $location.path("/orders");
            }

            vm.changepassword = function () {
                submitted = true;
                spinner.show();
                loginservice.changepassword(vm.email, vm.currentpassword, vm.password).then(changepasswordCompleted, changepasswordFailed);
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