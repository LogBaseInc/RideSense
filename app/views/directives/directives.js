define(['angular',
  'config.route', 
  'bootbox',
  'bootstrap-datepicker'], 
  function (angular, configroute, bootbox) {
    (function () {
      configroute.register.directive("lbDatepicker", ["$rootScope", function ($rootScope) {
        var linkFn = function (scope, element, attr, ctrl) {
            element.datetimepicker({
                format: 'DD/MM/YYYY',
            });

             element.on("dp.change", function (e) {
                 $rootScope.$emit('cardetail:dateselected', {date: e.date});
            });

        };
        return {
            restrict: 'A',
            link: linkFn
        };
      }]);

      configroute.register.factory('$bootbox', ['$modal', function ($modal) {
        // NOTE: this is a workaround to make BootboxJS somewhat compatible with
        // Angular UI Bootstrap in the absence of regular bootstrap.js
        if ($.fn.modal == undefined) {
            $.fn.modal = function (directive) {
                var that = this;
                if (directive == 'hide') {
                    if (this.data('bs.modal')) {
                        this.data('bs.modal').close();
                        $(that).remove();
                    }
                    return;
                } else if (directive == 'show') {
                    return;
                }

                var modalInstance = $modal.open({
                    template: $(this).find('.modal-content').html()
                });
                this.data('bs.modal', modalInstance);
                setTimeout(function () {
                    $('.modal.ng-isolate-scope').remove();
                    $(that).css({
                        opacity: 1,
                        display: 'block'
                    }).addClass('in');
                }, 100);
            };
        }
        return bootbox;
      }]);  

      configroute.register.directive('googlePlaces', ['$rootScope', function($rootScope){
        return {
            restrict:'E',
            replace:true,
            scope: {},
            template: '<input id="google_places_ac" name="google_places_ac" type="text" class="input-block-level" placeholder="Search location..." style="border :2px solid rgba(59, 153, 252, 0.68); width:100%; position: relative; z-index:3;"/>',
            link: function($scope, elm, attrs){
                var autocomplete = new google.maps.places.Autocomplete($("#google_places_ac")[0], {});
                google.maps.event.addListener(autocomplete, 'place_changed', function() {
                    var place = autocomplete.getPlace();
                    $rootScope.$emit('search:location', {lat:place.geometry.location.lat(), lng:place.geometry.location.lng()});
                });
            }
        }
      }]);

      configroute.register.directive('myMap', function($rootScope) {
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

            function setSpeedPoints() { 
              if(scope.speedbrake) {
                for(var i=0; i<scope.speedbrake.length>0; i++)
                {
                    setSpeedMarker(map, new google.maps.LatLng(scope.speedbrake[i].latitude, scope.speedbrake[i].longitude), scope.speedbrake[i].speed.toString(), 'At speed '+scope.speedbrake[i].speed.toString());
                }
              }
            }

            function setBrakePoints() {
              if(scope.brake) {
                for(var i=0; i<scope.brake.length>0; i++)
                {
                  setBrakeMarker(map, new google.maps.LatLng(scope.brake[i].latitude, scope.brake[i].longitude), null, null);
                }
              }
            }
            
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