require.config({
    urlArgs: 'V1.0',
    waitSeconds: 0,
    paths: {
        angular: 'bower_components/angular/angular',
        angularAMD: 'bower_components/angularAMD/angularAMD',
        'angular-cookies': 'bower_components/angular-cookies/angular-cookies.min',
        'angular-animate': 'bower_components//angular-animate/angular-animate',
        'angular-route': 'bower_components/angular-route/angular-route',
        'angular-sanitize': 'bower_components/angular-sanitize/angular-sanitize',
        bootstrap: 'bower_components/bootstrap/dist/js/bootstrap',
        ngMessages: 'bower_components/angular-messages/angular-messages',
        jquery: 'bower_components/jquery/dist/jquery',
        _: 'bower_components/underscore/underscore',
        'config.route': 'config.route',
        'ui-bootstrap' :'scripts/ui-bootstrap-tpls-0.12.0',
        'spinner': 'scripts/spin',
        'toaster' :'bower_components/angularjs-toaster/toaster',
        'ngDialog' : 'bower_components/ngDialog/js/ngDialog',
        'googlemaps' : 'bower_components/angular-google-maps/dist/angular-google-maps',
        'lodash': 'bower_components/lodash/lodash',
        'highcarts-src': 'scripts/highcharts.src',
        'highcharts' : 'bower_components/highcharts-ng/dist/highcharts-ng'
    },
    shim: {
        angular: {
            deps: ['jquery'],
            exports: 'angular',
        },
        'angularAMD': ['angular'],
        'angular-animate': ['angular'],
        'angular-route': ['angular'],
        'angular-sanitize': ['angular'],
        'angular-cookies': ['angular'],
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
        'googlemaps': ['angular'],
        'highcharts': ['jquery','angular','highcarts-src'],
    },
});

require(["infrastructure"], function () {
    require(["app"], function (app) {

    });
});