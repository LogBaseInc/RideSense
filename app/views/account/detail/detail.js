define(['angular',
    'config.route',
    'views/account/users/users'], function (angular, configroute) {
    (function () {

        configroute.register.controller('accountdetail', ['$scope', '$location', '$http', 'config', 'notify', 'spinner', 'sessionservice', 'utility', accountdetail]);
        function accountdetail($scope, $location, $http, config, notify, spinner, sessionservice, utility) {
            var submitted = false;
            var vm = this;
            var accountid = sessionservice.getaccountId();
            vm.token = {};
            vm.isdelete = false;
            vm.urlisdelete = false;
            vm.webhookurl = null;
            vm.loggedinusername = sessionservice.getusername();
            
            Object.defineProperty(vm, 'canupdate', {
                get: canupdate
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            var accountref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/name');
            var addressref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/address');
            var tokenref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/token');
            var inventoryTrackingRef = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/inventorytracking');
            var manualDeliveryRef = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/manualdelivery');

            activate();

            function activate() {
                $('#role-toggle1').bootstrapToggle();
                $('#role-toggle2').bootstrapToggle();

                $('#role-toggle1').prop('checked', false).change();
                $('#role-toggle2').prop('checked', false).change();

                spinner.show();
                accountref.once("value", function(snapshot) {
                    vm.accountname = snapshot.val();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The account name read failed: ", errorObject);
                });

                var emailref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/email');
                emailref.once("value", function(snapshot) {
                    vm.email = snapshot.val();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The account name read failed: ", errorObject);
                });
                
                addressref.once("value", function(snapshot) {
                    vm.address = snapshot.val();
                    if(vm.address == null)
                        vm.address = {};
                    spinner.hide();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The address read failed: ", errorObject);
                });

                inventoryTrackingRef.once("value", function(snapshot) {
                    $('#role-toggle1').prop('checked', (snapshot.val() != null && snapshot.val() != undefined && snapshot.val() != "" && snapshot.val() == true ? true : false)).change();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("Inventory Tracking read failed: ", errorObject);
                });

                manualDeliveryRef.once("value", function(snapshot) {
                    $('#role-toggle2').prop('checked', (snapshot.val() != null && snapshot.val() != undefined && snapshot.val() != "" && snapshot.val() == true ? true : false)).change();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("Manual Delivery read failed: ", errorObject);
                });


                tokenref.on("value", function(snapshot) {
                    if(snapshot.val() != null) {
                        vm.token = snapshot.val();
                        vm.token.createdon = moment(vm.token.createdon).format("MMM DD, YYYY hh:mm A");
                    }
                    else {
                       vm.token = null;  
                    }
                    spinner.hide();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The setting token read failed: ", errorObject);
                });

                var webhookUrlref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/webhook/url');
                webhookUrlref.once("value", function(snapshot) {
                    vm.webhookurl = snapshot.val();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The Webhook URL read failed: ", errorObject);
                });
            }

            function canupdate(){
                return $scope.accountform.$valid && !submitted;
            }

            vm.update = function () {
                accountref.set(vm.accountname);
                addressref.set(vm.address);
                inventoryTrackingRef.set($('#role-toggle1').prop('checked'));
                manualDeliveryRef.set($('#role-toggle2').prop('checked'));
                notify.success('Account details updated successfully');
            }

            vm.getToken = function() {
                vm.isdelete = false;
                var token = utility.generateUUID();
                var date = moment(new Date()).format("YYYY/MM/DD HH:mm:ss");
                tokenref.set({id: token, createdon: date});

                var tokensref = new Firebase(config.firebaseUrl+'tokens/'+token);
                var data = {};
                data.accountId = accountid;
                data.orderCount = {count: 0, date: moment(new Date()).format("YYYYMMDD")};
                tokensref.set(data);
            }

            vm.deleteToken = function() {
                vm.isdelete = false;
                var tokensref = new Firebase(config.firebaseUrl+'tokens/'+vm.token.id);
                tokensref.remove();

                tokenref.remove();
            }

            vm.saveWebhookUrl =function() {
                spinner.show();
                checkWebhook();
            }

            function checkWebhook () {
                var testactivity = {};
                testactivity.order = {};
                testactivity.token = vm.token.id;
                testactivity.activity = "TEST_ACTIVITY";
                testactivity.time_ms = ((moment(new Date()).unix()) * 1000);
                console.log(testactivity);

                var req = {
                    method: 'POST',
                    url: vm.webhookurl,
                    headers: {
                       'Content-Type': 'application/json'
                    },
                    data: testactivity
                }

                $http(req).then(
                function(){
                    var webhookUrlref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/webhook/url');
                    webhookUrlref.set(vm.webhookurl);
                    spinner.hide();
                    notify.success("Webhook URL saved successfully");
                    utility.applyscope($scope);
                }, 
                function(error){
                    spinner.hide();
                    notify.error("Error while posting to Webhook URL. Provide a valid URL");
                    utility.applyscope($scope);
                });
            }

            vm.deleteWebhookUrl =function(form) {
                var webhookUrlref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/webhook/url');
                webhookUrlref.remove();
                vm.webhookurl = null;
                vm.urlisdelete = false;
                form.$setPristine();
                form.$setUntouched();
            }
        }
    })();
});