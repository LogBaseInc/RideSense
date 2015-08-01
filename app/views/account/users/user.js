define(['angular',
    'config.route',
    'views/services/userservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('user', ['$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'userservice', 'utility', user]);
        function user($scope, $location, config, notify, spinner, sessionservice, userservice, utility) {
            var submitted = false;
            var vm = this;
            vm.isAdmin = true;
            vm.isdelete = false;
            var userfberef;
            vm.emailsused = [];
            var accountId = sessionservice.getaccountId();
            var accountname = utility.getAccountName();

            Object.defineProperty(vm, 'canAdd', {
                get: canAdd
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate(){
                getUsers();
                var selecteduser =  utility.getUserSelected();
                if(selecteduser) {
                    vm.isEdit = true;
                    vm.userName = selecteduser.email;
                    vm.isAdmin = selecteduser.admin == 'Admin' ? true  : false;
                    vm.isJoined = selecteduser.status == 'Joined' ? true : false;
                    getUser();
                }
                else
                    vm.isEdit = false;
            }

            function getUsers(){
                var ref = new Firebase(config.firebaseUrl+'users/');
                ref.once("value", function(snapshot) {
                    vm.emailsused = [];
                    var accounts = snapshot.val()
                    for(property in accounts) {
                        vm.emailsused.push(accounts[property].email);
                    }
                }, function (errorObject) {
                    console.log("The users read failed: " + errorObject.code);
                });
            }

            function getUser() {
                var ref = new Firebase(config.firebaseUrl+'accounts/'+ accountId + '/users/' + utility.getEncodeString(vm.userName));
                ref.once("value", function(snapshot) {
                    vm.userdetail = snapshot.val();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    console.log("The users read failed: " + errorObject.code);
                });
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
                if(vm.emailsused.indexOf(vm.userName) < 0) {
                    submitted = true;
                    spinner.show();
                   
                    var userName = utility.getEncodeString(vm.userName);

                    userfberef = new Firebase(config.firebaseUrl+'accounts/'+accountId+'/users/'+userName);
                    var userjson = '{"admin":'+vm.isAdmin + ',"joined" : false' + ',"invitedon":' + new Date().getTime() +'}';
                    userfberef.set(angular.fromJson(userjson));

                    return userservice.sendUserInviteEmail(vm.userName, accountname, getInvitationUrl()).then(sendUserInviteEmailCompleted, sendUserInviteEmailFailed);
                }
                else {
                    notify.error("Email already in use");
                }
            }

            vm.resendemail = function () {
                submitted = true;
                spinner.show();
                return userservice.sendUserInviteEmail(vm.userName, accountname, getInvitationUrl()).then(function(){
                    submitted = false;
                    spinner.hide();
                    notify.success('Email sent successfully');
                }, sendUserInviteEmailFailed);
            }

            function getInvitationUrl() {
                var userName = utility.getEncodeString(vm.userName);
                return config.hosturl+'user/activate/'+utility.getEncodeString(accountId)+'/'+userName;
            }

            vm.edituser = function () {
                submitted = true;
                spinner.show();

                var userName = utility.getEncodeString(vm.userName);

                userfberef = new Firebase(config.firebaseUrl+'accounts/'+accountId+'/users/'+userName+'/admin');
                userfberef.set(vm.isAdmin);

                submitted = false;
                spinner.hide();
                notify.success('User updated successfully');
                $location.path('/account/users');
            }

            vm.deleteuser = function() {
                vm.isdelete = true;
            }

            vm.deletecancel = function() {
                vm.isdelete = false;
            }

            vm.deleteconfirm = function() {
                if(vm.userdetail != null) {
                    submitted = true;
                    spinner.show();

                    var userName = utility.getEncodeString(vm.userName);

                    var usersfberef = new Firebase(config.firebaseUrl+'users/'+ vm.userdetail.uid);
                    usersfberef.remove();

                    userfberef = new Firebase(config.firebaseUrl+'accounts/'+accountId+'/users/'+userName);
                    userfberef.remove();

                    ubmitted = true;
                    spinner.hide();
                    notify.success('User deleted successfully');
                    $location.path('/account/users');
                }
                else {
                    notify.error('Something went wrong, please try after some time');
                }
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