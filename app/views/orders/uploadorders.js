define(['angular',
    'config.route',
    'lib',
    'views/services/orderservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('uploadorders', ['$rootScope', '$scope', '$location', 'sessionservice', 'config', 'spinner', 'notify', 'utility', 'orderservice', uploadorders]);
        function uploadorders($rootScope, $scope, $location, sessionservice, config, spinner, notify, utility, orderservice) {
        	$rootScope.routeSelection = 'orders';
        	var vm = this;
        	var submitted = false;
        	var accountid= sessionservice.getaccountId();
            var userid = sessionservice.getSession().uid;
            vm.buttondisabled = false;

            activate();

            function activate(){
                getCountryName();
            }

            function getCountryName() {
                var countryref = new Firebase(config.firebaseUrl+'accounts/'+accountid+"/"+'address/country');
                countryref.once("value", function(snapshot) {
                    if(snapshot.val() != null && snapshot.val() != undefined && snapshot.val() != "") {
                        vm.country = snapshot.val();
                        utility.applyscope($scope);
                    }
                    else{
                        $.ajax({
                            url: "http://ip-api.com/json",
                            type: 'GET',
                            success: function(json) {
                                vm.country = json.country;
                                utility.applyscope($scope);
                            },
                            error: function(err) {
                                vm.country = "India";
                                utility.applyscope($scope);
                            }
                        });
                    }
                }, function(errorObject){

                });
            }

        	vm.uploadorders = function() {
        		if(vm.selectedfile != null && vm.selectedfile != undefined) {
	        		if(vm.selectedfile.name.indexOf(".xlsx") > 0) {
	        			spinner.show();
	        			vm.buttondisabled = true;
		        		var reader = new FileReader();
		                reader.onload = function(readerEvt) {
		                    var binaryString = readerEvt.target.result;
		                    var base64 = btoa(binaryString);

		                    var obj = xlsx(base64);
		                    parseExcelRows(obj);
		                };
		                reader.readAsBinaryString(vm.selectedfile);
		            }
		            else {
		            	notify.error("Upload only .xlsx file.")
		            }
		        }
		        else {
		           	notify.error("No file chosen.")
		        }
        	}

            function checkOrderFileHeader(orderheader){
                var isvalid = false;
                if(orderheader.length >=1 && 
                    orderheader[0].toLowerCase().indexOf('order number') >=0 && 
                    orderheader[1].toLowerCase().indexOf('customer name') >=0 && 
                    orderheader[2].toLowerCase().indexOf('customer address') >=0 && 
                    orderheader[3].toLowerCase().indexOf('zipcode') >=0 && 
                    orderheader[4].toLowerCase().indexOf('customer mobile number') >=0 &&
                    orderheader[5].toLowerCase().indexOf('delivery date') >=0 &&
                    orderheader[6].toLowerCase().indexOf('delivery time') >=0 &&
                    orderheader[7].toLowerCase().indexOf('amount to collect from customer') >=0 &&
                    orderheader[8].toLowerCase().indexOf('product description') >=0 &&
                    orderheader[9].toLowerCase().indexOf('notes') >=0 &&
                    orderheader[10].toLowerCase().indexOf('tags') >=0) {
                    isvalid = true;
                }

                return isvalid;
            }

        	function parseExcelRows(data) {
                if(data.isdirectfromexport == false) {
            		var orders = [];
            		if(data.worksheets.length > 0) {
            			if(data.worksheets[0].length > 1) {
            				var records= data.worksheets[0];
            				if(records.length >0 && records.length <= 100) {
    	        				var addcount = 0;
                                if(checkOrderFileHeader(records[0])) {
        	        				for(var j = 1; j < records.length; j++) {
        	        					var orderinfo = records[j];
        	        					if(orderinfo.length >= 11 && 
        	        					    orderinfo[0] != null && orderinfo[0] != undefined && orderinfo[0] != "" && orderinfo[0] != "-" && orderinfo[0].toString() != "NaN" &&
        	        					    orderinfo[1] != null && orderinfo[1] != undefined && orderinfo[1] != "" && orderinfo[1] != "-" && orderinfo[1].toString() != "NaN" &&
        	        					    orderinfo[2] != null && orderinfo[2] != undefined && orderinfo[2] != "" && orderinfo[2] != "-" && orderinfo[2].toString() != "NaN" &&
        	        					    orderinfo[3] != null && orderinfo[3] != undefined && orderinfo[3] != "" && orderinfo[3] != "-" && orderinfo[3].toString() != "NaN" &&
        	        					    orderinfo[4] != null && orderinfo[4] != undefined && orderinfo[4] != "" && orderinfo[4] != "-" && orderinfo[4].toString() != "NaN" &&
        	        					    orderinfo[5] != null && orderinfo[5] != undefined && orderinfo[5] != "" && orderinfo[5] != "-" && orderinfo[5].toString() != "NaN" &&
                                            orderinfo[6] != null && orderinfo[6] != undefined && orderinfo[6] != "" && orderinfo[6] != "-" && orderinfo[6].toString() != "NaN") {

        		        					var deliverydate = moment(new Date((orderinfo[5] - (25567 + 2))*86400*1000)).format('YYYY/MM/DD');
        		        					if(deliverydate != "Invalid date") {
        		        						addcount = addcount+1;

                                                orders.push({
                                                    order_id: orderinfo[0],
                                                    createdby : userid,
                                                    name: orderinfo[1],
                                                    address: orderinfo[2],
                                                    zip: orderinfo[3],
                                                    mobile_number :orderinfo[4],
                                                    delivery_date: deliverydate,
                                                    delivery_time_slot : orderinfo[6],
                                                    cod_amount : (orderinfo[7] != null && orderinfo[7] != undefined && orderinfo[7] != "" && orderinfo[7] != "-" && orderinfo[7].toString() != "NaN") ? orderinfo[7] : 0,
                                                    product_desc : (orderinfo[8] != null && orderinfo[8] != undefined && orderinfo[8] != "" && orderinfo[8] != "-" && orderinfo[8].toString() != "NaN") ? orderinfo[8] : "",
                                                    notes : (orderinfo[9] != null && orderinfo[9] != undefined && orderinfo[9] != "" && orderinfo[9] != "-" && orderinfo[9].toString() != "NaN") ? orderinfo[9] : "",
                                                    country: vm.country,
                                                    items : "",
                                                    tags: (orderinfo[10] != null && orderinfo[10] != undefined && orderinfo[10] != "" && orderinfo[10] != "-" && orderinfo[10].toString() != "NaN") ? orderinfo[10] : ""
                                                });
        			        				}
        	        					}
        	        				}

                                    if(orders.length > 0) {
                                        addOrder(orders);
                                    }
                                    else{
                                        spinner.hide();
                                        vm.buttondisabled = false;
                                        notify.error("No valid order found to upload.");
                                        utility.applyscope($scope);
                                    }
                                }
                                else {
                                    spinner.hide();
                                    vm.buttondisabled = false;
                                    notify.error("Few columns are missing, please use the latest template available");
                                    utility.applyscope($scope);
                                }
            				}
            				else {
            					spinner.hide();
            					vm.buttondisabled = false;
            					notify.error(records.length <=0 ? "No order found" : "More than 100 orders found. Only upto 100 orders will be uploaded at a time.");
            					utility.applyscope($scope);
            				}
            			}
            			else {
            				spinner.hide();
            				vm.buttondisabled = false;
            				notify.error('No orders found');
            				utility.applyscope($scope);
            			}
            		}
            		else {
            			spinner.hide();
            			vm.buttondisabled = false;
            			notify.error('No worksheet found');
            			utility.applyscope($scope);
            		}
                }
                else {
                    submitted = false;
                    vm.buttondisabled = false;
                    spinner.hide();
                    notify.warning('No change in orders');
                    utility.applyscope($scope);
                }
        	}

        	function addOrder(orders){
        		return orderservice.saveOrder(orders, accountid).then(
                function(data){
                    spinner.hide();
                    vm.buttondisabled = false;
                    notify.success(orders.length + " orders uploaded.");
                    utility.applyscope($scope);
                    vm.cancel();
                },
                function (error){
                    submitted = false;
                    vm.buttondisabled = false;
                    spinner.hide();
                    notify.error("Something went wrong, please try after sometime");
                    utility.applyscope($scope);
                });
        	}

        	vm.cancel = function() {
                submitted = false;
                spinner.hide();
                $location.path('/orders');
            }
        }
    })();
});