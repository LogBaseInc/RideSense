define(['angular',
    'config.route',
    'lib',
    'views/services/mobileuuidservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('device', ['$scope', '$location', 'config', 'spinner', 'notify', 'sessionservice', 'mobileuuidservice', 'utility', device]);
        function device($scope, $location, config, spinner, notify, sessionservice, mobileuuidservice, utility) {
            var submitted = false;
            var vm = this;
            vm.isDeviceEdit = false;
            vm.devicetype = 'stick';
            var devicesfberef;
            vm.isdelete = false;

            Object.defineProperty(vm, 'canBuy', {
                get: canBuy
            });

            vm.interacted = function (field, isdevicenumber) {
                return submitted || field.$dirty;
            };

            activate();

            function activate(){
                $('input[type=checkbox][data-toggle^=toggle]').bootstrapToggle();

                vm.device = utility.getDeviceSelected();
                if(vm.device == null) { 
                    vm.device = {};
                    vm.device.type = 'stick';
                    vm.device.vehicletype = 'car';
                    vm.isDeviceEdit = false;
                }
                else {
                    vm.isDeviceEdit = true;
                    if(vm.device.vehicletype == null || vm.device.vehicletype == undefined)
                        vm.device.vehicletype = 'car';
                }

                if(vm.device.type == 'stick') {
                    vm.isStick = true;
                    $('#device-toggle').prop('checked', true).change();
                }
                else {
                    vm.isStick = false;
                    $('#device-toggle').prop('checked', false).change();
                }

                if(vm.isDeviceEdit) {
                     $('#device-toggle').prop('disabled', true).change();
                }
                else {
                    $(document).on('click.bs.toggle', 'div[data-toggle^=toggle]', function(e) {
                        var $checkbox = $(this).find('input[type=checkbox]');
                        selectDeviceType($checkbox.prop('checked') ? 'stick' : 'stickmobile');
                    });
                }
            }

            function canBuy(){
                return $scope.deviceform.$valid && !submitted && ((vm.isStick && vm.isdeviceavailable) || !vm.isStick || vm.isDeviceEdit) ;
            }

            selectDeviceType = function(devicetype) {
                vm.device.type = devicetype;
                if(vm.device.type == 'stick')
                    vm.isStick = true;
                else {
                    vm.isStick = false;
                    vm.device.devicenumber = '';
                }
                utility.applyscope($scope);
            }

            vm.selectVehicleType = function(vehicletype) {
                vm.device.vehicletype = vehicletype;
            }

            vm.deviceIdCheck = function () {
                vm.isdeviceavailable = null;
                if(vm.isDeviceEdit != true && submitted != true && vm.isStick && vm.device.devicenumber != null && vm.device.devicenumber != '') {
                    devicesfberef = new Firebase(config.firebaseUrl+'devices/'+vm.device.devicenumber+'/');
                    devicesfberef.on("value", function(snapshot) {
                        if(snapshot.val() == null)
                            vm.isdeviceavailable = true;
                        else
                            vm.isdeviceavailable = false;
                        utility.applyscope($scope);
                    }, function (errorObject) {
                        utility.errorlog("The device read failed: " ,errorObject);
                    });
                }
                else {
                    vm.isdeviceavailable = null;
                }
            }

            vm.hidedevicecheck = function () {
                vm.isdeviceavailable = null;
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

                var deviceobj = {};
                deviceobj.vehiclenumber = vm.device.vehiclenumber;
                deviceobj.type = vm.device.type;
                deviceobj.vehicletype = vm.device.vehicletype;
                
                if(vm.isDeviceEdit)
                    deviceobj.addedon = vm.device.addedon;
                else
                    deviceobj.addedon = new Date().getTime();

                if(vm.device.drivername != null && vm.device.drivername != undefined && vm.device.drivername != "")
                    deviceobj.drivername  = vm.device.drivername;
                if(vm.device.driverid != null && vm.device.driverid != undefined && vm.device.driverid != "")
                    deviceobj.driverid = vm.device.driverid;
                if(vm.device.drivermobile != null && vm.device.drivermobile != undefined && vm.device.drivermobile != "")
                    deviceobj.drivermobile = vm.device.drivermobile;
                
                devicefberef.set(deviceobj);

                submitted = false;
                spinner.show();

                if(vm.isDeviceEdit)
                    notify.success('Device updated successfully');
                else
                    notify.success('Device added successfully');

                $location.path('/account/devices');
            }

            vm.deletedevice = function() {
                vm.isdelete = true;
            }

            vm.deletecancel = function() {
                vm.isdelete = false;
            }

            vm.deleteConfirm = function () {
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

            $scope.$on('$destroy', function iVeBeenDismissed() {
                if(devicesfberef)
                    devicesfberef.off();
            });
        }
    })();
});