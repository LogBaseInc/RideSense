define(['angular',
    'config.route',
    'lib', 
    'views/orders/orderactivity'], function (angular, configroute) {
    (function () {
        configroute.register.controller('cardetails', ['$rootScope', '$routeParams' ,'$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', cardetails]);
        function cardetails($rootScope, $routeParams, $scope, $location, config, spinner, sessionservice, utility) {
            var vm = this;
            var currentmonth;
            var todaysdate = '';
            var accountid = sessionservice.getaccountId();
            var allcaractivityref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/activity/daily');
            var selectedcarref;
            var carLiveRef = ""

            vm.distanceData = [];
            vm.showallcars = true;
            vm.totalDistance = 0;
            vm.totalcars = 0;
            vm.selectedcar = {};
            vm.isdatesupport = false;
            vm.averagedistance = 0;
            vm.orderstripsBy3 = [];
            var orderstripsplit = [];

            vm.errandtripsBy3 = [];
            var errandtripsplit = [];

            activate();

            function activate() {
                $rootScope.routeSelection = 'activity';
                isDateFiledSupported();

                if($routeParams.selectedcar) {
                    vm.showallcars = false;
                    vm.carsearchselected = $routeParams.selectedcar;
                }
                else {
                    vm.showallcars = true;
                    getAllCarDistanceDetails();
                    emitToSelectedUser(null);
                }

                setSelectedDate();
                var month  = new Date().getMonth();
                var year = new Date().getFullYear();
                vm.currentdate = moment(new Date(year, month, 1)).format('MMM DD, YYYY');
                month = month + 1;
                currentmonth = year.toString()+""+(month.toString().length ==1 ? "0"+ month.toString() : month.toString());

                getCarList();
                vm.totalcars = Object.keys(sessionservice.getAccountDevices()).length;
            }

            function setSelectedDate() {
                if(vm.showallcars == false && utility.getTripDate()) 
                    vm.selecteddate = vm.isdatesupport ? utility.getTripDate() :  moment(utility.getTripDate()).format('DD/MM/YYYY');
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
                utility.setTripDate(null);
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

                emitToSelectedUser(vm.selectedcar);
            }

            vm.carsearchedchanged = function() {
                if(vm.carsearchselected == null || vm.carsearchselected == '') {
                    vm.clearcar();
                }
            }

            function emitToSelectedUser(data){
                $rootScope.$emit('activity:usersearched', {user:data});
            }

            $rootScope.$on('datepicker:dateselected', function (event, data) {
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

                utility.setTripDate(vm.selecteddate);
                getTrips(vm.selectedcar.devicenumber);
            }

            vm.tripClicked = function (trip) {
                utility.setTripSelected(trip);
                utility.setTripDate(vm.selecteddate);
                $location.path('/trip/'+vm.selectedcar.vehiclenumber);
            }

            vm.clearcar = function() {
                if(vm.showallcars == false) {
                    vm.showallcars = true;
                    vm.carsearchselected = null;
                    utility.setTripDate(null);

                    if(carLiveRef != "")
                        carLiveRef.off();
                    
                    vm.orderstripsBy3 = [];
                    orderstripsplit = [];

                    vm.errandtripsBy3 = [];
                    errandtripsplit = [];

                    emitToSelectedUser(null);
                    getAllCarDistanceDetails();
                }
            }

            vm.gotoCarDetail = function () {
                if(carLiveRef != "")
                    carLiveRef.off();
                utility.setTripDate(vm.selecteddate);
                $location.path('/activity/detail/'+vm.selectedcar.devicenumber+'/'+vm.selectedcar.vehiclenumber);
            }

            function getOfflineorOnline() {
                if(vm.selectedcar.devicenumber != null && vm.selectedcar.devicenumber != undefined) {
                    vm.isonline = false;
                    var devicesref12 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/devices/'+vm.selectedcar.devicenumber.toString()+"/activity");
                    devicesref12.once("value", function(snapshot) {
                        console.log(snapshot.val());
                        if(snapshot.val() != null && snapshot.val() != undefined) {
                            var data = snapshot.val();
                            if (moment(data.date).format('DD/MM/YYYY') == moment(new Date()).format('DD/MM/YYYY') && data.login == true)
                                vm.isonline = true;
                            utility.applyscope($scope);
                        }
                    }, function (errorObject) {
                    });
                }
            }

            function getCarLiveData(){
                if(carLiveRef != "")
                    carLiveRef.off();

                getOfflineorOnline();

                carLiveRef = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/livecars/'+vm.selectedcar.devicenumber);
                carLiveRef.once("value", function(snapshot) {
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
                    if(vm.showallcars == false) {
                        emitToSelectedUser(vm.selectedcar);
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
                if(devicenumber != null && devicenumber != undefined && devicenumber != "") {
                    getErrandTrips(devicenumber);
                    spinner.show(); 
                    var orderstripref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+devicenumber+"/"+getDateRef());
                    orderstripref.once("value", function(snapshot) {
                        vm.orderstripsBy3 = [];
                        orderstrips = [];
                        orderstripsplit = [];

                        var data = snapshot.val();
                        for(property in data) {
                            var order = data[property];
                            if(order.Pickedon != null && order.Pickedon != undefined && order.Pickedon != "" &&
                               order.Deliveredon != null && order.Deliveredon != undefined && order.Deliveredon != " " &&
                               order.Pickedat != null && order.Pickedat != undefined && order.Pickedat != "" &&
                               order.Deliveredat != null && order.Deliveredat != undefined && order.Deliveredat != " ") {
                                var startlatnlng = order.Pickedat.split(" ");
                                var endlatnlng = order.Deliveredat.split(" ");
                                var vechicle = _.filter(vm.cars, function(car){ return car.devicenumber == devicenumber});

                                var tripdetail = {
                                    tripid : property,
                                    isorder: true,
                                    isfromorderdetail : false,
                                    date : vm.selecteddate,
                                    starttimestamp : new Date(order.Pickedon).getTime(),
                                    endtimestamp : new Date(order.Deliveredon).getTime(),
                                    pickedon : moment(order.Pickedon).format('hh:mm a'),
                                    deliveredon : moment(order.Deliveredon).format('hh:mm a'),
                                    distance : (order.Distance != null && order.Distance != undefined && order.Distance != "") ? (parseFloat(order.Distance).toFixed(2)).replace(".00","") : null,
                                    startlocation : order.Startlocation,
                                    endlocation : order.Endlocation,
                                    vehiclenumber : (vechicle != null && vechicle .length >0 ? vechicle[0].vehiclenumber : ""),
                                    deviceid : devicenumber,
                                    startlatitude : startlatnlng[0],
                                    startlongitude : startlatnlng[1],
                                    endlatitude : endlatnlng[0],
                                    endlongitude : endlatnlng[1],
                                };
                                orderstripsplit.push(tripdetail);
                                if(orderstripsplit.length == 3) {
                                    vm.orderstripsBy3.push({trips: orderstripsplit});
                                    orderstripsplit = [];
                                }
                            }
                        }

                        if(orderstripsplit.length > 0) {
                            vm.orderstripsBy3.push({trips: orderstripsplit});
                            orderstripsplit = [];
                        }

                        spinner.hide(); 
                        utility.applyscope($scope);
                    });
                }
            }

            function getErrandTrips(devicenumber) {
                spinner.show(); 
                var orderstripref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/tasks/'+devicenumber+"/"+getDateRef());
                orderstripref.once("value", function(snapshot) {
                    vm.errandtripsBy3 = [];
                    errandtripsplit = [];

                    var data = snapshot.val();
                    for(property in data) {
                        var task = data[property];
                        if(task.starttime != null && task.starttime != undefined && task.starttime != "" &&
                           task.endtime != null && task.endtime != undefined && task.endtime != " " &&
                           task.startedat != null && task.startedat != undefined && task.startedat != "" &&
                           task.endedat != null && task.endedat != undefined && task.endedat != " ") {
                            var startlatnlng = task.startedat.split(" ");
                            var endlatnlng = task.endedat.split(" ");
                            var vechicle = _.filter(vm.cars, function(car){ return car.devicenumber == devicenumber});

                            var tripdetail = {
                                tripid : property,
                                isorder: false,
                                isfromorderdetail : false,
                                date : vm.selecteddate,
                                starttimestamp : new Date(task.starttime).getTime(),
                                endtimestamp : new Date(task.endtime).getTime(),
                                pickedon : moment(task.starttime).format('hh:mm a'),
                                deliveredon : moment(task.endtime).format('hh:mm a'),
                                distance : (task.distance != null && task.distance != undefined && task.distance != "") ?  (parseFloat(task.distance).toFixed(2)).replace(".00","") : null,
                                startlocation : task.startlocation,
                                endlocation : task.endlocation,
                                vehiclenumber : (vechicle != null && vechicle .length >0 ? vechicle[0].vehiclenumber : ""),
                                deviceid : devicenumber,
                                startlatitude : startlatnlng[0],
                                startlongitude : startlatnlng[1],
                                endlatitude : endlatnlng[0],
                                endlongitude : endlatnlng[1],
                                notes : (task.notes != null && task.notes != undefined && task.notes != "") ? task.notes : null,
                            };

                            errandtripsplit.push(tripdetail);
                            if(errandtripsplit.length == 3) {
                                vm.errandtripsBy3.push({trips: errandtripsplit});
                                errandtripsplit = [];
                            }
                        }
                    }

                    if(errandtripsplit.length > 0) {
                        vm.errandtripsBy3.push({trips: errandtripsplit});
                        errandtripsplit = [];
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
                selectedcarref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/activity/devices/'+devicenumber+'/daily/');
                selectedcarref.orderByChild("timestamp").limitToLast(30).once("value", function(snapshot) {
                    setDistanceChartConfig(snapshot.val());
                });
            }

            function setDistanceChartConfig(data) {
                vm.distanceData.categories = [];
                vm.distanceData.data = [];
                vm.distanceData.date = [];
                vm.averagedistance = 0;
                vm.totalDistance = 0;

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
                    }

                    if(vm.showallcars == false) {
                        if(todaysdate == property) { vm.totalDistance = !isNaN(data[property].distance) ? data[property].distance : 0}
                    }
                    else {
                        if(property.indexOf(currentmonth) == 0) {
                            vm.totalDistance = vm.totalDistance + (!isNaN(data[property].distance) ? data[property].distance : 0);
                        }
                    }
                }

                if(vm.totalDistance > 0) {
                    var curerntday = new Date().getDate();;
                    vm.averagedistance = (vm.totalDistance / curerntday);
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
                if(vm.selecteddate.length == undefined)
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