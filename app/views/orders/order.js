define(['angular',
    'config.route',
    'lib',
    'views/services/customerservice',
    'views/services/productservice'], function (angular, configroute) {
    (function () {
        configroute.register.controller('order', ['$rootScope', '$routeParams' , '$http', '$scope', '$location', 'config', 'spinner', 'notify', 'sessionservice', 'utility', '$window', 'customerservice', 'productservice', order]);
        function order($rootScope, $routeParams, $http, $scope, $location, config, spinner, notify, sessionservice, utility, $window, customerservice, productservice) {
            var vm = this;
            var submitted = false;
            vm.order = {};
            vm.createtag = false;
            vm.deletetags = false;
            vm.tagColors = [];
            vm.selectcolor = "badgeblue";
            var alltagsref = null;
            vm.alltags = [];
            var accountid = sessionservice.getaccountId();
            vm.checkdistance = false;
            vm.showdistance = false;
            vm.spincode = utility.getSourcePincode();;
            vm.country = "";
            vm.mobilenumbers=[];
            vm.products = [];
            vm.productslist = [];

            Object.defineProperty(vm, 'canAdd', {
                get: canAdd
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            Object.defineProperty(vm, 'canCheckDist', {
                get: canCheckDist
            });

            activate();

            function activate() {
                initializeUnusedTags();
                $rootScope.routeSelection = 'orders';
                vm.isOrderEdit = false;

                isDateFiledSupported();
                getCountryName();

                if(utility.getOrderSelected() != null) {
                    vm.order = utility.getOrderSelected();
                    var timesplit = vm.order.time.split('-');
                    vm.time1 = timesplit[0];
                    vm.time2 = timesplit[1];
                    if(vm.order.items != null && vm.order.items != undefined && vm.order.items.length > 0) {
                        vm.products = angular.copy(vm.order.items);
                    }
                    else {
                        vm.products.push({name:"", quantity:1, price:0, unitprice:0});
                    }
                    vm.isOrderEdit = true;
                    vm.selecteddate = vm.isdatesupport ? new Date(vm.order.date): moment(utility.getDateFromString(vm.order.date)).format('DD/MM/YYYY');
                }
                else {
                    vm.order.tagsdetail = [];
                    vm.order.createdat = null;
                    vm.order.cancelled = false;
                    vm.order.productdesc = "";
                    vm.products = [];
                    vm.products.push({name:"", quantity:1, price:0, unitprice:0});
                    vm.time1 = "8:00 AM"
                    vm.time2 = "6:00 PM"
                    setTodayDate();
                }
                vm.tagsdetail = vm.order.tagsdetail;
                initializeTagColors();
                getAllMobileNumbers();
                getProducts();
            }

            function getAllMobileNumbers() {
                return customerservice.getAllMobileNumbers(accountid).then(
                function(data) {
                    vm.mobilenumbers = (data != null && data != undefined ) ? data : [];
                }
                , function(error) {
                });
            }

            function getProducts() {
                return productservice.getProductsBrief(accountid).then(
                function(data) {
                    vm.productslist = (data != null && data != undefined ) ? data : [];
                }
                , function(error) {
                });
            }

            function getAddressbyMobile(mobilenumber) {
                return customerservice.getAddressbyMobile(accountid, mobilenumber).then(
                function(data) {    
                    if(data != null && data != undefined && data.length > 0) {
                        vm.order.name = data[0].name;
                        vm.order.address = data[0].address;
                        vm.order.zip = data[0].zip;
                    }
                    else {
                        vm.order.name = null
                        vm.order.address = null;
                        vm.order.zip = null;
                    }
                }
                , function(error) {
                });
            }

            vm.mobileselected = function($item, $model, $label) {
               getAddressbyMobile($item.mobile)
            }

            vm.mobilechanged = function() {
                if(vm.order.mobilenumber == null || vm.order.mobilenumber == undefined) {
                    vm.order.name = null
                    vm.order.address = null;
                    vm.order.zip = null;
                }
                else if(vm.order.mobilenumber.length == 10)
                    getAddressbyMobile(vm.order.mobilenumber)
            }

            function getCountryName() {
                $.getJSON("http://freegeoip.net/json/", function (data) {
                    vm.country = data.country_name;
                });
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
                    vm.alltags = [];              
                    for(prop in tags) {
                        var taginfo = {
                            tag: prop, 
                            tagcolor : "badge"+tags[prop],
                            opacity : 1
                        };

                        if((_.filter(vm.tagsdetail, function(el){ return el.tag ==  prop})).length == 0) {  
                            vm.unusedtags.push(taginfo);
                        }

                        vm.alltags.push(taginfo);
                    }
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
                vm.createtag = false;
                vm.unusedtags = _.reject(vm.unusedtags, function(el) { return el.tag === tag.tag; });
                vm.tagsdetail.push(tag);
            }

            vm.removetag = function(tag) {
                if(vm.order.cancelled != true) {
                    vm.tagsdetail = _.reject(vm.tagsdetail, function(el) { return el.tag === tag.tag; });
                    vm.unusedtags.push(tag);
                }
            }

            vm.createNewTag = function() {
                if(vm.tagName != null && vm.tagName != undefined && vm.tagName != "") {
                    var tagsref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/tags/'+ $.trim(vm.tagName));
                    tagsref.set(vm.selectcolor.replace("badge",""));
                    vm.createtag = false;
                    vm.tagName = null;
                    vm.selectcolor = "badgeblue";
                }
                else {
                    notify.warning("Enter a name to create tag");
                }
            }

            vm.deleteTags = function() {
                var filter = _.filter(vm.alltags, function(el){ return el.opacity == 0.3 });
                if(filter.length > 0) {
                    var deletetags = _.pluck(filter, "tag");
                    bootbox.confirm('Are you sure, you want to delete "'+deletetags.join(', ')+'"tags', function(result) {
                        if(result == true) {
                            for(var i=0; i <deletetags.length; i++) {
                                var tagsref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/tags/'+deletetags[i]);
                                tagsref.remove();

                                vm.tagsdetail = _.reject(vm.tagsdetail, function(el) { return el.tag === deletetags[i];});
                                if(vm.isOrderEdit == true) {
                                    vm.order.tagsdetail = _.reject(vm.order.tagsdetail, function(el) { return el.tag === deletetags[i];});
                                
                                    var editorder = utility.getOrderSelected();
                                    editorder.tagsdetail = vm.order.tagsdetail;
                                    utility.setOrderSelected(editorder);
                                }
                            }
                            vm.deletetags = false;
                            utility.applyscope($scope);
                        }
                    });
                }
                else {
                    notify.warning("Select any tag to delete");
                }
            }

            vm.cancelDeleteTags = function() {
                vm.deletetags = false;
                clearSelectedTags();
            }

            function clearSelectedTags() {
                for(var j=0; j< vm.alltags.length; j++) {
                    vm.alltags[j].opacity = 1;
                }
            }

            vm.selecttagcolor = function(tagcolor) {
                vm.selectcolor = tagcolor.color;
            }

            vm.checkdistclicked = function() {
                vm.checkdistance = true;
                vm.dpincode = vm.order.zip;

                if(vm.dpincode != null && vm.dpincode != undefined && vm.dpincode != "" &&
                   vm.spincode != null && vm.spincode != undefined && vm.spincode != "") {
                    vm.caldistance();
                }
            }

            function canCheckDist() {
                return (vm.spincode != null && vm.spincode != undefined && vm.dpincode != null && vm.dpincode != undefined);
            }

            vm.caldistance = function() {
                vm.caldist = "";
                vm.showdistance = "";
                var origins = [];
                origins.push(vm.spincode + " " +vm.country);

                var destinations = [];
                destinations.push(vm.dpincode + " " +vm.country);
              
                var service = new google.maps.DistanceMatrixService();
                service.getDistanceMatrix(
                {
                    origins: origins,
                    destinations: destinations,
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC,
                    avoidHighways: false,
                    avoidTolls: false
                }, function(response, status) {
                    if(status == 'OK') {
                        if(response.rows.length >0 && response.rows[0].elements.length > 0 && response.rows[0].elements[0].status == 'OK') {
                            vm.caldist = response.rows[0].elements[0].distance.text;
                            vm.caltime = response.rows[0].elements[0].duration.text;
                            vm.showdistance = true;
                        }
                        else {
                          notify.warning("No route found.")
                          vm.showdistance = false;
                        }
                    }
                    else {
                        notify.error("Something went wrong, please try after some time");
                        vm.showdistance = false;
                    }

                    utility.applyscope($scope);
                });
            }

            vm.closecheckdistance = function() {
                if(vm.spincode != null && vm.spincode != undefined) {
                    utility.setSourcePincode(vm.spincode);
                }
                vm.checkdistance = false;
                vm.showdistance = false;
                vm.caldist = "";
                vm.showdistance = "";
                vm.spincode = utility.getSourcePincode();;
                vm.dpincode = null;
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

            vm.productselected =function($item, $model, $label, product) {
                product.unitprice = $item.price
                vm.quantityChanged(product);
            }

            vm.productChanged = function(product){
                product.unitprice = 0;
                product.price = 0;
                vm.quantityChanged(product);
            }

            vm.quantityChanged = function(product) {
                if(product.quantity <=0) {
                    product.price = 0;
                }
                else {
                    product.price = parseFloat((parseFloat(product.quantity) * parseFloat(product.unitprice)).toFixed(2));
                }
                calculateItemsAndAmount();
            }

            vm.priceChanged = function(product) {
                calculateItemsAndAmount();  
            }

            vm.addproduct = function() {
                vm.products.push({name:"", quantity:1, price:0, unitprice:0});
            }

            vm.removeproduct = function(index) {
               vm.products.splice(index, 1);
               calculateItemsAndAmount();
            }

            function calculateItemsAndAmount() {
                var items = "";
                var amount = 0;
                vm.order.items = [];

                for(var i=0; i< vm.products.length; i++) {
                    if(vm.products[i].name != null && vm.products[i].name != undefined && vm.products[i].name != "") 
                    {
                        items = items + vm.products[i].quantity + " X " + vm.products[i].name;

                        if(i != (vm.products.length-1))
                            items = items + ",\n";

                        vm.order.items.push({name: vm.products[i].name, quantity: vm.products[i].quantity, price : parseFloat(vm.products[i].price), 
                                        unitprice : parseFloat(vm.products[i].unitprice)});
                    }
                    amount = amount + parseFloat(vm.products[i].price);
                }

                vm.order.productdesc = items;
                vm.order.amount = amount;
            }

            vm.addorder = function() {
                submitted = true;
                spinner.show();
                
                vm.order.createdat = new Date().getTime();
                
                if(vm.order.amount == null || vm.order.amount == undefined)
                    vm.order.amount = 0;

                if(vm.order.zip == null || vm.order.zip == undefined)
                    vm.order.zip = "";
               
                vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');
                vm.order.time = vm.time1 + "-" + vm.time2;
                checkOrderNumber();
            }

            function checkOrderNumber() {
               var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+vm.order.deliverydate+"/"+vm.order.ordernumber);
               ordersref.once("value", function(snapshot) {
                    if(snapshot.val() == null) {
                        setTags();
                        ordersref.set(vm.order);
                        saveCustomer();
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
                    productdesc : vm.order.productdesc,
                    notes : (vm.order.notes != null || vm.order.notes != undefined) ?  vm.order.notes : "",
                    tags : (vm.order.tags != null || vm.order.tags != undefined) ? vm.order.tags : "",
                    zip : (vm.order.zip != null && vm.order.zip != undefined) ? vm.order.zip : "",
                    items : (vm.order.items != null && vm.order.items != undefined && vm.order.items.length > 0) ? vm.order.items : ""
                };
                
                updateorder.time = updateorder.time.replace(/\s+/g, " ");  
                ordersref.update(updateorder);

                if(vm.order.deviceid != null && vm.order.deviceid != undefined) {
                    var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber);
                    ordersref1.update({Name: vm.order.name, Mobile: vm.order.mobilenumber, Amount: vm.order.amount, Time: updateorder.time, 
                        Address: vm.order.address + (vm.order.zip != null && vm.order.zip != undefined ? (" " + vm.order.zip) : ""), Notes: updateorder.notes});

                    
                    if(vm.order.items != null && vm.order.items != undefined && vm.order.items.length > 0) {
                        var items = [];

                        for (var i = 0; i < vm.order.items.length; i++) {
                            items.push({Name: (vm.order.items[i].quantity +  " X " + vm.order.items[i].name), Description: ""});
                        };

                        ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber+"/Items");
                        ordersref1.set(items);
                    }
                    else {
                        ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber+"/Items");
                        ordersref1.remove();
                    }
                }

                saveCustomer();
                vm.cancel();
            }

            function saveCustomer() {
                return customerservice.saveCustomer(accountid, vm.order.mobilenumber, vm.order.name, vm.order.address, vm.order.zip);
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

            vm.cancelorder = function() {
                vm.iscancel = true;
            }

            vm.cancelcancelled = function() {
                vm.iscancel = false;
            }

            vm.cancelconfirm = function() {
                vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');
                submitted = true;
                spinner.show();

                var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+vm.order.deliverydate+"/"+vm.order.ordernumber+"/cancelled");
                ordersref.set(true);

                if(vm.order.deviceid != null && vm.order.deviceid != undefined) {
                    var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber);
                    ordersref.remove();
                }

                notify.success('Order cancelled successfully');
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