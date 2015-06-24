define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('device', ['$scope', 'ngDialog', device]);
        function device($scope, ngDialog) {
            var submitted = false;
            Object.defineProperty($scope, 'canBuy', {
                get: canBuy
            });

            $scope.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate(){
                if($scope.ngDialogData.device)
                    $scope.device = $scope.ngDialogData.device;
            }

            function canBuy(){
                return $scope.deviceform.$valid && !submitted;
            }

        }
    })();
});