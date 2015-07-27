define(['angular',
    'config.route',
    'views/services/userservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('user', ['$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'userservice', user]);
        function user($scope, $location, config, notify, spinner, sessionservice, userservice) {
            var submitted = false;
            var vm = this;
            vm.isAdmin = true;
            var userfberef;

            Object.defineProperty(vm, 'canAdd', {
                get: canAdd
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate(){
                var selecteduser =  sessionservice.getUserSelected();
                if(selecteduser) {
                    vm.isEdit = true;
                    vm.userName = selecteduser.email;
                    vm.isAdmin = selecteduser.admin == 'Admin' ? true  :false
                }
                else
                    vm.isEdit = false;
            }

            vm.roleType = function (type) {
                if(type == 'admin')
                    vm.isAdmin = true;
                else
                    vm.isAdmin = false;
            }

            function canAdd(){
                return $scope.userform.$valid && !submitted;
            }

            vm.adduser = function() {
                submitted = true;
                spinner.show();

                var accountId = sessionservice.getaccountId();
                var accountname = sessionservice.getAccountName();
                var userName = sessionservice.getEncodeString(vm.userName);

                userfberef = new Firebase(config.firebaseUrl+'accounts/'+accountId+'/users/'+userName);
                var userjson = '{"admin":'+vm.isAdmin + ',"joined" : false' + ',"invitedon":' + new Date().getTime() +'}';
                userfberef.set(angular.fromJson(userjson));

                var url = config.hosturl+'user/activate/'+sessionservice.getEncodeString(accountId)+'/'+userName;
                return userservice.sendUserInviteEmail(vm.userName, accountname, url).then(sendUserInviteEmailCompleted, sendUserInviteEmailFailed);
            }

            vm.edituser = function () {
                submitted = true;
                spinner.show();

                var accountId = sessionservice.getaccountId();
                var userName = sessionservice.getEncodeString(vm.userName);

                userfberef = new Firebase(config.firebaseUrl+'accounts/'+accountId+'/users/'+userName+'/admin');
                userfberef.set(vm.isAdmin);

                submitted = false;
                spinner.hide();
                notify.success('User updated successfully');
                $location.path('/account/users');
            }

            vm.deleteuser = function() {
                submitted = true;
                spinner.show();

                var accountId = sessionservice.getaccountId();
                var userName = sessionservice.getEncodeString(vm.userName);
                userfberef = new Firebase(config.firebaseUrl+'accounts/'+accountId+'/users/'+userName);
                userfberef.remove();

                ubmitted = true;
                spinner.hide();
                notify.success('User deleted successfully');
                $location.path('/account/users');
            }

            function sendUserInviteEmailCompleted() {
                submitted = false;
                spinner.hide();
                notify.success('User added successfully. Invite email send');
                $location.path('/account/users');
            }

            function sendUserInviteEmailFailed() {
                submitted = false;
                spinner.hide();
                userfberef.remove();
                notify.error('Something went wrong, please try after some time');
            }
        }
    })();
});