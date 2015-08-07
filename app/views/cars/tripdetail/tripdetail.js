define(['angular',
    'config.route',
    'lib',
    'views/services/triphistory'], function (angular, configroute) {
    (function () {

        configroute.register.controller('tripdetail', ['$rootScope', '$routeParams', '$location', '$scope', 'config', 'notify', 'spinner', 'uiGmapIsReady', 'triphistory', 'utility', tripdetail]);
        function tripdetail($rootScope, $routeParams, $location, $scope, config, notify, spinner, uiGmapIsReady, triphistory, utility) {
            var vm= this;
            vm.pathsource =[];
            vm.showmap= false;
            var mapinstance;
            var infowindow;

            activate()

            function activate() {
                utility.scrollToTop();
                $rootScope.routeSelection = 'cars';

                if(utility.getTripSelected()) {
                    setSelectedDate();
                    vm.selectedtrip = utility.getTripSelected();
                    getTripHistory();
                }
                else {
                    $location.path('/cars/'+$routeParams.carnumber);
                }
            }

            function setSelectedDate(){
                vm.selecteddate = moment(utility.getTripDate()).format('MMM DD, YYYY');
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
                        events: {
                        click: function (marker, eventName, args) {
                                infowindow.setContent(vm.selectedtrip.startlocation);
                                infowindow.open(mapinstance , marker);
                            }
                        }
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
                        events: {
                        click: function (marker, eventName, args) {
                                infowindow.setContent(vm.selectedtrip.endlocation);
                                infowindow.open(mapinstance , marker);
                            }
                        }
                    }

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

                    utility.applyscope($scope);

                    uiGmapIsReady.promise(1).then(function(instances) {
                        mapinstance = instances[0].map;
                        flightPath.setMap(mapinstance);
                        infowindow = new google.maps.InfoWindow({
                            content: ''
                        });
                    });
                }
                else {
                   notify.warning("Selected trip doesn't have history");
                   vm.gotoactivity();
                }
            }

            function getTripHistoryFailed(){
                spinner.hide();
                notify.error('Something went wrong, try after some time');
                return;
            }

            vm.gotoactivity = function(){
                $location.path('/cars/'+$routeParams.carnumber);
            }
        }
    })();
});