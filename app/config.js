define(['angular'], function (angular) {

    (function () {
        'use strict';

        var app = angular.module('rideSenseApp');

        var config = {
            docTitle: 'RideSense::',
            firebaseUrl: 'https://logbasedev.firebaseIO.com/'
        };

        app.value('config', config);
    })();
});
