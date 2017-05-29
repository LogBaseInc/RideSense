define(['angular',
    'config.route',
    'lib',
    'views/services/customerservice',
    'views/customers/dirPagination'], function (angular, configroute) {
    (function () {

        configroute.register.controller('customers', ['$rootScope','$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', 'notify', 'customerservice', customers]);
        function customers($rootScope, $scope, $location, config, spinner, sessionservice, utility, notify, customerservice) {
            var vm = this;
            vm.currentPage = 1;
            vm.pageSize = 100;
            var accountid = sessionservice.getaccountId();
            activate();

            function activate(){
                $rootScope.routeSelection = '';
                getCustomers();
            }

            function getCustomers() {
                spinner.show();
                customerservice.getAll(accountid).then(getCustomersCompleted, getCustomersFailed);
            }

            function getCustomersCompleted(data) {
                spinner.hide();
                data.sort(SortByName);
                vm.customers = data;
                utility.applyscope($scope);
            }

            function SortByName(a, b){
                return (a.name > b.name) ?  1 : -1;
            }

            function getCustomersFailed() {
                spinner.hide();
                notify.error("Something went worng, please try after sometime");
            }

            vm.exportCustomers = function() {
                var customersexport = [];
                customersexport.push(["Customer name", "Mpbile number", "Address", "Zipcode"])
                for(var i=0; i< vm.customers.length; i++) {
                    var customer = vm.customers[i];
                    customersexport.push([
                        customer.name,
                        customer.mobile,
                        customer.address,
                        customer.zip
                    ])
                }
                export_array_to_excel([customersexport, []], "Customers");
            }
        }
    })();
});