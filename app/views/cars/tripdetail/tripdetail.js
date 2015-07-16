define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('tripdetail', ['$rootScope', '$scope', 'config', 'spinner','sessionservice', tripdetail]);
        function tripdetail($rootScope, $scope, config, spinner, sessionservice) {
            var vm= this;
            vm.pathsource =[];
            vm.showmap= false;

            activate()

            function activate() {
                $rootScope.routeSelection = 'cars';
                vm.selectedtrip = $rootScope.selectedtrip;

                vm.showmap= true;  
                
                /*var myDataRef = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/report');
                    spinner.show();
                    myDataRef.on("value", function(snapshot) {
                        setPath(snapshot.val());
                    }, 
                    function (errorObject) {
                        console.log("The read failed: " + errorObject.code);
                    }
                );*/
            }

            function setPath(data) {
                spinner.hide();
                vm.pathsource = data.position;
                vm.showmap= true;  
                $rootScope.$emit('pathsource', {path:vm.pathsource});
                sessionservice.applyscope($scope);
            }
        }
    })();
});