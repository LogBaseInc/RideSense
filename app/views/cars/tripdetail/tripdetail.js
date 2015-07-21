define(['angular',
    'config.route',
    'lib',
    'views/services/triphistory'], function (angular, configroute) {
    (function () {

        configroute.register.controller('tripdetail', ['$rootScope', '$location', '$scope', 'config', 'notify', 'spinner', 'sessionservice', 'triphistory', tripdetail]);
        function tripdetail($rootScope, $location, $scope, config, notify, spinner, sessionservice, triphistory) {
            var vm= this;
            vm.pathsource =[];
            vm.showmap= false;

            activate()

            function activate() {
                $rootScope.routeSelection = 'cars';
                if($rootScope.selectedtrip) {
                    vm.selecteddate = $rootScope.selecteddate;
                    vm.selectedtrip = $rootScope.selectedtrip;
                    getTripHistory();
                }
                else {
                    $location.path('/cars');
                }
            }

            function getTripHistory() {
                spinner.show();
                return triphistory.getTripHistory(vm.selectedtrip.devicenumber, 
                    vm.selectedtrip.starttimestamp, vm.selectedtrip.endtimestamp).then(getTripHistoryCompleted, getTripHistoryFailed);
            }

            function getTripHistoryCompleted (data) {
                if(data.length > 0) {
                    vm.showmap= true;  
                    spinner.hide();
                    $rootScope.$emit('pathsource', {path:data, brake:null, speedbrake:null});
                    return;
                }
                else {
                   notify.warning("Selected trip doesn't have history");
                   $location.path('/cars'); 
                }
            }

            function getTripHistoryFailed(){
                spinner.hide();
                notify.error('Something went wrong, try after some time');
                return;
            }
        }
    })();
});