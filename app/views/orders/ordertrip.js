define(['angular',
    'config.route',
    'lib',
    'views/services/triphistory'], function (angular, configroute) {
    (function () {

        configroute.register.controller('ordertrip', ['$rootScope', '$routeParams', '$location', '$scope', 'config', 'notify', 'spinner', 'uiGmapIsReady', 'triphistory', 'utility', ordertrip]);
        function ordertrip($rootScope, $routeParams, $location, $scope, config, notify, spinner, uiGmapIsReady, triphistory, utility) {
            var vm= this;
            vm.pathsource =[];
            vm.showmap= false;
            var mapinstance;
            var infowindow;
            vm.mapOptions = {
                disableDefaultUI:true,    
            }

            activate()

            function activate() {
                utility.setGoogleMapConfig();
                utility.scrollToTop();
                
                $rootScope.routeSelection = 'orders';

                vm.selectedorder = utility.getOrderSelected();
                if(vm.selectedorder) {
                    getTripHistory();
                }
                else {
                    $location.path('/order');
                }
            }

            function getTripHistory() {
                spinner.show();
                return triphistory.getTripHistory(vm.selectedorder.deviceid, 
                    vm.selectedorder.starttimestamp, vm.selectedorder.endtimestamp).then(getTripHistoryCompleted, getTripHistoryFailed);
            }

            function getTripHistoryCompleted (data) {
                spinner.hide();
                if(data.length > 0) {
                    vm.showmap= true;  
                    var centerindex = Math.floor(data.length/2);
                    vm.map = { center: { latitude: data[centerindex].latitude, longitude: data[centerindex].longitude }, zoom: 15 };
                    
                    vm.startmarker = {
                        id: 1,
                         coords: {
                           latitude: data[0].latitude,
                           longitude: data[0].longitude
                        },
                        options: { 
                            draggable: false, 
                            icon: 'assets/images/greenmarker.png',
                        },
                    };

                    vm.endmarker = {
                        id: 2,
                         coords: {
                           latitude: data[(data.length-1)].latitude,
                           longitude: data[(data.length-1)].longitude
                        },
                        options: { 
                            draggable: false, 
                            icon: 'assets/images/redmarker.png',
                        },
                    }

                    var flightPlanCoordinates = [];
                    for(var i=0; i<data.length; i++) {
                        flightPlanCoordinates.push(new google.maps.LatLng(data[i].latitude, data[i].longitude));
                    }

                    var flightPath = new google.maps.Polyline({
                         path: flightPlanCoordinates,
                         geodesic: true,
                         strokeColor: '#00A0FF',
                         strokeOpacity: 1.0,
                         strokeWeight: 4
                    });


                    utility.applyscope($scope);

                    uiGmapIsReady.promise(1).then(function(instances) {
                        mapinstance = instances[0].map;
                        flightPath.setMap(mapinstance);
                        infowindow = new google.maps.InfoWindow({
                            content: ''
                        });
                    }, function(error){
                        utility.errorlog(error);
                        window.location.reload();
                    });
                }
                else {
                   notify.warning("Selected order doesn't have trip details");
                   vm.gotoorder();
                }
            }

            function getTripHistoryFailed(){
                spinner.hide();
                notify.error('Something went wrong, try after some time');
                return;
            }

            vm.gotoorder = function() {
                $location.path('/order');
            }
        }
    })();
});