define(['angular',
    'config.route',
    'lib',
    'views/services/productservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('products', ['$rootScope', '$scope', '$location', 'sessionservice', 'config', 'spinner', 'notify', 'utility', 'productservice', products]);
        function products($rootScope, $scope, $location, sessionservice, config, spinner, notify, utility, productservice) {
        	$rootScope.routeSelection = 'products';
        	var vm = this;
            var rawlogs = null;
        	var accountid= sessionservice.getaccountId();
            var ischeckboxclicked = false;
            vm.products = [];
            vm.itemstodelete = [];
            vm.isdelete = false;

            activate();

            $scope.productsort = function(predicate) {
                $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
                $scope.predicate = predicate;
            };

            function activate () {
                vm.submitted = false;
                $scope.reverse = false;
                $scope.predicate = "name";
                vm.products = [];
                vm.itemstodelete = [];
                getProducts();
             }

            function getProducts () {
                spinner.show();
                return productservice.getProductsDetail(accountid).then(
                function(data) {
                    vm.products = (data != null && data != undefined ) ? data : [];
                    spinner.hide();
                }
                , function(error) {
                    notify.error("Somethings went wrong, please try after some time");
                    spinner.hide();
                });
            }

            vm.addProduct = function() {
                utility.setProductSelected(null);
                $location.path('/account/item')
            }

            vm.productClicked = function(product) {
                if(vm.ischeckboxclicked == false) {
                    utility.setProductSelected(product);
                    $location.path('/account/item');
                }
                vm.ischeckboxclicked = false;
            }

            vm.checkboxchanged = function() {
                vm.ischeckboxclicked = true;
                vm.itemstodelete = _.pluck(_.filter(vm.products, function(prd){ return prd.isdelete }), 'uuid');
                console.log(vm.itemstodelete);
            }

            vm.deleteconfirm = function() {
                vm.isdelete = false;
                vm.submitted = true;
                spinner.show();
                return productservice.deleteProduct(accountid, vm.itemstodelete).then (
                function(data) {
                    setTimeout(
                      function() 
                      {
                        vm.submitted = false;
                        spinner.hide();
                        notify.success("Items deleted succesfully");
                        utility.applyscope($scope);
                        activate();
                      }, 15000); //15 sec
                }
                , function(error) {
                    vm.submitted = false;
                    spinner.hide();
                    notify.error("Somethings went wrong, please try after some time");
                    utility.applyscope($scope);
                });
            }

            vm.exportItems = function() {
               var itemsexport = [];
                itemsexport.push(["Item name", "Description", "Price (Number only, don't include currency symbol)", "Unit (Kg / Count)", "Inventory", "UUID(Don't edit this. For new leave it blank)"]);
                for(var i=0; i< vm.products.length; i++) {
                    var iteminfo = vm.products[i];
                    itemsexport.push([
                        iteminfo.name,
                        iteminfo.description,
                        iteminfo.price,
                        iteminfo.unit,
                        iteminfo.inventory,
                        iteminfo.uuid
                    ])
                }
                export_array_to_excel([itemsexport, []], "Items");
            }
        }
    })();
});