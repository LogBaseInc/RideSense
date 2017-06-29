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
            vm.token = {};
            vm.isdelete = false;
            var accountid = sessionservice.getaccountId();
            var userid = sessionservice.getSession().uid;

            var tokenref = new Firebase(config.firebaseUrl+'users/'+userid+'/token');

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

                tokenref.on("value", function(snapshot) {
                    if(snapshot.val() != null) {
                        vm.token = snapshot.val();
                        vm.token.createdon = moment(vm.token.createdon).format("MMM DD, YYYY hh:mm A");
                    }
                    else {
                       vm.token = null;  
                    }
                    spinner.hide();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The setting token read failed: ", errorObject);
                });
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

            vm.getToken = function() {
                vm.isdelete = false;
                var token = utility.generateUUID();
                var date = moment(new Date()).format("YYYY/MM/DD HH:mm:ss");
                tokenref.set({id: token, createdon: date});

                var tokensref = new Firebase(config.firebaseUrl+'tokens/'+token);
                var data = {};
                data.accountId = accountid;
                data.orderCount = {count: 0, date: moment(new Date()).format("YYYYMMDD")};
                data.userId = userid;
                tokensref.set(data);
            }

            vm.deleteToken = function() {
                vm.isdelete = false;
                var tokensref = new Firebase(config.firebaseUrl+'tokens/'+vm.token.id);
                tokensref.remove();

                tokenref.remove();
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