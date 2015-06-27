define(['angular',
    'config.route'], function (angular, configroute) {
    (function () {

        configroute.register.controller('tripmetrics', ['$rootScope', tripmetrics]);
        function tripmetrics($rootScope) {
            $rootScope.routeSelection = 'metrics';
            var vm = this;

		    var distances = [[1419716700000,1627.0], [1419717000000,1701.0], [1419717300000,1591.0], [1419717600000,1756.0], [1419717900000,1716.0], [1419718200000,1830.0], [1419718500000,1863.0]];

		    vm.tripsChartConfig = {
		        options: {
		            chart: {
		                type: 'line',
		            	zoomType: 'x'
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
		                name: 'Distance Convered',
		                data: distances,
		                color: '#795548'
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
		                text: 'Kilometers'
		            }
		        },
		        size: {
		           height: 250
		        }, 
		        loading: false,
		        size: {
		        	height: 150
		        }
		    };

		    vm.cardClicked = function(){
		    	console.log('Card Clicked!');
		    };

		    vm.recentTrips = [
				{
					carID: 53,
					score: null,
					distance: 14,
					duration: 24,
					startTime: '3 min ago',
					from: 'Ramanathapuram Signal',
					to: 'Coimbatore Railway Junction'
				}, 
				{
					carID: 62,
					score: null,
					distance: 7.3,
					duration: 18,
					startTime: '4 min ago',
					from: 'Saibaba Colony',
					to: 'Nava India Busstop'
				},
				{
					carID: 18,
					score: null,
					distance: 5.6,
					duration: 20,
					startTime: '16 min ago',
					from: 'Masakalipalayam',
					to: 'Coimbatore Airport'
				}
		    ];
		}
    })();
});