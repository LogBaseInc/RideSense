define(['angular',
    'config.route','moment'], function (angular, configroute, moment) {
    (function () {

        configroute.register.controller('devices', ['$rootScope','$scope', '$location', 'config', 'spinner', 'sessionservice', devices]);
        function devices($rootScope, $scope, $location, config, spinner, sessionservice) {
            var vm = this;

            activate();

            function activate(){
                $rootScope.routeSelection = '';
            	spinner.show();
                var ref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/devices');
                ref.once("value", function(snapshot) {
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
                        boughton: moment(data[property].addedon).format('MMM DD, YYYY'),
                        drivername : data[property].drivername,
                        driverid : data[property].driverid,
                        drivermobile : data[property].drivermobile,
                        vehiclenumber: data[property].vehiclenumber,
                        displayvehiclenumber: data[property].vehiclenumber.length > 25 ? (data[property].vehiclenumber.substring(0,25)+" ...") : data[property].vehiclenumber
                    });
                }

                spinner.hide();($scope);
                sessionservice.applyscope($scope);
            }

            vm.buydevice = function(){
                sessionservice.setDeviceSelected(null);
                $location.path('/account/device');
            }

            vm.editdevice = function(device){
                sessionservice.setDeviceSelected(device);
                $location.path('/account/device');
            }
        }
    })();
});