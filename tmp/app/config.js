define(['angular'], function (angular) {

    (function () {
        'use strict';

        var app = angular.module('rideSenseApp');

        var config = {
            firebaseUrl: 'https://logbasedev.firebaseIO.com/',
            apiUrl : 'http://stick-read-dev.logbase.io/api/',
            customerapiUrl : 'http://stick-write-dev.logbase.io/api/',
            hosturl : 'http://stickdashboard.logbase.io/#/',
            hideDeviceType : false
        };

        app.value('config', config);
    })();
});
