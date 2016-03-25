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
            vm.products = [];

            activate();

            $scope.productsort = function(predicate) {
                $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
                $scope.predicate = predicate;
            };

            function activate () {
                $scope.reverse = false;
                $scope.predicate = "name";
                vm.products = [];
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
                utility.setProductSelected(product);
                $location.path('/account/item')
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