define(['angular',
    'config.route',
    'moment',
    'lib'], function (angular, configroute, moment) {
    (function () {
        configroute.register.controller('alerts', ['$rootScope', '$scope', '$location', 'config', 'spinner', 'notify', 'sessionservice', alerts]);
        function alerts($rootScope, $scope, $location, config, spinner, notify, sessionservice) {
            $rootScope.routeSelection = 'alerts';
            var vm = this;
            vm.showclosed = false;
            vm.alertsdata = null;
            vm.alertsummarydata= {};
            var submitted = false;
            var alertslocation = sessionservice.getAlertsLocation();
			var firebaseref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/alerts');
			var mobilefbref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/mobile');

   			vm.canSaveMobile = function (form) {
                return form.$valid && form.$dirty && !submitted;
            };

			activate();

		 	function activate() {
		 		spinner.show();

				firebaseref.on("value", function(snapshot) {
					if(snapshot.val() !== null)
				  		setAlerts(snapshot.val());
				  	else {
				  		spinner.hide();
				  		vm.alertsdata = [];
				  		vm.openalerts  = [];
				  		vm.closedalerts = [];
				  		sessionservice.applyscope($scope);
				  	}
				  		
				}, function (errorObject) {
				  	console.log("The alerts read failed: " + errorObject.code);
				});

				mobilefbref.once("value", function(snapshot) {
				  	setMobileNumber(snapshot.val());
				}, function (errorObject) {
				  	console.log("The mobile number read failed: " + errorObject.code);
				});
		 	}

		 	function canSaveMobile(form){
				return form.$valid && !submitted;
		 	}

		 	function setMobileNumber (data) {
		 		vm.mobilenumber = data;
		 		sessionservice.applyscope($scope);
		 	}

		 	function setAlerts(data) {
		 		vm.alertsdata = data;
		 		var devicedetails = sessionservice.getAccountDevices();

				vm.alertsummarydata.categories =[];
		 		vm.alertsummarydata.data =[];

				for(var i = 30 ; i >= 0; i --) {
					var newdate = new Date();
					newdate.setDate(newdate.getDate() - i);
					vm.alertsummarydata.categories.push(moment(new Date(newdate)).format('MMM DD'));
					vm.alertsummarydata.data.push(0);
				}

		 		vm.openalerts = [];
		 		vm.closedalerts = [];
		 		for(property in data) {
		 			if(property != undefined) {
		 				var alert = data[property];
			 			var date = moment((alert.time)).format('MMM DD');
			 			var dateIndex = vm.alertsummarydata.categories.indexOf(date);
			 			if(dateIndex >= 0) 
				 			vm.alertsummarydata.data[dateIndex] += 1;
			 			else {
			 				vm.alertsummarydata.categories.push(date);
			 				vm.alertsummarydata.data.push(1);
			 			}

			 			var alertlocation =  _.first(_.filter(alertslocation, function(alertloc){ return alertloc.alertid == property}));

			 			var alertdetail =  {
			 				alertid : property,
			 				devicenumber: alert.devicenumber,
			 				vehiclenumber : devicedetails[alert.devicenumber].vehiclenumber,
			 				text: getAlertText(alert.alerttype),
			 				time: getTimeStamp(alert.time),
			 				latitude : alert.latitude,
			 				longitude : alert.longitude,
			 				location: alertlocation ? alertlocation.location : 'Calulating...',
			 				address : alertlocation ? alertlocation.address : ''
			 			};

			 			if(alert.status == 'Open')
							vm.openalerts.push(alertdetail);
						else
							vm.closedalerts.push(alertdetail)

			 			if(alertlocation == null || alertlocation == undefined) {
			 				var openlatlng = new google.maps.LatLng(alert.latitude, alert.longitude);
		                	readlocation(openlatlng, alertdetail);
		                }
		            }
		 		}

		 		setAlertSummaryData();
		 		spinner.hide();
		 		sessionservice.applyscope($scope);
		 	}

		 	function getAlertText(alertType) {
		 		var alerttext = '';
		 		alertType = alertType.toLowerCase();
		 		if(alertType == 'panic')
		 			alerttext = 'Panic button pressed';
		 		else if (alertType == 'accidentprone')
		 			alerttext = 'Accident prone driving';
		 		else if (alertType == 'crashed')
		 			alerttext = 'Car crashed';
		 		else if (alertType == 'plugged')
		 			alerttext = 'Device plugged into car';
		 		else if (alertType == 'unplugged')
		 			alerttext = 'Device unplugged from car';
		 		return alerttext;
		 	}

		 	function getTimeStamp(unixtimestamp) {
				return moment((unixtimestamp)).fromNow();
		 	}

		 	function readlocation(latlng, alertobject) {
			 	var geocoder = new google.maps.Geocoder();
		 		geocoder.geocode({ 'latLng': latlng }, function (results, status) {
		            if (status == google.maps.GeocoderStatus.OK) {
		                if (results[1]) {
		                    var strt = results[1].formatted_address;
		                    alertobject.location = strt.substring(0,strt.indexOf(','));
		                    alertobject.address = results[1].formatted_address;
		                    alertslocation.push ({
		                    	alertid : alertobject.alertid,
		                    	location : alertobject.location,
		                    	address : alertobject.address
		                    });
		                    sessionservice.setAlertsLocation(alertslocation);
							sessionservice.applyscope($scope);		                }
		            }
		            else {
		            	alertobject.location = 'Calculating...';
		            	sessionservice.applyscope($scope);
		            	console.log(status);
		            }
	            });
		 	}

		 	vm.closealert = function(alertobj){
		 		var alertref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/alerts/'+alertobj.alertid+'/status');
		 		alertref.set('Closed');
		 	}

		 	vm.saveMobile = function(){
		 		submitted = true;
		 		spinner.show();
		 		mobilefbref.set(vm.mobilenumber, saveMobileOnComplete);
		 	}

		 	vm.showAlertDetail = function (alert) {
		 		$rootScope.selectedAlert = alert;
		 		$location.path('/alertdetail');     
		 	}

		 	var saveMobileOnComplete = function(error) {
		 		submitted = false;
		 		spinner.hide();
				if (error)
				    notify.error('Something went wrong, please try after some time');
				else
				    notify.success('Mobile number saved successfully');
			  	
			  	sessionservice.applyscope($scope);
			};
		
		 	function setAlertSummaryData() {
		 		vm.alertsChartConfig = {
			        options: {
			            chart: {
			                type: 'line',
			            	zoomType: 'x',
				        	backgroundColor: 'WhiteSmoke',
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
			                name: 'Alerts',
			                data: vm.alertsummarydata.data,
			                color: 'LightCoral'
			            }
			        ],
			        xAxis: {
	            		categories: vm.alertsummarydata.categories,
	        		},
			        yAxis: {
			            min: 0
			        },
			        loading: false,
			        size: {
			        	height: 200
			        }
		    	};

		 	}
		}
    })();
});