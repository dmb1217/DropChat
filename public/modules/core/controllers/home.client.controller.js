'use strict';

//global variables
var welcomewindow, //initial welcoming window
	previouswindow,//window that a user gets when they click socket link
	infowindow,    //standard window prompting for input
	messagewindow, //window when clicking a marker on the map
	currentPos,
	map,
	hasPosted,
	geocoder,
	state,
	city,
	count;

angular.module('core').controller('HomeController', ['$scope', 'Authentication', '$stateParams', 'Posts', '$location', 'Socket',
	function($scope, Authentication, stateParams, Posts, $location, Socket) {
		$scope.authentication = Authentication;
		$scope.create = function(){
			var post = new Posts({
				name: Authentication.user.username,
				message: $scope.message,
				lat: currentPos.lat(),
				lon: currentPos.lng()
			});
			//close a message window if one is open
			messagewindow.close();
			//save the post
			post.$save(function(response) {
				//reset the text in the box to empty for next message
				$scope.message = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
			
		};
		//if user is logged in
		if($scope.authentication.user){
			//listen with socketio for a user to drop a message
			Socket.on('post.created', function(post) {
				//if post isn't garbage
				if(typeof post != "undefined"){
					//get position of the posted marker in GMap friendly type
			        var pos = new google.maps.LatLng(post.lat, post.lon);
			        //standard message markup
			        var message = 
		  					'<b>'+post.name + '</b> says:'+
		  					'<br /><span style="font-size:11">'+post.message+'</span>';
		  			//this window will be what a user sees on socket click
		  			var previouswindow = new google.maps.InfoWindow();
		  			previouswindow.setContent(message);
		  			//if the posted message is from a different user
		  			if(post.name != $scope.authentication.user.username){
				        var JustDroppedMarker = new google.maps.Marker({
			        		position: pos,
			        		map: map,
			        		//give it the drop animation
			        		animation: google.maps.Animation.DROP,
			        		icon: "http://www.crete.tournet.gr/components/com_articlecoords/map/marker_blue.png"
			        	});
			    	} else {
			    		 //just silently put the marker on the map
			    		 var JustDroppedMarker = new google.maps.Marker({
			        		position: pos,
			        		map: map,
			        		icon: "http://www.crete.tournet.gr/components/com_articlecoords/map/marker_blue.png"
			        	});
			    	}
			    	//marker definition for asynchronous markers
		        	google.maps.event.addListener(JustDroppedMarker, 'click', function(){
		        		previouswindow.open(map, JustDroppedMarker);
		        		//close everything else!
		        		messagewindow.close();
		        		welcomewindow.close();
		        		infowindow.close();
		        	});
		        	//close the previous window
		        	previouswindow.close();
		        	//set up the markup for the toast message at the top
			        var html = '<b>'+post.name+'</b> just dropped a message <span id="MarkerLoc">here</span>.';
			        $("#toast").html(html);
				    $("#toast").fadeIn('slow');
	     			$("#toast").delay('10000'); //10 seconds
	     			$("#toast").fadeOut('slow');
	     			//listen for a click to the 'here' link in the toast message
	     			$("#MarkerLoc").click(function(){
	     				//navigate the map to that position
	     				map.panTo(pos);
	     				//open the window associated with that marker
	     				previouswindow.open(map, JustDroppedMarker);
	     			});
				}
			});
		}
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
    		'<input type="submit" value="Submit" id="submit" class="btn"/>'+
    	'</form>';
    /*
    it's necessary to compile it here since angular doesn't digest
    directives written in a javascript string. 
    */
    var compiled = $compile(contents)($scope);
    //this window contains the input form
    var infowindow = new google.maps.InfoWindow();
    infowindow.setContent(compiled[0]);
    //when the ng-map directive is completed
    $scope.$on('mapInitialized', function initMap(evt, evtMap) {
    	//map handle
	  	map = evtMap;
	  	//add it to the scope
	  	$scope.map = map;
	  	//if the user gave us permission to use location services
	  	if(navigator.geolocation) {
	  		//get position
    		navigator.geolocation.getCurrentPosition(function(position) {
    			//store it
      			var pos = new google.maps.LatLng(position.coords.latitude,
                                       position.coords.longitude);
      				//show the welcome window
      				if($scope.authentication.user.displayName && !welcomewindow && !hasPosted){
 					welcomewindow = new google.maps.InfoWindow({
			 			map: map,
			 			content: welcomeContents,
			 			position: pos 
		 			});
 					}
 				//center the map over the coordinates (where the welcomewindow will be)
     			map.setCenter(pos);
    			}, 
    			function() {
    			//user denied us geolocation
      			handleNoGeolocation(true);
   				});
  		} else {
    		//browser doesn't support geolocation
   			handleNoGeolocation(false);
  		}
		
	  	//create the search box and link it to the HTML element.
	  	var input = (document.getElementById('pac-input'));
	  	//this searchbox is made useful through Google Places API
	  	var searchBox = new google.maps.places.SearchBox((input));
	  	//onChange event
	  	google.maps.event.addListener(searchBox, 'places_changed', function() {
	  		//get array of places
	    	var places = searchBox.getPlaces();
	    	//if we have no places, do nothing
		    if (places.length == 0) { return; }
		    //get nearby zones
		    var bounds = new google.maps.LatLngBounds();
		    //loop through the places
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
	  		//go there as accurately as possible
	  		map.fitBounds(bounds);
		});
		//good ol' counter
	  	var i;
	  	//our primary window for displaying marker messages
	  	messagewindow = new google.maps.InfoWindow;
	  	var posts = Posts.query(function(){
	  		//console.log(posts); will return an object with lots of goodies
	  		//for each marker that's been dropped by a user:
	  		for(i=0;i<posts.length;i++){
	  			//get the position of the marker
	  			var position = new google.maps.LatLng(posts[i]['lat'], posts[i]['lon']);
	  			//if there's actually a post under that position
	  			if (posts[i]['lat'] != 0 && posts[i]['lon'] != 0){
	  				var message = 
		  					'<b>'+posts[i]['name'] + '</b> says:'+
		  					'<br /><span style="font-size:11">'+posts[i]['message']+'</span>';
		  			//drop the marker with the message attached
	  				var marker = new google.maps.Marker({
	  					position: position,
	  					map: map,
	  					animation: google.maps.Animation.DROP,
	  					icon: "http://www.crete.tournet.gr/components/com_articlecoords/map/marker_blue.png",
	  					html: message
	  				})
	  				//listen for a click on it to actually show the window
	  				google.maps.event.addListener(marker, 'click', function(marker, i){
		  				messagewindow.setContent(this.html);
		  				messagewindow.open(map, this);
		  				welcomewindow.close();
	  				});
	  			}
	  		}
	  	});
		//if a user is logged in a clicks the map
     	$scope.placeMarker = function(e) {
     		if($scope.authentication.user){
     			//throw a marker down
	        	var marker = new google.maps.Marker({
	        		position: e.latLng,
	        		map: map,
	        		animation: google.maps.Animation.DROP,
	        		icon: "http://www.crete.tournet.gr/components/com_articlecoords/map/marker_blue.png"
	        	});
	        	//open our input form window
	        	infowindow.open(map, marker)
	        	//if the user closes the input form, delete the marker
	        	google.maps.event.addListener(infowindow, 'closeclick', function(){
	        		marker.setMap(null);
	        	});
	        	//if the user clicks off of the form, delete the marker
	        	google.maps.event.addListener(map, 'click', function(){
	        		marker.setMap(null);
	        	});
	        	//close windows if they're open
	        	welcomewindow.close();
	        	messagewindow.close();
	        	//storing this global variable for later use
	        	currentPos=marker.position;
	        	//listen for a click on that submit button to close our form window
	        	$("#submit").click(function(){
	        		infowindow.close();
	        	});
        	} else {
        		//if user isn't logged in, display it in the toast message
        		$("#toast").html("You must <a href=http://localhost:3000/#!/signup>register</a> before dropping messages!");
        		$("#toast").fadeIn('slow');
     			$("#toast").delay('5000');
     			$("#toast").fadeOut('slow');
        	}
      	};
    });
	function handleNoGeolocation(errorFlag) {
		//default the map to UCF if we can't use geolocation
		var options = {
			map: map,
			position: new google.maps.LatLng(28.60, -81.20),
			content: welcomeContents
		};
		if($scope.authentication.user.displayName && !hasPosted) welcomewindow = new google.maps.InfoWindow(options);
		map.setCenter(options.position);
	}
});
