define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('device', ['$scope', 'ngDialog','config', 'notify', 'sessionservice', device]);
        function device($scope, ngDialog, config, notify, sessionservice) {
            var submitted = false;
            $scope.isDeviceEdit = false;

            Object.defineProperty($scope, 'canBuy', {
                get: canBuy
            });

            $scope.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate(){
                if($scope.ngDialogData.device) {
                    $scope.isDeviceEdit = true;
                    $scope.device = $scope.ngDialogData.device;
                }
            }

            function canBuy(){
                return $scope.deviceform.$valid && !submitted;
            }

            $scope.adddevice = function () {
                var accountnumber = sessionservice.getaccountId();
                var accountfberef = new Firebase(config.firebaseUrl+'devices/'+$scope.device.devicenumber+'/');
                accountfberef.set(accountnumber);

                var devicefberef = new Firebase(config.firebaseUrl+'accounts/'+accountnumber+'/devices/'+$scope.device.devicenumber+'/');
                var devicejson = '{"vehiclenumber" : "'+$scope.device.vehiclenumber+'"}';
                devicefberef.set(angular.fromJson(devicejson));
                if($scope.isDeviceEdit)
                    notify.success('Device updated successfully');
                else
                    notify.success('Device added successfully');

                $scope.closeThisDialog('Cancel');
            }

        }
    })();
});