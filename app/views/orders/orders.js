
define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {
        configroute.register.controller('orders', ['$rootScope', '$routeParams' ,'$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', orders]);
        function orders($rootScope, $routeParams, $scope, $location, config, spinner, sessionservice, utility) {
            var vm = this;
            var todaysdate = '';
            var unassignorderref = null;
            vm.isdatesupport = false;
            vm.orders = [];
            vm.ordersBy3 =[];
            var datefilter = "";
            vm.istoday = false;
            var accountdevices = sessionservice.getAccountDevices();
            var isassignorderclickd = false;
            var orderindex = [];
            var assignedordersref = [];

            activate();

            function activate() {
                $rootScope.routeSelection = 'orders';
                isDateFiledSupported();
                setTodayDate();

                getUnAssignOrders();
            }

            function setTodayDate() {                    
                todaysdate = vm.isdatesupport ? new Date() : moment(new Date()).format('DD/MM/YYYY');

                var selectedorder = utility.getOrderSelected();
                if(selectedorder == null) {
                    vm.istoday = true;
                    vm.selecteddate = todaysdate;
                    datefilter = vm.selecteddate;

                    utility.setOrderSelected(null);
                }
                else {
                    vm.selecteddate = vm.isdatesupport ? new Date(selectedorder.date) : moment(utility.getDateFromString(selectedorder.date)).format('DD/MM/YYYY');              
                    datefilter = vm.selecteddate;

                    setIsToday();
                }
            }

            function setIsToday() {
                if((vm.isdatesupport == false && todaysdate == vm.selecteddate) ||
                   (vm.isdatesupport == true && moment(todaysdate).format('YYYYMMDD') == moment(vm.selecteddate).format('YYYYMMDD')))
                    vm.istoday = true;
                else
                    vm.istoday = false; 
            }

            function getUnAssignOrders() {
                spinner.show(); 
                var date;
                if(vm.isdatesupport == true)
                    date = moment(vm.selecteddate).format('YYYYMMDD');
                else
                    date = moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');

                if(unassignorderref != null && unassignorderref != undefined) {
                    unassignorderref.off()
                }

                unassignorderref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/unassignorders/'+date);
                unassignorderref.on("value", function(snapshot) {
                    vm.orders = [];
                    vm.ordersBy3 = [];

                    orderindex = [];
                    for(var i = 0; i< assignedordersref.length; i++) {
                        assignedordersref[i].off();
                    }

                    assignedordersref = [];

                    var data = snapshot.val();
                    for(orderprop in data) {
                        var orderdetail = {};
                        var orderinfo = data[orderprop];

                        var timesplit = orderinfo.time.split('-');
                        var ispm = false;
                        if(timesplit[0].toLowerCase().indexOf('pm') >=0 && parseInt(timesplit[0]) >= 1 && parseInt(timesplit[0]) <= 11) {
                            ispm = true;
                        }

                        orderdetail.timetosort = (isNaN(parseInt(timesplit[0])) ? 24 : (ispm ? (parseInt(timesplit[0])+12) : parseInt(timesplit[0])));
                        orderdetail.ordernumber = orderprop;
                        orderdetail.name = orderinfo.name;
                        orderdetail.address = orderinfo.address;
                        orderdetail.amount = orderinfo.amount;
                        orderdetail.time = orderinfo.time;
                        orderdetail.deviceid = null;
                        orderdetail.vehiclenumber = null;

                        if(orderinfo.deviceid != null && orderinfo.deviceid != undefined) {
                            var deviceinfo  = accountdevices[orderinfo.deviceid];
                            if(deviceinfo != null && deviceinfo != undefined) {
                                orderdetail.deviceid = orderinfo.deviceid;
                                orderdetail.vehiclenumber = deviceinfo.vehiclenumber;
                            }
                        }
                       
                        orderdetail.mobilenumber = orderinfo.mobilenumber;
                        orderdetail.productdesc = orderinfo.productdesc;
                        orderdetail.productname = orderinfo.productname;
                        orderdetail.date = vm.selecteddate;
                        orderdetail.status = null;
                        var displayaddress = orderinfo.Name+", "+orderinfo.Address;
                        orderdetail.displayaddress = displayaddress.length <= 85 ? displayaddress : (displayaddress.substring(0, 80) +"...");

                        orderindex[orderprop] = {};
                        orderindex[orderprop].index  = vm.orders.length;

                        setAssignedOrdersRef(orderdetail, date);

                        vm.orders.push(orderdetail);
                    }

                    vm.orders.sort(SortByTime);
                    for(var j=0 ; j < vm.orders.length ; j = j+3) {

                        var orderssplit = [];
                        orderssplit.push(vm.orders[j]);

                        if((j+1) < vm.orders.length)
                            orderssplit.push(vm.orders[j+1]);
                        if((j+2) < vm.orders.length)
                            orderssplit.push(vm.orders[j+2]);

                        if(orderssplit.length > 0)
                            vm.ordersBy3.push({orders: orderssplit});
                    }

                    spinner.hide(); 
                    utility.applyscope($scope);
                });
            }

            function SortByTime(a, b){
                var a1 = parseInt(a.timetosort);
                var b1 = parseInt(b.timetosort);

                return ((b1 > a1) ? -1 : ((b1 < a1) ? 1 : 0));
            }

            function setAssignedOrdersRef(orderdetail, date) {
                var ref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/orders/'+orderdetail.deviceid+'/'+date+'/'+orderdetail.ordernumber);
                assignedordersref.push(ref);
                ref.on("value", function(snapshot) {
                    var data = snapshot.val();
                    if(data != null) {
                        orderdetail.pickedon = data.Pickedon;
                        orderdetail.deliveredon = data.Deliveredon;

                        if(data.Deliveredon != null && data.Deliveredon != undefined)
                            orderdetail.status = "Delivered"; 
                        
                        else if(data.Pickedon != null && data.Pickedon != undefined) 
                            orderdetail.status = "Picked up"; 
                        
                        else
                            orderdetail.status = null;

                        if(orderdetail.pickedon != null && orderdetail.pickedon != undefined &&
                           orderdetail.deliveredon != null && orderdetail.deliveredon != undefined) {
                            orderdetail.starttimestamp =  (moment(orderdetail.pickedon).unix())*1000;
                            orderdetail.endtimestamp =  (moment(orderdetail.deliveredon).unix())*1000;
                        }
                    }
                    else
                        orderdetail.status = null;
                                   
                    utility.applyscope($scope);
                });
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

            $rootScope.$on('datepicker:dateselected', function (event, data) {
                if(data.date.format('DD/MM/YYYY') != vm.selecteddate) {
                    vm.selecteddate = data.date.format('DD/MM/YYYY');
                    vm.datechanged(vm.selecteddate);
                }
            });

            vm.datechanged = function (date) {
                var isdatechanged = false;
                if(datefilter != vm.selecteddate)
                    isdatechanged = true;

                if(date == null) {
                    setTodayDate();
                    date = vm.selecteddate;
                }
                else 
                    vm.selecteddate = date;

                datefilter = vm.selecteddate;
                if(isdatechanged) {
                    vm.orders = [];
                    vm.ordersBy3 = [];
                    vm.ordersplit = [];

                    getUnAssignOrders();
                }

                setIsToday();
            }

            vm.addOrder = function() {
                utility.setOrderSelected(null);
                $location.path('/order');
            }

            vm.orderClicked = function(order) {
                if(isassignorderclickd == false) {
                    utility.setOrderSelected(order);
                    $location.path('/order');
                    return false;
                }
                isassignorderclickd = false;
            }

            vm.assignorder = function(order){
                isassignorderclickd = true;
                utility.setOrderSelected(order);
                $location.path('/order/assignuser');
                return false;
            }

            vm.unassignorder = function(order) {
                isassignorderclickd = true;
                var deliverydate = vm.isdatesupport ? moment(order.date).format('YYYYMMDD') :  moment(utility.getDateFromString(order.date)).format('YYYYMMDD');
                var ordersref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/orders/'+order.deviceid+"/"+deliverydate+"/"+order.ordernumber);
                ordersref.remove();

                var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/unassignorders/'+deliverydate+"/"+order.ordernumber+"/deviceid");
                ordersref1.remove();
                return false;
            }

            $scope.$on('$destroy', function iVeBeenDismissed() {
                for(var i = 0; i< assignedordersref.length; i++) {
                    assignedordersref[i].off();
                }

                if(unassignorderref != null && unassignorderref != undefined)
                    unassignorderref.off();
            });
        }
    })();
});