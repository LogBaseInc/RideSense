define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('devices', ['$rootScope','$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', devices]);
        function devices($rootScope, $scope, $location, config, spinner, sessionservice, utility) {
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
                vm.devicesdetails = [];
                for(var property in data) {
                    vm.devices.push({
                        devicenumber : property,
                        boughton: moment(data[property].addedon).format('MMM DD, YYYY'),
                        displayvehiclenumber: data[property].vehiclenumber.length > 25 ? (data[property].vehiclenumber.substring(0,25)+" ...") : data[property].vehiclenumber,
                        drivername : data[property].drivername,
                    });

                    vm.devicesdetails.push({
                        devicenumber : property,
                        boughton: moment(data[property].addedon).format('MMM DD, YYYY'),
                        drivername : data[property].drivername,
                        driverid : data[property].driverid,
                        drivermobile : data[property].drivermobile,
                        vehiclenumber: data[property].vehiclenumber,
                        type : data[property].type ? data[property].type : 'stick',
                    });
                }

                spinner.hide();($scope);
                utility.applyscope($scope);
            }

            vm.buydevice = function(){
                utility.setDeviceSelected(null);
                $location.path('/account/device');
            }

            vm.editdevice = function(index){
                utility.setDeviceSelected(vm.devicesdetails[index]);
                $location.path('/account/device');
            }
        }
    })();
});