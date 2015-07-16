define(['angular',
    'config.route',
    'moment',
    'lib'], function (angular, configroute, moment) {
    (function () {

        configroute.register.controller('live', ['$compile', '$rootScope', '$scope', 'config', 'spinner', 'uiGmapIsReady', 'uiGmapGoogleMapApi', 'sessionservice', live]);
        function live($compile, $rootScope, $scope, config, spinner, uiGmapIsReady, uiGmapGoogleMapApi, sessionservice) {
        $rootScope.routeSelection = 'live'
	        var vm = this;
		 	vm.distanceCovered = 0;
		 	vm.showmaps =false;
		 	vm.location = '';
			vm.locationsearch = true;
		 	vm.carsearch = false;
		 	vm.searchoption = "location";
		 	vm.dragMarker = false;
		 	vm.map = { center: { latitude: 11, longitude: 77 }, zoom: 12 };
		 	vm.clusterOptions = {
							      averageCenter : true,
							      ignoreHidden : true,
								};
	 		var idleCarlist = [];
			var directionsDisplays = [];
			var directionsService;
			var mapinstance;
			var routecolor = ['red', 'green',  'purple', 'orange', 'blue'];

		 	activate();

		 	vm.markersEvents = {
			    click: function (gMarker, eventName, model) {
				    var latlng = new google.maps.LatLng(model.latitude, model.longitude);
				    var geocoder = new google.maps.Geocoder();
			 		geocoder.geocode({ 'latLng': latlng }, function (results, status) {
			            if (status == google.maps.GeocoderStatus.OK) {
			                if (results[0]) {
			          			var content = '<div id="infowindow_content">'+results[0].formatted_address+'<br>'+model.time+'<br><a href="#/cars/'+model.title+'">More details</a></div>';
			          			var compiled = $compile(content)($scope);
						        infowindow.setContent(compiled[0].innerHTML);
						        infowindow.open( mapinstance , gMarker );
			          		}
			            }
		            });
			    }
			 };

			var infowindow = new google.maps.InfoWindow({
			  	content: ''
			});

		 	function activate(){
			 	spinner.show();
				getlivecardata();
				getDistance();
		 	}

		 	function getlivecardata() {
		 		var ref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/livecars');
				ref.on("value", function(snapshot) {
					if(snapshot.val())
				  		livecarsmodel(snapshot.val());
				  	else {
				  		spinner.hide();
				  		vm.activeCabs = 0;
			 			vm.idleCabs = 0
			 			vm.cars = {};
			 			vm.cars.models = [];
				  		setGoogleMaps(null,null)
				  		sessionservice.applyscope($scope);
				  	}

				}, function (errorObject) {
				  	console.log("The livecars read failed: " + errorObject.code);
				});
		 	}

		 	function getDistance() {
				var newdate = new Date();
				newdate.setDate(newdate.getDate() - 1);
				var previousday = moment(new Date(newdate)).format('YYYYMMDD');

				var distancefbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/daily/'+previousday);
				distancefbref.once("value", function(snapshot) {
				  	vm.previousdaydistance = snapshot.val() != null ? snapshot.val().distance : 0; 
					getCurrentdayDistance();
				}, function (errorObject) {
				  	console.log("The previous day distance read failed: " + errorObject.code);
				});
		 	}

		 	function getCurrentdayDistance() {
		 		var currentday = moment().format("YYYYMMDD");
				var distancefbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/daily/'+currentday);
				distancefbref.on("value", function(snapshot) {
				  	vm.distanceCovered = snapshot.val() != null ? (snapshot.val().distance.toFixed(2)) : 0; 

				  	var distancex =  vm.previousdaydistance / 24;
				  	var time = moment().format("HH.mm");
				  	vm.isUP = vm.distanceCovered >= (distancex * time);

				  	sessionservice.applyscope($scope);
				}, function (errorObject) {
				  	console.log("The current day distance read failed: " + errorObject.code);
				});
		 	}
			
		 	vm.searchOptionChanged = function(searchoption){
			 	if(searchoption == 'location'){
				 	vm.locationsearch = true;
				 	vm.carsearch = false;
				 	vm.carsearchselected = null;
			 	}
			 	else {
					vm.locationsearch = false;
					vm.carsearch = true;
					vm.carsearchselected = null;
			 	}
		 	}

		 	vm.carsearched = function($item, $model, $label){
			 	setGoogleMaps($item.latitude, $item.longitude);
			 }

			vm.showDragMarker = function(){
			 	vm.dragMarker = !vm.dragMarker;
			 	if(vm.dragMarker) {
			 	vm.marker.coords.latitude =  vm.map.center.latitude;
			 	   vm.marker.coords.longitude =   vm.map.center.longitude;
			 	   //setGoogleMaps(vm.map.center.latitude, vm.map.center.longitude);
			 	   calculateDistances();
			 	}
			 	else{
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
		     	options: { draggable: true, icon: 'assets/images/user-marker-small.png' },
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
			 	vm.activeCabs = 0;
			 	vm.idleCabs = 0
			 	var devicedetails = sessionservice.getAccountDevices();
			 	var isinitail = vm.cars === undefined;
			 	if(isinitail) {
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
					 	sessionservice.applyscope($scope);
					 	setGoogleMaps(null, null);
					}
				}
			 	else {
				 	for(property in data) {
				 		if(property != undefined) {
					 		var livecarobj  = data[property];
					 		var vehiclenumber = devicedetails[property].vehiclenumber;

						 	var cardetail =  _.first(_.filter(vm.cars.models, function(carmodel){ return carmodel.title == vehiclenumber}));
						 	if(cardetail) {
						 		var isIdle = getIsIdle(livecarobj);

							 	cardetail.latitude = livecarobj.latitude;
							 	cardetail.longitude = livecarobj.longitude;
							 	cardetail.time = getTimeStamp(livecarobj.locationtime),
							 	cardetail.isIdle = isIdle;
							 	if(cardetail.isIdle === false)
								 	cardetail.options.labelContent = vehiclenumber;
							 	cardetail.options.labelClass = ((isIdle && vm.dragMarker) ? 'tm-marker-label-distance' : 'tm-marker-label'),
							   	cardetail.options.icon = (isIdle ? 'assets/images/car-parked.png' : 'assets/images/car-moving.png'),
							   	cardetail.options.labelAnchor = ((isIdle && vm.dragMarker) ? '20 80' : '0 0')
						 	}
						 	else {
						 		vm.carlist.push({name : vehiclenumber});
							 	vm.cars.models.push(getLiveCarObject(livecarobj, property, vehiclenumber));
						 	}
						}
		 				sessionservice.applyscope($scope);
		 				setMapCenterOfAllMarkers();
		 			}
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
		 		if(isIdle)
		 			vm.idleCabs = vm.idleCabs + 1;
		 		else
		 			vm.activeCabs = vm.activeCabs + 1;

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
				
				calcRoute();
			}

			function clearRoutes(){
				for(var i=0; i<directionsDisplays.length; i++){
				 	directionsDisplays[i].setDirections({ routes: [] })	 
				}
				directionsDisplays= [];
			}

			function calcRoute() {
				clearRoutes();
			 	var dest1 = new google.maps.LatLng(vm.marker.coords.latitude, vm.marker.coords.longitude);
			 	var origins = [];
			 	idleCarlist = [];
			 	for(var i=0 ; i<vm.cars.models.length; i++) {
				 	if(vm.cars.models[i].isIdle === true) {
				 	idleCarlist.push(vm.cars.models[i]);
				 	var origin = new google.maps.LatLng(vm.cars.models[i].latitude,vm.cars.models[i].longitude);
				 	var request = {
					    origin: origin, 
					    destination: dest1,
					   	travelMode: google.maps.TravelMode.DRIVING
				 	};

			 		directionsService.route(request, function(response, status) {
					   if (status == google.maps.DirectionsStatus.OK) {
						   	var colorindex = directionsDisplays.length < 4 ? directionsDisplays.length : ((directionsDisplays.length)%5);
						   	var directionsDisplay = new google.maps.DirectionsRenderer({preserveViewprot: true, suppressMarkers: true, polylineOptions: { strokeColor: routecolor[colorindex],strokeOpacity:.4, strokeWeight:5 }});
						     	directionsDisplay.setMap(mapinstance);
						     	directionsDisplay.setDirections(response);
						     	directionsDisplays.push(directionsDisplay);
						   }
				 		});
				 	}
			 	}
			}

			function callback(response, status) {
				if(status == 'OK'){
					for(var i=0; i<response.rows.length; i++){
						var element = response.rows[i].elements[0];
						var distance = element.distance.text;
						var duration = element.duration.text;
						vm.cars.models[i].options.labelContent = idleCarlist[i].title + '<div>'+distance + ' | '+duration +'</div>';
						vm.cars.models[i].options.labelClass = 'tm-marker-label-distance';
						vm.cars.models[i].options.labelAnchor = '20 60';
					}
				}

			}

		 	function setGoogleMaps(lat, lng){
				vm.showmaps =true;
		       	uiGmapGoogleMapApi.then(function(maps) {
		       		maps.visualRefresh = true;
				   	vm.map = { center: { latitude: (lat!==null?lat:11), longitude: (lng!==null?lng:77) }, zoom: vm.map.zoom };
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
				setMapCenterOfAllMarkers();
			});

			function setMapCenterOfAllMarkers() {
				/*if(vm.cars.models.length > 0) {
					var bounds = new google.maps.LatLngBounds();
					for(i=0;i<vm.cars.models.length;i++) {
						bounds.extend(new google.maps.LatLng(vm.cars.models[i].latitude,vm.cars.models[i].longitude));
					}

					mapinstance.setCenter(bounds.getCenter());
					mapinstance.fitBounds(bounds);
					mapinstance.setZoom(mapinstance.getZoom() - 4);
				}*/	
			}

		}
	})();
});