define(['angular',
    'config.route', 
    'lib',
    'views/services/loginservice',
    'views/services/userservice'], function (angular, configroute) {
        (function () {
            configroute.register.controller('login', ['$rootScope', '$scope', '$location', 'config', 'spinner', 'notify', 'sessionservice', 'loginservice', 'userservice', 'utility', login]);
            function login($rootScope, $scope, $location, config, spinner, notify, sessionservice, loginservice, userservice, utility) {
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
                vm.isPasswordGood = false;
                vm.emailnotverified = false;
                var accountdata = null;

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
                    if(field.$dirty === true && vm.emailnotverified === true) {
                        vm.emailnotverified = false;
                    }
                    return submitted || field.$dirty;
                };

                activate();
                function activate(){
                    spinner.hide();
                    if(sessionservice.isLoggedIn() == 'true') {
                        $location.path('/detail');
                    }
                    else {
                        sessionservice.clear();
                    }
                }

                $rootScope.$on('passwordStrength', function(event, data) {
                    vm.isPasswordGood = data.isGood;
                });

                vm.login = function () {
                     vm.emailnotverified = false;
                    if(vm.canLogin) { 
                        document.activeElement.blur();  
                         Array.prototype.forEach.call(document.querySelectorAll('input, textarea'), function(it) { 
                            it.blur(); 
                        });
     
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
                    sessionservice.setSession(data, accountId);
                    loginanalytics(data, accountId);
                    $rootScope.$emit('logincompleted');
                    $location.path('/detail');    
                    utility.applyscope($scope);     
                }

                function loginanalytics(data, accountId) {
                    analytics.track('Logged In'); 
                    analytics.identify(data.uid, {
                      email: data.password.email,
                      accountid : accountId
                    });
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
                    checkAccountName();
                }

                function checkAccountName() {
                    var ref1 = new Firebase(config.firebaseUrl+'accountusers/'+vm.newuser.accountname.toLowerCase());
                    ref1.once("value", function(snapshot) {
                        if(snapshot.val() == null || snapshot.val() == undefined) {
                            loginservice.signup(vm.newuser.email, vm.newuser.password).then(signupcompleted, signupfailed);
                        }
                        else{
                            notify.error("Account name in use. Please enter different name");
                            spinner.hide();
                            submitted = false;
                            utility.applyscope($scope);
                        }
                    }, function (errorObject) {
                        notify.error('Something went wrong, please try again later');
                    });
                }

                function signupcompleted(userData) {
                    uuid =  utility.generateUUID();
                    var usersref = new Firebase(config.firebaseUrl+'users/'+userData.uid+'/');
                    var useracc = {};
                    useracc.account = 'account'+uuid;
                    useracc.email = vm.newuser.email;
                    useracc.emailverified = false;
                    usersref.set(useracc);
                    
                    var url = config.hosturl+'account/verify/'+userData.uid;      
                    userservice.sendUserVerifyEmail(vm.newuser.email, vm.newuser.accountname, url);

                    var accountref = new Firebase(config.firebaseUrl+'accounts/account'+uuid);
                    var accountobj = {};
                    accountobj.email = vm.newuser.email;
                    accountobj.mobilenumber = vm.newuser.mobilenumber;
                    accountobj.name = vm.newuser.accountname;
                    accountobj.timezone = getTimeZone();
                    accountobj.address = {};
                    accountobj.address.country = vm.newuser.country;
                    accountobj.createdon = moment(new Date()).format('YYYY/DD/MM HH:mm:ss');
                    accountref.set(accountobj);

                    var accountuserref = new Firebase(config.firebaseUrl+'accountusers/'+vm.newuser.accountname.toLowerCase());
                    var accountuserjson = '{"accountid":"account'+ uuid+'"}';
                    accountuserref.set(angular.fromJson(accountuserjson));
                    
                    var accountidref = new Firebase(config.firebaseUrl+'accountids/'+useracc.account);
                    accountidref.set(useracc.account);

                    spinner.hide();
                    submitted = false;
                    notify.success('Registered successfully.');
                    backtologinclicked();
                }

                function signupfailed(error) {
                    spinner.hide();
                    submitted = false;
                    notify.error(error.message)
                    vm.newuser = null;
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
                    if(vm.isPasswordGood)
                    {
                        if(vm.newuser != null && vm.newuser.password != null && vm.newuser.password != undefined &&
                           vm.newuser.repeatpassword != null && vm.newuser.repeatpassword != undefined)
                        {
                            if(vm.newuser.password !== vm.newuser.repeatpassword)
                                vm.repeatpwderror = true;
                            else
                                vm.repeatpwderror = false;
                        }
                    }
                    return $scope.signupform.$valid && !submitted && !vm.repeatpwderror && vm.isPasswordGood;
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