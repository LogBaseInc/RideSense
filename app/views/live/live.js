define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('live', ['$rootScope', '$scope', 'config', 'spinner', 'uiGmapIsReady', 'uiGmapGoogleMapApi', live]);
        function live($rootScope, $scope, config, spinner, uiGmapIsReady, uiGmapGoogleMapApi) {
        	$rootScope.routeSelection = 'live'
        	var vm = this;
		  	vm.distanceCovered = '5.6k';
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
			var directionsService
			var mapinstance;
			var routecolor = ['red', 'green',  'purple', 'orange', 'blue'];
			// ['#F4CE37', '#00adef', '#7cc576', '#f36523', '#898f99'];

		  	activate();
		  	function activate(){
		  		spinner.show();
				var ref = new Firebase(config.firebaseUrl+'livecars');
				ref.on("value", function(snapshot) {
				   livecarsmodel(snapshot.val());
				}, function (errorObject) {
				   console.log("The read failed: " + errorObject.code);
				});
		  	}

		  	vm.searchOptionChanged = function(searchoption){
		  		if(searchoption == 'location'){
		  			vm.locationsearch = true;
		  			vm.carsearch = false;
		  			vm.carsearchselected = null;
		  		}
		  		else{
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
		  		  //setGoogleMaps(lat, lng);
		  		  calculateDistances();
		  		  vm.cars.models = vm.cars.models;
		        }
		      }
		    };

		  	function livecarsmodel(data){
		  		vm.activeCabs = 0;
		  		vm.idleCabs = 0
		  		var isinitail = vm.cars === undefined;
		  		if(isinitail) {
			  		vm.cars = {};
			  		vm.cars.models =[];
			  		vm.carlist =[];

			  		for(var i=0; i<data.length; i++){
			  			var currentdatetime = new Date();
			  			var datetimediff = ((new Date() - new Date(data[i].locationtime))/1000/60);
			  			var isIdle = true;
						if(datetimediff > config.idleTime)
							vm.idleCabs = vm.idleCabs+1;
						else {
							vm.activeCabs = vm.activeCabs+1;
							isIdle = false;
						}
						
						vm.carlist.push({name : data[i].devicenumber});
			  			vm.cars.models.push(
		  				{
		  					latitude: data[i].latitude,
		  					longitude: data[i].longitude,
		  					title: '#'+data[i].devicenumber,
		  					id : i,
		  					isIdle: isIdle,
		  					options: {
					    		labelContent:  '#'+data[i].devicenumber, 
					    		labelClass: ((isIdle && vm.dragMarker) ? 'tm-marker-label-distance' : 'tm-marker-label'),
					    		icon: (isIdle ? 'assets/images/car-parked.png' : 'assets/images/car-moving.png'),
					    		labelAnchor: ((isIdle && vm.dragMarker) ? '20 60' : '0 0')
				    		}
		  				});
			  		}
	  				setGoogleMaps(null,null);
	  			}
	  			else {
	  				for(var i=0; i<data.length; i++){

						var currentdatetime = new Date();
			  			var datetimediff = ((new Date() - new Date(data[i].locationtime))/1000/60);
			  			var isIdle = true;
						if(datetimediff > config.idleTime)
							vm.idleCabs = vm.idleCabs+1;
						else {
							vm.activeCabs = vm.activeCabs+1;
							isIdle = false;
						}

	  					var cardetail =  _.first(_.filter(vm.cars.models, function(carmodel){ return carmodel.title == data[i].devicenumber}));
	  					if(cardetail){
	  						cardetail.latitude = data[i].latitude;
		  					cardetail.longitude = data[i].longitude;
		  					cardetail.isIdle = isIdle;
		  					if(cardetail.isIdle === false)
		  						cardetail.options.labelContent = data[i].devicenumber;
		  					cardetail.options.labelClass = ((isIdle && vm.dragMarker) ? 'tm-marker-label-distance' : 'tm-marker-label'),
					    	cardetail.options.icon = (isIdle ? 'assets/images/car-parked.png' : 'assets/images/car-moving.png'),
					    	cardetail.options.labelAnchor = ((isIdle && vm.dragMarker) ? '20 80' : '0 0')
	  					}
	  				}
	  				calculateDistances();
	  				//setGoogleMaps(vm.map.center.latitude, vm.map.center.longitude);
	  			}
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
						/*if(element.distance.value <= 30000) {*/
						vm.cars.models[i].options.labelContent = idleCarlist[i].title + '<div>'+distance + ' | '+duration +'</div>';
						vm.cars.models[i].options.labelClass = 'tm-marker-label-distance';
						vm.cars.models[i].options.labelAnchor = '20 60';
						/*}
						else {
							vm.cars.models[i].options.labelContent = idleCarlist[i].title;
							vm.cars.models[i].options.labelClass = 'tm-marker-label';
							vm.cars.models[i].options.labelAnchor = '0 0';
						}*/
					}
				}

			}

		  	function setGoogleMaps(lat, lng){
		  		vm.showmaps =true;

	        	uiGmapGoogleMapApi.then(function(maps) {
	        		var defaultBounds = new google.maps.LatLngBounds(
										new google.maps.LatLng(40.82148, -73.66450),
										new google.maps.LatLng(40.66541, -74.31715));	
	        		maps.visualRefresh = true;
		    		vm.map = { center: { latitude: (lat!==null?lat:11), longitude: (lng!==null?lng:77) }, zoom: vm.map.zoom };
	    		});

	    		spinner.hide();
	    	}

	    	$rootScope.$on('search:location', function (event, data) {
	    		vm.map.zoom = 14;
                setGoogleMaps(data.lat, data.lng);
            });

             uiGmapIsReady.promise(1).then(function(instances) {
			    console.log('uiGmapIsReady');
			    directionsService = new google.maps.DirectionsService();
			    mapinstance = instances[0].map;
    		});
          
        }
    })();
});