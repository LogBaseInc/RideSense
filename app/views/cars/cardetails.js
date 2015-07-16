define(['angular',
    'config.route',
    'moment',
    'bootstrap-datepicker'], function (angular, configroute, moment) {
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
            
            activate();

            function activate() {
                $rootScope.routeSelection = 'cars';
                vm.selecteddate = moment(new Date()).format('DD/MM/YYYY');

                getCarList();

                if($routeParams.selectedcar) {
                    vm.showallcars = false;
                    vm.carsearchselected = $routeParams.selectedcar;
                    getTrips($routeParams.selectedcar);
                }
                else {
                    vm.showallcars = true;
                    getAllCarDistanceDetails();
                }

                vm.totalcars = Object.keys(sessionservice.getAccountDevices()).length;
            }
          
            vm.carsearched = function($item, $model, $label){
                spinner.show(); 
                vm.selecteddate = moment(new Date()).format('DD/MM/YYYY');
                vm.showallcars = false;
                vm.selectedcar = $item;
                $routeParams.selectedcar = $item.title;
                vm.totalDistance = 0;
                allcaractivityref.off("value");
                getCarDistanceDetail(vm.selectedcar.devicenumber);
                getTrips(vm.selectedcar.devicenumber);
            }

            vm.datechanged = function () {
                getTrips(vm.selectedcar.devicenumber);
                
            }

            vm.tripClicked = function (trip) {

            }

            vm.clearcar = function() {
                if(vm.showallcars == false) {
                    vm.showallcars = true;
                    vm.carsearchselected = null;
                    getAllCarDistanceDetails();
                }
            }

            function getCarList() {
                vm.cars = [];
                var devices = sessionservice.getAccountDevices();
                for(property in devices) {
                    var cardetail = {
                        title : devices[property].vehiclenumber, 
                        devicenumber : property,
                        drivername : devices[property].drivername,
                        drivermobile : devices[property].drivermobile
                    };

                    if($routeParams.selectedcar == devices[property].vehiclenumber) {
                        vm.selectedcar = cardetail;
                        getCarDistanceDetail(vm.selectedcar.devicenumber);
                    }

                    vm.cars.push(cardetail);
                }
            }

            function getTrips(devicenumber) {
                spinner.show(); 
                vm.trips = [];
                var tripref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/trips/devices/'+devicenumber+'/daily/'+getDateRef());
                tripref.once("value", function(snapshot) {
                    var data = snapshot.val();
                    for(property in data) {
                        var tripdetail = {
                            tripid : property,
                            starttime : moment(data[property].starttime).format('HH:MM'),
                            endtime : moment(data[property].endtime).format('HH:MM'),
                            distance : (data[property].endodo - data[property].startodo).toFixed(2),
                            startlatitude : data[property].startlatitude,
                            startlongitude : data[property].startlongitude,
                            endlatitude : data[property].endlatitude,
                            endlongitude : data[property].endlongitude,
                        };
                        vm.trips.push(tripdetail);
                        readlocation(new google.maps.LatLng(tripdetail.startlatitude,tripdetail.startlongitude), tripdetail, true);
                        readlocation(new google.maps.LatLng(tripdetail.endlatitude,tripdetail.endlongitude), tripdetail, false);
                    }
                    spinner.hide(); 
                    sessionservice.applyscope($scope);
                });
            }

            function readlocation(latlng, obj, isStart) {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[0]) {
                            var location =  results[0].address_components[0].short_name;
                            if(results[0].address_components[1])
                                location = location +', '+results[0].address_components[1].short_name;
                            if(results[0].address_components[2])
                                location = location +', '+results[0].address_components[2].short_name;

                            if(isStart)
                                obj.startlocation = location;
                            else
                                obj.endlocation = location;

                            //var strt = results[0].formatted_address;
                            //obj.location = strt.substring(0,strt.indexOf(','));
                            //obj.address = results[1].formatted_address;

                            /*alertslocation.push ({
                                alertid : alertobject.alertid,
                                location : alertobject.location,
                                address : alertobject.address
                            });*/
                            //sessionservice.setAlertsLocation(alertslocation);
                            sessionservice.applyscope($scope);                      }
                    }
                    else {
                        if(isStart)
                            obj.startlocation = 'Start location';
                        else
                            obj.endlocation = 'End location';
                    }
                });
            }

            function getAllCarDistanceDetails() {
                spinner.show();  
                if(selectedcarref) selectedcarref.off("value");              
                allcaractivityref.orderByChild("timestamp").limitToLast(30).on("value", function(snapshot) {
                    setDistanceChartConfig(snapshot.val());
                });
            }

            function getCarDistanceDetail(devicenumber) {
                spinner.show();
                selectedcarref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/devices/'+devicenumber+'/daily/');
                selectedcarref.orderByChild("timestamp").limitToLast(30).on("value", function(snapshot) {
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
                            type: 'line',
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
                            color: 'LightCoral'
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
        }
    })();
});