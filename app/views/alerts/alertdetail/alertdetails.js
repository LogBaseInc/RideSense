define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('alertdetail', ['$rootScope', '$scope', '$location', 'uiGmapIsReady', 'uiGmapGoogleMapApi', 'sessionservice', alertdetail]);
        function alertdetail($rootScope, $scope, $location, uiGmapIsReady, uiGmapGoogleMapApi, sessionservice) {
        	$rootScope.routeSelection = 'alerts';
        	var vm = this;
        	var mapinstance;
		  	vm.showmaps =false;
		  	vm.selectedAlert = $rootScope.selectedAlert;

		  	activate();
		  	function activate() {
		  		if(vm.selectedAlert)
					setGoogleMaps()
				else
					$location.path('/alerts');
		  	}

			vm.marker = {
			    id: 1,
			     coords: {
			       latitude: vm.selectedAlert.latitude,
			       longitude: vm.selectedAlert.longitude
			    },
		     	options: { draggable: false, icon: 'assets/images/car-red.png' },
		     	events: {
				        click: function (marker, eventName, args) {
				        	infowindow.open(mapinstance, marker);
		       			}
		     		}
		    };

		  	function setGoogleMaps() {
	        	uiGmapGoogleMapApi.then(function(maps) {
	        		vm.showmaps =true;
	        		maps.visualRefresh = true;
		    		vm.map = { center: { latitude: vm.selectedAlert.latitude, longitude: vm.selectedAlert.longitude }, zoom: 14};
	    		});
	    	}

            uiGmapIsReady.promise(1).then(function(instances) {
			    directionsService = new google.maps.DirectionsService();
			    mapinstance = instances[0].map;

    		});

	        var infowindow = new google.maps.InfoWindow({
			  	content: vm.selectedAlert.address
			});
        }
    })();
});