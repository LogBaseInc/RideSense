define(['angular',
    'config.route',
    'lib'], function (angular, configroute) {
    (function () {
        configroute.register.controller('ordermap', ['$compile', '$rootScope', '$scope', '$location', 'sessionservice', 'uiGmapIsReady', 'uiGmapGoogleMapApi', 'config', 'spinner', 'notify', 'utility', ordermap]);
        function ordermap($compile, $rootScope, $scope, $location, sessionservice, uiGmapIsReady, uiGmapGoogleMapApi, config, spinner, notify, utility) {
            $rootScope.routeSelection = 'orders';
        	var omapvm = this;
            omapvm.isassginclicked = false;
            var defaultzoom = 14;
            var mapinstance;
            var infowindow;
            var zipcodes = [];
            omapvm.selectedorders = [];
            omapvm.docluster = true;
            omapvm.mapOptions = {
                disableDefaultUI: false,    
            }
            omapvm.clusterOptions = {
               averageCenter : true,
               ignoreHidden : true,
               imagePath: "assets/images/m"
            };
            var selecting = false,mouseDownPos, gribBoundingBox = null, mouseIsDown = 0;
            omapvm.isfilterclicked = false;
            var selectedorder = null;
            omapvm.showorhidefilter = showorhidefilter;
            activate();

            function activate () {
                // Show general Map
                omapvm.map = { center: { latitude: 0, longitude: 0 }, zoom: 2 };
                navigator.geolocation.getCurrentPosition(currentPositionCallback);

                setGoogleMaps();

                showorhidefilter();
            }

            function currentPositionCallback(position) {
                omapvm.map = { center: { latitude: position.coords.latitude, longitude: position.coords.longitude }, zoom: defaultzoom };
            }

            $scope.unassignclicked = function(){
               $scope.$parent.vm.unassignorder(selectedorder);
               infowindow.close();
            }

            omapvm.markersEvents = {
                click: function (gMarker, eventName, model) {
                    selectedorder = model;

                    if(omapvm.isassginclicked == true && model.deviceid == null && model.status == null) {
                        if(_.filter(omapvm.selectedorders, function(ord){return ord.ordernumber == model.ordernumber}).length == 0)
                            omapvm.selectedorders.push(model);
                    }

                    var isassigned = false;
                    if(model.deviceid != null && model.status != null)
                        isassigned = true;
                    
                    var content = '<div id="infowindow_content"><p>'+model.address+'.</p><span style="font-weight: bold;">'+getStatus(model)+'</span>'+(isassigned ? '<center><a class="btn btn-xs btn-info" ng-click="unassignclicked()">Unassign</a></center>' : '')+'</div>';
                    var compiled = $compile(content)($scope);
                    infowindow.setContent(compiled[0]);
                    infowindow.open( mapinstance , gMarker );
                    
                },
                dblclick : function (gMarker, eventName, model) {
                    utility.setOrderSelected(model);
                    $location.path('/order');
                }
            };

            function getStatus(model) {
                var status = "";
                if(model.vehiclenumber != null && model.vehiclenumber != undefined && model.vehiclenumber != "")
                    status = model.vehiclenumber + " ";

                if(model.cancelled == true) {
                    status = "Cancelled @ " + model.cancelledon;
                }
                else if(model.status == 'Accepted') {
                    status = status + "Accepted @ "+ model.acceptedon;
                }
                else if(model.status == 'Picked up') {
                    status = status + "Picked @ "+ model.pickedon;
                }
                else if(model.status == 'Delivered') {
                    if(model.markeddeliveredon == null)
                        status = status + (model.pickedon + " - " + model.deliveredon);
                    else
                        status = (model.markeddelivereddriver != null ? (model.markeddelivereddriver +" "): "") + "Marked as delivered @ " +model.pickedon;
                }

                return status;
            };

            omapvm.startorstopassign = function($event) {
               omapvm.selectedorders = [];
               var mapPos = parseInt($('.assignoption').css('right'), 10);
               if (mapPos < 0) {
                    omapvm.isassginclicked = true;
                    selecting = true;
                    hideAssignedMarkers(true);
                    $('.assignoption').animate({
                        right: 0
                    }, 458, 'swing', function() {
                        // Animation complete.
                    });
               }
               else {
                    omapvm.isassginclicked = false;
                    selecting = false;
                    hideAssignedMarkers(false);
                    $('.assignoption').animate({
                        right: -200
                    }, 458, 'swing', function() {
                        // Animation complete.
                    });
               } 
            }

            function showorhidefilter ($event) {
                var mapPos = parseInt($('.filteroption').css('right'), 10);
                if (mapPos < 0) {
                    omapvm.isfilterclicked = true;
                    $('.filteroption').animate({
                        right: 0
                    }, 458, 'swing', function() {
                        // Animation complete.
                    });
               }
               else {
                    omapvm.isfilterclicked = false;
                    $('.filteroption').animate({
                        right: -200
                    }, 458, 'swing', function() {
                        // Animation complete.
                    });
               } 
            }

            function hideAssignedMarkers(hideassigned) {
                if(hideassigned)
                    $scope.$parent.vm.selectedStatus = [{id: "Unassigned"}];
                else
                    $scope.$parent.vm.selectedStatus = [{id: "All"}];

                $scope.$parent.vm.statusfilter();
            }

            omapvm.removeSelectedOrder = function(index) {
                omapvm.selectedorders.splice(index,1);
            }

            omapvm.assign = function(user) {
                $scope.$parent.vm.assignorder(omapvm.selectedorders, user);
                omapvm.startorstopassign();
            }

            omapvm.markasDelivered = function(){
                $scope.$parent.vm.markasDelivered(omapvm.selectedorders);
                omapvm.startorstopassign();
            }

            omapvm.nolocationorderclicked = function(ord) {
                if(omapvm.isassginclicked == true && ord.deviceid == null && ord.status == null) {
                    if(omapvm.selectedorders.indexOf(ord) < 0)
                            omapvm.selectedorders.push(ord);
                }
                else if(omapvm.isassginclicked == false) {
                    utility.setOrderSelected(ord);
                    $location.path('/order');
                }
            }

            function setGoogleMaps(){
                uiGmapGoogleMapApi.then(function(maps) {
                    maps.visualRefresh = true;
                    infowindow = new google.maps.InfoWindow({
                        content: ''
                    });
                });

                uiGmapIsReady.promise(1).then( function(instances) {
                mapinstance = instances[0].map;
                omapvm.mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
                
                addListeners();

                }, function(error){
                    utility.errorlog(error);
                    window.location.reload();
                });
            }
            
            var shiftPressed = false;
            $(window).keydown(function (evt) {
                if($scope.$parent.vm.hasunassignorders == true) {
                    if (evt.which === 16) { // shift
                        shiftPressed = true;
                        
                        //Open assign
                        var mapPos = parseInt($('.assignoption').css('right'), 10);
                        if (mapPos < 0) {
                            omapvm.isassginclicked = true;
                            selecting = true;
                            hideAssignedMarkers(true);
                            $('.assignoption').animate({
                                right: 0
                            }, 458, 'swing', function() {
                                // Animation complete.
                            });
                            utility.applyscope($scope);
                        }
                    }
                }
            }).keyup(function (evt) {
                if (evt.which === 16) { // shift
                    shiftPressed = false;
                }
            });
                
            function addListeners() {

                //This event is fired when the map becomes idle after panning or zooming.
                google.maps.event.addListener(mapinstance, 'idle', function() {
                    var zoomLevel = mapinstance.getZoom();
                    if(zoomLevel >= 16) 
                        omapvm.docluster = false;
                    else
                        omapvm.docluster = true;
                    
                });

                if($scope.$parent.vm.showassign == true) {
                    google.maps.event.addListener(mapinstance, 'mousemove', function (e) {
                        if (mouseIsDown && (selecting || gribBoundingBox != null)) {
                            if (gribBoundingBox !== null) // box exists
                            {         
                                var newbounds = new google.maps.LatLngBounds(mouseDownPos,null);
                                newbounds.extend(e.latLng);    
                                gribBoundingBox.setBounds(newbounds); // If this statement is enabled, I lose mouseUp events

                            } else // create bounding box
                            {
                                gribBoundingBox = new google.maps.Rectangle({
                                    map: mapinstance,
                                    bounds: null,
                                    fillOpacity: 0.15,
                                    strokeWeight: 0.9,
                                    clickable: false
                                });
                            }
                        }
                    });

                    google.maps.event.addListener(mapinstance, 'mousedown', function (e) {
                        if (selecting && shiftPressed) {
                            mouseIsDown = 1;
                            mouseDownPos = e.latLng;
                            mapinstance.setOptions({
                                draggable: false
                            });
                        }
                    });

                    google.maps.event.addListener(mapinstance, 'mouseup', function (e) {
                        if (mouseIsDown && (selecting || gribBoundingBox != null)) {
                            mouseIsDown = 0;
                            if (gribBoundingBox !== null) // box exists
                            {
                                var boundsSelectionArea = new google.maps.LatLngBounds(gribBoundingBox.getBounds().getSouthWest(), gribBoundingBox.getBounds().getNorthEast());
                                var markers = $scope.$parent.vm.filterOrders;

                                for (var key in markers) { // looping through my Markers Collection 
                                    //if (boundsSelectionArea.contains(markers[key].marker.getPosition())) 
                                    if (gribBoundingBox.getBounds().contains(new google.maps.LatLng( markers[key].latitude, markers[key].longitude))){
                                        if(markers[key].deviceid == null && markers[key].status == null && _.filter(omapvm.selectedorders, function(ord){return ord.ordernumber == markers[key].ordernumber}).length == 0)
                                                omapvm.selectedorders.push(markers[key]);
                                    } 
                                }

                                gribBoundingBox.setMap(null); // remove the rectangle
                            }
                            shiftPressed = false;
                            gribBoundingBox = null;
                            $("#btn").css("color","black");
                        }

                        mapinstance.setOptions({
                            draggable: true
                        });
                        //stopDraw(e);
                    });
                }
            }

            $rootScope.$on('orders:map', function(event, data) {
                omapvm.markers = [];
                for(var i=0 ;i< data.orders.length; i++) {
                    var zip = (data.orders[i].zip != null && data.orders[i].zip != undefined && data.orders[i].zip != "" ? data.orders[i].zip: parseAddress(data.orders[i].address).zip);
                    var latandlng = zipcodes[zip];
                    var latlngsplit = latandlng != null && latandlng != undefined ? latandlng.split(" ") : [];
                    omapvm.markers.push({ 
                        latitude: latlngsplit.length == 2 ? latlngsplit[0] : null, 
                        longitude: latlngsplit.length == 2 ? latlngsplit[1] : null, 
                        title: data.orders[i].ordernumber, 
                        id : data.orders[i].ordernumber,
                        options: {
                            labelContent: data.orders[i].ordernumber, 
                            labelClass: 'tm-marker-label',
                            icon: 'assets/images/greenmarker.png',
                            labelAnchor: '22 0'
                        } 
                    });
                }
                utility.applyscope($scope);
                console.log(omapvm.markers);
                setGoogleMaps();
            });

            $rootScope.$on('search:location', function (event, data) {
                omapvm.map.center.latitude = data.lat;
                omapvm.map.center.longitude = data.lng;
                utility.applyscope($scope);
            });
        }
    })();
});