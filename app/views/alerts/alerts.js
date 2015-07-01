define(['angular',
    'config.route',
    'moment'], function (angular, configroute, moment) {
    (function () {
        configroute.register.controller('alerts', ['$rootScope', '$scope', 'config', 'spinner', 'notify', 'sessionservice', alerts]);
        function alerts($rootScope, $scope, config, spinner, notify, sessionservice) {
            $rootScope.routeSelection = 'alerts';
            var vm = this;
            vm.showclosed = false;
            vm.alertsdata = null;
            var alertsummarydata= {};
            var submitted = false;
			var firebaseref = new Firebase(config.firebaseUrl+'account/'+sessionservice.getSessionUid()+'/alerts');
			var mobilefbref = new Firebase(config.firebaseUrl+'account/'+sessionservice.getSessionUid()+'/mobile');

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
				  		$scope.$apply();
				  	}
				  		
				}, function (errorObject) {
				  	console.log("The alerts read failed: " + errorObject.code);
				});

				mobilefbref.on("value", function(snapshot) {
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
		 	}

		 	function setAlerts(data) {
		 		vm.alertsdata = data;
		 		getAlertSummaryData();

		 		var openalertsdata = _.filter(data, function(alert){ return alert.status == 'Open'});
		 		var closedalertsdata = _.filter(data, function(alert){ return alert.status == 'Closed'});

		 		openalertsdata.sort(function(a, b) {
    				return parseInt(b.time) - parseInt(a.time);
				});
				closedalertsdata.sort(function(a, b) {
    				return parseInt(b.time) - parseInt(a.time);
				});

		 		vm.openalerts = [];
		 		for(var i =0; i < openalertsdata.length; i++) {
		 			vm.openalerts.push(
		 			{
		 				alertid : openalertsdata[i].alertid,
		 				devicenumber: openalertsdata[i].devicenumber,
		 				text: getAlertText(openalertsdata[i].alerttype),
		 				time: getTimeStamp(openalertsdata[i].time),
		 				latitude : openalertsdata[i].latitude,
		 				longitude : openalertsdata[i].longitude,
		 				location: ''
		 			});
		 			var openlatlng = new google.maps.LatLng(openalertsdata[i].latitude, openalertsdata[i].longitude);
	                readlocation(openlatlng, vm.openalerts[i]);
		 		}

				vm.closedalerts = [];
		 		for(var i =0; i < closedalertsdata.length; i++) {
		 			vm.closedalerts.push(
		 			{
		 				alertid : closedalertsdata[i].alertid,
		 				devicenumber: closedalertsdata[i].devicenumber,
		 				text: getAlertText(closedalertsdata[i].alerttype),
		 				time: getTimeStamp(closedalertsdata[i].time),
		 				latitude : closedalertsdata[i].latitude,
		 				longitude : closedalertsdata[i].longitude,
		 				location: ''
		 			});
		 			var closedlatlng = new google.maps.LatLng(closedalertsdata[i].latitude, closedalertsdata[i].longitude);
	                readlocation(closedlatlng, vm.closedalerts[i]);
		 		}

		 		spinner.hide();
		 	}

		 	function getAlertText(alertType) {
		 		var alerttext = '';
		 		if(alertType == 'Panic')
		 			alerttext = 'Panic button pressed';
		 		else if (alertType == 'AccidentProne')
		 			alerttext = 'Accident prone driving';
		 		else if (alertType == 'Crashed')
		 			alerttext = 'Car crashed';
		 		return alerttext;
		 	}

		 	function getTimeStamp(unixtimestamp){
				return moment((unixtimestamp*1000)).fromNow();
		 	}

		 	function readlocation(latlng, alertobject){
			 	var geocoder = new google.maps.Geocoder();
		 		geocoder.geocode({ 'latLng': latlng }, function (results, status, i) {
		            if (status == google.maps.GeocoderStatus.OK) {
		                if (results[1]) {
		                    var strt = results[1].formatted_address;
		                    alertobject.location = strt.substring(0,strt.indexOf(','));
		                    if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
		                    	$scope.$apply();
		                    }
		                }
		            }
	            });
		 	}

		 	vm.closealert = function(alertobj){
		 		var alertclosed = _.first(_.filter(vm.alertsdata, function(alert){ return alert.alertid == alertobj.alertid}));
		 		alertclosed.status = 'Closed';
		 		var index = vm.alertsdata.indexOf(alertclosed);
		 		var alertref = new Firebase(config.firebaseUrl+'account/'+sessionservice.getSessionUid()+'/alerts/'+index+'/status');
		 		alertref.set('Closed');
		 	}

		 	vm.saveMobile = function(){
		 		submitted = true;
		 		spinner.show();
		 		mobilefbref.set(vm.mobilenumber, saveMobileOnComplete);
		 	}

		 	var saveMobileOnComplete = function(error) {
		 		submitted = false;
		 		spinner.hide();
				if (error)
				    notify.error('Something went wrong, please try after some time');
				else
				    notify.success('Mobile number saved successfully');
			  	
			  	$scope.$apply();
			};

		 	function getAlertSummaryData(){
		 		alertsummarydata.categories =[];
		 		alertsummarydata.data =[];
		 		var alertSummaryArray = angular.copy(vm.alertsdata);

				alertSummaryArray.sort(function(a, b) {
    				return parseInt(a.time) - parseInt(b.time);
				});

		 		for(var i=0; i<alertSummaryArray.length; i++){
		 			var date = moment((alertSummaryArray[i].time*1000)).format('MMM DD, YYYY');
		 			var dateIndex = alertsummarydata.categories.indexOf(date);
		 			if(dateIndex >= 0) 
			 			alertsummarydata.data[dateIndex] += 1;
		 			else {
		 				alertsummarydata.categories.push(date);
		 				alertsummarydata.data.push(1);
		 			}
		 		}

		 		vm.alertsChartConfig = {
			        options: {
			            chart: {
			                type: 'line',
			            	zoomType: 'x',
				        	backgroundColor: 'WhiteSmoke',
				        	marginBottom: 25,
			            },
				        legend: {
				            enabled: false
				        }
			        },
			        credits: {
						enabled: false
					},
			        title: {
			            text: ''
			        },
			        series: [
			            {
			                name: 'Alerts',
			                data: alertsummarydata.data,
			                color: 'LightCoral'
			            }
			        ],
			        xAxis: {
	            		categories: alertsummarydata.categories
	        		},
			        yAxis: {
			            min: 0
			        },
			        size: {
			           height: 250
			        }, 
			        loading: false,
			        size: {
			        	height: 150
			        }
		    	};
		 	}
		}
    })();
});