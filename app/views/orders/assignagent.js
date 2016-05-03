define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {
        configroute.register.controller('assignagent', ['$rootScope','$scope', '$location', 'config', 'notify', 'spinner', 'sessionservice', 'utility', assignagent]);
        function assignagent($rootScope, $scope, $location, config, notify, spinner, sessionservice, utility) {
            var vm = this;
            var todaysdate;
            var datefilter = "";
            var unassignorderref = null;
            var accountdevices = [];
            var accountid = sessionservice.getaccountId();
            var devicesref = null;
            var assignedordersref = [];
            var tags = [];
            vm.unassignedordercount = 0;
            vm.hascod = false;

            activate();

            function activate() {
                $rootScope.routeSelection = 'orders';

                vm.isdatesupport = utility.isDateFiledSupported();
                setTodayDate();
                getAllTags();
                getDevices();
            }

            function setTodayDate() {                    
                todaysdate = vm.isdatesupport ? new Date() : moment(new Date()).format('DD/MM/YYYY');
                vm.selecteddate = todaysdate;
                datefilter = vm.selecteddate;
                vm.showassign = true;
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
                if(isdatechanged) {
                    getUnAssignOrders();
                }

                datefilter = vm.selecteddate;
                setIsToday();
            }

            vm.dropdownclicked = function(parentindex, index) {
                isassignorderclickd = true;
                if($("#userdropdown"+parentindex+index).hasClass('show') == true) {
                    $("#userdropdown"+parentindex+index).removeClass("show");
                }
                else {
                    $(".dropdown-content").removeClass("show");
                    $("#userdropdown"+parentindex+index).addClass("show");
                }
                utility.applyscope($scope);
            }

            vm.assignorder = function(order, user) {
                submitted = true;
                spinner.show();
               
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
                
                submitted = false;
                spinner.hide();
            }

            vm.unassignorder = function(order) {
                if(order.delivered == false && vm.showassign == true) {
                    bootbox.confirm("Are you sure, you want to unassign this user?", function(result) {
                        if(result == true) {
                            var deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') :  moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');
                            var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+order.deviceid+"/"+deliverydate+"/"+order.ordernumber);
                            ordersref.remove();
                            var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+deliverydate+"/"+order.ordernumber+"/deviceid");
                            ordersref1.remove();
                        }
                    });
                }
            }

            function setIsToday() {
                if((vm.isdatesupport == false && moment(utility.getDateFromString(todaysdate)) <= moment(utility.getDateFromString(vm.selecteddate))) ||
                   (vm.isdatesupport == true && moment(todaysdate) <= moment(vm.selecteddate)))
                    vm.showassign = true;
                else
                    vm.showassign = false; 
            }

            function getAllTags() {
                spinner.show();
                var alltagsref = new Firebase(config.firebaseUrl+'accounts/'+accountid+"/"+'settings/tags');
                alltagsref.once("value", function(snapshot) {
                    if(snapshot.val() != null && snapshot.val() != undefined)
                        tags = snapshot.val();
                    else
                        tags = [];
                }, 
                function(errorObject) {
                    spinner.hide();
                });
            }

            function getUnAssignOrders() {
                spinner.show(); 
                var date = getOrderDate();

                if(unassignorderref != null && unassignorderref != undefined) {
                    unassignorderref.off()
                }

                unassignorderref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+date);
                unassignorderref.on("value", function(snapshot) {
                    spinner.hide();

                    for(var i = 0; i< assignedordersref.length; i++) {
                        assignedordersref[i].off();
                    }
                    assignedordersref = [];

                    for(var i =0; i<vm.users.length; i++) {
                        vm.users[i].orders = [];
                    }

                    var data = snapshot.val();
                    vm.unassignorders = [];
                    for(orderprop in data) {
                        var orderinfo = data[orderprop];
                        var orderdetail = getOrderDetail(orderinfo);
                        if(orderdetail != null) {
                            if(orderdetail.deviceid == null) {
                                vm.unassignorders.push(orderdetail);
                            }
                            else {
                                var user = _.filter(vm.users, function(user){ return user.deviceid == orderdetail.deviceid})[0];
                                user.orders.push(orderdetail);
                                setAssignedOrdersRef(orderdetail, date);
                            }
                        }
                    }

                    setAgentsOrder();
                    vm.unassignedordercount = vm.unassignorders.length;

                    if(vm.unassignorders.length > 0) {
                        vm.unassignorders.sort(SortByTime);

                        var ordersgroup = _.groupBy(vm.unassignorders, function(order){ return order.timetosort});
                        vm.unassignorders = [];
                        for(prop in ordersgroup) {
                            vm.unassignorders.push({timetosort: prop, data : ordersgroup[prop], time : ordersgroup[prop][0].time});
                        }
                    }
                    utility.applyscope($scope);
                });
            }

            function setAgentsOrder() {
                vm.agentorders = [];
                vm.noordersagents = [];
                for(var i=0; i<vm.users.length; i++){
                    if(vm.users[i].orders.length > 0) {
                        var codamount = 0;
                        if(vm.hascod) {
                            codamount =  _.reduce(vm.users[i].orders, 
                            function(sumnum, ord) { 
                                return sumnum + (ord.cod != null && ord.cod != undefined && ord.cod != "" ? ord.cod : 0) 
                            }, 0);
                            if(isNaN(codamount)) 
                                codamount = 0;
                        }

                        var ordersgroup = _.groupBy(vm.users[i].orders, function(order){ return order.timetosort});
                        var orders = [];
                        for(prop in ordersgroup) {

                            orders.push({timetosort: prop, data : ordersgroup[prop], time : ordersgroup[prop][0].time});
                        }
                        orders.sort(SortByTime);
                        vm.agentorders.push({
                            deviceid : vm.users[i].deviceid,
                            vehiclenumber : vm.users[i].vehiclenumber,
                            orders : orders,
                            loggedin : vm.users[i].loggedin,
                            codamount : codamount
                        })
                    }
                    else {
                        vm.noordersagents.push(vm.users[i]);
                    }
                }
            }

            function SortByTime(a, b){
                var a1 = parseInt(a.timetosort);
                var b1 = parseInt(b.timetosort);

                return ((b1 > a1) ? -1 : ((b1 < a1) ? 1 : 0));
            }

            function getOrderDetail(orderinfo) {
                var orderdetail = null;
                if(orderinfo.cancelled != true) {
                    orderdetail = {};
                    
                    var timesplit = orderinfo.time.split('-');
                    if(timesplit.length < 2)
                        timesplit = orderinfo.time.split('–');
                    var ispm = false;
                    if(timesplit[0].toLowerCase().indexOf('pm') >=0 && parseInt(timesplit[0]) >= 1 && parseInt(timesplit[0]) <= 11) {
                        ispm = true;
                    }

                    orderdetail.timetosort = (isNaN(parseInt(timesplit[0])) ? 24 : (ispm ? (parseInt(timesplit[0])+12) : parseInt(timesplit[0])));
                    orderdetail.ordernumber = orderprop;
                    orderdetail.name = orderinfo.name;
                    orderdetail.address = orderinfo.address;
                    orderdetail.zip = orderinfo.zip;
                    orderdetail.amount = orderinfo.amount;
                    orderdetail.time = orderinfo.time;
                    orderdetail.deviceid = null;
                    if(orderinfo.deviceid != null && orderinfo.deviceid != undefined) {
                        orderdetail.deviceid = orderinfo.deviceid;                    
                    }
                    orderdetail.delivered = (orderinfo.markeddeliveredon != null && orderinfo.markeddeliveredon != undefined && orderinfo.markeddeliveredon != "") ? true : false;
                    orderdetail.mobilenumber = orderinfo.mobilenumber;
                    orderdetail.productdesc = orderinfo.productdesc;
                    orderdetail.items = orderinfo.items;
                    orderdetail.formattednotes = "";
                    if(orderinfo.notes != null && orderinfo.notes != undefined && orderinfo.notes != "") {
                        var formattednotes = orderinfo.notes.substring(0, orderinfo.notes.indexOf("**")).split("\n\n");
                        if(formattednotes.length == 2)
                            orderdetail.formattednotes = formattednotes[1];
                    }

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

                    if(orderinfo.cod != null && orderinfo.cod != undefined && orderinfo.cod != "") {
                        vm.hascod = true;
                        orderdetail.cod = parseFloat(orderinfo.cod);
                    }
                }
                return orderdetail;
            }

            function setAssignedOrdersRef(orderdet, date) {
                var ref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+orderdet.deviceid+'/'+date+'/'+orderdet.ordernumber);
                assignedordersref.push(ref);
                ref.on("value", function(snapshot) {
                    var data = snapshot.val();
                    if(data != null) {
                        if(data.Deliveredon != null && data.Deliveredon != undefined) 
                            orderdet.delivered = true;
                        else
                            orderdet.delivered = false;
                    }
                    
                    utility.applyscope($scope);
                });
            }

            function getOrderDate () {
                var date;
                if(vm.isdatesupport == true)
                    date = moment(vm.selecteddate).format('YYYYMMDD');
                else
                    date = moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');

                return date;
            }

            function getDevices() {
                devicesref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/devices');
                devicesref.on("value", function(snapshot) {
                    vm.users = [];
                    if(snapshot.val() != null && snapshot.val() != undefined) {
                        accountdevices = snapshot.val();
                        for(prop in accountdevices) {
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

                        getUnAssignOrders();
                        utility.applyscope($scope);
                    }
                    else {
                       accountdevices = []; 
                    }
                }, function (errorObject) {
                });
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