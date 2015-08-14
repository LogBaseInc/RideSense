define(['angular'], function (angular) {

    (function () {
        'use strict';

        var app = angular.module('rideSenseApp');

        var config = {
            firebaseUrl: 'https://logbasedev.firebaseIO.com/',
            apiUrl : 'http://stick-read-dev.logbase.io/api/',
            //hosturl : 'http://0.0.0.0:9000/#/'
            hosturl : 'http://stickapp.azurewebsites.net/#/'
        };

        app.value('config', config);
    })();
});
