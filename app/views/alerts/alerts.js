define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('alerts', ['$rootScope', alerts]);
        function alerts($rootScope) {
            $rootScope.routeSelection = 'alerts';
            var vm = this;
			
			var distances = [[1419716700000,2], [1419717000000,0], [1419717300000,0], [1419717600000,1], [1419717900000,4], [1419718200000,0], [1419718500000,2]];
			vm.alertsChartConfig = {
		        options: {
		            chart: {
		                type: 'line',
		            	zoomType: 'x',
			        	backgroundColor: 'WhiteSmoke'
		            },
			        legend: {
			            enabled: false
			        }
		        },
		        title: {
		            text: ''
		        },
		        series: [
		            {
		                name: 'Alerts',
		                data: distances,
		                color: 'LightCoral'
		            }
		        ],
		        xAxis: {
		            type: 'datetime',
		            title: {
		                text: ''
		            }
		        },
		        yAxis: {
		            title: {
		                text: ''
		            }, 
		            min: 0
		        },
		        size: {
		           height: 250
		        }, 
		        loading: false,
		        size: {
		        	height: 150
		        }
		    };
		}
    })();
});