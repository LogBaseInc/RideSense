define(['angular',
    'config.route','moment'], function (angular, configroute, moment) {
    (function () {

        configroute.register.controller('cardetails', ['$rootScope','$scope', '$location', 'config', 'spinner', 'sessionservice', cardetails]);
        function cardetails($rootScope, $scope, $location, config, spinner, sessionservice) {
            var vm = this;
            vm.distanceData = [];

            activate();

            function activate() {
                $rootScope.routeSelection = 'cars';
                vm.distanceData.categories = [];
                vm.distanceData.data = [];

                for(var i = 30 ; i >= 0; i --) {
                    var newdate = new Date();
                    newdate.setDate(newdate.getDate() - i);
                    vm.distanceData.categories.push(moment(new Date(newdate)).format('MMM DD'));
                    vm.distanceData.data.push(0);
                }

                getDistanceDetails();
                //distanceChartConfig();

            }

            function getDistanceDetails() {
                var ref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/activity/daily');
                ref.orderByChild("timestamp").limitToLast(30).on("value", function(snapshot) {
                 
                var date = moment(snapshot.val().timestamp).format('MMM DD');
                var dateIndex = vm.distanceData.categories.indexOf(date);
                if(dateIndex >= 0) 
                    vm.distanceData.data[dateIndex] += snapshot.val().distance;
                    sessionservice.applyscope('$scope');
                    distanceChartConfig();
                });
            }

            function distanceChartConfig(){
                vm.distanceConfig = {
                    options: {
                        chart: {
                            type: 'line',
                            zoomType: 'x',
                            //backgroundColor: 'WhiteSmoke',
                            marginBottom: 50,
                            events: {
                            load: function (event) {
                                setTimeout( function () {$(window).resize();}, 100);
                            }
                         }
                        },
                        legend: {
                            enabled: false
                        },
                    },
                    credits: {
                        enabled: false
                    },
                    title: {
                        text: ''
                    },
                    series: [{
                            name: 'Alerts',
                            data: vm.distanceData.data, //[100, 200, 300, 400, 250, 456, 123, 456, 879, 123, 454, 565, 120, 345, 111, 234, 100, 200, 300, 400, 250, 456, 123, 456, 879, 123, 454, 565, 120, 345],
                            color: 'LightCoral'
                        }
                    ],
                    xAxis: {
                        categories: vm.distanceData.categories /*['Jun 10', 'Jun 11', 'Jun 12', 'Jun 13', 'Jun 14', 'Jun 15', 'Jun 16', 'Jun 17','Jun 18', 'Jun 19', 
                                     'Jun 20', 'Jun 21', 'Jun 22', 'Jun 23', 'Jun 24', 'Jun 25', 'Jun 26', 'Jun 27','Jun 28', 'Jun 29',
                                     'Jun 30', 'Jul 01', 'Jul 02', 'Jul 03', 'Jul 04', 'Jul 05', 'Jul 06', 'Jul 07', 'Jul 08', 'Jul 09']*/
                    },
                    yAxis: {
                        min: 0
                    },
                    loading: false,
                    size: {
                        height: 200
                    }
                };
            }
        }
    })();
});