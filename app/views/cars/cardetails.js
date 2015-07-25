define(['angular',
    'config.route',
    'moment',
    'lib'], function (angular, configroute, moment) {
    (function () {

        configroute.register.controller('cardetails', ['$rootScope', '$routeParams' ,'$scope', '$location', 'config', 'spinner', 'sessionservice', cardetails]);
        function cardetails($rootScope, $routeParams, $scope, $location, config, spinner, sessionservice) {
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

            activate();

            function activate() {
                $rootScope.routeSelection = 'cars';

                if($rootScope.tripdetails == false) {
                    $rootScope.selecteddate = null;
                    $rootScope.selectedcar = null;
                }

                setSelectedDate();

                if($routeParams.selectedcar) {
                    vm.showallcars = false;
                    $rootScope.selectedcar = $routeParams.selectedcar;
                    vm.carsearchselected = $routeParams.selectedcar;
                }
                else if($rootScope.selectedcar) {
                    vm.showallcars = false;
                    vm.carsearchselected = $rootScope.selectedcar;
                }
                else {
                    vm.showallcars = true;
                    getAllCarDistanceDetails();
                }

                $rootScope.tripdetails = false;
                getCarList();
                vm.totalcars = Object.keys(sessionservice.getAccountDevices()).length;
            }

            function setSelectedDate() {
                if($rootScope.selecteddate) {
                    vm.selecteddate  = $rootScope.selecteddate;
                }
                else {
                    vm.selecteddate = moment(new Date()).format('DD/MM/YYYY');
                    $rootScope.selecteddate  = vm.selecteddate;
                }
            }

            vm.carsearched = function($item, $model, $label) {
                spinner.show(); 
                vm.selecteddate = moment(new Date()).format('DD/MM/YYYY');
                $rootScope.selecteddate  = vm.selecteddate;

                vm.showallcars = false;
                vm.selectedcar = $item;
                $rootScope.selectedcar = $item.vehiclenumber;
                vm.totalDistance = 0;
                allcaractivityref.off("value");
                vm.carlocation = 'Locating...'
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
                $rootScope.selecteddate = date
                vm.selecteddate = date;
                getTrips(vm.selectedcar.devicenumber);
            }

            vm.tripClicked = function (trip) {
                $rootScope.selectedtrip = trip;
                $location.path('/car/trip');
            }

            vm.clearcar = function() {
                if(vm.showallcars == false) {
                    vm.showallcars = true;
                    vm.carsearchselected = null;
                    $rootScope.selecteddate = "";
                    $rootScope.selectedcar = "";
                    if(carLiveRef != "")
                        carLiveRef.off();
                    getAllCarDistanceDetails();
                }
            }

            vm.gotoCarDetail = function () {
                if(carLiveRef != "")
                    carLiveRef.off();
                $rootScope.selecteddevice = vm.selectedcar.devicenumber;
                $location.path('/car/detail');
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
                                    sessionservice.applyscope($scope);
                                }
                            }
                        });
                        sessionservice.applyscope($scope);
                    }
                    else {
                        vm.havelivedata = false;
                    }

                }, function (errorObject) {
                    console.log("The livecars read failed: " + errorObject.code);
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

                    if($rootScope.selectedcar == devices[property].vehiclenumber) {
                        vm.selectedcar = cardetail;
                        getCarLiveData();
                        getCarDistanceDetail(vm.selectedcar.devicenumber);
                    }

                    if($rootScope.selecteddate) {
                        vm.selecteddate = $rootScope.selecteddate;
                        getTrips(vm.selectedcar.devicenumber);
                    }

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
                                devicenumber : devicenumber
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
                    sessionservice.applyscope($scope);
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

                for(var i = 30 ; i >= 0; i --) {
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
                    }

                    if(todaysdate == property) { vm.totalDistance = !isNaN(data[property].distance) ? data[property].distance.toFixed(2) : 0}
                }

                distanceChartConfig();
                spinner.hide();
                sessionservice.applyscope($scope);
            }

            function distanceChartConfig(){
                vm.distanceConfig = {
                    options: {
                        chart: {
                            type: 'column',
                            zoomType: 'x',
                            //backgroundColor: 'WhiteSmoke',
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
                        height: 200
                    }
                };
            }

            function getDateRef() {
                var parts = vm.selecteddate.split('/');
                return moment(new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))).format("YYYYMMDD");
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