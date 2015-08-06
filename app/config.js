define(['angular'], function (angular) {

    (function () {
        'use strict';

        var app = angular.module('rideSenseApp');

        var config = {
            docTitle: 'Ridesense::',
            firebaseUrl: 'https://logbasedev.firebaseIO.com/',
            apiUrl : 'http://stick-read-dev.logbase.io/api/',
            //hosturl : 'http://0.0.0.0:9000/#/'
            hosturl : 'https://stickapp.azurewebsites.net/#/'
        };

        app.value('config', config);
    })();
});
