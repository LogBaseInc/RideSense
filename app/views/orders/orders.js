
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
            var datefilter = "";
            vm.istoday = false;
            var accountdevices = sessionservice.getAccountDevices();
            var accountid = sessionservice.getaccountId();
            var isassignorderclickd = false;
            var orderindex = [];
            var assignedordersref = [];
            var tags = [];

            activate();

            function activate() {
                $rootScope.routeSelection = 'orders';
                isDateFiledSupported();
                setTodayDate();

                getAllTags();

                vm.users = [];
                var devices = sessionservice.getAccountDevices();
                for(prop in devices){
                    vm.users.push({deviceid : prop, vehiclenumber: devices[prop].vehiclenumber});
                }
            }

            function getAllTags() {
                spinner.show();
                var alltagsref = new Firebase(config.firebaseUrl+'accounts/'+accountid+"/"+'settings/tags');
                alltagsref.once("value", function(snapshot) {
                    if(snapshot.val() != null && snapshot.val() != undefined) {
                        tags = snapshot.val();
                    }
                    getUnAssignOrders();
                }, 
                function(errorObject) {
                    spinner.hide();
                });
            }

            function setTodayDate() {                    
                todaysdate = vm.isdatesupport ? new Date() : moment(new Date()).format('DD/MM/YYYY');

                var selectedorder = utility.getOrderSelected();
                utility.setOrderSelected(null);
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

                unassignorderref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+date);
                unassignorderref.on("value", function(snapshot) {
                    vm.orders = [];
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
                        orderdetail.lat = orderinfo.lat;
                        orderdetail.lng = orderinfo.lng;
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
                        orderdetail.notes = orderinfo.notes;
                        
                        orderdetail.tags = orderinfo.tags;
                        orderdetail.tagsdetail = [];
                        if(orderinfo.tags != null && orderinfo.tags != undefined && orderinfo.tags != "") {
                            var tagspilit = orderinfo.tags.split(",");
                            for(var i = 0; i < tagspilit.length; i++) {
                                orderdetail.tagsdetail.push({
                                    tag: $.trim(tagspilit[i]), 
                                    tagcolor : "badge"+tags[$.trim(tagspilit[i])]
                                });
                            }
                        }

                        orderdetail.tagcolor =  "background-color:green !important";
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
                var ref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+orderdetail.deviceid+'/'+date+'/'+orderdetail.ordernumber);
                assignedordersref.push(ref);
                ref.on("value", function(snapshot) {
                    var data = snapshot.val();
                    if(data != null) {

                        if(data.Deliveredon != null && data.Deliveredon != undefined) {
                            orderdetail.status = "Delivered";
                            orderdetail.pickedon = moment(data.Pickedon).format('HH:mm A');
                            orderdetail.deliveredon = moment(data.Deliveredon).format('HH:mm A');
                        }
                        else if(data.Pickedon != null && data.Pickedon != undefined) {
                            orderdetail.status = "Picked up";
                            orderdetail.pickedon = moment(data.Pickedon).format('HH:mm A');
                        }
                        else
                            orderdetail.status = null;

                        if(data.Pickedon != null && data.Pickedon != undefined &&
                           data.Deliveredon != null && data.Deliveredon != undefined) {
                            orderdetail.starttimestamp =  (moment(data.Pickedon).unix())*1000;
                            orderdetail.endtimestamp =  (moment(data.Deliveredon).unix())*1000;
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

            vm.assignorder = function(order, user) {
               submitted = true;
               spinner.show();

               var deliverydate =  vm.isdatesupport ? moment(order.date).format('YYYYMMDD') : moment(utility.getDateFromString(order.date)).format('YYYYMMDD');
               var assignorders = {};
               assignorders.Name = order.name;
               assignorders.Address = order.address;
               assignorders.Amount = order.amount;
               assignorders.Mobile = order.mobilenumber;
               assignorders.Time = order.time;
               if(order.productname != null && order.productname != undefined) {
                  assignorders.Items = [];
                  assignorders.Items.push({Name: order.productname, Description: order.productdesc});
               }
               var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+user.deviceid+"/"+deliverydate+"/"+order.ordernumber);
               ordersref.set(assignorders); 

               var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+deliverydate+"/"+order.ordernumber);
               ordersref1.update({deviceid : user.deviceid});

               submitted = false;
               spinner.hide();
            }

            vm.unassignorder = function(order) {
                isassignorderclickd = true;
                bootbox.confirm("Are you sure, you want to unassign this user?", function(result) {
                    if(result == true) {
                        var deliverydate = vm.isdatesupport ? moment(order.date).format('YYYYMMDD') :  moment(utility.getDateFromString(order.date)).format('YYYYMMDD');
                        var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+order.deviceid+"/"+deliverydate+"/"+order.ordernumber);
                        ordersref.remove();

                        var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+deliverydate+"/"+order.ordernumber+"/deviceid");
                        ordersref1.remove();
                    }
                })
            }

            vm.dropdownclicked = function(ordernumber) {
                isassignorderclickd = true;
                if($("#userdropdown"+ordernumber).hasClass('show') == true) {
                    $("#userdropdown"+ordernumber).removeClass("show");
                }
                else {
                    $(".dropdown-content").removeClass("show");
                    $("#userdropdown"+ordernumber).addClass("show");
                }
                utility.applyscope($scope);
            }

            window.onclick = function(event) {
              if (!event.target.matches('.dropbtn')) {

                var dropdowns = document.getElementsByClassName("dropdown-content");
                var i;
                for (i = 0; i < dropdowns.length; i++) {
                  var openDropdown = dropdowns[i];
                  if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                  }
                }
              }
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