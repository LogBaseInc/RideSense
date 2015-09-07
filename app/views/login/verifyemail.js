  define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('verifyemail', ['$rootScope', '$scope', '$routeParams', '$location', 'config', 'notify', 'spinner', verifyemail]);
        function verifyemail($rootScope, $scope, $routeParams, $location, config, notify, spinner) {
            var vm = this;
            activate();

            function activate() {
                $rootScope.$emit('logout');
                spinner.show();
                if($routeParams.accountId != null && $routeParams.accountId != undefined) {
                    var usersref = new Firebase(config.firebaseUrl+'users/'+$routeParams.accountId+'/emailverified');
                    usersref.set(true);
                    notify.success('Email verified successfully');
                }
                else {
                    notify.error('Link is broken');
                }
                spinner.hide();
                $location.path('/login');
            }
        }
    })();
});