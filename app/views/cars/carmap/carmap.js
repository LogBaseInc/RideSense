define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('carmap', ['$compile', '$rootScope', '$scope', '$location', 'config', 'spinner', 'uiGmapIsReady', 'uiGmapGoogleMapApi', 'sessionservice', 'utility', carmap]);
        function carmap($compile, $rootScope, $scope, $location, config, spinner, uiGmapIsReady, uiGmapGoogleMapApi, sessionservice, utility) {
        	$rootScope.routeSelection = 'live'
	        var vm = this;
		 	vm.distanceCovered = 0;
		 	vm.showmaps =false;
			var mapinstance;
			var infowindow;
			var ref;
			var distanceref;

			activate();

		 	function activate(){
		 		$rootScope.routeSelection = 'cars';
		 		if($rootScope.selecteddevice) {
			 		$rootScope.tripdetails = true;
				 	spinner.show();
				 	getCarDistance();
					getlivecardata();
				}
				else {
                    $location.path('/cars');
                }
		 	}

		 	function getCarDistance() {
		 		var date = moment(new Date()).format('YYYYMMDD');
		 		distanceref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/devices/'+$rootScope.selecteddevice+'/daily/'+date);
		 		distanceref.on("value", function(snapshot) {
					var data = snapshot.val();
					if(data) {
						vm.distanceCovered = data.distance.toFixed(2);
						utility.applyscope($scope);
					}

				}, function (errorObject) {
				  	console.log("The distance read failed: " + errorObject.code);
				});
		 	}

		 	function getlivecardata() {
		 		ref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/livecars/'+$rootScope.selecteddevice);
				ref.on("value", function(snapshot) {
					var data = snapshot.val();
					if(data) {
						vm.cardetail = data;
						vm.status = data.running ? 'Running' : 'Idle';
						setGoogleMaps();
						setMarker();
						utility.applyscope($scope);
					}

				}, function (errorObject) {
				  	console.log("The livecars read failed: " + errorObject.code);
				});
		 	}

		 	function setMarker() {
			 	vm.marker = {
				    id: 1,
				     coords: {
				       latitude: vm.cardetail.latitude,
				       longitude: vm.cardetail.longitude
				    },
			     	options: { draggable: false, icon: (vm.cardetail.running ? 'assets/images/car-moving.png' : 'assets/images/car-parked.png')},
			     	events: {
				        click: function (marker, eventName, args) {
						    var latlng = new google.maps.LatLng(vm.marker.coords.latitude, vm.marker.coords.longitude);
						    var geocoder = new google.maps.Geocoder();
					 		geocoder.geocode({ 'latLng': latlng }, function (results, status) {
					            if (status == google.maps.GeocoderStatus.OK) {
					                if (results[0]) {
					                	var sublocality = _.first(_.filter(results[0].address_components, function(address){ return address.types[0].indexOf('sublocality') >= 0}));
					                	if(sublocality == null)
					                		sublocality = _.first(_.filter(results[0].address_components, function(address){ return address.types[0].indexOf('route') >= 0}));
					          			var content = '<div id="infowindow_content"><span style="font-weight: bold;">'+sublocality.long_name+'</span><br>Last updated '+getTimeStamp(vm.cardetail.locationtime)+'</div>';
					          			var compiled = $compile(content)($scope);
								        infowindow.setContent(compiled[0].innerHTML);
								        infowindow.open(mapinstance , marker);
					          		}
					            }
				            });
				    	}
			     	}
			    };
			}

			function getTimeStamp(unixtimestamp){
				return moment((unixtimestamp)).fromNow();
		 	}

		    function setGoogleMaps(lat, lng, zoom) {
	        	uiGmapGoogleMapApi.then(function(maps) {
	        		vm.showmaps =true;
	        		maps.visualRefresh = true;
		    		vm.map = { center: { latitude: lat ? lat : vm.cardetail.latitude, longitude: lng ? lng : vm.cardetail.longitude }, zoom: zoom ? zoom : 19};
		    		infowindow = new google.maps.InfoWindow({
			  			content: ''
					});
	    		});
	    	}

            uiGmapIsReady.promise(1).then(function(instances) {
			    directionsService = new google.maps.DirectionsService();
			    mapinstance = instances[0].map;
    		});

    		$rootScope.$on('search:location', function (event, data) {
			    setGoogleMaps(data.lat, data.lng, 15);
			});

			$scope.$on('$destroy', function iVeBeenDismissed() {
                if(ref)
                    ref.off();
                if(distanceref)
                	distanceref.off();
            });
		}
	})();
});