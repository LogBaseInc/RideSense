define(['angular',
    'config.route',
    'lib',
    'views/services/customerservice',
    'views/services/orderservice',
    'views/services/productservice'], function (angular, configroute) {
    (function () {
        configroute.register.controller('order', ['$rootScope', '$routeParams' , '$http', '$log', '$scope', '$location', 'config', 'spinner', 'notify', 'sessionservice', 'utility', '$window', 'customerservice', 'productservice', 'orderservice', order]);
        function order($rootScope, $routeParams, $http, $log, $scope, $location, config, spinner, notify, sessionservice, utility, $window, customerservice, productservice, orderservice) {
            var vm = this;
            var submitted = false;
            var alltagsref = null;
            var accountid = sessionservice.getaccountId();
            var userid = sessionservice.getSession().uid;

            vm.order = {};
            vm.createtag = false;
            vm.deletetags = false;
            vm.tagColors = [];
            vm.selectcolor = "badgeblue";
            vm.alltags = [];
            vm.checkdistance = false;
            vm.showdistance = false;
            vm.spincode = utility.getSourcePincode();;
            vm.country = "";
            vm.mobilenumbers=[];
            vm.products = [];
            vm.productslist = [];
            vm.trackinventory = false;
            vm.inventoryerror = false;
            vm.removedinventory = [];
            vm.istoday = false;
            vm.usernotfound = false;
            vm.fecthingaddressdata = false;

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

            //Activate
            function activate() {
                $rootScope.routeSelection = 'orders';
                vm.isOrderEdit = false;

                initializeUnusedTags();
                getInventoryTracking();

                vm.isdatesupport = utility.isDateFiledSupported();
                getCountryName();

                if(utility.getOrderSelected() != null) {
                    vm.order = utility.getOrderSelected();
                    var timesplit = vm.order.time.split('-');
                    if(timesplit.length < 2)
                        timesplit = vm.order.time.split('–');
                    vm.time1 = timesplit[0];
                    vm.time2 = timesplit[1];
                    if(vm.order.items != null && vm.order.items != undefined && vm.order.items.length > 0) {
                        vm.products = angular.copy(vm.order.items);
                    }
                    else {
                        addoneProduct();
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
                    addoneProduct();
                    vm.time1 = "8:00 AM"
                    vm.time2 = "6:00 PM"
                    setTodayDate();
                }

                var todaysdate = vm.isdatesupport ? new Date() : moment(new Date()).format('DD/MM/YYYY');
                 if((vm.isdatesupport == false && moment(utility.getDateFromString(todaysdate)).format('DD/MM/YYYY') <= moment(utility.getDateFromString(vm.selecteddate)).format('DD/MM/YYYY')) ||
                   (vm.isdatesupport == true && moment(todaysdate).format('DD/MM/YYYY') <= moment(vm.selecteddate).format('DD/MM/YYYY')))
                    vm.istoday = true;
                else
                    vm.istoday = false; 

                vm.removedinventory = [];
                vm.tagsdetail = vm.order.tagsdetail;
                initializeTagColors();
                getProducts();
            }

            function canAdd(){
                return $scope.orderform.$valid && !submitted && !vm.inventoryerror;
            }

            //Initialize methods
            function initializeTagColors() {
                vm.tagColors = [];
                vm.tagColors.push({color: "badgeblue"});
                vm.tagColors.push({color: "badgegreen"});
                vm.tagColors.push({color: "badgered"});
                vm.tagColors.push({color: "badgeorange"});
                vm.tagColors.push({color: "badgegray"});
                vm.tagColors.push({color: "badgeblack"});
            }

            function getCountryName() {
                var countryref = new Firebase(config.firebaseUrl+'accounts/'+accountid+"/"+'address/country');
                countryref.once("value", function(snapshot) {
                    if(snapshot.val() != null && snapshot.val() != undefined && snapshot.val() != "") {
                        vm.country = snapshot.val();
                        utility.applyscope($scope);
                    }
                    else{
                        $.ajax({
                            url: "http://ip-api.com/json",
                            type: 'GET',
                            success: function(json) {
                                vm.country = json.country;
                                utility.applyscope($scope);
                            },
                            error: function(err) {
                                vm.country = "India";
                                utility.applyscope($scope);
                            }
                        });
                    }
                }, function(errorObject){

                });
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

            function setTodayDate() {
                vm.selecteddate = vm.isdatesupport ? new Date() : moment(new Date()).format('DD/MM/YYYY');
            }

            //Get methods
            function getInventoryTracking() {
                var inventoryTrackingRef = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/inventorytracking');
                inventoryTrackingRef.once("value", function(snapshot) {
                    vm.trackinventory =  (snapshot.val() != null && snapshot.val() != undefined && snapshot.val() != "" && snapshot.val() == true ? true : false);
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("Inventory Tracking read failed: ", errorObject);
                });
            }

            function getProducts() {
                return productservice.getProductsBrief(accountid).then(
                function(data) {
                    vm.productslist = (data != null && data != undefined ) ? data : [];
                    for (var i = 0; i < vm.products.length; i ++) {
                        if(vm.products[i].uuid != null && vm.products[i].uuid != undefined && vm.products[i].uuid != "") {
                            var filterpr = _.filter(vm.productslist, function(pr){ return pr.uuid ==  vm.products[i].uuid});
                            if(filterpr != null && filterpr != undefined && filterpr.length > 0) {
                                vm.products[i].inventory = filterpr[0].inventory;
                            }
                            else {
                                vm.products[i].uuid = "";
                                vm.products[i].inventory = 0;
                            }
                            vm.products[i].originalQuantity = angular.copy(vm.products[i].quantity);
                        }
                    }
                    utility.applyscope($scope);
                }
                , function(error) {
                });
            }

            function getAddressbyMobile(mobilenumber) {
                vm.fecthingaddressdata = true;
                return customerservice.getAddressbyMobile(accountid, mobilenumber).then(
                function(data) {  
                    vm.fecthingaddressdata = false;
                    if(data != null && data != undefined && data.length > 0 && !jQuery.isEmptyObject(data[0])) {
                        vm.usernotfound = false;
                        vm.order.name = data[0].name;
                        vm.order.address = data[0].address;
                        vm.order.zip = data[0].zip;
                    }
                    else {
                        vm.usernotfound = true;
                        vm.order.name = null
                        vm.order.address = null;
                        vm.order.zip = null;
                    }
                    utility.applyscope($scope);
                }
                ,function(error) {
                });
            }

            //Changed event methods
            vm.mobileselected = function($item, $model, $label) {
               getAddressbyMobile($item.mobile)
            }

            vm.mobilechanged = function() {
                vm.usernotfound = false;
                vm.fecthingaddressdata = false;
                if(vm.order.mobilenumber == null || vm.order.mobilenumber == undefined) {
                    vm.order.name = null
                    vm.order.address = null;
                    vm.order.zip = null;
                }
                else if(vm.order.mobilenumber.length == 10)
                    getAddressbyMobile(vm.order.mobilenumber)
            }

            vm.datechanged = function (date) {
                if(date == null) {
                    setTodayDate();
                    date = vm.selecteddate;
                }
                else 
                    vm.selecteddate = date;
            }

            //Tags method
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

            function setTags() {
                delete vm.order["tagsdetail"];
                var tagArray = [];
                vm.order.tags = "";
                for(var i = 0; i < vm.tagsdetail.length; i++) {
                    tagArray.push(vm.tagsdetail[i].tag);
                }
                vm.order.tags = tagArray.join(",");
            }

            vm.selecttagcolor = function(tagcolor) {
                vm.selectcolor = tagcolor.color;
            }

            //Distance check
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

            //Products method
            vm.addproduct = function() {
                addoneProduct();
            }

            function addoneProduct () {
                vm.products.push({name:"", quantity:null, originalQuantity : 0, price:null, unitprice:0,inventoryerror: false});
            }

            vm.removeproduct = function(index) {
               vm.removedinventory.push(vm.products[index]);
               vm.products.splice(index, 1);
               calculateItemsAndAmount();
            }

            vm.productselected =function($item, $model, $label, product) {
                var prodfound = _.filter(vm.products, function(pdt){ return pdt.uuid == $item.uuid; });
                if(prodfound != null && prodfound.length > 0) {
                    product.name = null;
                    product.uuid = null;
                    product.unitprice = 0;
                    product.inventory = null;
                    product.quantity = 0;
                    product.inventoryerror = false;
                    var pr = prodfound[0];
                    pr.quantity = parseFloat(pr.quantity)+1;
                    vm.quantityChanged(pr);
                }
                else {
                    product.uuid = $item.uuid;
                    product.unitprice = $item.price;
                    product.inventory = $item.inventory;
                    product.quantity = product.quantity != null && product.quantity > 0 ? product.quantity : 1;
                    vm.quantityChanged(product);
                }
            }

            vm.productChanged = function(product){
                product.uuid = null;
                product.unitprice = 0;
                product.price = 0;
                product.inventory = null;
                product.inventoryerror = false;
                product.quantity = product.quantity != null && product.quantity > 0 ? product.quantity : 1;
                vm.quantityChanged(product);
            }

            vm.quantityChanged = function(product) {
                vm.inventoryerror = false;

                if(vm.trackinventory == true && product.inventory != null)
                { 
                    product.inventoryerror = false;
                    if(parseFloat(product.quantity) <= (parseFloat(product.inventory) + parseFloat(product.originalQuantity)))
                    {
                        if(product.quantity <=0) {
                            product.price = 0;
                        }
                        else {
                            product.price = parseFloat((parseFloat(product.quantity) * parseFloat(product.unitprice)).toFixed(2));
                        }
                        calculateItemsAndAmount();
                    }
                    else if(vm.trackinventory == true && product.quantity != null && product.quantity != undefined && product.quantity != "") {
                        product.noquantity = false;
                        product.inventoryerror = true;
                    }
                    else if(product.quantity == null || product.quantity == undefined || product.quantity == "") {
                        product.noquantity = true;
                        product.inventoryerror = true;
                    }
                }
                else if(vm.trackinventory == false) {
                    product.noquantity = false;
                    product.inventoryerror = false;

                    if(product.quantity == null || product.quantity == undefined || product.quantity == "") {
                        product.noquantity = true;
                        product.inventoryerror = true;
                    }
                    else {
                        if(product.quantity <=0) {
                            product.price = 0;
                        }
                        else {
                            product.price = parseFloat((parseFloat(product.quantity) * parseFloat(product.unitprice)).toFixed(2));
                        }
                        calculateItemsAndAmount();
                    }
                }

                var inventoryerrors = _.filter(vm.products, function(product){ return product.inventoryerror == true; });
                vm.inventoryerror = inventoryerrors != null && inventoryerrors!= undefined && inventoryerrors.length>0;
            }

            vm.priceChanged = function(product) {
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

                        vm.order.items.push({name: vm.products[i].name, quantity: vm.products[i].quantity, price : parseFloat(vm.products[i].price), unitprice : parseFloat(vm.products[i].unitprice), 
                        uuid : (vm.products[i].uuid != null && vm.products[i].uuid != undefined && vm.products[i].uuid != "") ? vm.products[i].uuid : ""});
                    }
                    amount = amount + parseFloat(vm.products[i].price);
                }

                vm.order.productdesc = items;
                vm.order.amount = amount;
            }

            function productInventoryCal (type) {
                var inventories = [];
                if(type == "Add") {
                    for (var i = 0; i < vm.products.length; i++) {
                        if(vm.products[i].uuid != null && vm.products[i].uuid != undefined && vm.products[i].uuid != "") {
                            if(vm.products[i].quantity != null && vm.products[i].quantity != undefined && vm.products[i].quantity != "")
                                inventories.push({uuid : vm.products[i].uuid, inventory_diff :  (0-parseFloat(vm.products[i].quantity)).toString()});
                        }
                    }
                }
                else if(type == "Delete") {
                    for (var i = 0; i < vm.products.length; i++) {
                        if(vm.products[i].uuid != null && vm.products[i].uuid != undefined && vm.products[i].uuid != "" && parseFloat(vm.products[i].originalQuantity) > 0) {
                            inventories.push({uuid : vm.products[i].uuid, inventory_diff :  vm.products[i].originalQuantity.toString()});
                        }
                    }

                    for (var j = 0; j < vm.removedinventory.length; j++) {
                        inventories.push({uuid : vm.removedinventory[j].uuid, inventory_diff :  parseFloat(vm.removedinventory[j].originalQuantity).toString()});
                    }
                }
                else if(type == "Update") {
                    for (var i = 0; i < vm.products.length; i++) {
                        if(vm.products[i].uuid != null && vm.products[i].uuid != undefined && vm.products[i].uuid != "") {
                            if(vm.products[i].quantity != null && vm.products[i].quantity != undefined && vm.products[i].quantity != "") 
                            {
                                if(parseFloat(vm.products[i].originalQuantity) > 0) 
                                {
                                    var invendiff = (parseFloat(vm.products[i].originalQuantity)  - parseFloat(vm.products[i].quantity));
                                    if(invendiff != 0 ) {
                                        inventories.push({uuid : vm.products[i].uuid, inventory_diff : invendiff.toString()});
                                    }
                                }
                                else {
                                    inventories.push({uuid : vm.products[i].uuid, inventory_diff :  (0-parseFloat(vm.products[i].quantity)).toString()});
                                }
                            }
                        }
                    }

                    for (var j = 0; j < vm.removedinventory.length; j++) {
                        if(vm.removedinventory[j].uuid != null && vm.removedinventory[j].uuid != undefined && vm.removedinventory[j].uuid != "") {
                           var alreadyadded = _.filter(inventories, function(inv){ return inv.uuid ==  vm.removedinventory[j].uuid});
                           
                           if(alreadyadded != null && alreadyadded.length > 0) {
                                alreadyadded[0].inventory_diff = parseFloat(alreadyadded[0].inventory_diff) + (parseFloat(vm.removedinventory[j].originalQuantity));
                           }
                           else
                                inventories.push({uuid : vm.removedinventory[j].uuid, inventory_diff :  parseFloat(vm.removedinventory[j].originalQuantity).toString()});
                        }
                    }
                }
                return (inventories);
            }

            //Order methods
            vm.addorder = function() {
                submitted = true;
                spinner.show();
                
                vm.order.createdat = new Date().getTime();
                vm.order.createdby = userid;
                
                if(vm.order.amount == null || vm.order.amount == undefined)
                    vm.order.amount = 0;

                vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYY/MM/DD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYY/MM/DD');
                vm.order.time = vm.time1 + "-" + vm.time2;
                checkOrderNumber();
            }

            function checkOrderNumber() {
               var orddeliverdate =  vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');
               var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+orddeliverdate+"/"+vm.order.ordernumber);
               ordersref.once("value", function(snapshot) {
                    if(snapshot.val() == null) {
                        updateinventories("Add");
                    }
                    else{
                        notify.error("Order number already exists");
                        submitted = false;
                        spinner.hide();
                        utility.applyscope($scope);
                    }
                   
                });
            }

            vm.updateorder = function() {
                updateinventories("Update");
            }

            vm.deleteorder = function() {
                vm.isdelete = true;
            }

            vm.deletecancel = function() {
                vm.isdelete = false;
            }

            vm.deleteconfirm = function() {
               updateinventories("Delete");
            }

            function updateinventories (calledfrom) {
                submitted = true;
                spinner.show();

                var inventories = productInventoryCal(calledfrom);
                if(inventories.length > 0 && vm.trackinventory == true) {
                    return productservice.updateProuctsInvetory(accountid, inventories).
                    then(function (data) {
                        if(calledfrom == "Add") 
                            addFirebaseOrder();
                        else if(calledfrom == "Update")
                            updateFirebaseOrder();
                        else if(calledfrom == "Delete")
                            deleteFirebaseOrder();

                    }, function (error) {
                        if(error.data.indexOf('out of stock')>=0) {
                            notify.error("Some products inventory changed, please refresh the page and add order");
                        }
                        else{
                            notify.error("Something went worng, please try after sometime");
                        }
                        submitted = false;
                        spinner.hide();
                        utility.applyscope($scope);
                    });
                }
                else {
                    if(calledfrom == "Add") 
                        addFirebaseOrder();
                    else if(calledfrom == "Update")
                        updateFirebaseOrder();
                    else if(calledfrom == "Delete")
                        deleteFirebaseOrder();
                }
            }

            function addFirebaseOrder () {
                setTags();
                submitted = true;
                spinner.show();
                var ordsave = {
                    order_id: vm.order.ordernumber.toString(),
                    name: vm.order.name.toString(),
                    address: vm.order.address.toString(),
                    delivery_date: moment(vm.order.deliverydate).format('YYYY/MM/DD'),
                    delivery_time_slot : vm.order.time,
                    mobile_number : vm.order.mobilenumber.toString(),
                    cod_amount : vm.order.amount.toString(),
                    product_desc : vm.order.productdesc != null &&  vm.order.productdesc != undefined ? vm.order.productdesc.toString() : "",
                    notes : vm.order.notes != null &&  vm.order.notes != undefined ? vm.order.notes.toString() : "",
                    zip : vm.order.zip != null &&  vm.order.zip != undefined ? vm.order.zip.toString() : "",
                    country: vm.country,
                    items : vm.order.items != null &&  vm.order.items != undefined ? vm.order.items: "",
                    tags: vm.order.tags != null &&  vm.order.tags != undefined ? vm.order.tags: "",
                    createdby : vm.order.createdby
                }

                $log.info({order: ordsave,tags:['stick', 'order', 'ui', accountid], type: 'add'});
                return orderservice.saveOrder([ordsave], accountid).then(
                function(data){
                    saveCustomer();
                    vm.cancel();
                    utility.applyscope($scope);
                },
                function (error){
                    submitted = false;
                    spinner.hide();
                    notify.error("Something went wrong, please try after sometime");
                    utility.applyscope($scope);
                });
            }

            function updateFirebaseOrder () {
                setTags();
                
                vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYY/MM/DD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYY/MM/DD');

                if(vm.order.amount == null || vm.order.amount == undefined || vm.order.amount == "")
                    vm.order.amount = 0;

                var updateorder = {
                    time:  vm.time1 + " - " + vm.time2,
                    productdesc : vm.order.productdesc != null &&  vm.order.productdesc != undefined ? vm.order.productdesc.toString() : "",                    
                    notes : (vm.order.notes != null || vm.order.notes != undefined) ?  vm.order.notes : "",
                    tags : (vm.order.tags != null || vm.order.tags != undefined) ? vm.order.tags : "",
                    zip : (vm.order.zip != null && vm.order.zip != undefined) ? vm.order.zip : "",
                    items : (vm.order.items != null && vm.order.items != undefined && vm.order.items.length > 0) ? vm.order.items : ""
                };
                
                updateorder.time = updateorder.time.replace(/\s+/g, " ");  
                updateorder.time = updateorder.time.replace("–", "-"); 
                var ordsave = {
                    order_id: vm.order.ordernumber.toString(),
                    name: vm.order.name.toString(),
                    address: vm.order.address.toString(),
                    delivery_date: moment(vm.order.deliverydate).format('YYYY/MM/DD'),
                    delivery_time_slot : updateorder.time,
                    mobile_number : vm.order.mobilenumber.toString(),
                    cod_amount : vm.order.amount.toString(),
                    product_desc : updateorder.productdesc,
                    notes : updateorder.notes.toString(),
                    zip : updateorder.zip.toString(),
                    country: vm.country,
                    items : updateorder.items,
                    tags: updateorder.tags,
                    url: vm.order.url,
                    createdby : (vm.order.createdby != null && vm.order.createdby != undefined) ? vm.order.createdby : null
                }

                $log.info({order: ordsave,tags:['stick', 'order', 'ui', accountid], type: 'update'});
                return orderservice.saveOrder([ordsave], accountid).then(
                function(data){
                    if(vm.order.deviceid != null && vm.order.deviceid != undefined) {
                        var orddeliverdate =  vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');
                        var ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+orddeliverdate+"/"+vm.order.ordernumber);
                        ordersref1.update({Name: vm.order.name, Mobile: vm.order.mobilenumber, Amount: parseFloat(vm.order.amount), Time: updateorder.time, 
                            Address: vm.order.address + (vm.order.zip != null && vm.order.zip != undefined ? (" " + vm.order.zip) : ""), Notes: updateorder.notes});

                        if(vm.order.items != null && vm.order.items != undefined && vm.order.items.length > 0) {
                            var items = [];

                            for (var i = 0; i < vm.order.items.length; i++) {
                                items.push({Name: (vm.order.items[i].quantity +  " X " + vm.order.items[i].name), Description: ""});
                            };

                            ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+orddeliverdate+"/"+vm.order.ordernumber+"/Items");
                            ordersref1.set(items);
                        }
                        else if(vm.order.productdesc != null && vm.order.productdesc != undefined && vm.order.productdesc != "") {
                            var items = [];
                            items.push({Name: "", Description: vm.order.productdesc});
                            ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+orddeliverdate+"/"+vm.order.ordernumber+"/Items");
                            ordersref1.set(items);
                        }
                        else {
                            ordersref1 = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+orddeliverdate+"/"+vm.order.ordernumber+"/Items");
                            ordersref1.remove();
                        }
                    }
                    saveCustomer();
                    vm.cancel();
                    utility.applyscope($scope);
                },
                function (error){
                    submitted = false;
                    spinner.hide();
                    notify.error("Something went wrong, please try after sometime");
                    utility.applyscope($scope);
                });
            }

            function deleteFirebaseOrder () {
                vm.order.deliverydate = vm.isdatesupport ? moment(vm.selecteddate).format('YYYYMMDD') : moment(utility.getDateFromString(vm.selecteddate)).format('YYYYMMDD');
                submitted = true;
                spinner.show();

                var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+vm.order.deliverydate+"/"+vm.order.ordernumber);
                ordersref.remove();

                if(vm.order.deviceid != null && vm.order.deviceid != undefined) {
                    var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber);
                    ordersref.remove();
                }

                var ordertrackref = new Firebase(config.firebaseUrl+'trackurl/'+vm.order.deliverydate+"/"+accountid+"_"+vm.order.ordernumber);
                ordertrackref.remove();

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
                var cancelledon = moment(new Date()).format('YYYY/MM/DD HH:mm:ss')
                var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/unassignorders/'+vm.order.deliverydate+"/"+vm.order.ordernumber);
                ordersref.update({cancelled:true, cancelledon: cancelledon});

                if(vm.order.deviceid != null && vm.order.deviceid != undefined) {
                    var ordersref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/orders/'+vm.order.deviceid+"/"+vm.order.deliverydate+"/"+vm.order.ordernumber+"/Cancelledon");
                    ordersref.set(cancelledon);

                    var ordertrackref = new Firebase(config.firebaseUrl+'trackurl/'+vm.order.deliverydate+"/"+accountid+"_"+vm.order.ordernumber+"/status");
                    ordertrackref.set("Cancelled");
                }

                notify.success('Order cancelled successfully');
                vm.cancel();
            }

            //Customer
            function saveCustomer() {
                return customerservice.saveCustomer(accountid, vm.order.mobilenumber, vm.order.name, vm.order.address, vm.order.zip);
            }

            //Trip
            vm.viewtrip = function() {
                vm.order.tripid = vm.order.ordernumber;
                vm.order.isorder = true;
                vm.order.isfromorderdetail = true;
                utility.setTripSelected(vm.order);
                $location.path('/trip');
            }

            vm.cancel = function() {
                submitted = false;
                spinner.hide();
                $location.path('/orders');
            }

            $rootScope.$on('datepicker:dateselected', function (event, data) {
                if(data.date.format('DD/MM/YYYY') != vm.selecteddate) {
                    vm.selecteddate = data.date.format('DD/MM/YYYY');
                    vm.datechanged(vm.selecteddate);
                }
            });

            $scope.$on('$destroy', function iVeBeenDismissed() {
                if(alltagsref != null && alltagsref != undefined)
                    alltagsref.off();
            });
        }
    })();
});