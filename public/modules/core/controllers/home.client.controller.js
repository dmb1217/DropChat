'use strict';

var welcomewindow,
	infowindow,
	currentPos,
	map,
	hasPosted,
	geocoder,
	state,
	city,
	count;

angular.module('core').controller('HomeController', ['$scope', 'Authentication', '$stateParams', 'Posts', '$location', 'Socket',
	function($scope, Authentication, stateParams, Posts, $location, Socket) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
		
		if($scope.authentication.user){

			Socket.on('post.created', function(post) {
				if(typeof post != "undefined"){
			       
			        $("#toast").html(post.name +" just posted a message!");
				    $("#toast").fadeIn('slow');
	     			$("#toast").delay('5000');
	     			$("#toast").fadeOut('slow');
				}
			    
			});
		}
		$scope.create = function(){
			/*geocoder = new google.maps.Geocoder();
			var latlng = new google.maps.LatLng(currentPos.lat(), currentPos.lng());
			//alert("Else loop" + latlng);
			geocoder.geocode({'latLng': latlng}, function(results, status)
			{
			//alert("Else loop1");
				if (status == google.maps.GeocoderStatus.OK)
				{
					if (results[0]){
						var add=results[0].formatted_address ;
						var value=add.split(",");
						count=value.length;
						state=value[count-2];
						city=value[count-3];
					}
					else{
						alert("address not found");
					}
				}
			});*/
			var post = new Posts({
				name: Authentication.user.username,
				message: $scope.message,
				lat: currentPos.lat(),
				lon: currentPos.lng()
			});

			post.$save(function(response) {
				// Clear form fields
				//location.reload();
     		    
				$scope.message = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
			
		};
	}
]);
angular.module('core').controller('EventArgumentsCtrl', function($scope, $compile, $http, Posts) {
    var welcomeContents = 
	 		'<div style="text-align:center;" id="welcome">'+
				'Welcome, <span style="font-weight: bold">'+$scope.authentication.user.username+'</span>!<br />'+
				'Pick a spot anywhere on the map and begin dropping messages for other people to see!'+
			'</div>';
    var contents = 
    	'<form id="MarkerMessage" ng-submit="create()">'+
    		'<textarea autofocus style="font-family:Roboto" cols="40" rows="3" ng-model="$parent.message" name="message" placeholder="Drop a Message"></textarea>'+
    		'<br />'+
    		'<input type="submit" value="Submit" class="btn"/>'+
    	'</form>';
    //it's necessary to compile it here since angular doesn't digest
    //directives written in a javascript string. 
    var compiled = $compile(contents)($scope);
    var infowindow = new google.maps.InfoWindow();
    infowindow.setContent(compiled[0]);
    $scope.$on('mapInitialized', function initMap(evt, evtMap) {
	  	map = evtMap;
	  	$scope.map = map;
	  	if(navigator.geolocation) {
    		navigator.geolocation.getCurrentPosition(function(position) {
      			var pos = new google.maps.LatLng(position.coords.latitude,
                                       position.coords.longitude);
      				if($scope.authentication.user.displayName && !welcomewindow && !hasPosted){
 					welcomewindow = new google.maps.InfoWindow({
			 			map: map,
			 			content: welcomeContents,
			 			position: pos 
		 			});
 					}

     			map.setCenter(pos);
    			}, 
    			function() {
      			handleNoGeolocation(true);
   				});
  		} else {
    		// Browser doesn't support Geolocation
   			handleNoGeolocation(false);
  		}
		
	  	// Create the search box and link it to the UI element.
	  	var input = (document.getElementById('pac-input'));
	  	//map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
	  	
	  	var searchBox = new google.maps.places.SearchBox((input));
	  	google.maps.event.addListener(searchBox, 'places_changed', function() {
	    	var places = searchBox.getPlaces();
		    if (places.length == 0) { return; }
		    var bounds = new google.maps.LatLngBounds();
    		for (var i = 0, place; place = places[i]; i++) {
	     		var image = {
			        url: place.icon,
			        size: new google.maps.Size(71, 71),
			        origin: new google.maps.Point(0, 0),
			        anchor: new google.maps.Point(17, 34),
			        scaledSize: new google.maps.Size(25, 25)
			    };
	      		bounds.extend(place.geometry.location);
	  		}
	  		map.fitBounds(bounds);
		});
	  	var i,
	  		messagewindow = new google.maps.InfoWindow;
	  	var posts = Posts.query(function(){
	  		//console.log(posts[0]['message']);
	  		//get all of the messages dropped by all users:
	  		for(i=0;i<posts.length;i++){
	  			var position = new google.maps.LatLng(posts[i]['lat'], posts[i]['lon']);
	  			if (posts[i]['lat'] != 0 && posts[i]['lon'] != 0){
	  				var message = 
		  					'<b>'+posts[i]['name'] + '</b> says:'+
		  					'<br /><span style="font-size:11">'+posts[i]['message']+'</span>';
	  				var marker = new google.maps.Marker({
	  					position: position,
	  					map: map,
	  					icon: "http://www.crete.tournet.gr/components/com_articlecoords/map/marker_blue.png",
	  					html: message
	  				})
	  				
	  				google.maps.event.addListener(marker, 'click', function(marker, i){
		  				messagewindow.setContent(this.html);
		  				messagewindow.open(map, this);
		  				welcomewindow.close();
	  				});
	  			}
	  		}
	  	});
     	$scope.placeMarker = function(e) {
     		if($scope.authentication.user){
	        	var marker = new google.maps.Marker({
	        		position: e.latLng,
	        		map: map,
	        		animation: google.maps.Animation.DROP,
	        		icon: "http://www.crete.tournet.gr/components/com_articlecoords/map/marker_blue.png"
	        	});
	        	infowindow.open(map, marker);
	        	google.maps.event.addListener(infowindow, 'closeclick', function(){
	        		marker.setMap(null);
	        	});
	        	google.maps.event.addListener(map, 'click', function(){
	        		marker.setMap(null);
	        	});
	        	welcomewindow.close();
	        	messagewindow.close();
	        	currentPos=marker.position;
	        	//map.panTo(e.latLng);
        	} else {
        		$("#toast").html("You must <a href=http://localhost:3000/#!/signup>register</a> before dropping messages!");
        		$("#toast").fadeIn('slow');
     			$("#toast").delay('5000');
     			$("#toast").fadeOut('slow');
        	}

      	};


    });
	function handleNoGeolocation(errorFlag) {
		var options = {
			map: map,
			position: new google.maps.LatLng(28.60, -81.20),
			content: welcomeContent
		};
		if($scope.authentication.user.displayName && !hasPosted) welcomewindow = new google.maps.InfoWindow(options);
		map.setCenter(options.position);
	}
	
});
