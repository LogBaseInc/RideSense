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
            vm.mapOptions = {
                disableDefaultUI:true,    
            }

            activate()

            function activate() {
                utility.setGoogleMapConfig();
                utility.scrollToTop();
                
                $rootScope.routeSelection = 'activity';

                if(utility.getTripSelected()) {
                    setSelectedDate();
                    vm.selectedtrip = utility.getTripSelected();
                    getTripHistory();

                    var starttime = new Date(vm.selecteddate + " " +vm.selectedtrip.starttime);
                    var endtime = new Date(vm.selecteddate + " " +vm.selectedtrip.endtime);
                    var diff =  Math.abs(new Date(endtime) - new Date(starttime));
                    var seconds = Math.floor(diff/1000); //ignore any left over units smaller than a second
                    var minutes = Math.floor(seconds/60); 
                    seconds = seconds % 60;
                    var hours = Math.floor(minutes/60);
                    minutes = minutes % 60;

                    if(hours > 0)
                        vm.time = hours + " hrs" + " " + (minutes > 0 ? (minutes + " mins") : "");
                    else if(minutes > 0)
                        vm.time = minutes + " mins";
                    else
                        vm.time = seconds + " secs";

                }
                else {
                    $location.path('/activity/'+$routeParams.carnumber);
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
                $location.path('/activity/'+$routeParams.carnumber);
            }
        }
    })();
});