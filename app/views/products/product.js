define(['angular',
    'config.route',
    'lib',
    'views/services/productservice'], function (angular, configroute) {
    (function () {

        configroute.register.controller('product', ['$rootScope', '$scope', '$location', 'sessionservice', 'config', 'spinner', 'notify', 'utility', 'productservice', product]);
        function product($rootScope, $scope, $location, sessionservice, config, spinner, notify, utility, productservice) {
        	$rootScope.routeSelection = 'products';
        	var vm = this;
            var submitted = false;
        	var accountid= sessionservice.getaccountId();

            Object.defineProperty(vm, 'canAdd', {
                get: canAdd
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate () {
                if(utility.getProductSelected() != null) {
                    vm.product = utility.getProductSelected();
                    vm.isProductEdit = true;
                }
                else {
                    vm.product = {};
                    vm.product.uuid = utility.generateUUID();
                    vm.product.unit = "Kg";
                    vm.isProductEdit = false;
                }
            }   

            function canAdd(){
                return $scope.productform.$valid && !submitted;
            }

            vm.deleteconfirm = function() {
                submitted = true;
                spinner.show();
                return productservice.deleteProduct(accountid, vm.product.uuid).then (
                function(data) {
                    submitted = false;
                    spinner.hide();
                    notify.success("Item deleted succesfully");
                    utility.applyscope($scope);
                    vm.cancel();
                }
                , function(error) {
                    submitted = false;
                    spinner.hide();
                    notify.error("Somethings went wrong, please try after some time");
                    utility.applyscope($scope);
                });
            }

            vm.addproduct = function() {
                saveProduct();
            }

            vm.updateproduct = function() {
                saveProduct();
            }

            function saveProduct () {
                submitted = true;
                spinner.show();
                var products = [];
                products.push({
                    uuid: vm.product.uuid.toString(),
                    name: vm.product.name,
                    description: vm.product.description ,
                    unit: vm.product.unit,
                    price: vm.product.price.toString(),
                    inventory: vm.product.inventory.toString()
                });

                return productservice.saveProducts(accountid, products).then (
                function(data) {
                    submitted = false;
                    spinner.hide();
                    notify.success("Item saved succesfully");
                    utility.applyscope($scope);
                    vm.cancel();
                }
                , function(error) {
                    submitted = false;
                    spinner.hide();
                    notify.error("Somethings went wrong, please try after some time");
                    utility.applyscope($scope);
                });
            }

            vm.cancel = function() {
                submitted = false;
                spinner.hide();
                $location.path('/account/items');
            }     	
        }
    })();
});