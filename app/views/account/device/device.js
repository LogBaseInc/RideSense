define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('device', ['$scope', 'ngDialog','config', 'sessionservice', device]);
        function device($scope, ngDialog, config, sessionservice) {
            var submitted = false;


            Object.defineProperty($scope, 'canBuy', {
                get: canBuy
            });

            $scope.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate(){
                if($scope.ngDialogData.device)
                    $scope.device = $scope.ngDialogData.device;
            }

            function canBuy(){
                return $scope.deviceform.$valid && !submitted;
            }

            $scope.adddevice = function () {
                //var devicefberef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/licenses/'+$scope.device.licensenumber+'/');
                //var devicejson = '{"vehiclenumber" : "'+$scope.device.vehiclenumber+'"}';
                //devicefberef.set(angular.fromJson(devicejson));
                ngDialog.close();
            }

        }
    })();
});