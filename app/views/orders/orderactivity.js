define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {
        configroute.register.controller('orderactivity', ['$rootScope', '$scope', 'config', 'sessionservice', 'utility', orderactivity]);
        function orderactivity($rootScope, $scope, config, sessionservice, utility) {
        	$rootScope.routeSelection = 'activity';
        	var oavm = this;
        	var todaysdate = "";
            var currentmonth;
             var ordersref;
		  	oavm.showallusers = true;
		  	oavm.totalorders = 0;
		  	oavm.avgorders = 0;
		  	oavm.ordersData = {};

		  	activate();
		  	function activate() {
                var month  = new Date().getMonth();
                var year = new Date().getFullYear();
                month = month + 1;
                currentmonth = year.toString()+""+(month.toString().length ==1 ? "0"+ month.toString() : month.toString());

                if($scope.$parent.vm.showallcars == false) 
                    setOrderUrl($scope.$parent.vm.selectedcar);
                else
                    setOrderUrl(null);
		  	}

            $rootScope.$on('activity:usersearched', function(event, data) {
                setOrderUrl(data.user);
            });

            function setOrderUrl(user) {
                if(user == null) {
                    oavm.headertext = "This Month Order Activity";
                    ordersref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/unassignorders');
                }
                else {
                    oavm.headertext = "Order Summary for "+ user.vehiclenumber;
                    ordersref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/orders/'+user.devicenumber);
                }

                getAllOrders();
            }

		  	function getAllOrders() {
		  		ordersref.once("value", function(snapshot) {
		  			oavm.totalorders = 0;
		  			oavm.avgorders = 0; 
                    var data = snapshot.val();
                    if(data) {
                        calOrderCount(data);
                    }
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The unassignorders read failed: " , errorObject);
                });
		  	}

		  	function calOrderCount(data) {
		  		oavm.ordersData.categories = [];
                oavm.ordersData.data = [];
                oavm.ordersData.date = [];

		  		for(var i = 29 ; i >= 0; i --) {
                    var newdate = new Date();
                    newdate.setDate(newdate.getDate() - i);
                    var date = moment(new Date(newdate)).format('YYYYMMDD');
                    oavm.ordersData.categories.push(moment(new Date(newdate)).format('MMM DD'));
                    oavm.ordersData.date.push(date);
                    var ordersobj = data[date];
                    var orderscount = 0;
                    if(ordersobj != null && ordersobj != undefined) {
                        delete ordersobj["LoggedOn"];
                        delete ordersobj["Loggedat"];
                        orderscount = Object.keys(ordersobj).length;
                    }
                    oavm.ordersData.data.push(orderscount);
                    if(i == 0) { todaysdate= date;}

                    if(date.indexOf(currentmonth) == 0) {
                        oavm.totalorders = oavm.totalorders+orderscount;
                    }
                }

                if(oavm.totalorders > 0) {
                    var curerntday = new Date().getDate();;
                    oavm.avgorders = (oavm.totalorders / curerntday).toFixed(0);
                }

                ordersChartConfig();
		  	}

            function ordersChartConfig(){
                oavm.ordersConfig = {
                    options: {
                        chart: {
                            type: 'line',
                            zoomType: 'x',
                            backgroundColor: '#EFEBE9',
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
                            name: 'Orders',
                            data: oavm.ordersData.data,
                            color: 'LightCoral'
                        }
                    ],
                    xAxis: {
                        categories: oavm.ordersData.categories
                    },
                    yAxis: {
                        min: 0,
                        title : 'Orders'
                    },
                    loading: false,
                    size: {
                        height: 175
                    }
                };
            }
        }
    })();
});