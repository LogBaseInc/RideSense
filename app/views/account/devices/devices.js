define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('devices', ['$rootScope','$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', devices]);
        function devices($rootScope, $scope, $location, config, spinner, sessionservice, utility) {
            var vm = this;
            vm.devices = [];

            activate();

            function activate(){
                $rootScope.routeSelection = '';
            	spinner.show();
                var ref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/devices');
                ref.once("value", function(snapshot) {
                    getDevices(snapshot.val());
                }, function (errorObject) {
                    utility.errorlog("The livecars read failed: " ,errorObject);
                });
            }

            function getDevices(data){
                utility.scrollToTop();
                
            	vm.devices = [];
                vm.devicesdetails = [];

                for(var property in data) {
                    if(data[property].vehiclenumber != null && data[property].vehiclenumber != undefined && data[property].vehiclenumber != "" && 
                       data[property].vehicletype != null && data[property].vehicletype != undefined && data[property].vehicletype != "" &&
                       data[property].addedon != null && data[property].addedon != undefined && data[property].addedon != "") {
                        vm.devices.push({
                            devicenumber : property,
                            boughton: moment(data[property].addedon).format('MMM DD, YYYY'),
                            displayvehiclenumber: data[property].vehiclenumber.length > 20 ? (data[property].vehiclenumber.substring(0,20)+"...") : data[property].vehiclenumber,
                            vehicletype : data[property].vehicletype ? data[property].vehicletype : 'car',
                            vehiclenumber: data[property].vehiclenumber,
                            type : data[property].type ? data[property].type : 'stick',
                            addedon : data[property].addedon,
                            appversion : (data[property].appversion != null && data[property].appversion != undefined && data[property].appversion != "") ? data[property].appversion : null
                        });

                        vm.devicesdetails.push({
                            devicenumber : property,
                            boughton: moment(data[property].addedon).format('MMM DD, YYYY'),
                            drivername : data[property].drivername,
                            driverid : data[property].driverid,
                            drivermobile : data[property].drivermobile,
                            vehiclenumber: data[property].vehiclenumber,
                            type : (data[property].type != null && data[property].type != undefined) ? data[property].type : 'stick',
                            vehicletype : data[property].vehicletype ? data[property].vehicletype : 'car',
                            addedon : data[property].addedon
                        });
                    }
                }
                
                vm.devices.sort(SortByDate);
                vm.devicesdetails.sort(SortByDate);

                spinner.hide();
                utility.applyscope($scope);
            }

            function SortByDate(a, b){
              return ((a.addedon > b.addedon) ? -1 : ((a.addedon < b.addedon) ? 1 : 0));
            }


            vm.buydevice = function(){
                utility.setDeviceSelected(null);
                $location.path('/account/device');
            }

            vm.editdevice = function(devicenumber){
                utility.setDeviceSelected(_.first(_.filter(vm.devicesdetails, function(device){ return device.devicenumber == devicenumber})));
                $location.path('/account/device');
            }
        }
    })();
});