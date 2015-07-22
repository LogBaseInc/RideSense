define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('device', ['$scope', '$bootbox', '$location', 'config', 'notify', 'sessionservice', device]);
        function device($scope, $bootbox, $location, config, notify, sessionservice) {
            var submitted = false;
            var vm = this;
            vm.isDeviceEdit = false;

            Object.defineProperty(vm, 'canBuy', {
                get: canBuy
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate(){
                vm.device = sessionservice.getDeviceSelected();
                if(vm.device == null) { 
                    vm.device = {};
                    vm.isDeviceEdit = false;
                }
                else {
                    vm.isDeviceEdit = true;
                }
            }

            function canBuy(){
                return $scope.deviceform.$valid && !submitted;
            }

            vm.adddevice = function () {
                var accountnumber = sessionservice.getaccountId();
                var accountfberef = new Firebase(config.firebaseUrl+'devices/'+vm.device.devicenumber+'/');
                accountfberef.set(accountnumber);

                var devicefberef = new Firebase(config.firebaseUrl+'accounts/'+accountnumber+'/devices/'+vm.device.devicenumber+'/');
                var devicejson = '{"vehiclenumber":"'+vm.device.vehiclenumber+ '","drivername":"' + vm.device.drivername +'","driverid":"' 
                                  + vm.device.driverid +'","drivermobile":' +vm.device.drivermobile+ ',"addedon":' + new Date().getTime() +'}';
                devicefberef.set(angular.fromJson(devicejson));
                if(vm.isDeviceEdit)
                    notify.success('Device updated successfully');
                else
                    notify.success('Device added successfully');

                $location.path('/account/devices');
            }

            vm.deletedevice = function() {
                 $bootbox.confirm("This will delete the '"+vm.device.devicenumber+"' device and its data, do you want to continue?", function (result) {
                    if (result === true) {
                        var livecarsfberef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/livecars/'+vm.device.devicenumber+'/');
                        livecarsfberef.remove();

                        var devicefberef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/devices/'+vm.device.devicenumber+'/');
                        devicefberef.remove();

                        var devicesfberef = new Firebase(config.firebaseUrl+'devices/'+vm.device.devicenumber+'/');
                        devicesfberef.remove();

                        var actvityfberef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/devices/'+vm.device.devicenumber+'/');
                        actvityfberef.remove();

                        notify.success('Device deleted successfully');
                        $location.path('/account/devices');
                    }
                });
            }
        }
    })();
});