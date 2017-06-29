  define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('verifyemail', ['$rootScope', '$scope', '$routeParams', '$location', 'config', 'notify', 'spinner', 'utility', verifyemail]);
        function verifyemail($rootScope, $scope, $routeParams, $location, config, notify, spinner, utility) {
            var vm = this;
            activate();

            function activate() {
                spinner.show();
                if($routeParams.accountId != null && $routeParams.accountId != undefined) {
                    var usersref = new Firebase(config.firebaseUrl+'users/'+$routeParams.accountId+'/emailverified');
                    usersref.set(true, function(error) {
                        if (error) {
                            notify.error('Something went wrong, please try again later');
                            spinner.hide();
                            utility.applyscope($scope);
                            $rootScope.$emit('logout');
                        } 
                        else {
                            notify.success('Email verified successfully');
                            spinner.hide();
                            utility.applyscope($scope);
                            $rootScope.$emit('logout');
                        }
                    });
                }
                else {
                    notify.error('Link is broken');
                    spinner.hide();
                    utility.applyscope($scope);
                    $rootScope.$emit('logout');
                }
            }
        }
    })();
});