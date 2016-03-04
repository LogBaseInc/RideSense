define(['angular',
    'config.route',
    'lib',
    'views/services/productservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('uploadproducts', ['$rootScope', '$scope', '$location', 'sessionservice', 'config', 'spinner', 'notify', 'utility', 'productservice', uploadproducts]);
        function uploadproducts($rootScope, $scope, $location, sessionservice, config, spinner, notify, utility, productservice) {
        	$rootScope.routeSelection = 'orders';
        	var vm = this;
        	var submitted = false;
        	vm.buttondisabled = false;
        	var accountid= sessionservice.getaccountId();

        	vm.uploadproducts = function() {
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
                if(data.isdirectfromexport == false) {
            		var products = [];
            		if(data.worksheets.length > 0) {
            			if(data.worksheets[0].length > 1) {
            				var records= data.worksheets[0];
            				if(records.length >0) {
    	        				for(var j = 1; j < records.length; j++) {
    	        					var productinfo = records[j];
                                    if(productinfo.length >= 5 && 
                                        productinfo[0] != null && productinfo[0] != undefined && productinfo[0] != "" && productinfo[0].toString() != "NaN" &&
                                        productinfo[1] != null && productinfo[1] != undefined && productinfo[1] != "" && productinfo[1].toString() != "NaN" &&
                                        productinfo[2] != null && productinfo[2] != undefined && productinfo[2] != "" && productinfo[2].toString() != "NaN" &&
                                        productinfo[3] != null && productinfo[3] != undefined && productinfo[3] != "" && productinfo[3].toString() != "NaN" &&
                                        productinfo[4] != null && productinfo[4] != undefined && productinfo[4] != "" && productinfo[4].toString() != "NaN") {

                                        if(!isNaN(productinfo[2]) && !isNaN(productinfo[4])) {
                                            var product = {};
                                            product.name = productinfo[0].toString();
                                            product.description = productinfo[1].toString();
                                            product.price = productinfo[2].toString();
                                            product.unit = productinfo[3].toString();
                                            product.inventory = productinfo[4].toString();
                                            product.uuid = productinfo.length>5 && isGuid(productinfo[5]) ? productinfo[5] : utility.generateUUID();

                                            products.push(product);
                                        }
                                    }
                                }
                                if(products.length > 0) {
                                    return productservice.saveProducts(accountid, products).then (
                                    function(data) {
                                        submitted = false;
                                        vm.buttondisabled = false;
                                        spinner.hide();
                                        notify.success(products.length + " Item saved succesfully");
                                        utility.applyscope($scope);
                                        vm.cancel();
                                    }
                                    , function(error) {
                                        submitted = false;
                                        vm.buttondisabled = false;
                                        spinner.hide();
                                        notify.error("Somethings went wrong, please try after some time");
                                        utility.applyscope($scope);
                                    });
                                }
                                else {
                                    submitted = false;
                                    vm.buttondisabled = false;
                                    spinner.hide();
                                    notify.error("No valid item found");
                                    utility.applyscope($scope);
                                }
            				}
            				else {
                                submitted = false;
                                vm.buttondisabled = false;
            					spinner.hide();
            					vm.buttondisabled = false;
            					notify.error("No items found");
            					utility.applyscope($scope);
            				}
            			}
            			else {
                            submitted = false;
                            vm.buttondisabled = false;
            				spinner.hide();
            				submitted = false;
            				notify.error('No items found');
            				utility.applyscope($scope);
            			}
            		}
            		else {
                        submitted = false;
                        vm.buttondisabled = false;
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
                    notify.warning('No change in items');
                    utility.applyscope($scope);
                }
        	}

        	vm.cancel = function() {
                submitted = false;
                vm.buttondisabled = false;
                spinner.hide();
                $location.path('/account/items');
            }

            function isGuid(value) {    
                var regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                var match = regex.exec(value);
                return match != null;
            }
        }
    })();
});