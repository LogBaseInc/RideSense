
define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {
        configroute.register.controller('orders', ['$rootScope', '$routeParams' ,'$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', orders]);
        function orders($rootScope, $routeParams, $scope, $location, config, spinner, sessionservice, utility) {
            var vm = this;
            var todaysdate = '';
            var unassignorderref = null;
            var devicesref = null;
            vm.isdatesupport = false;
            vm.orders = [];
            var datefilter = "";
            vm.istoday = false;
            var accountdevices = sessionservice.getAccountDevices();
            var accountid = sessionservice.getaccountId();
            var userid = sessionservice.getSession().uid;
            var isassignorderclickd = false;
            var orderindex = [];
            var assignedordersref = [];
            var tags = [];
            vm.tagsoption = [];
            vm.selectedTag = "All";
            vm.selectedStatus = "All";

            vm.orderidshow = false;
            vm.nameshow = false;
            vm.deliverytimeshow = false;
            vm.amountshow = false;
            vm.addressshow = false;
            vm.itemsshow = false;
            vm.tagsshow = false;
            vm.statusshow = false;
            vm.selectedcolumns = [];
            vm.isdesktop = utility.IsDesktop();
            vm.filterOrders = [];
            vm.manualdelivery = false;

            activate();
            $scope.ordersort = function(predicate) {
                if(predicate != null) {
                    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
                    $scope.predicate = predicate;
                }
                else {
                    $scope.predicate = null;
                    $scope.reverse = false;
                }
            };

            function activate() {
                $rootScope.routeSelection = 'orders';
                $scope.predicate = null;
                $scope.reverse = false;
                
                setColumnOptions();
                getInventoryTracking();

                vm.tagsoption = [];
                vm.tagsoption.push({name:"All", value:"All"});

                vm.statusoption=[];
                vm.statusoption.push({name:"All", value:"All"});
                vm.statusoption.push({name:"Unassigned", value:"Unassigned"});
                vm.statusoption.push({name:"Yet to accept", value:"Yet to accept"});
                vm.statusoption.push({name:"Accepted", value:"Accepted"});
                vm.statusoption.push({name:"Picked up", value:"Picked up"});
                vm.statusoption.push({name:"Delivered", value:"Delivered"});
                vm.statusoption.push({name:"Cancelled", value:"Cancelled"});

                getOrderColumns();
                isDateFiledSupported();
                setTodayDate();
                getAllTags();
                getDevices();
            }

            function getInventoryTracking() {
                var manualdeliverygRef = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/manualdelivery');
                manualdeliverygRef.once("value", function(snapshot) {
                    vm.manualdelivery =  (snapshot.val() != null && snapshot.val() != undefined && snapshot.val() != "" && snapshot.val() == true ? true : false);
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("manual delivery read failed: ", errorObject);
                });
            }

            function getDevices() {
                devicesref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/devices');
                devicesref.on("value", function(snapshot) {
                    vm.users = [];
                    if(snapshot.val() != null && snapshot.val() != undefined) {
                        accountdevices = snapshot.val();
                        for(prop in accountdevices){
                            if(accountdevices[prop].activity != null && accountdevices[prop].activity != undefined) {
                                if ((moment(accountdevices[prop].activity.date).format('DD/MM/YYYY') == moment(todaysdate).format('DD/MM/YYYY')) && accountdevices[prop].activity.login == true)
                                    vm.users.push({deviceid : prop, vehiclenumber: accountdevices[prop].vehiclenumber});
                            }
                            else 
                                vm.users.push({deviceid : prop, vehiclenumber: accountdevices[prop].vehiclenumber});
                        }
                        utility.applyscope($scope);
                    }
                    else {
                       accountdevices = []; 
                    }
                }, function (errorObject) {
                });
            }

            function getOrderColumns() {
                var alltagsref = new Firebase(config.firebaseUrl+'users/'+userid+"/"+'settings/ordercolumns');
                alltagsref.once("value", function(snapshot) {
                    if(snapshot.val() != null && snapshot.val() != undefined) {
                        vm.selectedcolumns = snapshot.val();
                        for(var i =0 ; i < vm.selectedcolumns.length; i++) {
                            setColumnVisibility(vm.selectedcolumns[i], true);
                        }
                    }
                    else {
                        vm.orderidshow = true;
                        vm.nameshow = true;
                        vm.deliverytimeshow = true;
                        vm.amountshow = true;
                        vm.addressshow = true;
                        vm.itemsshow = true;
                        vm.tagsshow = true;
                        vm.statusshow = true;

                       vm.selectedcolumns = [{id: "Order #"}, {id: "Customer name"}, {id: "Delivery time"}, {id: "Amount to collect"}, {id: "Address"}, {id: "Items"}, {id: "Tags"}, {id: "Status"}];
                    }
                    utility.applyscope($scope);
                }, 
                function(errorObject) {
                });
            }

            function setColumnOptions() {
                vm.columns = [
                    {id: "Order #", label: "Order #"},
                    {id: "Customer name", label: "Customer name"},
                    {id: "Delivery time", label: "Delivery time"},
                    {id: "Amount to collect", label: "Amount to collect"},
                    {id: "Address", label: "Address"},
                    {id: "Items", label: "Items"},
                    {id: "Tags", label: "Tags"},
                    {id: "Status", label: "Status"}];

                vm.columnsselectsettings = {
                    showCheckAll : false,
                    showUncheckAll : false,
                    scrollable : false,
                    dynamicTitle : false,
                    buttonDefaultText : "Selected fields"
                };

                vm.columnevents = {
                    onItemSelect : function(item) {
                        setColumnVisibility(item, true);
                    },
                    onItemDeselect : function(item) {
                        setColumnVisibility(item, false);
                    }
                }
            }

            function setColumnVisibility(item, selected) {
                if(item.id == "Order #")
                    vm.orderidshow = selected;
                else if(item.id == "Customer name")
                    vm.nameshow = selected;
                else if(item.id == "Delivery time")
                    vm.deliverytimeshow = selected;
                else if(item.id == "Amount to collect")
                    vm.amountshow = selected;
                else if(item.id == "Address")
                    vm.addressshow = selected;
                else if(item.id == "Items")
                    vm.itemsshow = selected;
                else if(item.id == "Tags")
                    vm.tagsshow = selected;
                else if(item.id == "Status")
                    vm.statusshow = selected;

                var ordercolumnsrf = new Firebase(config.firebaseUrl+'users/'+userid+'/settings/ordercolumns');
                ordercolumnsrf.set(vm.selectedcolumns);

                utility.applyscope($scope);
            }

            function getAllTags() {
                spinner.show();
                var alltagsref = new Firebase(config.firebaseUrl+'accounts/'+accountid+"/"+'settings/tags');
                alltagsref.once("value", function(snapshot) {
                    vm.tagsoption = [];
                    if(snapshot.val() != null && snapshot.val() != undefined) {
                        tags = snapshot.val();
                        vm.tagsoption = [];
                        vm.tagsoption.push({name:"All", value:"All"});
                        for(prop in tags) {
                            vm.tagsoption.push({name:prop, value:prop});
                        }
                    }
                    else {
                        vm.tagsoption.push({name:"All", value:"All"});
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

            function getOrderDate () {
                var date;
                if(vm.isdatesupport == true)
                    date = moment(vm.selecteddate).format('YYYYMMDD');
                else
                    date = moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');

                return date;
            }

            function getUnAssignOrders() {
                spinner.show(); 
                var date = getOrderDate();

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
                        orderdetail.createdat = (orderinfo.createdat != null && orderinfo.createdat != undefined) ? getCreatedTime(orderinfo.createdat) : null;
                        orderdetail.ordernumber = orderprop;
                        orderdetail.name = orderinfo.name;
                        orderdetail.address = orderinfo.address;
                        orderdetail.zip = orderinfo.zip;
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
                        orderdetail.items = orderinfo.items;
                        orderdetail.notes = orderinfo.notes;
                        orderdetail.url = ((orderinfo.url != null && orderinfo.url != undefined && orderinfo.url != "") ? orderinfo.url : null);
                        orderdetail.tags = orderinfo.tags;
                        orderdetail.tagsdetail = [];
                        if(orderinfo.tags != null && orderinfo.tags != undefined && orderinfo.tags != "") {
                            var tagspilit = orderinfo.tags.split(",");
                            for(var i = 0; i < tagspilit.length; i++) {
                                var tag = $.trim(tagspilit[i]);
                                if(tags[tag] != null && tags[tag] != undefined) {
                                    orderdetail.tagsdetail.push({
                                        tag: tag, 
                                        tagcolor : "badge"+tags[tag]
                                    });
                                }
                            }
                        }

                        orderdetail.tagcolor =  "background-color:green !important";
                        orderdetail.date = vm.selecteddate;
                        orderdetail.status = null;
                        var displayaddress = orderinfo.Name+", "+orderinfo.Address;
                        orderdetail.displayaddress = displayaddress.length <= 85 ? displayaddress : (displayaddress.substring(0, 80) +"...");

                        orderindex[orderprop] = {};
                        orderindex[orderprop].index  = vm.orders.length;

                        if(orderinfo.cancelled == true) {
                            orderdetail.status = "Cancelled";
                            orderdetail.cancelled = true;
                        }
                        else {
                            orderdetail.cancelled = false;
                            setAssignedOrdersRef(orderdetail, date);
                        }

                        vm.orders.push(orderdetail);
                    }

                    vm.orders.sort(SortByTime);
                    vm.tagfilter();
                    spinner.hide(); 
                    utility.applyscope($scope);
                });
            }

            function getCreatedTime(unixtimestamp) {
                return moment((unixtimestamp)).format("MMM DD, YYYY hh:mm a");
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
                            orderdetail.pickedon = moment(data.Pickedon).format('hh:mm A');
                            orderdetail.deliveredon = moment(data.Deliveredon).format('hh:mm A');
                        }
                        else if(data.Pickedon != null && data.Pickedon != undefined) {
                            orderdetail.status = "Picked up";
                            orderdetail.pickedon = moment(data.Pickedon).format('hh:mm A');
                        }
                        else if(data.Acceptedon != null && data.Acceptedon != undefined) {
                            orderdetail.acceptedon = moment(data.Acceptedon).format('hh:mm A');
                            orderdetail.status = "Accepted";
                        }
                        else {
                            orderdetail.status = "Yet to accept";
                        }

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
                    vm.tagfilter();
                }

                setIsToday();
            }

            vm.tagfilter = function() {
                if(vm.selectedTag != "All")
                    vm.tagfilterOrders = _.filter(vm.orders, function(order){ 
                        for(var i = 0; i < order.tagsdetail.length; i++) {
                            if(order.tagsdetail[i].tag.toLowerCase() == vm.selectedTag.toLowerCase())
                                return true;
                        }
                        return false;
                    });
                else 
                    vm.tagfilterOrders = vm.orders;

                vm.statusfilter();
            }

            vm.statusfilter = function() {
                if(vm.selectedStatus != "All")
                    vm.filterOrders = _.filter(vm.tagfilterOrders, function(order){ 
                        if(vm.selectedStatus != "Unassigned") {
                            if(order.status != null && order.status != undefined && order.status.toLowerCase() == vm.selectedStatus.toLowerCase()) return true;
                        }
                        else {
                            if(order.status == null || order.status == undefined) return true;
                        }
                        return false;
                    });
                else 
                    vm.filterOrders = vm.tagfilterOrders;
            }

            vm.addOrder = function() {
                utility.setOrderSelected(null);
                $location.path('/order');
            }
            
            vm.uploadfile = function() {
                $location.path('/orders/upload');
            }

            vm.orderClicked = function(order) {
                if(isassignorderclickd == false) {
                    utility.setOrderSelected(order);
                    $location.path('/order');
                    return false;
                }
                isassignorderclickd = false;
            }

            vm.linkClicked = function(url) {
                isassignorderclickd=true;
            }

            vm.assignorder = function(order, user) {
               submitted = true;
               spinner.show();

               var deliverydate =  vm.isdatesupport ? moment(order.date).format('YYYYMMDD') : moment(utility.getDateFromString(order.date)).format('YYYYMMDD');
               var assignorders = {};
               assignorders.Name = order.name;
               assignorders.Address = order.address + (order.zip != null && order.zip != undefined ? (" " +order.zip) : "");
               assignorders.Amount = order.amount;
               assignorders.Mobile = order.mobilenumber;
               assignorders.Time = order.time;
               assignorders.Notes = (order.notes != null && order.notes != undefined) ? order.notes : "";
               assignorders.Items = [];
               if(order.items != null && order.items != undefined && order.items.length > 0) {
                    for (var i = 0; i < order.items.length; i++) {
                        assignorders.Items.push({Name: (order.items[i].quantity +  " X " + order.items[i].name), Description: ""});
                    };
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
                });
            }

            vm.markasDelivered = function (order) {
                isassignorderclickd = true;
                bootbox.confirm("Are you sure, you want to mark this order as delivered?", function(result) {
                    if(result == true) {
                        var date = getOrderDate();
                        var orderfbref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+order.deviceid+"/"+date+"/"+order.ordernumber);
                        var timestamp = moment(new Date()).format("YYYY/MM/DD HH:mm:ss");
                        orderfbref.update({Pickedon:timestamp, Deliveredon:timestamp});
                    }
                });
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