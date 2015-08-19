define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {
        
        configroute.register.controller('liveempty', ['$rootScope', '$location', liveempty]);
        function liveempty($rootScope, $location) {
        	$rootScope.routeSelection = 'live';
			$location.path('/live');   
		} 
	})();
});