define(['angular',
    'config.route', 
    'views/services/loginservice'], function (angular, configroute) {
        (function () {
            configroute.register.controller('login', ['$rootScope', '$scope', '$location', 'config', 'spinner', 'notify', 'sessionservice','loginservice', 'utility', login]);
            function login($rootScope, $scope, $location, config, spinner, notify, sessionservice, loginservice, utility) {
                var vm = this, submitted = false;
                vm.logindiv = true;
                vm.signupdiv = false;
                vm.forgotdiv = false;
                vm.newuser = {};
                vm.newuser.agreed = false;
                vm.repeatpwderror = false;
                vm.success = true;
                var uuid = null;
                vm.backtologinclicked = backtologinclicked;

                Object.defineProperty(vm, 'canLogin', {
                    get: canLogin
                });

                Object.defineProperty(vm, 'canResetPassword', {
                    get: canResetPassword
                });

                Object.defineProperty(vm, 'canSignup', {
                    get: canSignup
                });

                vm.interacted = function (field) {
                    return submitted || field.$dirty;
                };

                activate();
                function activate(){
                    sessionservice.clear();
                }

                vm.login = function () {
                    if(vm.canLogin) {    
                        utility.closekeyboard($('#txtPassword'));    
                        spinner.show();
                        submitted= true;
                        return loginservice.login(vm.userName, vm.password).then(getAccountId, loginfailed);
                    }
                };

                function getAccountId(data) {
                    var ref1 = new Firebase(config.firebaseUrl+'users/'+data.uid+'/');
                    ref1.once("value", function(snapshot) {
                        if(snapshot.val() != null && snapshot.val().account) {
                            loginCompleted(data, snapshot.val().account);
                        }
                        else {
                            spinner.hide();
                            submitted = false;
                            notify.error('Not linked with any account');
                            utility.applyscope($scope);
                            $location.path('/account/delete/'+vm.userName);
                        }
                    }, function (errorObject) {
                        notify.error('Something went wrong, please try again later');
                    });
                }

                function loginCompleted(data, accountId) {
                    spinner.hide();
                    submitted = false;
                    vm.success = true;
                    //vm.password = null;
                    sessionservice.setSession(data, accountId);
                    $rootScope.$emit('alertcount');
                    $location.path('/live');    
                    utility.applyscope($scope);     
                }

                function loginfailed(error) { 
                    spinner.hide();
                    submitted = false;
                    if(error.message.indexOf("The specified user does not exist") >= 0 || error.message.indexOf("The specified password is incorrect") >= 0) {
                        vm.success = false;
                        vm.password = null;
                        resetform($scope.loginform);
                    }
                    else {
                        notify.error('Something went wrong, please try again later');
                        vm.password = null;
                        resetform($scope.loginform);
                    }
                }

                vm.forgotpassword = function() {
                    spinner.show();
                    submitted= true;
                    loginservice.resetpasswordlink(vm.useremail).then(forgotpasswordcompleted, forgotpasswordfailed)
                }

                function forgotpasswordcompleted() {
                    spinner.hide();
                    submitted = false;
                    notify.success('Password reset sent to '+vm.useremail);
                    vm.useremail = null;
                    resetform($scope.forgotpassform);
                    vm.backtologinclicked();
                }

                function forgotpasswordfailed(error) {
                    spinner.hide();
                    submitted = false;
                    notify.error(error.message)
                    vm.useremail = null;
                    resetform($scope.forgotpassform);
                }

                vm.resetSignupForm = function() {
                    vm.newuser = {};
                    vm.newuser.email = null;
                    vm.newuser.password = null;
                    resetform($scope.signupform);
                }

                vm.signup = function() {
                    spinner.show();
                    submitted= true;
                    loginservice.signup(vm.newuser.email, vm.newuser.password).then(signupcompleted, signupfailed)
                }

                function signupcompleted(userData) {
                    uuid =  utility.generateUUID();
                    var usersref = new Firebase(config.firebaseUrl+'users/'+userData.uid+'/');
                    var useracc = {};
                    useracc.account = 'account'+uuid;
                    useracc.email = vm.newuser.email;
                    usersref.set(useracc);

                    var accountref = new Firebase(config.firebaseUrl+'accounts/account'+uuid);
                    var accountjson = '{"email":"'+ vm.newuser.email + '","name" : "'+vm.newuser.accountname+'","timezone" : "'+getTimeZone()+'"}';
                    accountref.set(angular.fromJson(accountjson));

                    spinner.hide();
                    submitted = false;
                    notify.success('Registered successfully!');
                    backtologinclicked();
                }

                function signupfailed(error) {
                    spinner.hide();
                    submitted = false;
                    notify.error(error.message)
                    vm.newuser = null;s
                    resetform($scope.signupform);
                }

                function getTimeZone() {
                    return (new Date).toLocaleString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        timeZoneName: 'long'
                    }).replace(/^\d\d /, '');
                }

                vm.forgotpasswordlinkclicked = function() {
                    linkclicked();
                    vm.forgotdiv = true;
                }

                vm.signuplinkclicked = function() {
                    linkclicked();
                    vm.signupdiv = true;
                }

                function backtologinclicked() {
                    linkclicked();
                    vm.logindiv = true;
                }

                vm.hide = function () {
                    vm.success = true;
                }

                function canLogin() {
                    return $scope.loginform. $valid && !submitted;
                }

                function canResetPassword() {
                    return $scope.forgotpassform.$valid && !submitted;
                }

                function canSignup() {
                    if($scope.signupform.$valid)
                    {
                        if(vm.newuser.password != null && vm.newuser.password != undefined &&
                           vm.newuser.repeatpassword != null && vm.newuser.repeatpassword != undefined)
                        {
                            if(vm.newuser.password !== vm.newuser.repeatpassword)
                                vm.repeatpwderror = true;
                            else
                                vm.repeatpwderror = false;
                        }
                    }
                    return $scope.signupform.$valid && !submitted && !vm.repeatpwderror;
                }
                
                function resetform(form) {
                    form.$setPristine();
                    form.$setUntouched();
                }

                function linkclicked() {
                    vm.logindiv = false;
                    vm.signupdiv = false;
                    vm.forgotdiv = false;
                    vm.useremail = null;
                    vm.repeatpwderror = false;
                    vm.password = null;
                    vm.userName =null;
                    vm.newuser = {};
                    vm.newuser.email = null;
                    vm.newuser.password = null;
                    resetform($scope.forgotpassform);
                    resetform($scope.loginform);
                    resetform($scope.signupform);
                }
            }
    })();
});