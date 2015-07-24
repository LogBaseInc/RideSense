define(['angular',
    'config.route',
    'lib',
    'views/services/mobileuuidservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('device', ['$scope', '$bootbox', '$location', 'config', 'spinner', 'notify', 'sessionservice', 'mobileuuidservice', device]);
        function device($scope, $bootbox, $location, config, spinner, notify, sessionservice, mobileuuidservice) {
            var submitted = false;
            var vm = this;
            vm.isDeviceEdit = false;
            vm.devicetype = 'stick';

            Object.defineProperty(vm, 'canBuy', {
                get: canBuy
            });

            vm.interacted = function (field, isdevicenumber) {
                //if(isdevicenumber == true && vm.isdeviceavailable != null) vm.isdeviceavailable = null;
                return submitted || field.$dirty;
            };

            activate();

            function activate(){
                vm.device = sessionservice.getDeviceSelected();
                if(vm.device == null) { 
                    vm.device = {};
                    vm.device.type = 'stick';
                    vm.isDeviceEdit = false;
                }
                else {
                    vm.isDeviceEdit = true;
                }

                if(vm.device.type == 'stick')
                    vm.isStick = true;
                else
                    vm.isStick = false;
            }

            function canBuy(){
                return $scope.deviceform.$valid && !submitted && ((vm.isStick && vm.isdeviceavailable) || !vm.isStick || vm.isDeviceEdit) ;
            }

            vm.selectDeviceType = function(devicetype) {
                vm.devicetype = devicetype;
                if(vm.devicetype == 'stick')
                    vm.isStick = true;
                else {
                    vm.isStick = false;
                    vm.device.devicenumber = '';
                }
            }

            vm.deviceIdCheck = function () {
                vm.isdeviceavailable = null;
                if(vm.isDeviceEdit != true && submitted != true && vm.isStick && vm.device.devicenumber != null && vm.device.devicenumber != '') {
                    var devicesfberef = new Firebase(config.firebaseUrl+'devices/'+vm.device.devicenumber+'/');
                    devicesfberef.on("value", function(snapshot) {
                        if(snapshot.val() == null)
                            vm.isdeviceavailable = true;
                        else
                            vm.isdeviceavailable = false;
                    }, function (errorObject) {
                        console.log("The device read failed: " + errorObject.code);
                    });
                }
                else {
                    vm.isdeviceavailable = null;
                }
            }

            vm.adddevice = function () {
                if(vm.isDeviceEdit ==false && vm.isStick == false) {
                    submitted = true;
                    spinner.show();
                    return mobileuuidservice.getMobileUuid(vm.device.drivermobile, sessionservice.getAccountName()).then(getMobileUuidCompleted, getMobileUuidFailed);
                }
                else {
                   adddev(); 
                }
            }

            function getMobileUuidCompleted(data) {
                vm.device.devicenumber = data.uuid;
                adddev()
            }

            function getMobileUuidFailed() {
                submitted = false;
                spinner.hide();
                notify.error('Something went wrong, please try after some time.');  
            }

            function adddev() {
                submitted = true;
                spinner.show();

                var accountnumber = sessionservice.getaccountId();
                var accountfberef = new Firebase(config.firebaseUrl+'devices/'+vm.device.devicenumber+'/');
                accountfberef.set(accountnumber);

                var devicefberef = new Firebase(config.firebaseUrl+'accounts/'+accountnumber+'/devices/'+vm.device.devicenumber+'/');
                var devicejson = '{"vehiclenumber":"'+vm.device.vehiclenumber+ '","type":"' + vm.devicetype + '","drivername":"' + vm.device.drivername +'","driverid":"' 
                                  + vm.device.driverid +'","drivermobile":' + vm.device.drivermobile+ ',"addedon":' + new Date().getTime() +'}';
                devicefberef.set(angular.fromJson(devicejson));

                submitted = false;
                spinner.show();

                if(vm.isDeviceEdit)
                    notify.success('Device updated successfully');
                else
                    notify.success('Device added successfully');

                $location.path('/account/devices');
            }

            vm.deletedevice = function() {
                 $bootbox.confirm("This will delete the '"+vm.device.devicenumber+"' device and its data, do you want to continue?", function (result) {
                    if (result === true) {
                        submitted = true;
                        spinner.show();

                        var livecarsfberef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/livecars/'+vm.device.devicenumber+'/');
                        livecarsfberef.remove();

                        var devicefberef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/devices/'+vm.device.devicenumber+'/');
                        devicefberef.remove();

                        var devicesfberef = new Firebase(config.firebaseUrl+'devices/'+vm.device.devicenumber+'/');
                        devicesfberef.remove();

                        var actvityfberef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/devices/'+vm.device.devicenumber+'/');
                        actvityfberef.remove();

                        var tripfberef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/trips/devices/'+vm.device.devicenumber+'/');
                        tripfberef.remove();

                        submitted = false;
                        spinner.show();

                        notify.success('Device deleted successfully');
                        $location.path('/account/devices');
                    }
                });
            }
        }
    })();
});