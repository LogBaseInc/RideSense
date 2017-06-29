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
              template: '<div data-ng-show="isBusy" style="z-index:1000"><img src="assets/images/loader.gif" class="ajax-loader"></img></div>'
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

      module.directive('checkStrength', ['$rootScope', function ($rootScope) {
          return {
            replace: false,
            restrict: 'EACM',
            scope: { model: '=checkStrength' },
            link: function (scope, element, attrs) {
                var strength = {
                    colors: ['#F00', '#F90', '#FF0', '#66CD00'],
              mesureStrength: function (p) {
                  var _force = 0;
                        var _regex = /[$-/:-?{-~!"^_`\[\]]/g; //" (Commentaire juste là pour pas pourrir la coloration sous Sublime...)
                     
                        var _lowerLetters = /[a-z]+/.test(p);                    
                        var _upperLetters = /[A-Z]+/.test(p);
                        var _numbers = /[0-9]+/.test(p);
                        var _symbols = _regex.test(p);
                                              
                        var _flags = [_lowerLetters, _upperLetters, _numbers, _symbols];                    
                        var _passedMatches = $.grep(_flags, function (el) { return el === true; }).length;                                          
                        
                        _force += 2 * p.length + ((p.length >= 10) ? 1 : 0);
                        _force += _passedMatches * 10;
                            
                        // penality (short password)
                        _force = (p.length <= 6) ? Math.min(_force, 10) : _force;                                      
                        
                        // penality (poor variety of characters)
                        _force = (_passedMatches == 1) ? Math.min(_force, 10) : _force;
                        _force = (_passedMatches == 2) ? Math.min(_force, 20) : _force;
                        _force = (_passedMatches == 3) ? Math.min(_force, 40) : _force;
                        
                        return _force;
              },
              getColor: function (s, newValue) {
                  var idx = 0;
                  if (s <= 10) { idx = 0; }
                  else if (s <= 20) { idx = 1; }
                  else if (s <= 30) { idx = 2; }
                  else  { idx = 3; }

                  if(idx >= 3 && (newValue.length < 8 || /\d/.test(newValue) == false))
                      idx = 1;

                  return { idx: idx + 1, col: this.colors[idx] };
              }
                };
          
                scope.$watch('model', function (newValue, oldValue) {
                    if (!newValue || newValue === '') {
                        element.css({ "display": "none"  });
                    } else {
                        var c = strength.getColor(strength.mesureStrength(newValue), newValue);
                        element.css({ "display": "inline" });
                        element.children('li')
                            .css({ "background": "#DDD" })
                            .slice(0, c.idx)
                            .css({ "background": c.col });
                        $rootScope.$emit('passwordStrength', {isGood : c.idx   >= 3 ? true  :false});
                    }
                });
          
            },
            template: '<li class="point"></li><li class="point"></li><li class="point"></li><li class="point"></li>'
         };
      }]);

      module.directive('ngEnter', function () {
          return function (scope, element, attrs) {
              element.bind("keydown keypress", function (event) {
                  if(event.which === 13) {
                      scope.$apply(function (){
                          scope.$eval(attrs.ngEnter);
                      });
                      event.preventDefault();
                  }
              });
          };
      });

      module.directive('lbTooltip', function(){
        return {
            restrict: 'A',
            link: function(scope, element, attrs){
                var order = angular.fromJson(attrs.lbTooltip);
                var title='<small><i class="glyphicon glyphicon-map-marker ordicon"></i>'+ order.address+" " +order.zip+'</small><br/><hr><small><i class="glyphicon glyphicon-gift ordicon"></i>'+order.productdesc+'</small>'
                $(element).tooltip({
                  title: title, 
                  html: true, 
                  placement: "top"
                }); 

                $(element).hover(function(){
                    // on mouseenter
                    $(element).tooltip('show');
                }, function(){
                    // on mouseleave
                    $(element).tooltip('hide');
                });
            }
        };
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

  })();
});