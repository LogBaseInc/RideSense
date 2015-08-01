define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

    	var app = angular.module('rideSenseApp');
		app.config(function(uiGmapGoogleMapApiProvider) {
            uiGmapGoogleMapApiProvider.configure({
                key: 'AIzaSyD0aOSSRwYlmV586w1uIPaOxGIV-6123LU',
                v: '3.17',
                libraries: 'weather,geometry,visualization'
            });
        });

        configroute.register.controller('live', ['$compile', '$rootScope', '$scope', 'config', 'notify', 'spinner', 'uiGmapIsReady', 'uiGmapGoogleMapApi', 'sessionservice', 'utility', live]);
        function live($compile, $rootScope, $scope, config, notify, spinner, uiGmapIsReady, uiGmapGoogleMapApi, sessionservice, utility) {
        $rootScope.routeSelection = 'live'
	        var vm = this;
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
								};
	 		var idleCarlist = [];
			var directionsDisplays = [];
			var directionsService;
			var mapinstance;
			var routecolor = ['red', 'green',  'purple', 'orange', 'blue'];
			var infowindow;
			vm.docluster = true;
			var livecarref;
			var distancefbref;
			var runningcarref;
			vm.liverefs = [];
			vm.istracking = false;

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
			          			var content = '<div id="infowindow_content"><span style="font-weight: bold;">'+sublocality.long_name+'</span><br>Last updated '+model.time+'<br><a style="margin-left:25%" href="#/cars/'+model.title+'"><img src="assets/images/more-details.png"></img></a></div>';
			          			var compiled = $compile(content)($scope);
						        infowindow.setContent(compiled[0].innerHTML);
						        infowindow.open( mapinstance , gMarker );
			          		}
			            }
		            });
			    }
			 };

		 	function activate(){
		 		vm.islocationsearhced = true;

			 	spinner.show();
				getlivecardata();
				getRunningCarCount();
				getDistance();

				vm.map = { center: { latitude: 11, longitude: 77 }, zoom: 13 };
				navigator.geolocation.getCurrentPosition(currentPositionCallback);
		 	}

		 	function currentPositionCallback(position) {
		 		vm.map = { center: { latitude: position.coords.latitude, longitude: position.coords.longitude }, zoom: vm.map.zoom };
		 	}

		 	function getlivecardata() {
		 		livecarref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/livecars');
				livecarref.once("value", function(snapshot) {
					if(snapshot.val()) {
				  		livecarsmodel(snapshot.val());
				  		childAddedEvent();
				  	}
				  	else {
				  		spinner.hide();
			 			vm.cars = {};
			 			vm.cars.models = [];
				  		setGoogleMaps(null,null)
				  		utility.applyscope($scope);
				  	}

				}, function (errorObject) {
				  	console.log("The livecars read failed: " + errorObject.code);
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
						vm.carlist.push({name : vehiclenumber});
						vm.cars.models.push(getLiveCarObject(childSnapshot.val(), childSnapshot.key(), vehiclenumber));
						utility.applyscope($scope);
					}
				});
		 	}

		 	function getRunningCarCount() {
		 		runningcarref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/livecount/running');
				runningcarref.on("value", function(snapshot) {
					if(snapshot.val())
				  		vm.activeCabs =  snapshot.val();
				  	else
				  		vm.activeCabs = 0;
				  	utility.applyscope($scope);

				}, function (errorObject) {
				  	console.log("The running count failed: " + errorObject.code);
				});
		 	}

		 	function getDistance() {
				var newdate = new Date();
				newdate.setDate(newdate.getDate() - 1);
				var previousday = moment(new Date(newdate)).format('YYYYMMDD');

				var pdistancefbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/daily/'+previousday);
				pdistancefbref.once("value", function(snapshot) {
				  	vm.previousdaydistance = snapshot.val() != null ? snapshot.val().distance : 0; 
					getCurrentdayDistance();
				}, function (errorObject) {
				  	console.log("The previous day distance read failed: " + errorObject.code);
				});
		 	}

		 	function getCurrentdayDistance() {
		 		var currentday = moment().format("YYYYMMDD");
				distancefbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/daily/'+currentday);
				distancefbref.on("value", function(snapshot) {
				  	vm.distanceCovered = snapshot.val() != null ? (snapshot.val().distance.toFixed(2)) : 0; 

				  	var distancex =  vm.previousdaydistance / 24;
				  	var time = moment().format("HH.mm");
				  	vm.isUP = vm.distanceCovered >= (distancex * time);

				  	utility.applyscope($scope);
				}, function (errorObject) {
				  	console.log("The current day distance read failed: " + errorObject.code);
				});
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
			 	setGoogleMaps($item.latitude, $item.longitude, 15);
			 	utility.closekeyboard($('#txtcarsearch'));
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
						idleCarlist[i].options.labelAnchor = '0 0'
					}
					idleCarlist=[];
					clearRoutes();
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
			 	var devicedetails = sessionservice.getAccountDevices();
			 	vm.cars = {};
			 	vm.cars.models =[];
			 	vm.carlist =[];

			 	for(property in data) {
			 		if(property != undefined) {
				 		var livecarobj  = data[property];
				 		var vehiclenumber = devicedetails[property].vehiclenumber;
						vm.carlist.push({name : vehiclenumber});
						vm.cars.models.push(getLiveCarObject(livecarobj, property, vehiclenumber));
					 }
				 	utility.applyscope($scope);
				 	setGoogleMaps(null, null);
				}
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
					   	labelClass: ((isIdle && vm.dragMarker) ? 'tm-marker-label-distance' : 'tm-marker-label'),
					   	icon: (isIdle ? 'assets/images/car-parked.png' : 'assets/images/car-moving.png'),
					   	labelAnchor: ((isIdle && vm.dragMarker) ? '20 60' : '0 0')
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
							idleCarlist[i].options.labelContent = idleCarlist[i].title + '<div>'+distance + ' | '+duration +'</div>';
							idleCarlist[i].options.labelClass = 'tm-marker-label-distance';
							idleCarlist[i].options.labelAnchor = '20 60';
						}
						else if(element.status == 'OK' && element.distance.value > 5000) {
							var distance = element.distance.text;
							var duration = element.duration.text;
							idleCarlist[i].options.labelContent = idleCarlist[i].title + '<div>> 5 km</div>';
							idleCarlist[i].options.labelClass = 'tm-marker-label-distance';
							idleCarlist[i].options.labelAnchor = '20 60';
						}
						else if (element.status == 'ZERO_RESULTS') {
							idleCarlist[i].options.labelContent = idleCarlist[i].title + '<div>Not found</div>';
							idleCarlist[i].options.labelClass = 'tm-marker-label-distance';
							idleCarlist[i].options.labelAnchor = '20 60';
						}
						else {
							idleCarlist[i].options.labelContent = idleCarlist[i].title;
							idleCarlist[i].options.labelClass = 'tm-marker-label';
							idleCarlist[i].options.labelAnchor = '0 0'
						}
					}
				}
				notify.success('Distance and time updated');
				utility.applyscope($scope);
			}

		 	function setGoogleMaps(lat, lng, zoom){
				vm.showmaps =true;
		       	uiGmapGoogleMapApi.then(function(maps) {
		       		maps.visualRefresh = true;
		       		if(lat != null && lng != null)
				   		vm.map = { center: { latitude: lat, longitude: lng }, zoom: zoom ? zoom : vm.map.zoom };
				   	infowindow = new google.maps.InfoWindow({
			  			content: ''
					});

		   			spinner.hide();
		   		});
		   	}

		   	$rootScope.$on('search:location', function (event, data) {
			   	vm.map.zoom = 14;
			    setGoogleMaps(data.lat, data.lng);
			});

			uiGmapIsReady.promise(1).then(function(instances) {
			   	directionsService = new google.maps.DirectionsService();
			   	mapinstance = instances[0].map;

			  	google.maps.event.addListener(mapinstance, 'bounds_changed', function() {
			  		var zoomLevel = mapinstance.getZoom();
			  		vm.istracking = zoomLevel >= 14;

				  	if(zoomLevel >= 16) 
				  		vm.docluster = false;
				  	else
				  		vm.docluster = true;

				  	for(var i = 0 ; i < vm.liverefs.length ; i++) {
				  		vm.liverefs[i].off();
				  	}

				  	vm.liverefs = [];

					if(zoomLevel >= 14) {
					  	for (var i=0; i < vm.cars.models.length; i++) {
						    if (mapinstance.getBounds().contains(new google.maps.LatLng(vm.cars.models[i].latitude, vm.cars.models[i].longitude))) {

								var fbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/livecars/'+vm.cars.models[i].id);
								if(vm.liverefs.indexOf(fbref) < 0 ) {
									vm.liverefs.push(fbref);
									fbref.on("value", function(snapshot) {
										updatemarker(snapshot.val(), snapshot.key());
									}, function (errorObject) {
									  	console.log("The live car read failed: " + errorObject.code);
									});
								}					    
							} 
						}
					}
					utility.applyscope($scope);
		  		});
			});
			
			function updatemarker(livecarobj, key) {
				if(livecarobj) {
					//console.log(key);
					var cardetail =  _.first(_.filter(vm.cars.models, function(carmodel){ return carmodel.id == key}));
				 	if(cardetail) {
				 		var isIdle = getIsIdle(livecarobj);

					 	cardetail.latitude = livecarobj.latitude;
					 	cardetail.longitude = livecarobj.longitude;
					 	cardetail.time = getTimeStamp(livecarobj.locationtime),
					 	cardetail.isIdle = isIdle;
					 	if(cardetail.isIdle === false)
						 	cardetail.options.labelContent = cardetail.title;
					 	cardetail.options.labelClass = ((isIdle && vm.dragMarker) ? 'tm-marker-label-distance' : 'tm-marker-label'),
					   	cardetail.options.icon = (isIdle ? 'assets/images/car-parked.png' : 'assets/images/car-moving.png'),
					   	cardetail.options.labelAnchor = ((isIdle && vm.dragMarker) ? '20 80' : '0 0')
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

				for(var i = 0 ; i < vm.liverefs.length ; i++) {
				  	vm.liverefs[i].off();
				}
			});
		}
	})();
});