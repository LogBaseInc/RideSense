  define(['angular',
    'config.route',
    'views/services/loginservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('deleteaccount', ['$scope', '$routeParams', '$location', 'notify', 'spinner', 'loginservice', deleteaccount]);
        function deleteaccount($scope, $routeParams, $location, notify, spinner, loginservice) {
            var submitted = false;
            var email = ""
            var vm = this;

            Object.defineProperty(vm, 'candelete', {
                get: candelete
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate() {
                vm.email = $routeParams.email;
            }

            function candelete() {
                return $scope.deleteform.$valid && !submitted;
            }

            vm.deleteuser = function () {
                submitted = true;
                spinner.show();
                return loginservice.removeuser(vm.email, vm.password).then(deleteusercompleted, deleteuserfailed)
            }

            function deleteusercompleted() {
                submitted = false;
                spinner.hide();
                notify.success('Deleted successfully');
                $location.path('/login');
            }

            function deleteuserfailed(error) {
                submitted = false;
                spinner.hide();
                switch (error.code) {
                    case "INVALID_USER":
                        notify.error("Email does not exist.");
                        break;
                    case "INVALID_PASSWORD":
                        notify.error("Password is incorrect.");
                        break;
                    default:
                        notify.error("Something went wrong, please try again after some time.");
                }
            }
        }
    })();
});