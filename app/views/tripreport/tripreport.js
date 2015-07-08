define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('tripreport', ['$rootScope', '$scope', 'config', 'uiGmapGoogleMapApi', 'spinner','sessionservice', tripreport]);
        function tripreport($rootScope, $scope, config, uiGmapGoogleMapApi, spinner, sessionservice) {
            $rootScope.routeSelection = 'report';
            var vm= this;
            vm.pathsource =[];
            vm.speedbrake = true;
            vm.brake = true;
            vm.startloc=null;
            vm.stoploc=null;
            vm.showmap= false;

           var myDataRef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/report');
            spinner.show();
            myDataRef.on("value", function(snapshot) {
                    setPath(snapshot.val());
                }, 
                function (errorObject) {
                    console.log("The read failed: " + errorObject.code);
                }
            );

            function setPath(data) {
                spinner.hide();
                vm.pathsource = data.position;
                vm.brakesource = data.braking;
                vm.speedbrakesource = _.filter(data.speed_breaker, function(speedbreaker){ return speedbreaker.penalty == 1});
                vm.score = data.score;
                vm.distance = data.distance;
                vm.datetime = data.datetime;
                vm.showmap= true;  
                $rootScope.$emit('pathsource', {path:vm.pathsource, brake:vm.brakesource, speedbrake:vm.speedbrakesource});
                sessionservice.applyscope($scope);
                    
                var geocoder = new google.maps.Geocoder();
                var latlng = new google.maps.LatLng(vm.pathsource[0].latitude, vm.pathsource[1].longitude);
                geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[1]) {
                            var strt = results[1].formatted_address;
                            vm.startloc = strt.substring(0,strt.indexOf(','));
                            sessionservice.applyscope($scope);
                        } 
                    } 
                });
                
                var latlng = new google.maps.LatLng(vm.pathsource[data.position.length-1].latitude, vm.pathsource[data.position.length-1].longitude);
                geocoder.geocode({ 'latLng': latlng }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[1]) {
                            var stop = results[1].formatted_address;
                            vm.stoploc = stop.substring(0,stop.indexOf(','));
                            sessionservice.applyscope($scope);
                        } 
                    } 
                });

            }

            vm.speedbrakechecked = function()
            {
                $rootScope.$emit('speedbrake', {show:vm.speedbrake});
            }

            vm.brakechecked = function()
            {
                $rootScope.$emit('brake', {show:vm.brake});
            }
        }
    })();
});