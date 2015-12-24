define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {
        configroute.register.controller('assignuser', ['$rootScope', '$routeParams' ,'$scope', '$location', 'config', 'spinner', 'notify', 'sessionservice', 'utility', '$window', assignuser]);
        function assignuser($rootScope, $routeParams, $scope, $location, config, spinner, notify, sessionservice, utility, $window ) {
            var vm = this;
            var submitted = false;
            var order;
            vm.selecteduser = null;
            
            Object.defineProperty(vm, 'canAdd', {
                get: canAdd
            });

            activate();

            function activate() {
                if(utility.getOrderSelected() != null) {
                    $rootScope.routeSelection = 'orders';
                    order = utility.getOrderSelected();
                    isDateFiledSupported();
                    vm.users = [];
                    var devices = sessionservice.getAccountDevices();
                    for(prop in devices){
                        vm.users.push({deviceid : prop, vehiclenumber: devices[prop].vehiclenumber});
                    }
                }
                else{
                    $window.history.back();
                }
            }

            function isDateFiledSupported(){
                var datefield=document.createElement("input")
                datefield.setAttribute("type", "date")
                if (datefield.type != "date") { //if browser doesn't support input type="date"
                   vm.isdatesupport = false;
                }
                else
                   vm.isdatesupport = true;
            }

            function canAdd(){
                return !submitted && vm.selecteduser != null;
            }

            vm.assignUser = function() {
               submitted = true;
               spinner.show();

               var deliverydate =  vm.isdatesupport ? moment(order.date).format('YYYYMMDD') : moment(utility.getDateFromString(order.date)).format('YYYYMMDD');
               var assignorders = {};
               assignorders.Name = order.name;
               assignorders.Address = order.address;
               assignorders.Amount = order.amount;
               assignorders.Mobile = order.mobilenumber;
               assignorders.Time = order.time;
               assignorders.Items = [];
               assignorders.Items.push({Name: order.productname, Description: order.productdesc});
               var ordersref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/orders/'+vm.selecteduser+"/"+deliverydate+"/"+order.ordernumber);
               ordersref.set(assignorders); 

               var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/unassignorders/'+deliverydate+"/"+order.ordernumber);
               ordersref1.update({deviceid : vm.selecteduser});

               vm.cancel();
            }

            vm.cancel = function() {
                submitted = false;
                spinner.hide();
                $window.history.back();
            }
        }
    })();
});