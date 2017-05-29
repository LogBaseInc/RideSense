define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('agentappsetting', ['$rootScope','$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', agentappsetting]);
        function agentappsetting($rootScope, $scope, $location, config, spinner, sessionservice, utility) {
            var vm = this;
            var accountid = sessionservice.getaccountId();
            var ref;

            activate();

            function activate(){
                $rootScope.routeSelection = '';
                vm.accept = false;
                vm.pickup = false;
                vm.start = false;
                vm.deliver = true;
                getAppSettings();
            }

            function getAppSettings() {
                ref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/agentapp');
                ref.on("value", function(snapshot) {
                    if(snapshot.val() != null) {
                        var data = snapshot.val();
                        vm.accept = data.accept;
                        vm.pickup = data.pickup;
                        vm.start = data.start;
                    }
                    else {
                        ref.set({accept:false, pickup: false, start: false, deliver: true});
                    }
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("Inventory Tracking read failed: ", errorObject);
                });
            }

            vm.datachanged = function(value, status) {
                var ref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/agentapp/'+status);
                ref1.set(value);
                if(value == false && status == 'pickup') {
                    vm.datachanged(false, 'start');
                }
            }

            $scope.$on('$destroy', function iVeBeenDismissed() {
                if(ref)
                    ref.off();
            });
        }
    })();
});