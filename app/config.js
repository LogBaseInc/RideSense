define(['angular'], function (angular) {

    (function () {
        'use strict';

        var app = angular.module('rideSenseApp');

        var config = {
            docTitle: 'Ridesense::',
            firebaseUrl: 'https://logbasedev.firebaseIO.com/',
            apiUrl : 'http://stick-read-dev.logbase.io/api/',
        };

        app.value('config', config);
    })();
});
