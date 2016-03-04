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
            vm.distance = 0;
            vm.isdatesupport = false;

            activate()

            function activate() {
                utility.setGoogleMapConfig();
                utility.scrollToTop();
                isDateFiledSupported();

                vm.selectedtrip = utility.getTripSelected();
                if(vm.selectedtrip != null) {
                    if(vm.selectedtrip.isfromorderdetail == true)
                        $rootScope.routeSelection = 'orders';
                    else
                        $rootScope.routeSelection = 'activity';
                    
                    vm.date = (vm.isdatesupport == true ? moment(vm.selectedtrip.date).format('MMM DD YYYY') : moment(utility.getDateFromString(vm.selectedtrip.date)).format('MMM DD YYYY'));

                    var starttime = new Date(vm.date + " " +vm.selectedtrip.pickedon);
                    var endtime = new Date(vm.date + " " +vm.selectedtrip.deliveredon);
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

                    if(vm.selectedtrip) {
                        getTripHistory();
                    }
                    else {
                        $location.path('/order');
                    }
                }
                else {
                    $location.path('/login');
                }
            }

            function isDateFiledSupported(){
                var datefield=document.createElement("input")
                datefield.setAttribute("type", "date")
                if (datefield.type != "date") { //if browser doesn't support input type="date"
                   vm.isdatesupport = false;
                }
                else
                   vm.isdatesupport = true;
            }

            function getTripHistory() {
                spinner.show();
                return triphistory.getTripHistory(vm.selectedtrip.deviceid, 
                    vm.selectedtrip.starttimestamp, vm.selectedtrip.endtimestamp).then(getTripHistoryCompleted, getTripHistoryFailed);
            }

            function getTripHistoryCompleted (data) {
                spinner.hide();
                if(data.length > 0) {
                    vm.distance = 0;
                    for(var i = 0 ;i<(data.length-1); i++) {
                        vm.distance = vm.distance + (calcDistance(data[i].latitude, data[i].longitude, data[i+1].latitude, data[i+1].longitude));
                    }
                    vm.distance = vm.distance.toFixed(0);

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

            vm.gotoactivity = function() {
               $location.path('/activity/'+vm.selectedtrip.vehiclenumber);
            }

            function calcDistance(lat1, lon1, lat2, lon2, unit) {
                unit = "K";
                var radlat1 = Math.PI * lat1/180
                var radlat2 = Math.PI * lat2/180
                var radlon1 = Math.PI * lon1/180
                var radlon2 = Math.PI * lon2/180
                var theta = lon1-lon2
                var radtheta = Math.PI * theta/180
                var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
                dist = Math.acos(dist)
                dist = dist * 180/Math.PI
                dist = dist * 60 * 1.1515
                if (unit=="K") { dist = dist * 1.609344 }
                if (unit=="N") { dist = dist * 0.8684 }
                if(isNaN(dist))
                    dist = 0;
                return dist;
            }
        }
    })();
});