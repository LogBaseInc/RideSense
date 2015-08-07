define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('cardetails', ['$rootScope', '$routeParams' ,'$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', cardetails]);
        function cardetails($rootScope, $routeParams, $scope, $location, config, spinner, sessionservice, utility) {
            var vm = this;
            vm.distanceData = [];
            vm.showallcars = true;
            var todaysdate = '';
            vm.totalDistance = 0;
            vm.totalcars = 0;
            vm.selectedcar = {};
            var allcaractivityref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/daily');
            var selectedcarref;
            var carLiveRef = ""
            vm.isdatesupport = false;
            vm.totaldistanceof30days = 0;

            activate();

            function activate() {
                $rootScope.routeSelection = 'cars';
                isDateFiledSupported();

                if($routeParams.selectedcar) {
                    vm.showallcars = false;
                    vm.carsearchselected = $routeParams.selectedcar;
                }
                else {
                    vm.showallcars = true;
                    getAllCarDistanceDetails();
                }

                setSelectedDate();

                getCarList();
                vm.totalcars = Object.keys(sessionservice.getAccountDevices()).length;
            }

            function setSelectedDate() {
                if(vm.showallcars == false && utility.getTripDate()) 
                    vm.selecteddate  = utility.getTripDate();
                else
                    setTodayDate();
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

            function setTodayDate() {
                vm.selecteddate = vm.isdatesupport ? new Date() : moment(new Date()).format('DD/MM/YYYY');
            }

            vm.carsearched = function($item, $model, $label) {
                spinner.show();
                utility.closekeyboard($('#txtcarsearch'));

                setTodayDate();

                vm.showallcars = false;
                vm.selectedcar = $item;
                vm.totalDistance = 0;
                allcaractivityref.off("value");
                vm.carlocation = 'Locating...';

                getCarLiveData();
                getCarDistanceDetail(vm.selectedcar.devicenumber);
                getTrips(vm.selectedcar.devicenumber);
            }

            vm.carsearchedchanged = function() {
                if(vm.carsearchselected == null || vm.carsearchselected == '')
                    vm.clearcar();
            }

            $rootScope.$on('cardetail:dateselected', function (event, data) {
                if(data.date.format('DD/MM/YYYY') != vm.selecteddate)
                    vm.datechanged(data.date.format('DD/MM/YYYY'));
            });

            vm.datechanged = function (date) {
                if(date == null) {
                    setTodayDate();
                    date = vm.selecteddate;
                }
                else 
                    vm.selecteddate = date;
                getTrips(vm.selectedcar.devicenumber);
            }

            vm.tripClicked = function (trip) {
                utility.setTripSelected(trip);
                utility.setTripDate(vm.selecteddate);
                $location.path('/car/trip/'+vm.selectedcar.vehiclenumber);
            }

            vm.clearcar = function() {
                if(vm.showallcars == false) {
                    vm.showallcars = true;
                    vm.carsearchselected = null;
                    utility.setTripDate(null);

                    if(carLiveRef != "")
                        carLiveRef.off();
                    
                    vm.trips = [];
                    vm.tripsBy3 = [];
                    vm.tripsplit = [];

                    getAllCarDistanceDetails();
                }
            }

            vm.gotoCarDetail = function () {
                if(carLiveRef != "")
                    carLiveRef.off();
                utility.setTripDate(vm.selecteddate);
                $location.path('/car/detail/'+vm.selectedcar.devicenumber+'/'+vm.selectedcar.vehiclenumber);
            }

            function getCarLiveData(){
                if(carLiveRef != "")
                    carLiveRef.off();

                carLiveRef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/livecars/'+vm.selectedcar.devicenumber);
                carLiveRef.on("value", function(snapshot) {
                    var data = snapshot.val();
                    if(data) {
                        vm.havelivedata = true;
                        vm.carrunning = data.running;
                        var latlng = new google.maps.LatLng(data.latitude, data.longitude);
                        var geocoder = new google.maps.Geocoder();
                        geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                if (results[0]) {
                                    var sublocality = _.first(_.filter(results[0].address_components, function(address){ return address.types[0].indexOf('sublocality') >= 0}));
                                    if(sublocality == null)
                                        sublocality = _.first(_.filter(results[0].address_components, function(address){ return address.types[0].indexOf('route') >= 0}));
                                    vm.carlocation = sublocality.long_name;
                                    utility.applyscope($scope);
                                }
                            }
                        });
                        utility.applyscope($scope);
                    }
                    else {
                        vm.havelivedata = false;
                    }

                }, function (errorObject) {
                    utility.errorlog("The livecars read failed: " , errorObject);
                });

            }

            function getCarList() {
                vm.cars = [];
                vm.searchlist = [];
                var devices = sessionservice.getAccountDevices();
                for(property in devices) {
                    var cardetail = {
                        title : devices[property].vehiclenumber, 
                        vehiclenumber : devices[property].vehiclenumber, 
                        devicenumber : property,
                        drivername : devices[property].drivername,
                        drivermobile : devices[property].drivermobile,
                        type : 'Car'
                    };

                    if(vm.carsearchselected == devices[property].vehiclenumber) {
                        vm.selectedcar = cardetail;
                        getCarLiveData();
                        getCarDistanceDetail(vm.selectedcar.devicenumber);
                    }
                    if(vm.showallcars == false)
                        getTrips(vm.selectedcar.devicenumber);

                    vm.cars.push(cardetail);
                    vm.cars.push({
                        title : devices[property].drivername, 
                        vehiclenumber : devices[property].vehiclenumber, 
                        devicenumber : property,
                        drivername : devices[property].drivername,
                        drivermobile : devices[property].drivermobile,
                        type : 'Driver'
                    });
                }
            }

            function getTrips(devicenumber) {
                spinner.show(); 
                var tripref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/trips/devices/'+devicenumber+'/daily/'+getDateRef());
                tripref.once("value", function(snapshot) {
                    vm.trips = [];
                    vm.tripsBy3 = [];
                    vm.tripsplit = [];

                    var data = snapshot.val();
                    for(property in data) {
                        if(data[property].endtime) {
                            var tripdetail = {
                                tripid : property,
                                starttimestamp : data[property].starttime,
                                endtimestamp : data[property].endtime,
                                starttime : moment(data[property].starttime).format('hh:mm a'),
                                endtime : moment(data[property].endtime).format('hh:mm a'),
                                distance : data[property].tripdistance ? data[property].tripdistance.toFixed(2) : 0,
                                startlocation : data[property].startaddress,
                                endlocation : data[property].endaddress,
                                vehiclenumber : vm.selectedcar.vehiclenumber,
                                devicenumber : devicenumber,
                                startlatitude : data[property].startlatitude,
                                startlongitude : data[property].startlongitude,
                                endlatitude : data[property].endlatitude,
                                endlongitude : data[property].endlongitude,
                            };
                            vm.trips.push(tripdetail);
                            vm.tripsplit.push(tripdetail);
                            if(vm.tripsplit.length == 3) {
                                vm.tripsBy3.push({trips: vm.tripsplit});
                                vm.tripsplit = [];
                            }
                        }
                    }

                    if(vm.tripsplit.length > 0) {
                        vm.tripsBy3.push({trips: vm.tripsplit});
                        vm.tripsplit = [];
                    }

                    spinner.hide(); 
                    utility.applyscope($scope);
                });
            }
            
            function getAllCarDistanceDetails() {
                spinner.show();  
                if(selectedcarref) selectedcarref.off("value");              
                allcaractivityref.orderByChild("timestamp").limitToLast(30).once("value", function(snapshot) {
                    setDistanceChartConfig(snapshot.val());
                });
            }

            function getCarDistanceDetail(devicenumber) {
                spinner.show();
                selectedcarref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/devices/'+devicenumber+'/daily/');
                selectedcarref.orderByChild("timestamp").limitToLast(30).once("value", function(snapshot) {
                    setDistanceChartConfig(snapshot.val());
                });
            }

            function setDistanceChartConfig(data) {
                vm.distanceData.categories = [];
                vm.distanceData.data = [];
                vm.distanceData.date = [];
                vm.totaldistanceof30days = 0;

                for(var i = 29 ; i >= 0; i --) {
                    var newdate = new Date();
                    newdate.setDate(newdate.getDate() - i);
                    var categoryDate = moment(new Date(newdate)).format('YYYYMMDD');
                    vm.distanceData.categories.push(moment(new Date(newdate)).format('MMM DD'));
                    vm.distanceData.date.push(categoryDate);
                    vm.distanceData.data.push(0);
                    if(i == 0) { todaysdate= categoryDate;}
                }

                for(property in data) {
                    var dateIndex = vm.distanceData.date.indexOf(property);
                    if(dateIndex >= 0) {
                        vm.distanceData.data[dateIndex] = !isNaN(data[property].distance) ? parseFloat(data[property].distance.toFixed(2)) : 0;
                        vm.totaldistanceof30days = vm.totaldistanceof30days + vm.distanceData.data[dateIndex];
                    }

                    if(todaysdate == property) { vm.totalDistance = !isNaN(data[property].distance) ? data[property].distance.toFixed(2) : 0}
                }

                distanceChartConfig();
                spinner.hide();
                utility.applyscope($scope);
            }

            function distanceChartConfig(){
                vm.distanceConfig = {
                    options: {
                        chart: {
                            type: 'column',
                            zoomType: 'x',
                            backgroundColor: '#EFEBE9',
                            marginBottom: 50,
                            events: {
                            load: function (event) {
                                setTimeout( function () {$(window).resize();}, 100);
                            }
                         }
                        },
                        legend: {
                            enabled: false
                        },
                    },
                    credits: {
                        enabled: false
                    },
                    title: {
                        text: ''
                    },
                    series: [{
                            name: 'Distance',
                            data: vm.distanceData.data,
                            color: '#5090C1'
                        }
                    ],
                    xAxis: {
                        categories: vm.distanceData.categories
                    },
                    yAxis: {
                        min: 0,
                        title : 'Distance'
                    },
                    loading: false,
                    size: {
                        height: 175
                    }
                };
            }

            function getDateRef() {
                if(vm.isdatesupport)
                    return moment(vm.selecteddate).format("YYYYMMDD");
                else {
                    var parts = vm.selecteddate.split('/');
                    return moment(new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))).format("YYYYMMDD");
                }
            }

            $scope.$on('$destroy', function iVeBeenDismissed() {
                if(allcaractivityref)
                    allcaractivityref.off();

                if(selectedcarref)
                    selectedcarref.off();

                if(carLiveRef)
                    carLiveRef.off();
            });
        }
    })();
});