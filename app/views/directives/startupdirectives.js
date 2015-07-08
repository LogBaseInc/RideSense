define(['angular'], function (angular) {
    (function () {
        'use strict';
        var module = angular.module('rideSenseApp');
        
        module.directive("lbSpinner", function () {
            return {
                restrict: "EA",
                replace: true,
                link: link,
                scope: {
                    isBusy: "=",
                },
                //template: '<div data-ng-show="isBusy" class="page-splash"><div data-cc-spinner="spinnerOptions"></div></div>'
                template: '<div data-ng-show="isBusy"><img src="assets/images/loader.gif" class="ajax-loader"></img></div>'
               
            };
            function link(scope, element, attrs) {
                scope.spinnerOptions = {
                    radius: 10,
                    lines: 10,
                    length: 8,
                    width: 3,
                    speed: 1.7,
                    corners: 1.0,
                    trail: 100,
                    color: '#FFA500'
                };
            }
        });  

         module.directive('ccSpinner', ['$window', function ($window) {
            var directive = {
                link: link,
                restrict: 'A'
            };
            return directive;

            function link(scope, element, attrs) {
                scope.spinner = null;
                scope.$watch(attrs.ccSpinner, function (options) {
                    if (scope.spinner) {
                        scope.spinner.stop();
                    }
                    scope.spinner = new $window.Spinner(options);
                    scope.spinner.spin(element[0]);
                }, true);
            }
        }]);   

        module.directive('googlePlaces', ['$rootScope', function($rootScope){
            return {
                restrict:'E',
                replace:true,
                scope: {},
                template: '<input id="google_places_ac" name="google_places_ac" type="text" class="input-block-level" placeholder="Search location..." style="border:0px; width:100%; position: relative; z-index:3; height:50px"/>',
                link: function($scope, elm, attrs){
                    var autocomplete = new google.maps.places.Autocomplete($("#google_places_ac")[0], {});
                    google.maps.event.addListener(autocomplete, 'place_changed', function() {
                        var place = autocomplete.getPlace();
                        $rootScope.$emit('search:location', {lat:place.geometry.location.lat(), lng:place.geometry.location.lng()});
                    });
                }
            }
        }]);

        module.directive('myMap', function($rootScope) {
        var link = function(scope, element, attrs) {
          var map, infoWindow;
          var markers = [];
          var brakemarkers =[];

          function initMap() {
           var centerindex = Math.floor(scope.path.length/2);
           var centerlatlng = scope.path[centerindex];
                // map config
                var mapOptions = {
               center: new google.maps.LatLng(centerlatlng.latitude, centerlatlng.longitude),
               zoom: 14,
               mapTypeId: google.maps.MapTypeId.ROADMAP,
               scrollwheel: false
             };

             if (map === void 0) {
              map = new google.maps.Map(element[0], mapOptions);
            }

           //  var startimage = 'images/greendot.png';
           //  var startLatLng = new google.maps.LatLng(scope.path[0].latitude, scope.path[0].longitude);
           //  var beachMarker = new google.maps.Marker({
           //   position: startLatLng,
           //   map: map,
           //   icon: startimage
           // });

           //  var endimage = 'images/reddot.png';
           //  var endLatLng = new google.maps.LatLng(scope.path[scope.path.length-1].latitude, scope.path[scope.path.length-1].longitude);
           //  var beachMarker = new google.maps.Marker({
           //   position: endLatLng,
           //   map: map,
           //   icon: endimage
           // });
          }    

            // place a marker
            function setSpeedMarker(map, position, title, content) {
              var marker;
              var markerOptions = {
                position: position,
                map: map,
                title: title,
                icon: 'assets/images/speedbump.png'
              };

              marker = new google.maps.Marker(markerOptions);
                markers.push(marker); // add marker to array
                
                google.maps.event.addListener(marker, 'click', function () {
                    // close window if not undefined
                    if (infoWindow !== void 0) {
                      infoWindow.close();
                    }
                    // create new window
                    var infoWindowOptions = {
                      content: content
                    };
                    infoWindow = new google.maps.InfoWindow(infoWindowOptions);
                    infoWindow.open(map, marker);
                  });
              }

              function setBrakeMarker(map, position) {
              var brakemarker;
              var markerOptions = {
                position: position,
                map: map,
                title: '',
                icon: 'assets/images/braking-icon-hover.png'
              };

                brakemarker = new google.maps.Marker(markerOptions);
                brakemarkers.push(brakemarker); // add marker to array
              };

              function setPath()
              {
                var flightPlanCoordinates = [];
                for(var i=0; i<scope.path.length>0; i++)
                {
                  flightPlanCoordinates.push(new google.maps.LatLng(scope.path[i].latitude, scope.path[i].longitude));
                }

                var flightPath = new google.maps.Polyline({
                 path: flightPlanCoordinates,
                 geodesic: true,
                 strokeColor: '#00A0FF',
                 strokeOpacity: 1.0,
                 strokeWeight: 4
               });
                flightPath.setMap(map);
              }

              function setSpeedPoints()
              {
                for(var i=0; i<scope.speedbrake.length>0; i++)
                {
                    setSpeedMarker(map, new google.maps.LatLng(scope.speedbrake[i].latitude, scope.speedbrake[i].longitude), scope.speedbrake[i].speed.toString(), 'At speed '+scope.speedbrake[i].speed.toString());
                }
              }

              function setBrakePoints()
              {
                for(var i=0; i<scope.brake.length>0; i++)
                {
                  setBrakeMarker(map, new google.maps.LatLng(scope.brake[i].latitude, scope.brake[i].longitude), null, null);
                }
              }
              /*if(scope.path)
              {
                initMap();
                setPath();
                setSpeedPoints();
                setBrakePoints();
              }*/
            
              $rootScope.$on('pathsource', function(event, data) {
                scope.path = data.path;
                scope.brake = data.brake;
                scope.speedbrake = data.speedbrake;

                initMap();
                setPath();
                setSpeedPoints();
                setBrakePoints();
              });

              $rootScope.$on('speedbrake', function(event, data) {
                  if(data.show === false)
                  {
                    for (var i = 0; i < markers.length; i++) {
                      markers[i].setMap(null);
                    }
                  }
                  else
                  {
                    for (var i = 0; i < markers.length; i++) {
                      markers[i].setMap(map);
                    }
                  }
              });

              $rootScope.$on('brake', function(event, data) {
                  if(data.show === false)
                  {
                    for (var i = 0; i < brakemarkers.length; i++) {
                      brakemarkers[i].setMap(null);
                    }
                  }
                  else
                  {
                    for (var i = 0; i < brakemarkers.length; i++) {
                      brakemarkers[i].setMap(map);
                    }
                  }
              });
            };

            return {
              restrict: 'A',
              template: '<div id="gmaps" style="height:100%"></div>',
              replace: true,
              scope:
              {
               path : '=',
               brake :'=',
               speedbrake: '='
             },
             link: link
           };
         });

    })();
});