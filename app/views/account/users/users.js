define(['angular',
    'config.route',
    'lib',
    'views/account/users/user'], function (angular, configroute) {
    (function () {

        configroute.register.controller('users', ['$rootScope','$scope', '$location', 'config', 'spinner', 'sessionservice', 'utility', users]);
        function users($rootScope, $scope, $location, config, spinner, sessionservice, utility) {
            var uservm = this;
            uservm.users = [];
            uservm.shownousers = false;
            uservm.useremails = [];
            var ref;

            activate();

            function activate(){
                $rootScope.routeSelection = '';
            	spinner.show();
                ref = new Firebase(config.firebaseUrl+'accounts/'+sessionservice.getaccountId()+'/users');
                ref.on("value", function(snapshot) {
                    getUsers(snapshot.val());
                }, function (errorObject) {
                    utility.errorlog("The users read failed: " , errorObject);
                });
            }

            function getUsers(data) {
                utility.scrollToTop();

            	uservm.users = [];
                uservm.useremails = [];

                for(var property in data) {
                    var email = utility.getDecodeString(property);
                    
                    var user = {
                        email : email,
                        isAdmin: data[property].admin,
                        isRegular : !(data[property].admin),
                        isVendor : (data[property].vendor != null && data[property].vendor != undefined) ? data[property].vendor : false,
                        status: data[property].joined ? 'Joined' : 'Invited',
                        joinedon : data[property].joined ? moment(data[property].joinedon).format('MMM DD, YYYY') : ''
                    };
                    user.role = setUserRole(user);
                    uservm.users.push(user);
                    uservm.useremails.push(email);
                }
                uservm.shownousers = uservm.users.length <=0 ;
                spinner.hide();
                utility.applyscope($scope);
            }

            function setUserRole(user) {
                if(user.isAdmin)
                    return "Administrator";
                else if(user.isAdmin == false && user.isVendor == true)
                    return "Vendor";
                else if(user.isAdmin == false)
                    return "Regular"
            }

            uservm.adduser = function(){
                if(uservm.search != null && uservm.search != undefined && uservm.search != "")
                    $rootScope.useremail = uservm.search;
                else
                    $rootScope.useremail = null;

                $rootScope.userselected = null;
                uservm.showadduser = true;
            }

            uservm.edituser = function (index) {
                $rootScope.userselected = uservm.users[index]
                uservm.showadduser = true;
            }

            $scope.$on('$destroy', function iVeBeenDismissed() {
                if(ref)
                    ref.off();
            });
        }
    })();
});