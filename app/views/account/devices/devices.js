define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('devices', ['$scope', 'ngDialog', 'config', 'spinner', 'sessionservice', devices]);
        function devices($scope, ngDialog, config, spinner, sessionservice) {
            var vm = this;

            activate();

            function activate(){
            	spinner.show();
                var ref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/devices');
                ref.on("value", function(snapshot) {
                    getDevices(snapshot.val());
                }, function (errorObject) {
                    console.log("The livecars read failed: " + errorObject.code);
                });
            }

            function getDevices(data){
            	vm.devices = [];
                for(var property in data) {
                    vm.devices.push({
                        devicenumber : property,
                        //boughton: data[property].addedOn,
                        vehiclenumber: data[property].vehiclenumber,
                        displayvehiclenumber: data[property].vehiclenumber.length > 25 ? (data[property].vehiclenumber.substring(0,25)+" ...") : data[property].vehiclenumber
                    });
                }

                spinner.hide();($scope);
                sessionservice.applyscope($scope);
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