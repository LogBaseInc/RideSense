define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('users', ['$rootScope','$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', users]);
        function users($rootScope, $scope, $location, config, spinner, sessionservice, utility) {
            var vm = this;
            vm.users = [];

            activate();

            function activate(){
                $rootScope.routeSelection = '';
            	spinner.show();
                var ref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/users');
                ref.once("value", function(snapshot) {
                    getUsers(snapshot.val());
                }, function (errorObject) {
                    console.log("The users read failed: " + errorObject.code);
                });
            }

            function getUsers(data){
            	vm.users = [];
                for(var property in data) {
                    vm.users.push({
                        email : utility.getDecodeString(property),
                        admin: data[property].admin ? 'Admin' : 'Not admin',
                        status: data[property].joined ? 'Joined' : 'Invited',
                        joinedon : data[property].joined ? moment(data[property].joinedon).format('MMM DD, YYYY') : ''
                    });
                }
                spinner.hide();
                utility.applyscope($scope);
            }

            vm.adduser = function(){
                utility.setUserSelected(null);
                $location.path('/account/user');
            }

             vm.edituser = function (index) {
                utility.setUserSelected(vm.users[index]);
                $location.path('/account/user');
            }
        }
    })();
});