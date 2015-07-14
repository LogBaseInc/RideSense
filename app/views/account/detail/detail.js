define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('accountdetail', ['$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', accountdetail]);
        function accountdetail($scope, $location, config, notify, spinner, sessionservice) {
            var submitted = false;
            var vm = this;

            Object.defineProperty(vm, 'canupdate', {
                get: canupdate
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            var accountref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/name');
            var addressref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/address');
            activate();

            function activate(){
                spinner.show();
                accountref.on("value", function(snapshot) {
                    vm.accountname = snapshot.val();
                    sessionservice.applyscope($scope);
                }, function (errorObject) {
                    console.log("The account name read failed: " + errorObject.code);
                });
                
                addressref.on("value", function(snapshot) {
                    vm.address = snapshot.val();
                    if(vm.address == null)
                        vm.address = {};
                    spinner.hide();
                    sessionservice.applyscope($scope);
                }, function (errorObject) {
                    console.log("The address read failed: " + errorObject.code);
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