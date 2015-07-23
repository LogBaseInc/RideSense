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

    })();
});