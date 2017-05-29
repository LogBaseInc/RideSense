define(['angular',
    'config.route',
    'lib',
		'views/services/orderservice',
    'views/orders/ordersmap.js'
    ], function (angular, configroute) {
    (function () {
        configroute.register.controller('orders', ['$rootScope', '$routeParams' ,'$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', 'orderservice', 'notify', orders]);
        function orders($rootScope, $routeParams, $scope, $location, config, spinner, sessionservice, utility, orderservice, notify) {
            var vm = this;
            var todaysdate = '';
            var unassignorderref = null;
            var devicesref = null;
            var datefilter = "";
            var accountdevices = sessionservice.getAccountDevices();
            var accountid = sessionservice.getaccountId();
            var userid = sessionservice.getSession().uid;
            var isassignorderclickd = false;
            var orderindex = [];
            var assignedordersref = [];
            var tags = [];
            var timeoptions = [];
            var totalorderscount =0;

            vm.orders = [];
            vm.showassign = false;
            vm.isdatesupport = false;
            vm.tagsoption = [];
            vm.selectedTag = "All";
            vm.selectedStatus = [{id: "All"}];
            vm.orderidshow = false;
            vm.nameshow = false;
            vm.deliverytimeshow = false;
            vm.amountshow = false;
            vm.addressshow = false;
            vm.itemsshow = false;
            vm.deliverychargeshow = false;
            vm.pickuplocationshow = false;
            vm.vendorshow = false;
            vm.notesshow = false;
            vm.tagsshow = false;
            vm.statusshow = false;
            vm.selectedcolumns = [];
            vm.isdesktop = utility.IsDesktop();
            vm.filterOrders = [];
            vm.nolocationOrders = [];
            vm.manualdelivery = false;
            vm.showmaps = false;
            vm.hasunassignorders = false;
            vm.isVendor = true;
            vm.previousdaysassign = true;
						vm.webhookUrl = '';

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

                vm.vendorsupport = false;
                getSettings();

                updateTotalOrdersCount(0);

                vm.time1options = initializeTime(true);
                vm.time2options = initializeTime(false);

                vm.time1 = utility.getTimeInMins("12:00 AM");
                vm.time2 = utility.getTimeInMins("11:59 PM");

                if(utility.getOrderView() == "Map")
                    vm.showmaps = true;
                else
                    vm.showmaps = false;

                setColumnOptions();

                vm.tagsoption = [];
                vm.tagsoption.push({name:"All", value:"All"});

                getOrderColumns();
                vm.isdatesupport = utility.isDateFiledSupported();
                setTodayDate();
                getDevices();

                updatelastseen();
            }

            function getSettings() {
                var vendorref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings');
                vendorref.once("value", function(snapshot) {
                    vm.tagsoption = [];
                    var setting = snapshot.val();
                    if(setting != null && setting != undefined && setting != "") {
                        vm.manualdelivery =  (setting.manualdelivery != null && setting.manualdelivery != undefined && setting.manualdelivery != "") ? true : false;
                        vm.vendorsupport = (setting.vendorsupport != null && setting.vendorsupport != undefined && setting.vendorsupport != "") ? setting.vendorsupport : false;
                        if(vm.vendorsupport == true) {
                            vm.columns.splice(6, 0, {id: "Delivery Charge", label: "Delivery Charge"}, {id: "Pickup Location", label: "Pickup Location"});
                            getVendorEmails();
                        }
                        
                        tags = setting.tags != null && setting.tags != undefined && setting.tags != "" ? setting.tags: [];
                        vm.tagsoption = [];
                        vm.tagsoption.push({name:"All", value:"All"});
                        for(prop in tags) {
                            vm.tagsoption.push({name:prop, value:prop});
                        }
												if(setting.webhook != null && setting.webhook != undefined) {
													vm.webhookUrl = setting.webhook.url != null && setting.webhook.url != undefined ? setting.webhook.url : '';
												}
                    }
                    else {
                        vm.vendorsupport = false;
                        vm.manualdelivery = false;
                        vm.tagsoption.push({name:"All", value:"All"});
                    }

                    getUnAssignOrders();
                    utility.applyscope($scope);
                }, function(errorObject){

                });
            }

            function getVendorEmails() {
                var ref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/users');
                ref.once("value", function(snapshot) {
                    var data = snapshot.val();
                    vm.vendors = [];
                    for(prop in data) {
                        if(data[prop].vendor == true) {
                            vm.vendors[data[prop].uid] = utility.getDecodeString(prop);
                        }
                    }
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The users read failed: " , errorObject);
                });
            }

            vm.getTotalAmount = function(filterresults) {
                $('#totalamount').text(0);
                totalAmount = 0;
                totalorderscount = 0;
                updateTotalOrdersCount(0);

                if(filterresults != null && filterresults != undefined) {
                    totalorderscount = filterresults.length;
                    vm.totalAmount = _.reduce(filterresults, function(sumnum, ord){ return sumnum + parseFloat(ord.amount); }, 0);
                }

                updateTotalOrdersCount(totalorderscount);
                $('#totalamount').text(vm.totalAmount);
                utility.applyscope($scope);
            }

            function updateTotalOrdersCount(count) {
                $('#totalorderspan').text(count);
                $('#totalamount').text(0);
            }
            
            function initializeTime(isstart){
                timeoptions = [];

                if(isstart)
                    addtimeoption("12:00 AM");

                addtimeoption("12:30 AM");
                addtimeoption("1:00 AM");
                addtimeoption("1:30 AM");
                addtimeoption("2:00 AM");
                addtimeoption("2:30 AM");
                addtimeoption("3:00 AM");
                addtimeoption("3:30 AM");
                addtimeoption("4:00 AM");
                addtimeoption("4:30 AM");
                addtimeoption("5:00 AM");
                addtimeoption("5:30 AM");
                addtimeoption("6:00 AM");
                addtimeoption("6:30 AM");
                addtimeoption("7:00 AM");
                addtimeoption("7:30 AM");
                addtimeoption("8:00 AM");
                addtimeoption("8:30 AM");
                addtimeoption("9:00 AM");
                addtimeoption("9:30 AM");
                addtimeoption("10:00 AM");
                addtimeoption("10:30 AM");
                addtimeoption("11:00 AM");
                addtimeoption("11:30 AM");
                addtimeoption("12:00 PM");
                addtimeoption("12:30 PM");
                addtimeoption("1:00 PM");
                addtimeoption("1:30 PM");
                addtimeoption("2:00 PM");
                addtimeoption("2:30 PM");
                addtimeoption("3:00 PM");
                addtimeoption("3:30 PM");
                addtimeoption("4:00 PM");
                addtimeoption("4:30 PM");
                addtimeoption("5:00 PM");
                addtimeoption("5:30 PM");
                addtimeoption("6:00 PM");
                addtimeoption("6:30 PM");
                addtimeoption("7:00 PM");
                addtimeoption("7:30 PM");
                addtimeoption("8:00 PM");
                addtimeoption("8:30 PM");
                addtimeoption("9:00 PM");
                addtimeoption("9:30 PM");
                addtimeoption("10:00 PM");
                addtimeoption("10:30 PM");
                addtimeoption("11:00 PM");
                addtimeoption("11:30 PM");
                addtimeoption("11:59 PM");

                return timeoptions;
            }

            function addtimeoption(time) {
                timeoptions.push({id:utility.getTimeInMins(time), value:time});
            }

            function updatelastseen() {
                var lastseenref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/lastseen');
                lastseenref.set(moment(new Date()).format('YYYY/DD/MM HH:mm:ss'));
            }

            function getDevices() {
                devicesref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/devices');
                devicesref.on("value", function(snapshot) {
                    vm.users = [];
                    if(snapshot.val() != null && snapshot.val() != undefined) {
                        accountdevices = snapshot.val();
                        for(prop in accountdevices){
                            if(accountdevices[prop].activity != null && accountdevices[prop].activity != undefined) {
                                if ((vm.isdatesupport == true && moment(accountdevices[prop].activity.date).format('DD/MM/YYYY') == moment(todaysdate).format('DD/MM/YYYY') ||
                                    (vm.isdatesupport == false && moment(accountdevices[prop].activity.date).format('DD/MM/YYYY') == todaysdate)) && 
                                    accountdevices[prop].activity.login == true)
                                    vm.users.push({deviceid : prop, vehiclenumber: accountdevices[prop].vehiclenumber, loggedin : true});
                                else
                                    vm.users.push({deviceid : prop, vehiclenumber: accountdevices[prop].vehiclenumber, loggedin : false});
                            }
                            else 
                                vm.users.push({deviceid : prop, vehiclenumber: accountdevices[prop].vehiclenumber, loggedin : false});
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
                        vm.notesshow = true;
                        vm.deliverychargeshow = true;
                        vm.pickuplocationshow = true;
                        vm.vendorshow = true;

                        vm.selectedcolumns = [{id: "Order #"}, {id: "Customer name"}, {id: "Delivery time"}, {id: "Amount to collect"}, {id: "Address"}, {id: "Items"}, {id: "Delivery Charge"}, {id: "Pickup Location"}, {id: "Vendor"}, {id: "Notes"}, {id: "Tags"}, {id: "Status"}];
                        alltagsref.set(vm.selectedcolumns);
                    }
                    utility.applyscope($scope);
                }, 
                function(errorObject) {
                });
            }

            function setColumnOptions() {
                vm.statusoptions = [
                    {id: "All", label: "All"},
                    {id: "Unassigned", label: "Unassigned"},
                    {id: "Yet to accept", label: "Yet to accept"},
                    {id: "Accepted", label: "Accepted"},
                    {id: "Picked up", label: "Picked up"},
                    {id: "Delivered", label: "Delivered"},
                    {id: "Cancelled", label: "Cancelled"}];

                vm.statussselectsettings = {
                    showCheckAll : false,
                    showUncheckAll : false,
                    scrollable : false,
                    dynamicTitle : false,
                    buttonDefaultText : "Selected status"
                };

                vm.statusevents = {
                    onItemSelect : function(item) {
                        if(item.id != "All")
                            vm.selectedStatus = _.reject(vm.selectedStatus, function(el) { return el.id === "All"; });
                        else if(item.id == "All")
                            vm.selectedStatus = [{id: "All"}];

                        vm.statusfilter();
                    },
                    onItemDeselect : function(item) {
                        if(vm.selectedStatus.length == 0 )
                            vm.selectedStatus = [{id: "All"}];
                        vm.statusfilter();
                    }
                }

                vm.columns = [
                    {id: "Order #", label: "Order #"},
                    {id: "Customer name", label: "Customer name"},
                    {id: "Delivery time", label: "Delivery time"},
                    {id: "Amount to collect", label: "Amount to collect"},
                    {id: "Address", label: "Address"},
                    {id: "Items", label: "Items"},
                    {id: "Notes", label: "Notes"},
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
                else if(item.id == "Notes")
                    vm.notesshow = selected;
                else if(item.id == "Tags")
                    vm.tagsshow = selected;
                else if(item.id == "Status")
                    vm.statusshow = selected;
                else if(item.id == "Delivery Charge")
                    vm.deliverychargeshow = selected;
                else if(item.id == "Pickup Location")
                    vm.pickuplocationshow = selected;
                else if(item.id == "Vendor")
                    vm.vendorshow = selected;

                var ordercolumnsrf = new Firebase(config.firebaseUrl+'users/'+userid+'/settings/ordercolumns');
                ordercolumnsrf.set(vm.selectedcolumns);

                utility.applyscope($scope);
            }

            function setTodayDate() {                    
                todaysdate = vm.isdatesupport ? new Date() : moment(new Date()).format('DD/MM/YYYY');

                var selectedorder = utility.getOrderSelected();
                utility.setOrderSelected(null);
                if(selectedorder == null) {
                    vm.selecteddate = todaysdate;
                    datefilter = vm.selecteddate;

                    utility.setOrderSelected(null);
                }
                else {
                    vm.selecteddate = vm.isdatesupport ? new Date(selectedorder.date) : moment(utility.getDateFromString(selectedorder.date)).format('DD/MM/YYYY');              
                    datefilter = vm.selecteddate;

                }
                setIsToday();
            }

            function setIsToday() {
                if((vm.isdatesupport == false && moment(utility.getDateFromString(todaysdate)) <= moment(utility.getDateFromString(vm.selecteddate))) ||
                   (vm.isdatesupport == true && moment(moment(todaysdate).format("YYYY/MM/DD")) <= moment(moment(vm.selecteddate).format("YYYY/MM/DD"))))
                    vm.showassign = vm.isVendor ? false : true;
                else
                    vm.showassign = vm.previousdaysassign ? true : false; 
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
                    vm.isVendor = sessionservice.getRole().isVendor;
                    if(vm.vendorsupport == true && vm.isVendor == false && vm.columns.length == 11) {
                        vm.columns.splice(8, 0, {id: "Vendor", label: "Vendor"});
                    }
                    else if(vm.isVendor == true && vm.columns.length != 9) {
                        vm.columns.splice(2,1);
                        vm.columns.splice(8,1);
                    }

                    setIsToday();
                    vm.orders = [];
                    orderindex = [];
                    for(var i = 0; i< assignedordersref.length; i++) {
                        assignedordersref[i].off();
                    }

                    assignedordersref = [];

                    var data = snapshot.val();
                    if(vm.isVendor == true) {
                        data = _.filter(data, function(order) { 
                            if(order != null && order != undefined) {
                                if(order.createdby != null && order.createdby != undefined) {
                                    return order.createdby == userid;
                                }
                                return false;
                            }
                            return false;
                        });
                    }
                    for(orderprop in data) {
                        var orderinfo = data[orderprop];
                        var orderdetail = getOrderDetail(orderinfo);
                        vm.orders.push(orderdetail);

                        if(orderdetail.status != "Cancelled" && orderdetail.status != "Delivered" && 
                            orderdetail.deviceid != null && orderdetail.deviceid != undefined && orderdetail.deviceid != "") {
                            orderdetail.cancelled = false;
                            setAssignedOrdersRef(orderdetail, date);
                        }
                    }

                    vm.orders.sort(SortByTime);
                    checkLatnLng();
                    vm.tagfilter();
                    spinner.hide(); 
                    utility.applyscope($scope);
                });
            }

            function checkLatnLng() {
                if (vm.orders.length != 0) {
                    for (j=0; j < vm.orders.length; j++) {
                        if(vm.orders[j].latitude != null && vm.orders[j].latitude != undefined && vm.orders[j].latitude != "" &&
                          vm.orders[j].longitude != null && vm.orders[j].longitude != undefined && vm.orders[j].longitude != "") {

                            var finalLatLng = new google.maps.LatLng(vm.orders[j].latitude,vm.orders[j].longitude);
                            for (i=j+1; i < vm.orders.length; i++) {
                                
                                if(vm.orders[i].latitude != null && vm.orders[i].latitude != undefined && vm.orders[i].latitude != "" &&
                                vm.orders[i].longitude != null && vm.orders[i].longitude != undefined && vm.orders[i].longitude != "") {

                                    var pos = new google.maps.LatLng( vm.orders[i].latitude, vm.orders[i].longitude);

                                    //if a marker already exists in the same position as this marker
                                    if (finalLatLng.equals(pos)) {
                                        //update the position of the coincident marker by applying a small multipler to its coordinates
                                        var newLat = finalLatLng.lat() + (Math.random() -.5) / 1500;// * (Math.random() * (max - min) + min);
                                        var newLng = finalLatLng.lng() + (Math.random() -.5) / 1500;// * (Math.random() * (max - min) + min);
                                        finalLatLng = new google.maps.LatLng(newLat,newLng);
                                    }
                                }
                            }

                            vm.orders[j].latitude = finalLatLng.lat();
                            vm.orders[j].longitude = finalLatLng.lng();
                        }
                    }

                }
            }

            function parseAddress(address) {
                if (typeof address !== "string") throw "Address is not a string.";
                address = address.trim();
                var comma = address.indexOf(',');
                var returned = {};
                returned.city = address.slice(0, comma);
                var after = address.substring(comma + 2); // The string after the comma, +2 so that we skip the comma and the space.
                var space = after.lastIndexOf(' ');
                returned.state = after.slice(0, space);
                returned.zip = after.substring(space + 1);
                return returned;
            }

            function getOrderDetail(orderinfo) {
                var orderdetail = {};
                
                var timesplit = orderinfo.time.split('-');
                if(timesplit.length < 2)
                    timesplit = orderinfo.time.split('–');
                var ispm = false;
                if(timesplit[0].toLowerCase().indexOf('pm') >=0 && parseInt(timesplit[0]) >= 1 && parseInt(timesplit[0]) <= 11) {
                    ispm = true;
                }

                orderdetail.timetosort = (isNaN(parseInt(timesplit[0])) ? 24 : (ispm ? (parseInt(timesplit[0])+12) : parseInt(timesplit[0])));
                orderdetail.createdat = (orderinfo.createdat != null && orderinfo.createdat != undefined) ? getCreatedTime(orderinfo.createdat) : null;
                orderdetail.createdby = (orderinfo.createdby != null && orderinfo.createdby != undefined) ? orderinfo.createdby : null;
                orderdetail.ordernumber = orderinfo.ordernumber;
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
                orderdetail.markeddelivereddriver = (orderinfo.markeddelivereddriver != null && orderinfo.markeddelivereddriver != undefined && orderinfo.markeddelivereddriver != "") ? orderinfo.markeddelivereddriver : null;
                orderdetail.markeddeliveredon = (orderinfo.markeddeliveredon != null && orderinfo.markeddeliveredon != undefined && orderinfo.markeddeliveredon != "") ? orderinfo.markeddeliveredon : null;
                orderdetail.mobilenumber = orderinfo.mobilenumber;
                orderdetail.productdesc = orderinfo.productdesc;
                orderdetail.items = orderinfo.items;
                orderdetail.notes = orderinfo.notes;
                orderdetail.formattednotes = "";
                if(orderinfo.notes != null && orderinfo.notes != undefined && orderinfo.notes != "") {
                    var formattednotes = orderinfo.notes.substring(0, orderinfo.notes.indexOf("**")).split("\n\n");
                    if(formattednotes.length == 2)
                        orderdetail.formattednotes = formattednotes[1];
                    else
                        orderdetail.formattednotes = orderinfo.notes;
                }
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
                    orderdetail.cancelledon = (orderinfo.cancelledon != null && orderinfo.cancelledon != undefined && orderinfo.cancelledon != "") ? moment(orderdetail.cancelledon).format('hh:mm A') : null;
                }
                else if(orderdetail.markeddeliveredon != null) {
                    orderdetail.status = "Delivered";
                    orderdetail.deliveredon = moment(orderdetail.markeddeliveredon).format('hh:mm A');
                    orderdetail.pickedon = null;
                    orderdetail.cancelled = false;
                }

                orderdetail.deliverycharge = (orderinfo.deliverycharge != null && orderinfo.deliverycharge != null) ? orderinfo.deliverycharge : 0;
                orderdetail.pickuplocation = (orderinfo.pickuplocation != null && orderinfo.pickuplocation != null) ? orderinfo.pickuplocation : null;
                if(vm.vendorsupport && vm.isVendor == false) {
                    orderdetail.vendor = vm.vendors[orderinfo.createdby] || "Self";
                }

                //For maps
                orderdetail.title = orderinfo.ordernumber;
                orderdetail.id  = orderinfo.ordernumber;

                if(orderinfo.location != null && orderinfo.location != undefined && orderinfo.location != "") {
                    orderdetail.latitude = orderinfo.location.lat;
                    orderdetail.longitude = orderinfo.location.lng;
                    orderdetail.options = {
                        labelContent: '<span> #'+orderinfo.ordernumber +'</span><br/><span>'+ orderdetail.time +'</span>',
                        labelClass: 'tm-marker-label',
                        icon: orderdetail.deviceid == null && orderdetail.status == null ? 'assets/images/redmarker.png' : 'assets/images/greenmarker.png',
                        labelAnchor: '22 0'
                    }
                }
                else {
                    orderdetail.latitude = null;
                    orderdetail.longitude = null;
                }
               
                return orderdetail;
            }

            function getCreatedTime(unixtimestamp) {
                return moment((unixtimestamp)).format("MMM DD, YYYY hh:mm a");
            }

            function SortByTime(a, b){
                var a1 = parseInt(a.timetosort);
                var b1 = parseInt(b.timetosort);

                return ((b1 > a1) ? -1 : ((b1 < a1) ? 1 : 0));
            }

            function setAssignedOrdersRef(orderdet, date) {
                var ref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+orderdet.deviceid+'/'+date+'/'+orderdet.ordernumber);
                assignedordersref.push(ref);
                ref.on("value", function(snapshot) {
                    var data = snapshot.val();
                    if(data != null) {
                        if(data.Deliveredon != null && data.Deliveredon != undefined) {
                            orderdet.status = "Delivered";
                            orderdet.pickedon = (data.Pickedon != null && data.Pickedon != undefined) ? moment(data.Pickedon).format('hh:mm A') : null;
                            orderdet.deliveredon = moment(data.Deliveredon).format('hh:mm A');
                        }
                        else if(data.Pickedon != null && data.Pickedon != undefined) {
                            orderdet.status = "Picked up";
                            orderdet.pickedon = moment(data.Pickedon).format('hh:mm A');
                            if(data.Startedon != null && data.Startedon != undefined) {
                                orderdet.startedon = moment(data.Startedon).format('hh:mm A');
                            }
                        }
                        else if(data.Acceptedon != null && data.Acceptedon != undefined) {
                            orderdet.acceptedon = moment(data.Acceptedon).format('hh:mm A');
                            orderdet.status = "Accepted";
                        }
                        else {
                            orderdet.status = "Yet to accept";
                        }

                        if(data.Pickedon != null && data.Pickedon != undefined &&
                           data.Deliveredon != null && data.Deliveredon != undefined) {
                            orderdet.starttimestamp =  (moment(data.Pickedon).unix())*1000;
                            orderdet.endtimestamp =  (moment(data.Deliveredon).unix())*1000;
                        }
                    }
                    else
                        orderdet.status = null;
                    
                    utility.applyscope($scope);
                });
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
                    vm.tagfilterOrders = _.filter(vm.orders, function(order) { 
                        for(var i = 0; i < order.tagsdetail.length; i++) {
                            if(order.tagsdetail[i].tag.toLowerCase() == vm.selectedTag.toLowerCase())
                                return true;
                        }
                        return false;
                    });
                else 
                    vm.tagfilterOrders = vm.orders;

                vm.timefilter();
            }

            vm.timefilter = function() {
                if(vm.time1 == utility.getTimeInMins("12:00 AM") && vm.time2 == utility.getTimeInMins("11:59 PM")) {
                    vm.time2options = initializeTime(false);
                    vm.timefilterOrders = vm.tagfilterOrders;
                }
                else {
                    vm.time2options =  _.filter(vm.time1options, function(opt) {return opt.id > vm.time1});

                    vm.timefilterOrders = _.filter(vm.tagfilterOrders, function(order){ 
                        var timesplit = order.time.split('-');
                        var ordertime = utility.getTimeInMins(timesplit[0]);
                        if(ordertime >= vm.time1 && ordertime <= vm.time2)
                            return true;
                        else
                            return false;
                    });
                }
                utility.applyscope($scope);

                vm.statusfilter();
            }

            vm.statusfilter = function() {
                var statusarr = [];
                vm.nolocationOrder = [];
                
                for(var i=0; i< vm.selectedStatus.length; i++){
                    statusarr.push(vm.selectedStatus[i].id);
                }
                if(jQuery.inArray("All", statusarr) < 0)
                    vm.filterOrders = _.filter(vm.timefilterOrders, function(order){ 
                        if(jQuery.inArray("Unassigned", statusarr) >= 0 && ((order.status == null || order.status == undefined) && (order.deviceid == null || order.deviceid == undefined)))
                            return true;
                        else if(jQuery.inArray(order.status, statusarr) >= 0) {
                            return true;
                        }
                        return false;
                    });
                else 
                    vm.filterOrders = vm.timefilterOrders;

                if(vm.showassign)
                    vm.hasunassignorders = _.filter(vm.filterOrders, function(ord){ return ord.status == null && ord.deviceid == null}).length > 0; //is any unassign orders
                else
                    vm.hasunassignorders = false;

                vm.nolocationOrder = _.filter(vm.filterOrders, function(ord){ return ord.latitude == null});

                if(vm.filterOrders.length ==0 || vm.search == null || vm.search == "" || vm.search == undefined)
                    updateTotalOrdersCount(vm.filterOrders.length);
                else
                    updateTotalOrdersCount(0);
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
                isassignorderclickd = true;
            }

            vm.assignorder = function(ord, user) {
                isassignorderclickd = true;
                submitted = true;
                spinner.show();
               
                var orderstoassign = [];
                if($.isArray(ord) == false)
                    orderstoassign.push(ord);
                else
                    orderstoassign = ord;

                for(var i =0 ; i<orderstoassign.length; i++) {
                    var order = orderstoassign[i];
                    order.time = order.time.replace("–", "-");
                    var deliverydate =  vm.isdatesupport ? moment(order.date).format('YYYYMMDD') : moment(utility.getDateFromString(order.date)).format('YYYYMMDD');
                    var assignorders = {};
                    assignorders.Name = order.name;
                    assignorders.Address = order.address + (order.zip != null && order.zip != undefined ? (" " +order.zip) : "");
                    assignorders.Amount = parseFloat(order.amount);
                    assignorders.Mobile = order.mobilenumber;
                    assignorders.Time = order.time;
                    assignorders.Notes = (order.notes != null && order.notes != undefined) ? order.notes : "";
                    assignorders.Items = [];
                    if(order.items != null && order.items != undefined && order.items.length > 0) {
                        for (var i = 0; i < order.items.length; i++) {
                            assignorders.Items.push({Name: (order.items[i].quantity +  " X " + order.items[i].name), Description: ""});
                        };
                    }
                    else if(order.productdesc != null && order.productdesc != undefined && order.productdesc != ""){
                        assignorders.Items.push({Name: "", Description: order.productdesc});
                    }

                    var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+user.deviceid+"/"+deliverydate+"/"+order.ordernumber);
                    ordersref.set(assignorders); 

                    var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+deliverydate+"/"+order.ordernumber);
                    ordersref1.update({deviceid : user.deviceid});
                }

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

            vm.markasDelivered = function (ord) {
                isassignorderclickd = true;
                var drivername = $("#drivernametxt").val();
                var date = getOrderDate();
                var timestamp = moment(new Date()).format("YYYY/MM/DD HH:mm:ss");

                var orderstoassign = [];
                if($.isArray(ord) == false)
                    orderstoassign.push(ord);
                else
                    orderstoassign = ord;
                
                for(var i =0 ; i<orderstoassign.length; i++) {
                    var order = orderstoassign[i];
                    var orderfbref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+date+"/"+order.ordernumber);
                    orderfbref.update({markeddeliveredon: timestamp, markeddelivereddriver: (drivername != null && drivername != undefined && drivername != "" ? drivername : "")});

                    var ordertrackref = new Firebase(config.firebaseUrl+'trackurl/'+date+"/"+accountid+"_"+order.ordernumber+"/status");
                    ordertrackref.set("Delivered");
										//Webhook event notification - starts
										if(vm.webhookUrl != null && vm.webhookUrl != '') {
											console.log('Webhook is setup: ' + vm.webhookUrl);
											return orderservice.updateOrderStatus(order, accountid, date, vm.webhookUrl, drivername).then(
												function(data){
													console.log('Succesfully sent event notification.');
												},
												function (error){
													console.log('Could not send delivered event notification: ' + JSON.stringify(error));
													notify.error('Could not send delivered event notification.');
												});
										}
										else
											console.log('Webhook not setup');
										//Webhook event notification - ends
                }
            }

            vm.dropdownclicked = function($index) {
                isassignorderclickd = true;
                if($("#userdropdown"+$index).hasClass('show') == true) {
                    $("#userdropdown"+$index).removeClass("show");
                }
                else {
                    $(".dropdown-content").removeClass("show");
                    $("#userdropdown"+$index).addClass("show");
                }
                utility.applyscope($scope);
            }

            vm.exportOrders = function() {
                var deliverydate =  moment(vm.selecteddate).format('DD/MM/YYYY');
                var ordersexport = [];
                ordersexport.push(["Order number", "Customer name", "Customer address", "Zipcode", "Customer mobile number", "Delivery date (dd/mm/yyyy)", "Delivery time(hh:mm AM/PM - hh:mm AM/PM)", "Amount to collect from customer (Number only. Don’t use currency symbols)",
                  "Product description", "Notes", "Tags"])
                for(var i=0; i< vm.orders.length; i++) {
                    var ordinfo = vm.orders[i];
                    ordersexport.push([
                        ordinfo.ordernumber,
                        ordinfo.name,
                        ordinfo.address,
                        ordinfo.zip,
                        ordinfo.mobilenumber,
                        deliverydate,
                        ordinfo.time,
                        ordinfo.amount,
                        (ordinfo.productdesc != null && ordinfo.productdesc != undefined && ordinfo.productdesc != "") ? ordinfo.productdesc : "-",
                        (ordinfo.notes != null && ordinfo.notes != undefined && ordinfo.notes != "") ? ordinfo.notes : "-",
                        (ordinfo.tags != null && ordinfo.tags != undefined && ordinfo.tags != "") ? ordinfo.tags : "-"
                    ])
                }

                export_array_to_excel([ordersexport, []], "Orders");
            }

            vm.showMapClicked = function() {
                vm.selectedTag = "All";
                vm.selectedStatus = [{id: "All"}];
                vm.time1 = utility.getTimeInMins("12:00 AM");
                vm.time2 = utility.getTimeInMins("11:59 PM");
                vm.tagfilter();

                vm.showmaps = !vm.showmaps;
                utility.setOrderView(vm.showmaps == true ? "Map" : "Table");
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

            $rootScope.$on('confrimdialog', function(event, data) {
                isassignorderclickd = true;
            });
        }
    })();
});