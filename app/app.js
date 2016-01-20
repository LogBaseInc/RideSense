define(['angular',
  'angularAMD'],
  function (angular, angularAMD) {
      (function () {
          'use strict';

          var app = angular.module('rideSenseApp', [
              // Angular modules 
             'ngRoute',         
             'ngMessages',
             'ngBootbox',

             // 3rd Party Modules
             'ui.bootstrap',
             'toaster',
             'logglyLogger',
             //'ngIdle'
          ]);

          app.run(['$route', function ($route) {
              
          }]);

          window.scriptLoaded = function() {

          };

          require([
              'config',
              'config.route',
              'views/layout/shell',
              'views/component/spinner/spinner',
              'views/component/notify/notify',
              'views/component/sessionservice',
              'views/directives/startupdirectives'
          ], function () {
              angular.element(document).ready(function () {
                  loadScript();
                  return angularAMD.bootstrap(app);
              });
          });

          function loadScript() {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://maps.google.com/maps/api/js?sensor=true&libraries=places&language=en-US&callback=scriptLoaded';
            document.body.appendChild(script);

            var script1 = document.createElement('script');
            script1.type = 'text/javascript';
            script1.src = 'https://gitcdn.github.io/bootstrap-toggle/2.2.0/js/bootstrap-toggle.min.js';
            document.body.appendChild(script1);
          } 
    })();
});
