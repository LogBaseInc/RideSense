define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {
        configroute.register.controller('order', ['$rootScope', '$routeParams' ,'$scope', '$location', 'config', 'spinner', 'notify', 'sessionservice', 'utility', '$window', order]);
        function order($rootScope, $routeParams, $scope, $location, config, spinner, notify, sessionservice, utility, $window) {
            var vm = this;
            var submitted = false;
            vm.order = {};
            vm.createtag = false;
            vm.tagColors = [];
            vm.selectcolor = "badgeblue";
            var alltagsref = null;
            var accountid = sessionservice.getaccountId();

            Object.defineProperty(vm, 'canAdd', {
                get: canAdd
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            activate();

            function activate() {
                initializeUnusedTags();
                $rootScope.routeSelection = 'orders';
                vm.isOrderEdit = false;
                
                isDateFiledSupported();

                if(utility.getOrderSelected() != null) {
                    vm.order = utility.getOrderSelected();
                    var timesplit = vm.order.time.split('-');
                    vm.time1 = timesplit[0];
                    vm.time2 = timesplit[1];

                    vm.isOrderEdit = true;
                    vm.selecteddate = vm.isdatesupport ? new Date(vm.order.date): moment(utility.getDateFromString(vm.order.date)).format('DD/MM/YYYY');
                }
                else {
                    vm.order.tagsdetail = [];
                    vm.time1 = "8:00 AM"
                    vm.time2 = "6:00 PM"
                    setTodayDate();
                }
                vm.tagsdetail = vm.order.tagsdetail;
                initializeTagColors();
            }

            function initializeTagColors() {
                vm.tagColors = [];
                vm.tagColors.push({color: "badgeblue"});
                vm.tagColors.push({color: "badgegreen"});
                vm.tagColors.push({color: "badgered"});
                vm.tagColors.push({color: "badgeorange"});
                vm.tagColors.push({color: "badgegray"});
                vm.tagColors.push({color: "badgeblack"});
            }

            function initializeUnusedTags() { 
                spinner.show();
                alltagsref = new Firebase(config.firebaseUrl+'accounts/'+accountid+"/"+'settings/tags');
                alltagsref.on("value", function(snapshot) {
                    spinner.hide();
                    var tags  = snapshot.val();
                    vm.unusedtags = [];                
                    for(prop in tags) {
                        if((_.filter(vm.tagsdetail, function(el){ return el.tag ==  prop})).length == 0) {  
                            vm.unusedtags.push({
                                tag: prop, 
                                tagcolor : "badge"+tags[prop]
                            });
                        }
                    }
                    vm.unusedtags.push({tag : '+', tagcolor: 'addtag'});
                    utility.applyscope($scope);
                }, 
                function(errorObject) {
                });
            }

            function canAdd(){
                return $scope.orderform.$valid && !submitted ;
            }

            function setTodayDate() {
                vm.selecteddate = vm.isdatesupport ? new Date() : moment(new Date()).format('DD/MM/YYYY');
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
                if(date == null) {
                    setTodayDate();
                    date = vm.selecteddate;
                }
                else 
                    vm.selecteddate = date;
            }

            vm.addtag = function(tag) {
                if(tag.tag != "+") {
                    vm.createtag = false;
                    vm.unusedtags = _.reject(vm.unusedtags, function(el) { return el.tag === tag.tag; });
                    vm.tagsdetail.push(tag);
                }
                else {
                    vm.createtag = true;
                }
            }
            vm.cancelCreateTag =  function() {
               vm.createtag = false; 
            }

            vm.createNewTag = function() {
                if(vm.tagName != null && vm.tagName != undefined) {
                    var tagsref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/tags/'+vm.tagName);
                    tagsref.set(vm.selectcolor.replace("badge",""));
                }
                vm.createtag = false;
                vm.tagName = null;
                vm.selectcolor = "badgeblue";
            }

            vm.removetag = function(tag) {
                vm.tagsdetail = _.reject(vm.tagsdetail, function(el) { return el.tag === tag.tag; });
                vm.unusedtags.unshift(tag);
            }

            vm.selecttagcolor = function(tagcolor) {
                vm.selectcolor = tagcolor.color;
            }

            vm.addorder = function() {
                submitted = true;
                spinner.show();
                
                if(vm.order.amount == null || vm.order.amount == undefined)
                    vm.order.amount = 0;
               
                vm.order.productname = (vm.order.productname != null && vm.order.productname != undefined) ? vm.order.productname : "";
                vm.order.productdesc = (vm.order.productdesc != null && vm.order.productdesc != undefined) ? vm.order.productdesc : "";

                vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');
                vm.order.time = vm.time1 + "-" + vm.time2;
                checkOrderNumber();
            }

            function setTags() {
                delete vm.order["tagsdetail"];
                var tagArray = [];
                vm.order.tags = "";
                for(var i = 0; i < vm.tagsdetail.length; i++) {
                    tagArray.push(vm.tagsdetail[i].tag);
                }
                vm.order.tags = tagArray.join(",");
            }

            function checkOrderNumber() {
               var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+vm.order.deliverydate+"/"+vm.order.ordernumber);
               ordersref.once("value", function(snapshot) {
                    if(snapshot.val() == null) {
                        setTags();
                        ordersref.set(vm.order);
                        vm.cancel();
                    }
                    else{
                        notify.error("Order number already exists");
                    }
                    submitted = false;
                    spinner.hide();
                    utility.applyscope($scope);
                });
            }

            vm.updateorder = function() {
                submitted = true;
                spinner.show();
                setTags();

                vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');
                var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+vm.order.deliverydate+"/"+vm.order.ordernumber);

                if(vm.order.amount == null || vm.order.amount == undefined || vm.order.amount == "")
                    vm.order.amount = 0;

                var updateorder = {
                    name: vm.order.name, 
                    mobilenumber: vm.order.mobilenumber, 
                    amount: vm.order.amount, 
                    time: vm.time1 + " - " + vm.time2, 
                    address: vm.order.address,
                    productname : (vm.order.productname != null && vm.order.productname != undefined) ? vm.order.productname : "",
                    productdesc : (vm.order.productdesc != null && vm.order.productdesc != undefined) ? vm.order.productdesc : "",
                    notes : (vm.order.notes != null || vm.order.notes != undefined) ?  vm.order.notes : "",
                    tags : (vm.order.tags != null || vm.order.tags != undefined) ? vm.order.tags : ""
                };
                
                updateorder.time = updateorder.time.replace(/\s+/g, " ");  
                ordersref.update(updateorder);

                if(vm.order.deviceid != null && vm.order.deviceid != undefined) {
                    var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber);
                    ordersref1.update({Name: vm.order.name, Mobile: vm.order.mobilenumber, Amount: vm.order.amount, Time: updateorder.time, Address: vm.order.address});

                    ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber+"/Items/0");
                    ordersref1.update({Name: ((vm.order.productname != null && vm.order.productname != undefined) ? vm.order.productname : ""), 
                    Description: ((vm.order.productdesc != null && vm.order.productdesc != undefined) ? vm.order.productdesc : "")});
                }

                vm.cancel();
            }

            vm.deleteorder = function() {
                vm.isdelete = true;
            }

            vm.deletecancel = function() {
                vm.isdelete = false;
            }

            vm.deleteconfirm = function() {
                vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');

                submitted = true;
                spinner.show();

                var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+vm.order.deliverydate+"/"+vm.order.ordernumber);
                ordersref.remove();

                if(vm.order.deviceid != null && vm.order.deviceid != undefined) {
                    var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber);
                    ordersref.remove();
                }

                notify.success('Order deleted successfully');
                vm.cancel();
            }

            vm.viewtrip = function() {
                $location.path('/order/trip');
            }

            vm.cancel = function() {
                submitted = false;
                spinner.hide();
                $location.path('/orders');
            }

            $scope.$on('$destroy', function iVeBeenDismissed() {
                if(alltagsref != null && alltagsref != undefined)
                    alltagsref.off();
            });
        }
    })();
});