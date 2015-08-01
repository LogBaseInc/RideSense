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
                 $rootScope.$emit('cardetail:dateselected', {date: e.date == false ? moment(new Date()) : e.date});
            });

        };
        return {
            restrict: 'A',
            link: linkFn
        };
      }]);

      configroute.register.directive('googlePlaces', ['$rootScope', function($rootScope){
        return {
            restrict:'E',
            replace:true,
            scope: {},
            //template: '<input id="google_places_ac" name="google_places_ac" type="text" class="input-block-level" placeholder="Search by Map Location" style="border :2px solid rgba(59, 153, 252, 0.68); width:100%; position: relative; z-index:3;"/>',
            template: '<input id="google_places_ac" name="google_places_ac" type="text" class="form-control" placeholder="Search by Map Location" />',
            link: function($scope, elm, attrs){
                var autocomplete = new google.maps.places.Autocomplete($("#google_places_ac")[0], {});
                google.maps.event.addListener(autocomplete, 'place_changed', function() {
                    var place = autocomplete.getPlace();
                    $rootScope.$emit('search:location', {lat:place.geometry.location.lat(), lng:place.geometry.location.lng()});
                });
            }
        }
      }]);

    })();
});