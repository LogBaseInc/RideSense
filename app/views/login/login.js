define(['angular',
    'config.route',
    'views/services/loginservice'], function (angular, configroute) {
        (function () {
            configroute.register.controller('login', ['$scope', '$location', 'spinner', 'notify', 'sessionservice','loginservice', login]);
            function login($scope, $location, spinner, notify, sessionservice, loginservice) {
                var vm = this, submitted = false;
                vm.userName = 'kalaivani@logbase.io';
                vm.password = 'zaq1';
                vm.logindiv = true;
                vm.signupdiv = false;
                vm.forgotdiv = false;
                vm.newuser = {};
                vm.newuser.agreed = false;
                vm.repeatpwderror = false;
                vm.success = true;

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
                     spinner.show();
                     submitted= true;
                     loginservice.login(vm.userName, vm.password).then(loginCompleted, loginfailed)
                };

                function loginCompleted(data) {
                    spinner.hide();
                    submitted = false;
                    vm.success = true;
                    vm.password = null;
                    sessionservice.setSession(data);
                    $location.path('/live');            
                }

                function loginfailed(error) { 
                    spinner.hide();
                    submitted = false;
                    if(error.message.indexOf("The specified user does not exist") >= 0 || error.message.indexOf("The specified password is incorrect") >= 0) {
                        vm.success = false;
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
                    vm.newuser.email = null;
                    vm.newuser = null;
                    resetform($scope.signupform);
                }

                vm.signup = function() {
                    spinner.show();
                    submitted= true;
                    loginservice.signup(vm.newuser.email, vm.newuser.password).then(signupcompleted, signupfailed)
                }

                function signupcompleted() {
                    spinner.hide();
                    submitted = false;
                    notify.success('Registered successfully!');
                    vm.backtologinclicked();
                }

                function signupfailed(error) {
                    spinner.hide();
                    submitted = false;
                    notify.error(error.message)
                    vm.newuser = null;
                    resetform($scope.signupform);
                }

                vm.forgotpasswordlinkclicked = function() {
                    linkclicked();
                    vm.forgotdiv = true;
                }

                vm.signuplinkclicked = function() {
                    linkclicked();
                    vm.signupdiv = true;
                }

                vm.backtologinclicked = function() {
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
                    vm.password = null;
                    vm.userName =null;
                    resetform($scope.forgotpassform);
                    resetform($scope.loginform);
                    resetform($scope.signupform);
                }
        }
    })();
});