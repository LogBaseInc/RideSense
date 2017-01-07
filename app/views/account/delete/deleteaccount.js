  define(['angular',
    'config.route',
    'lib',
    'views/services/loginservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('deleteaccount', ['$rootScope', '$scope', '$routeParams', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'loginservice', deleteaccount]);
        function deleteaccount($rootScope, $scope, $routeParams, $location, config, notify, spinner, sessionservice, loginservice) {
            var submitted = false;
            var email = ""
            var vm = this;
            var accountid = sessionservice.getaccountId();
            var accountname = sessionservice.getAccountName();
            var useruid = sessionservice.getuseruid();

            Object.defineProperty(vm, 'candelete', {
                get: candelete
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate() {
                if($routeParams.email != null) {
                    vm.email = $routeParams.email;
                }
                else {
                    notify.error("Link is broken.");
                    $location.path('/account/detail');
                }
                
            }

            function candelete() {
                return $scope.deleteform.$valid && !submitted;
            }

            vm.deleteuser = function () {
                bootbox.confirm("If you continue, your account and all the data within it will be permanently deleted. If you still want to delete this account, press OK", function(result) {
                    if(result == true) {
                        submitted = true;
                        spinner.show();
                        return loginservice.login(vm.email, vm.password).then(logincompleted, loginfailed)
                    }
                });
            }

            function logincompleted() {
                //users delete
                var userref = new Firebase(config.firebaseUrl+'users/'+useruid);
                userref.remove();

                //accountids
                var accountidref = new Firebase(config.firebaseUrl+'accountids/'+accountid);
                accountidref.remove();

                //account users
                var accountuserdref = new Firebase(config.firebaseUrl+'accountusers/'+accountname.toLowerCase());
                accountuserdref.remove();

                //devices
                var accountdevicesref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/devices');
                accountdevicesref.once("value", function(snapshot) {
                    for(property in snapshot.val()) {
                        var devicesref = new Firebase(config.firebaseUrl+'devices/'+property);
                        devicesref.remove();
                    }

                    //api token
                    var tokenref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/token/id');
                    tokenref.once("value", function(snapshot) {
                        if(snapshot.val() != null && snapshot.val() != undefined && snapshot.val() != "") {
                            var tokensref = new Firebase(config.firebaseUrl+'tokens/'+snapshot.val());
                            tokensref.remove();
                        }

                            //collabarators
                        var collabarators = [];
                        var collabaratorsref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/users');
                        collabaratorsref.once("value", function(snapshot) {
                            var data = snapshot.val();
                            for(property in data) {
                                var collabarator = data[property];
                                if(collabarator.joined == true) {
                                    collabarators.push(collabarator.uid);
                                }
                            }

                            console.log(collabarators);

                            //delete account
                            var accountref = new Firebase(config.firebaseUrl+'accounts/'+accountid);
                            accountref.remove();

                            //delete user
                            return loginservice.removeuser(vm.email, vm.password).then(userremovedcompleted)

                        }, function (errorObject) {
                            utility.errorlog("The device read failed: " ,errorObject);
                        });

                        
                    }, function (errorObject) {
                        utility.errorlog("The device read failed: " ,errorObject);
                    });
                    
                }, function (errorObject) {
                    utility.errorlog("The device read failed: " ,errorObject);
                });
            }

            function userremovedcompleted() {
                submitted = false;
                spinner.hide();
                notify.error("Account deleted successfully");
                $rootScope.$emit('logout');
            }

            function loginfailed(error) {
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