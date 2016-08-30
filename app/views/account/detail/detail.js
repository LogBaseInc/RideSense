define(['angular',
    'config.route',
    'lib',
    'views/account/users/users',
    'views/account/agentappsettings/agentappsetting.js'], function (angular, configroute) {
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
            vm.notificationEnabled = false;
            vm.notificationKey = null;
            vm.minFromOrderTime = null;
            vm.deliveryTimeWindow = null;
            vm.roundOffOrderTime = null;
            var userid = sessionservice.getSession().uid;
            
            Object.defineProperty(vm, 'canupdate', {
                get: canupdate
            });

            vm.interacted = function (field) {
                return submitted || field.$dirty;
            };

            var accountref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/name');
            var addressref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/address');
            var tokenref = new Firebase(config.firebaseUrl+'users/'+userid+'/token');
            var settingsRef = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings');
            var mobileref = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/mobilenumber');
            var notificationSettingsRef = new Firebase(config.firebaseUrl+'accounts/'+accountid+'/settings/notifications');

            activate();

            function activate() {
                $('#role-toggle1').bootstrapToggle();
                $('#role-toggle2').bootstrapToggle();
                $('#role-toggle3').bootstrapToggle();
                $('#role-toggle4').bootstrapToggle();
                $('#role-toggle5').bootstrapToggle();

                $('#role-toggle1').prop('checked', false).change();
                $('#role-toggle2').prop('checked', false).change();
                $('#role-toggle3').prop('checked', false).change();
                $('#role-toggle4').prop('checked', false).change();
                $('#role-toggle5').prop('checked', false).change();

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

                mobileref.once("value", function(snapshot) {
                    vm.mobilenumber = snapshot.val();
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("The mobile number read failed: ", errorObject);
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

                settingsRef.once("value", function(snapshot) {
                    var settings = snapshot.val();
                    if(settings != null && settings != undefined && settings!= "") {
                        var inventorytracking = (settings.inventorytracking != null && settings.inventorytracking != undefined && settings.inventorytracking != "") ? settings.inventorytracking : false;
                        var manualdelivery = (settings.manualdelivery != null && settings.manualdelivery != undefined && settings.manualdelivery != "") ? settings.manualdelivery : false;
                        var vendorsupport = (settings.vendorsupport != null && settings.vendorsupport != undefined && settings.vendorsupport !="") ? settings.vendorsupport : false;
                        var autoorderid = (settings.autoorderid != null && settings.autoorderid != undefined && settings.autoorderid !="") ? settings.autoorderid : false;
                        var autodeliverytime = (settings.autodeliverytime != null && settings.autodeliverytime != undefined && settings.autodeliverytime !="") ? settings.autodeliverytime : false;
                        vm.minFromOrderTime = (settings.minfromordertime != null && settings.minfromordertime != undefined && settings.minfromordertime !="") ? settings.minfromordertime : null;
                        vm.deliveryTimeWindow = (settings.deliverytimewindow != null && settings.deliverytimewindow != undefined && settings.deliverytimewindow !="") ? settings.deliverytimewindow : null;
                        vm.roundOffOrderTime = (settings.roundoffordertime != null && settings.roundoffordertime != undefined && settings.roundoffordertime !="") ? settings.roundoffordertime : null;

                        $('#role-toggle1').prop('checked', inventorytracking).change();
                        $('#role-toggle2').prop('checked', manualdelivery).change();
                        $('#role-toggle3').prop('checked', vendorsupport).change();
                        $('#role-toggle4').prop('checked', autoorderid).change();
                        $('#role-toggle5').prop('checked', autodeliverytime).change();
                    }
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("Inventory Tracking read failed: ", errorObject);
                });

                notificationSettingsRef.once("value", function(snapshot) {
                    var notificationSettings = snapshot.val();
                    console.log('Going to check notification settings for: ' + vm.loggedinusername);
                    if(notificationSettings != null && notificationSettings != undefined && notificationSettings!= "") {
                        //TODO
                        for (var key in notificationSettings) {
                            if(notificationSettings[key] === vm.loggedinusername) {
                                vm.notificationEnabled = true;
                                vm.notificationKey = key;
                                console.log('Notification enabled: ' + vm.notificationEnabled + ', key: ' + key);
                                $('#role-toggle5').prop('checked', vm.notificationEnabled).change();
                            } else {
                                console.log('Notification not enabled for: ' + vm.loggedinusername);
                            }
                        }
                    } else {
                        console.log('No notification settings found');
                    }
                    utility.applyscope($scope);
                }, function (errorObject) {
                    utility.errorlog("Inventory Tracking read failed: ", errorObject);
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
                mobileref.set(vm.mobilenumber);
                settingsRef.update({
                    inventorytracking : $('#role-toggle1').prop('checked'),
                    manualdelivery : $('#role-toggle2').prop('checked'),
                    vendorsupport : $('#role-toggle3').prop('checked'),
                    autoorderid : $('#role-toggle4').prop('checked'),
                    autodeliverytime: $('#role-toggle5').prop('checked'),
                    minfromordertime: vm.minFromOrderTime,
                    deliverytimewindow: vm.deliveryTimeWindow,
                    roundoffordertime: vm.roundOffOrderTime
                });
                notify.success("Account details updated successfully");
            }

            vm.saveNotificationPref = function () {
                var currNotificationEnabled = $('#role-toggle5').prop('checked');

                if(currNotificationEnabled != vm.notificationEnabled) {
                    if(currNotificationEnabled) {
                        //Add to firebase
                        var newRef = notificationSettingsRef.push(vm.loggedinusername);
                        vm.notificationEnabled = true;
                        vm.notificationKey = newRef.key();
                        console.log('Notifications enabled. Key is: ' + vm.notificationKey);
                    } else {
                        //Remove in firebase
                        notificationSettingsRef.child(vm.notificationKey).remove();
                        vm.notificationEnabled = false;
                        vm.notificationKey = null;
                        console.log('Notifications disabled.');
                    }
                } else {
                    console.log('No change in notification preference.');
                }
                notify.success("Notification preferences updated successfully");
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
                data.userId = userid;
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