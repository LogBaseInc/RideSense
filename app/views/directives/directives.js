define(['angular',
  'config.route', 
  'bootstrap-datepicker'], 
  function (angular, configroute) {
    (function () {
      configroute.register.directive("lbDatepicker", ["$rootScope", function ($rootScope) {
        var linkFn = function (scope, element, attr, ctrl) {
            element.datetimepicker({
                format: 'DD/MM/YYYY',
            });

             element.on("dp.change", function (e) {
                 $rootScope.$emit('datepicker:dateselected', {date: e.date == false ? moment(new Date()) : e.date});
            });

        };
        return {
            restrict: 'A',
            link: linkFn
        };
      }]);

      configroute.register.directive("timeSlider", ["$rootScope", "utility", function ($rootScope, utility) {
        var linkFn = function (scope, element, attr, ctrl) {
            var timeoneinmins = utility.getTimeInMins(scope.timeone);
            var timetwoinmins = utility.getTimeInMins(scope.timetwo);

            element.slider({
              range: true,
              disabled: scope.iscancelled,
              min: 0,
              max: 1440,
              step: 30,
              values: [timeoneinmins, timetwoinmins],
              slide: function (e, ui) {
                  scope.timeone = utility.getTime1(ui.values[0]);
                  scope.timetwo = utility.getTime2(ui.values[1]);
                  utility.applyscope(scope);
              },

              stop : function(e, ui){
                if(scope.slidestop != null && scope.slidestop != undefined)
                    scope.slidestop();
              }
          });

        };
        return {
            restrict: 'A',
            link: linkFn,
            scope: {
              timeone: '=',
              timetwo: '=',
              iscancelled: '=',
              slidestop : '&'
            },
        };
      }]);

      configroute.register.directive('googlePlaces', ['$rootScope', function($rootScope){
        return {
            restrict:'E',
            replace:true,
            scope: {},
            template: '<input id="google_places_ac" name="google_places_ac" type="text" class="form-control tm-search-text" placeholder="Search by location" />',
            link: function($scope, elm, attrs){
                var autocomplete = new google.maps.places.Autocomplete($("#google_places_ac")[0], {});
                google.maps.event.addListener(autocomplete, 'place_changed', function() {
                    var place = autocomplete.getPlace();
                    $rootScope.$emit('search:location', {lat:place.geometry.location.lat(), lng:place.geometry.location.lng()});
                });
            }
        }
      }]);

      configroute.register.directive('confirm', ['$modal', '$parse', '$rootScope', function($modal, $parse, $rootScope){
        return {
          link: function(scope, el, attr){
            el.bind('click', function(){
              $rootScope.$emit('confrimdialog');

              var instance = $modal.open({
                templateUrl: 'markasdeliveredmodal.html',
                controller: ['$scope', '$modalInstance', function(s, m){
                  s.ok = function(){
                    m.close();
                  };
                  s.cancel = function(){
                    m.dismiss();
                  };
                }]
              });
              
              instance.result.then(function(){
                // close - action!
                $parse(attr.onConfirm)(scope);
              }, 
              function(){
                // dimisss - do nothing
              });
            });
          }
        }
      }]);

    })();
});