define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('live', ['$rootScope', '$scope', 'config', 'spinner', 'uiGmapGoogleMapApi', live]);
        function live($rootScope, $scope, config, spinner, uiGmapGoogleMapApi) {
        	$rootScope.routeSelection = 'live'
        	var vm = this;
		  	vm.distanceCovered = '5.6k';
		  	vm.showmaps =false;
		  	vm.location = '';
			vm.locationsearch = true;
		  	vm.carsearch = false;
		  	vm.searchoption = "location";

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

		  	vm.marker = {
		      id: 1,
		      coords: {
		        latitude: 11.025,
		        longitude: 77
		      },
		      options: { draggable: true, icon: 'assets/images/marker-small.png' },
		      events: {
		        dragend: function (marker, eventName, args) {
		          console.log('car dragend');
		          var lat = marker.getPosition().lat();
		          var lon = marker.getPosition().lng();
		          console.log(lat);
		          console.log(lon);
		        }
		      }
		    };

		  	function livecarsmodel(data){
		  		vm.activeCabs = 0;
		  		vm.idleCabs = 0
		  		vm.cars = {};
		  		vm.cars.models =[];
		  		vm.carlist =[];

		  		for(var i=0; i<data.length; i++){
		  			var currentdatetime = new Date();
		  			var datetimediff = ((new Date() - new Date(data[i].locationtime))/1000/60);
					if(datetimediff > config.idleTime)
						vm.idleCabs = vm.idleCabs+1;
					else
						vm.activeCabs = vm.activeCabs+1;
					
					vm.carlist.push({name : data[i].devicenumber});
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
	  			setGoogleMaps(null,null);
		  		
		  	}

		  	function setGoogleMaps(lat, lng){
		  		vm.showmaps =true;
	        	uiGmapGoogleMapApi.then(function(maps) {
	        		 var defaultBounds = new google.maps.LatLngBounds(
										new google.maps.LatLng(40.82148, -73.66450),
										new google.maps.LatLng(40.66541, -74.31715)
									);	
		    		vm.map = { center: { latitude: (lat!==null?lat:11), longitude: (lng!==null?lng:77) }, zoom: 12 };
		    		
	    		});
	    		spinner.hide();
	    	}

	    	$rootScope.$on('search:location', function (event, data) {
                setGoogleMaps(data.lat, data.lng);
            });

        }
    })();
});