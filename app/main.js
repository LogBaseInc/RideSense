require.config({
    urlArgs: '3.4',
    waitSeconds: 0,
    paths: {
        angular: '../bower_components/angular/angular',
        angularAMD: '../bower_components/angularAMD/angularAMD',
        'angular-animate': '../bower_components//angular-animate/angular-animate',
        'angular-route': '../bower_components/angular-route/angular-route',
        bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
        ngMessages: '../bower_components/angular-messages/angular-messages',
        jquery: '../bower_components/jquery/dist/jquery',
        _: '../bower_components/underscore/underscore',
        'config.route': 'config.route',
        'ui-bootstrap' :'scripts/ui-bootstrap-tpls-0.12.0',
        'spinner': 'scripts/spin',
        'toaster' :'../bower_components/angularjs-toaster/toaster',
        'googlemaps' : '../bower_components/angular-google-maps/dist/angular-google-maps',
        'highcarts-src': 'scripts/highcharts.src',
        'highcharts' : '../bower_components/highcharts-ng/dist/highcharts-ng',
        'moment' :'scripts/moment',
        'bootstrap-datepicker': 'scripts/bootstrap-datepicker',
        'directives': 'views/directives/directives',
        'utility' : 'views/component/utility'
    },
    shim: {
        angular: {
            deps: ['jquery'],
            exports: 'angular',
        },
        'angularAMD': ['angular'],
        'angular-animate': ['angular'],
        'angular-route': ['angular'],
        'ngMessages': ['angular'],
        bootstrap: {
            deps: ["jquery"]
        },

        jquery: {
            exports: 'jQuery'
        },

        'ui-bootstrap': ['angular'],
        underscore: {
            exports: "_"
        },
         "spinner": {
            exports: 'Spinner'
        },
        'toaster': ['angular','angular-animate'],
    },
});

require(["infrastructure"], function () {
    require(["app"], function (app) {

    });
});