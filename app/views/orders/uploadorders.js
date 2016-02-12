define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {

        configroute.register.controller('uploadorders', ['$rootScope', '$scope', '$location', 'sessionservice', 'config', 'spinner', 'notify', 'utility', uploadorders]);
        function uploadorders($rootScope, $scope, $location, sessionservice, config, spinner, notify, utility) {
        	$rootScope.routeSelection = 'orders';
        	var vm = this;
        	var submitted = false;
        	vm.buttondisabled = false;
        	var accountid= sessionservice.getaccountId();

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

        	function parseExcelRows(data) {
        		var orders = [];
        		if(data.worksheets.length > 0) {
        			if(data.worksheets[0].length > 1) {
        				var records= data.worksheets[0];
        				if(records.length >0 && records.length <= 100) {
	        				var addcount = 0;
	        				for(var j = 1; j < records.length; j++) {
	        					var orderinfo = records[j];
	        					if(orderinfo.length >= 11 && 
	        					   orderinfo[0] != null && orderinfo[0] != undefined && orderinfo[0] != "" && orderinfo[0] != "-" && orderinfo[0].toString() != "NaN" &&
	        					   orderinfo[1] != null && orderinfo[1] != undefined && orderinfo[1] != "" && orderinfo[1] != "-" && orderinfo[1].toString() != "NaN" &&
	        					   orderinfo[2] != null && orderinfo[2] != undefined && orderinfo[2] != "" && orderinfo[2] != "-" && orderinfo[2].toString() != "NaN" &&
	        					   orderinfo[3] != null && orderinfo[3] != undefined && orderinfo[3] != "" && orderinfo[3] != "-" && orderinfo[3].toString() != "NaN" &&
	        					   orderinfo[4] != null && orderinfo[4] != undefined && orderinfo[4] != "" && orderinfo[4] != "-" && orderinfo[4].toString() != "NaN" &&
	        					   orderinfo[5] != null && orderinfo[5] != undefined && orderinfo[5] != "" && orderinfo[5] != "-" && orderinfo[0].toString() != "NaN") {

		        					var deliverydate = moment(new Date((orderinfo[4] - (25567 + 2))*86400*1000)).format('YYYYMMDD');
		        					if(deliverydate != "Invalid date") {
		        						addcount = addcount+1;

			        					var order = {};
                                        order.createdat = new Date().getTime();
			        					order.ordernumber = orderinfo[0];
			        					order.name = orderinfo[1];
			        					order.address = orderinfo[2];
			        					order.mobilenumber = orderinfo[3];
			        					order.deliverydate = deliverydate;
			        					order.time = orderinfo[5];
			        					order.amount = (orderinfo[6] != "-") ? orderinfo[6] : 0;
			        					order.productname = (orderinfo[7] != "-") ? orderinfo[7] : "";
			        					order.productdesc = (orderinfo[8] != "-") ? orderinfo[8] : "";
			        					order.notes = (orderinfo[9] != "-") ? orderinfo[9] : "";
			        					order.tags = (orderinfo[10] != "-") ? orderinfo[10] : "";
			        					addOrder(order);
			        				}
	        					}
	        				}
	        				spinner.hide();
        					vm.buttondisabled = false;
        					notify.success(addcount + " orders uploaded.");
        					utility.applyscope($scope);
        					vm.cancel();
        				}
        				else {
        					spinner.hide();
        					vm.buttondisabled = false;
        					notify.error(records.length <=0 ? "No orders found" : "More than 100 orders found. Only upto 100 orders will be uploaded at a time.");
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

        	function addOrder(order){
        		var orderref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+order.deliverydate+"/"+order.ordernumber);
        		orderref.set(order);
        	}

        	vm.cancel = function() {
                submitted = false;
                spinner.hide();
                $location.path('/orders');
            }
        }
    })();
});