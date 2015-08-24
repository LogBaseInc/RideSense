define(['angular',
    'config.route',
    'views/account/users/users'], function (angular, configroute) {
    (function () {

        configroute.register.controller('accountdetail', ['$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'utility', accountdetail]);
        function accountdetail($scope, $location, config, notify, spinner, sessionservice, utility) {
            var submitted = false;
            var vm = this;

            Object.defineProperty(vm, 'canupdate', {
                get: canupdate
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            var accountref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/name');
            var emailref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/email');
            var addressref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/address');

            activate();

            function activate(){
                
                spinner.show();
                accountref.once("value", function(snapshot) {
                    vm.accountname = snapshot.val();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The account name read failed: ", errorObject);
                });

                emailref.once("value", function(snapshot) {
                    vm.email = snapshot.val();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The account name read failed: ", errorObject);
                });
                
                addressref.once("value", function(snapshot) {
                    vm.address = snapshot.val();
                    if(vm.address == null)
                        vm.address = {};
                    spinner.hide();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The address read failed: ", errorObject);
                });
            }

            function canupdate(){
                return $scope.accountform.$valid && !submitted;
            }

            vm.update = function () {
                accountref.set(vm.accountname);
                addressref.set(vm.address);
                notify.success('Account details updated successfully');
            }
        }
    })();
});