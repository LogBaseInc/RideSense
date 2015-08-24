define(['angular',
    'config.route',
    'views/services/userservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('user', ['$rootScope', '$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'userservice', 'utility', user]);
        function user($rootScope, $scope, $location, config, notify, spinner, sessionservice, userservice, utility) {
            var submitted = false;
            var vm = this;
            vm.isAdmin = true;
            vm.isdelete = false;
            var userfberef;
            vm.emailsused = [];
            var accountId = sessionservice.getaccountId();
            var accountname = sessionservice.getAccountName();

            Object.defineProperty(vm, 'canAdd', {
                get: canAdd
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate(){
                
                $('input[type=checkbox][data-toggle^=toggle]').bootstrapToggle();

                $(document).on('click.bs.toggle', 'div[data-toggle^=toggle]', function(e) {
                    var $checkbox = $(this).find('input[type=checkbox]');
                    setroleType($checkbox.prop('checked') ? 'admin' : 'notadmin');
                });

                $('#role-toggle').prop('checked', true).change();

                getUsers();
                if($rootScope.userselected) {
                    vm.isEdit = true;
                    vm.userName = $rootScope.userselected.email;
                    vm.isAdmin = $rootScope.userselected.admin == 'Admin' ? true  : false;
                    vm.isJoined = $rootScope.userselected.status == 'Joined' ? true : false;
                    $('#role-toggle').prop('checked', vm.isAdmin).change();
                    
                    getUser();
                }
                else {
                    vm.isEdit = false;
                    if($rootScope.useremail)
                        vm.userName = $rootScope.useremail;
                    $rootScope.useremail = null;
                }
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
                    utility.errorlog("The users read failed: ",errorObject);
                });
            }

            function getUser() {
                var ref = new Firebase(config.firebaseUrl+'accounts/'+ accountId + '/users/' + utility.getEncodeString(vm.userName));
                ref.once("value", function(snapshot) {
                    vm.userdetail = snapshot.val();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The users read failed: " , errorObject);
                });
            }

            function setroleType (type) {
                if(type == 'admin')
                    vm.isAdmin = true;
                else
                    vm.isAdmin = false;
                utility.applyscope($scope);
            }

            function canAdd(){
                return $scope.userform.$valid && !submitted;
            }

            vm.adduser = function() {
                if(vm.emailsused.indexOf(vm.userName) < 0 && $scope.uservm.useremails.indexOf(vm.userName) < 0) {
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
                vm.cancel();
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

                    submitted = true;
                    spinner.hide();
                    notify.success('User deleted successfully');
                    vm.cancel();
                }
                else {
                    notify.error('Something went wrong, please try after some time');
                }
            }

            vm.cancel = function () {
                $scope.uservm.search = null;
                $scope.uservm.showadduser = false;
            }

            function sendUserInviteEmailCompleted() {
                submitted = false;
                spinner.hide();
                notify.success('User added successfully. Invite email send');
                vm.cancel();
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