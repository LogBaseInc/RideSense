define(['angular'], function (angular) {

    (function () {
        'use strict';

        var app = angular.module('rideSenseApp');

        var config = {
            docTitle: 'Ridesense::',
            firebaseUrl: 'https://logbasedev.firebaseIO.com/',
            idleTime : '15'
        };

        app.value('config', config);
    })();
});
