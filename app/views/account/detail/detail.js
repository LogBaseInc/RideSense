define(['angular',
    'config.route',
    'views/account/users/users'], function (angular, configroute) {
    (function () {

        configroute.register.controller('accountdetail', ['$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'utility', accountdetail]);
        function accountdetail($scope, $location, config, notify, spinner, sessionservice, utility) {
            var submitted = false;
            var vm = this;
            var accountid = sessionservice.getaccountId();
            vm.token = {};

            Object.defineProperty(vm, 'canupdate', {
                get: canupdate
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            var accountref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/name');
            var addressref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/address');
            var tokenref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/token');

            activate();

            function activate(){
                spinner.show();
                accountref.once("value", function(snapshot) {
                    vm.accountname = snapshot.val();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The account name read failed: ", errorObject);
                });

                var emailref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/email');
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

                tokenref.on("value", function(snapshot) {
                    vm.token = snapshot.val();
                    vm.token.createdon = moment(vm.token.createdon).format("MMM DD, YYYY hh:mm A");
                    spinner.hide();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The setting token read failed: ", errorObject);
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

            vm.getToken = function() {
                var token = utility.generateUUID();
                var date = moment(new Date()).format("YYYY/MM/DD HH:mm:ss");
                tokenref.set({id: token, createdon: date});

                var tokensref = new Firebase(config.firebaseUrl+'tokens/'+token);
                var data = {};
                data.accountId = accountid;
                data.orderCount = {count: 0, date: moment(new Date()).format("YYYYMMDD")};
                tokensref.set(data);
            }
        }
    })();
});