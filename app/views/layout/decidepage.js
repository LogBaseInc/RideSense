define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {
        
        configroute.register.controller('decidepage', ['$rootScope', '$location', 'sessionservice', decidepage]);
        function decidepage($rootScope, $location, sessionservice) {
        	if(sessionservice.isLoggedIn() == 'true') {
        		$rootScope.routeSelection = 'orders';
				$location.path('/orders');
			}
			else {
				$location.path('/login');
			}   
		} 
	})();
});