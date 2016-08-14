define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {
        
        configroute.register.controller('live', ['$compile', '$rootScope', '$scope', 'config', 'notify', 'spinner', 'uiGmapIsReady', 'uiGmapGoogleMapApi', 'sessionservice', 'utility', live]);
        function live($compile, $rootScope, $scope, config, notify, spinner, uiGmapIsReady, uiGmapGoogleMapApi, sessionservice, utility) {
        $rootScope.routeSelection = 'live'
	        var vm = this;
	        var idleCarlist = [];
			var directionsDisplays = [];
			var directionsService;
			var mapinstance;
			var routecolor = ['red', 'green',  'purple', 'orange', 'blue'];
			var infowindow;
			var livecarref;
			var distancefbref;
			var runningcarref;
			var devicedetails;
			var defaultzoom = 14;
			var isunclusterallowed = true;
			var accountid = sessionservice.getaccountId();
			var devicesref = null;
			var previoustwodaytimestamp;

		 	vm.distanceCovered = 0;
		 	vm.showmaps =false;
		 	vm.location = '';
			vm.locationsearch = true;
		 	vm.carsearch = false;
		 	vm.searchoption = "location";
		 	vm.dragMarker = false;
		 	vm.clusterOptions = {
							      averageCenter : true,
							      ignoreHidden : true,
							      imagePath: "assets/images/m"
								};
			vm.docluster = true;
			vm.liverefs = [];
			vm.istracking = false;
			vm.mapOptions = {
				disableDefaultUI: !(utility.IsDesktop()),    
			}
			vm.onlineusers = 0;
			activate();

		 	vm.markersEvents = {
			    click: function (gMarker, eventName, model) {
				    var latlng = new google.maps.LatLng(model.latitude, model.longitude);
				    var geocoder = new google.maps.Geocoder();
			 		geocoder.geocode({ 'latLng': latlng }, function (results, status) {
			            if (status == google.maps.GeocoderStatus.OK) {
			                if (results[0]) {
			                	var sublocality = _.first(_.filter(results[0].address_components, function(address){ return address.types[0].indexOf('sublocality') >= 0}));
			                	if(sublocality == null)
			                		sublocality = _.first(_.filter(results[0].address_components, function(address){ return address.types[0].indexOf('route') >= 0}));
			          			var content = '<div id="infowindow_content"><span style="font-weight: bold;">'+sublocality.long_name+'</span><p>Last updated '+model.time+'.</p><a class="btn btn-xs btn-info" style="margin-left:25%" href="#/activity/'+model.title+'">Go to Activity <i class="glyphicon glyphicon-arrow-right"></i></a></div>';
			          			var compiled = $compile(content)($scope);
						        infowindow.setContent(compiled[0].innerHTML);
						        infowindow.open( mapinstance , gMarker );
			          		}
			            }
		            });
			    }
			 };

		 	function activate() {
		 		vm.carsearch = true;
		 		vm.locationsearch = false;
		 		vm.hidenotactivefor2days = true;
		 		var previoustwodate = moment(new Date().setDate(new Date().getDate()-2)).format("MM/DD/YYYY"); 
		 		previoustwodaytimestamp = Date.parse(previoustwodate); 

		 		var ua = navigator.userAgent;
				if( ua.indexOf("Android") >= 0 ) {
				  var androidversion = parseFloat(ua.slice(ua.indexOf("Android")+8));
				  if(androidversion < 5)
				  	isunclusterallowed = false;
				}

		 		utility.setGoogleMapConfig();

		 		vm.islocationsearhced = true;
		 		
			 	spinner.show();
			 	getOfflineOnlineDeviceCount();
				getlivecardata();
				getDistance();

				vm.map = { center: { latitude: 11, longitude: 77 }, zoom: defaultzoom };
				navigator.geolocation.getCurrentPosition(currentPositionCallback);
		 	}

		 	function currentPositionCallback(position) {
		 		vm.map = { center: { latitude: position.coords.latitude, longitude: position.coords.longitude }, zoom: defaultzoom };
		 	}

		 	function getOfflineOnlineDeviceCount() {
                devicesref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/devices');
                devicesref.on("value", function(snapshot) {
                    vm.onlineusers = 0;
                    if(snapshot.val() != null && snapshot.val() != undefined) {
                        accountdevices = snapshot.val();
                        for(prop in accountdevices) {
                            if(accountdevices[prop].activity != null && accountdevices[prop].activity != undefined) {
                                if ((moment(accountdevices[prop].activity.date).format('DD/MM/YYYY') == moment(new Date()).format('DD/MM/YYYY')) && accountdevices[prop].activity.login == true)
                                    vm.onlineusers = vm.onlineusers + 1;
                            }
                        }
                        utility.applyscope($scope);
                    }
                }, function (errorObject) {
                });
            }

		 	function getlivecardata() {
		 		livecarref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/livecars');
				livecarref.once("value", function(snapshot) {
					if(snapshot.val()) {
				  		livecarsmodel(snapshot.val());
				  		childAddedEvent();
				  	}
				  	else {
				  		spinner.hide();
			 			vm.cars = {};
			 			vm.cars.models = [];
				  		setGoogleMaps()
				  		utility.applyscope($scope);
				  	}

				}, function (errorObject) {
				  	utility.errorlog("The livecars read failed: " , errorObject);
				});

				livecarref.on('child_removed', function(oldChildSnapshot) {
  					var carmodel = _.first(_.filter(vm.cars.models, function(car){ return car.id == oldChildSnapshot.key()}));
  					vm.cars.models.pop(carmodel);
				});

		 	}

		 	function childAddedEvent() {
		 		livecarref.on('child_added', function(childSnapshot) {
					var devicedetails = sessionservice.getAccountDevices();
			 		var vehiclenumber = devicedetails[childSnapshot.key()].vehiclenumber;
			 		if(_.filter(vm.carlist, function(car) { return car.name == vehiclenumber}).length == 0) {
			 			var childdata = childSnapshot.val();
			 			if((vm.hidenotactivefor2days == true && childdata.locationtime >= previoustwodaytimestamp) || vm.hidenotactivefor2days == false) {
							vm.carlist.push({name : vehiclenumber});
							vm.cars.models.push(getLiveCarObject(childdata, childSnapshot.key(), vehiclenumber));
							utility.applyscope($scope);
						}
					}
				});
		 	}

		 	function getDistance() {
				var newdate = new Date();
				newdate.setDate(newdate.getDate() - 1);
				var previousday = moment(new Date(newdate)).format('YYYYMMDD');

				var pdistancefbref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/activity/daily/'+previousday);
				pdistancefbref.once("value", function(snapshot) {
				  	vm.previousdaydistance = snapshot.val() != null ? snapshot.val().distance : 0; 
					getCurrentdayDistance();
				}, function (errorObject) {
				  	utility.errorlog("The previous day distance read failed: " , errorObject);
				});
		 	}

		 	function getCurrentdayDistance() {
		 		var currentday = moment().format("YYYYMMDD");
				distancefbref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/activity/daily/'+currentday);
				distancefbref.on("value", function(snapshot) {
				  	vm.distanceCovered = snapshot.val() != null && snapshot.val().distance != null? (snapshot.val().distance.toFixed(2)) : 0; 

				  	var distancex =  vm.previousdaydistance / 24;
				  	var time = moment().format("HH.mm");
				  	vm.isUP = vm.distanceCovered >= (distancex * time);

				  	utility.applyscope($scope);
				}, function (errorObject) {
				  	utility.errorlog("The current day distance read failed: " , errorObject);
				});
		 	}

			vm.visibilityofdevice = function() {
				getlivecardata();
			}

		 	vm.searchOptionChanged = function(searchoption){
			 	if(searchoption == 'location'){
				 	vm.locationsearch = true;
				 	vm.carsearch = false;
				 	vm.carsearchselected = null;
				 	vm.islocationsearhced = true;
			 	}
			 	else {
					vm.locationsearch = false;
					vm.carsearch = true;
					vm.carsearchselected = null;
					vm.islocationsearhced = false;
			 	}
		 	}

		 	vm.carsearched = function($item, $model, $label) {
		 		utility.closekeyboard($('#txtcarsearch'));
		 		vm.map.zoom = 16;
		 		vm.map.center.latitude = $item.latitude;
		 		vm.map.center.longitude = $item.longitude;
			}

			vm.showDragMarker = function() {
			 	vm.dragMarker = !vm.dragMarker;
			 	if(vm.dragMarker) {
			 	vm.marker.coords.latitude =  vm.map.center.latitude;
			 	   vm.marker.coords.longitude =   vm.map.center.longitude;
			 	   calculateDistances();
			 	}
			 	else {
			 		vm.marker.coords.latitude = 1000000000;
			 	   	vm.marker.coords.longitude = 1000000000;
				 	for(var i=0; i<idleCarlist.length; i++){
						idleCarlist[i].options.labelContent = idleCarlist[i].title;
						idleCarlist[i].options.labelClass = 'tm-marker-label';
						idleCarlist[i].options.labelAnchor = '22 0'
					}
					idleCarlist=[];
			 	}
		 	}

		 	vm.marker = {
			    id: 1,
			     coords: {
			       latitude: 1000000000,
			       longitude: 1000000000
			    },
		     	options: { draggable: true, icon: 'assets/images/user-marker2-small.png' },
		     	events: {
				        dragend: function (marker, eventName, args) {
				        var lat = marker.getPosition().lat();
				        var lng = marker.getPosition().lng();
			 	 		calculateDistances();
			 	 		vm.cars.models = vm.cars.models;
		       		}
		     	}
		    };

		 	function livecarsmodel(data) {
			 	devicedetails = sessionservice.getAccountDevices();
			 	vm.cars = {};
			 	vm.cars.models =[];
			 	vm.carlist =[];

			 	for(property in data) {
			 		if(property != undefined) {
			 			if((vm.hidenotactivefor2days == true && data[property].locationtime >= previoustwodaytimestamp) || vm.hidenotactivefor2days == false) {
					 		var livecarobj  = data[property];
					 		var vehiclenumber = devicedetails[property].vehiclenumber;
							vm.carlist.push({name : vehiclenumber});
							vm.cars.models.push(getLiveCarObject(livecarobj, property, vehiclenumber));
						}
					 }
				 	utility.applyscope($scope);
				 	setGoogleMaps();
				}
			}

			function getVechileType(property) {
				return devicedetails[property].vehicletype ? devicedetails[property].vehicletype : 'car';
			}

		 	function getLiveCarObject(livecarobj, property, vehiclenumber) {
		 		var isIdle = getIsIdle(livecarobj);
		 		return {
				 	latitude: livecarobj.latitude,
				 	longitude: livecarobj.longitude,
				 	title: vehiclenumber,
				 	id : property,
				 	isIdle: isIdle,
				 	time : getTimeStamp(livecarobj.locationtime),
				 	options: {
					   	labelContent: vehiclenumber, 
					   	labelClass: ((isIdle && vm.dragMarker) ? 'tm-callout' : 'tm-marker-label'),
					   	icon: utility.getVehicleImageUrl(getVechileType(property), isIdle),
					   	labelAnchor: ((isIdle && vm.dragMarker) ? '40 100' : '22 0')
					}
				}
			}

			function getIsIdle(livecarobj) {
				var isIdle = livecarobj.running ? !livecarobj.running: true;
		 		return isIdle;
			}

		 	function getTimeStamp(unixtimestamp){
				return moment((unixtimestamp)).fromNow();
		 	}

		 	function calculateDistances() {
			 	var dest1 = new google.maps.LatLng(vm.marker.coords.latitude, vm.marker.coords.longitude);
			 	var origins = [];
			 	idleCarlist = [];
			 	for(var i=0 ; i<vm.cars.models.length; i++) {
				 	if(vm.cars.models[i].isIdle === true) {
					 	idleCarlist.push(vm.cars.models[i]);
					 	origins.push(new google.maps.LatLng(vm.cars.models[i].latitude,vm.cars.models[i].longitude));
				 	}
		 		}

				var service = new google.maps.DistanceMatrixService();
				service.getDistanceMatrix(
			    {
				    origins: origins,
				    destinations: [dest1],
				    travelMode: google.maps.TravelMode.DRIVING,
				    unitSystem: google.maps.UnitSystem.METRIC,
				    avoidHighways: false,
				    avoidTolls: false
			    }, callback);
			}

			function callback(response, status) {
				if(status == 'OK') {
					for(var i=0; i<response.rows.length; i++){
						var element = response.rows[i].elements[0];
						if(element.status == 'OK' && element.distance.value <= 5000) {
							var distance = element.distance.text;
							var duration = element.duration.text;
							idleCarlist[i].options.labelContent = '<div class="callout top">'+idleCarlist[i].title + '<br/>'+distance + ' | '+duration +'</div>';
							idleCarlist[i].options.labelClass = 'tm-callout';
							idleCarlist[i].options.labelAnchor = '40 100';
						}
						else if(element.status == 'OK' && element.distance.value > 5000) {
							var distance = element.distance.text;
							var duration = element.duration.text;
							idleCarlist[i].options.labelContent = '<div class="callout top">'+idleCarlist[i].title + '<br/>> 5 km</div>';
							idleCarlist[i].options.labelClass = 'tm-callout';
							idleCarlist[i].options.labelAnchor = '40 100';
						}
						else if (element.status == 'ZERO_RESULTS') {
							idleCarlist[i].options.labelContent = '<div class="callout top">'+idleCarlist[i].title + '<br/>Not found</div>';
							idleCarlist[i].options.labelClass = 'tm-callout';
							idleCarlist[i].options.labelAnchor = '40 100';
						}
						else {
							idleCarlist[i].options.labelContent = idleCarlist[i].title;
							idleCarlist[i].options.labelClass = 'tm-marker-label';
							idleCarlist[i].options.labelAnchor = '22 0'
						}
					}
				}
				utility.applyscope($scope);
			}

		 	function setGoogleMaps(){
				vm.showmaps =true;
		       	uiGmapGoogleMapApi.then(function(maps) {
		       		maps.visualRefresh = true;
				   	infowindow = new google.maps.InfoWindow({
			  			content: ''
					});

		   			spinner.hide();
		   		});
		   	}

		   	$rootScope.$on('search:location', function (event, data) {
			   	vm.map.zoom = 15;
			   	vm.map.center.latitude = data.lat;
		 		vm.map.center.longitude = data.lng;
		 		utility.applyscope($scope);
			});

			uiGmapIsReady.promise(1).then( function(instances) {
			   	directionsService = new google.maps.DirectionsService();
			   	mapinstance = instances[0].map;
				vm.mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
			   	setTracking();
			   	var update_timeout = null;

			   	//This event is fired when the map becomes idle after panning or zooming.
			  	google.maps.event.addListener(mapinstance, 'idle', function() {
			  		if(isunclusterallowed) {
				  		var zoomLevel = mapinstance.getZoom();
				  		if(zoomLevel >= 16) 
					  		vm.docluster = false;
					  	else
					  		vm.docluster = true;
					}

			  		if(update_timeout)
			  			clearTimeout(update_timeout);

			  		update_timeout = setTimeout(function() {
				        setTracking();
				    }, 2000); 
		  		});
			}, function(error){
				utility.errorlog(error);
				window.location.reload();
			});

			function setTracking() {
				var zoomLevel = mapinstance.getZoom();
		  		vm.istracking = zoomLevel >= 14;

			  	for(var i = 0 ; i < vm.liverefs.length ; i++) {
			  		vm.liverefs[i].off();
			  	}

			  	vm.liverefs = [];

				if(zoomLevel >= 14) {
				  	for (var i=0; i < vm.cars.models.length; i++) {
					    if (mapinstance.getBounds().contains(new google.maps.LatLng(vm.cars.models[i].latitude, vm.cars.models[i].longitude))) {

							var fbref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/livecars/'+vm.cars.models[i].id);
							if(vm.liverefs.indexOf(fbref) < 0 ) {
								vm.liverefs.push(fbref);
								fbref.on("value", function(snapshot) {
									updatemarker(snapshot.val(), snapshot.key());
								}, function (errorObject) {
								  	utility.errorlog("The live car read failed: " , errorObject);
								});
							}					    
						} 
					}
				}
				utility.applyscope($scope);
			}
			
			function updatemarker(livecarobj, key) {
				devicedetails = sessionservice.getAccountDevices();
				if(livecarobj) {
					var cardetail =  _.first(_.filter(vm.cars.models, function(carmodel){ return carmodel.id == key}));
				 	if(cardetail) {
				 		var isIdle = getIsIdle(livecarobj);

					 	cardetail.latitude = livecarobj.latitude;
					 	cardetail.longitude = livecarobj.longitude;
					 	cardetail.time = getTimeStamp(livecarobj.locationtime),
					 	cardetail.isIdle = isIdle;
					 	if(cardetail.isIdle === false)
						 	cardetail.options.labelContent = cardetail.title;
					 	cardetail.options.labelClass = ((isIdle && vm.dragMarker) ? 'tm-callout' : 'tm-marker-label'),
					   	cardetail.options.icon = utility.getVehicleImageUrl(getVechileType(key), isIdle),
					   	cardetail.options.labelAnchor = ((isIdle && vm.dragMarker) ? '40 100' : '22 0')
				 	}
				  	utility.applyscope($scope);
				}
			}

			$scope.$on('$destroy', function iVeBeenDismissed() {
				if(livecarref)
					livecarref.off();

				if(distancefbref)
					distancefbref.off();

				if(runningcarref)
					runningcarref.off();

				/*if(devicesref)
					devicesref.off();*/

				for(var i = 0 ; i < vm.liverefs.length ; i++) {
				  	vm.liverefs[i].off();
				}
			});
		}
	})();
});