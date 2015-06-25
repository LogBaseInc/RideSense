define(['angular',
    'config.route',
    'views/live/googleplaces.js'], function (angular, configroute) {
    (function () {

        configroute.register.controller('live', ['$rootScope', '$scope', 'config', 'spinner', 'uiGmapGoogleMapApi', live]);
        function live($rootScope, $scope, config, spinner, uiGmapGoogleMapApi) {
        	$rootScope.routeSelection = 'live'
        	var vm = this;
		  	vm.distanceCovered = '5.6k';
		  	vm.showmaps =false;
		  	vm.location = '';

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

		  	function livecarsmodel(data){
		  		vm.activeCabs = 0;
		  		vm.idleCabs = 0

	  			var isInitial = vm.cars === undefined;
		  		vm.cars = {};
		  		vm.cars.models =[];
		  		for(var i=0; i<data.length; i++){
		  			var currentdatetime = new Date();
		  			var datetimediff = ((new Date() - new Date(data[i].locationtime))/1000/60);
					if(datetimediff > config.idleTime)
						vm.idleCabs = vm.idleCabs+1;
					else
						vm.activeCabs = vm.activeCabs+1;
					
		  			vm.cars.models.push(
	  				{
	  					latitude: data[i].latitude,
	  					longitude: data[i].longitude,
	  					title: data[i].devicenumber,
	  					id : i,
	  					options: {
				    		labelContent: data[i].devicenumber, 
				    		labelClass: 'tm-marker-label',
				    		icon: (datetimediff > config.idleTime ? 'assets/images/car-parked.png' : 'assets/images/car-moving.png')
			    		}
	  				});
		  		}
	  			setGoogleMaps(isInitial);
		  		
		  	}

		  	function setGoogleMaps(isInitial){
		  		vm.showmaps =true;
				var events = {
				    places_changed: function (searchBox) {
				        var place = searchBox.getPlaces();
				        if (!place || place == 'undefined' || place.length == 0) {
				            console.log('no place data :(');
				            return;
				        }

			        vm.map = {
			            "center": {
			                "latitude": place[0].geometry.location.lat(),
			                "longitude": place[0].geometry.location.lng()
			            },
			            "zoom": 13
			        };
			        vm.marker = {
			            id: 0,
			            coords: {
			                latitude: place[0].geometry.location.lat(),
			                longitude: place[0].geometry.location.lng()
			            }
			        };
				    }
				};

				vm.searchbox = { template: 'searchbox.tpl.html', events: events };

	        	uiGmapGoogleMapApi.then(function(maps) {
	        		 var defaultBounds = new google.maps.LatLngBounds(
										new google.maps.LatLng(40.82148, -73.66450),
										new google.maps.LatLng(40.66541, -74.31715)
									);	
		    		vm.map = { center: { latitude: 11, longitude: 77 }, zoom: 11 };
		    		
	    		});
	    		spinner.hide();
	    	}
        }
    })();
});