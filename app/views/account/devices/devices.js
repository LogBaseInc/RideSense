define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('devices', ['ngDialog', devices]);
        function devices(ngDialog) {
            var vm = this;

            activate();

            function activate(){
            	getDevices();
            }

            function getDevices(){
            	vm.devices = [];
            	vm.devices.push({
            		devicenumber : '1234567890',
            		boughton: 'May 1, 2015',
            		carnumber: 'TN 37 AY 5306',
            		licensenumber: 'AT1235',
            		modelnumber: 'TACWS1234'
            	});
            	vm.devices.push({
            		devicenumber : '1234567891',
            		boughton: 'May 5, 2015',
            		carnumber: 'TN 37 AY 5307',
            		licensenumber: 'AT12345',
            		modelnumber: 'TAASWS34234'
            	});
            	vm.devices.push({
            		devicenumber : '1234567892',
            		boughton: 'May 5, 2015',
            		carnumber: 'TN 37 AY 5308',
            		licensenumber: 'AT12345SO',
            		modelnumber: 'TAASWS34234'
            	});
            }

            vm.buydevice = function(){
                ngDialog.open({
                    template: 'devicedialog',
                    controller: 'device',
                    className: 'ngdialog-theme-default',
                    data: '{"device" : null}'
                });
            }

            vm.editdevice = function(device){
                ngDialog.open({
                    template: 'devicedialog',
                    controller: 'device',
                    className: 'ngdialog-theme-default',
                    data: {device: angular.copy(device)}
                });
            }
        }
    })();
});