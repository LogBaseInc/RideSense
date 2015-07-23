define(['angular',
    'config.route',
    'lib',
    'views/services/triphistory'], function (angular, configroute) {
    (function () {

        configroute.register.controller('tripdetail', ['$rootScope', '$location', '$scope', 'config', 'notify', 'spinner', 'uiGmapIsReady', 'sessionservice', 'triphistory', tripdetail]);
        function tripdetail($rootScope, $location, $scope, config, notify, spinner, uiGmapIsReady, sessionservice, triphistory) {
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
                    var centerindex = Math.floor(data.length/2);
                    vm.map = { center: { latitude: data[centerindex].latitude, longitude: data[centerindex].longitude }, zoom: 15 };
                    
                    var flightPlanCoordinates = [];
                    for(var i=0; i<data.length; i++)
                    {
                        flightPlanCoordinates.push(new google.maps.LatLng(data[i].latitude, data[i].longitude));
                    }

                    var flightPath = new google.maps.Polyline({
                         path: flightPlanCoordinates,
                         geodesic: true,
                         strokeColor: '#00A0FF',
                         strokeOpacity: 1.0,
                         strokeWeight: 4
                    });

                    sessionservice.applyscope($scope);

                    uiGmapIsReady.promise(1).then(function(instances) {
                        var mapinstance = instances[0].map;
                        flightPath.setMap(mapinstance);
                    });
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