/*
*  GBJSTK.js
*  GoodBarber JavaScript ToolKit for Plugins
*
*  Created for Beautiful Apps Plugins by GoodBarber.
*/

class GBError {
    code = 0;
    message = "";
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }
}

function gbCallbackToString(f) {
    return btoa(f.toString());
}

function gbCallback(hash, values) {
    var decoded = atob(hash);
    var fn = new Function('return ' + decoded)(); 
    function caller(otherFunction) {
        otherFunction.apply(null, values);
    }
    caller(fn);
}

var gb = (function() {
	
	var version = "2.0.0";

	/************* Debugging Zone *************/

	/* Var : int gbDebuggingMode
	*  Sets the debugging mode using a system of code values. 
	*  0 : Production mode
	*  1 : Alerts before any request
	*  2 : Alerts before any request + stop requests
	*/
	var gbDebuggingMode = 0,

	/* Var : string gbToken
	*  Initialize the authentification token used in gbRequest();
	*/
	gbToken = gbParam('gbToken');

	/************* Parent platform detection *************/


	gbUserInfo = {};

	/* Var : BOOL gbAngularMode
	*  Switches the URL updates and the form posts to messages to parent iframe - necessary for the plugins to work in the website version.
	*/
	gbAngularMode = false;

	/* Var : BOOL gbDevMode
	*  JUST TO DEVELOP DIRECTLY ON A DESKTOP BROWSER. If you want to dev and test your plugin in a standard web page, this boolean will do the trick.
	*  Once integrated in a plugin section of an app, this will always be false.
	*  DO NOT USE IN PRODUCTION 
	*  true : Development mode
	*  false : Production mode
	*/
	var gbDevMode = !gbAngularMode && !navigator.userAgent.match(/iPhone OS/i) && !navigator.userAgent.match(/iPad/i) && !navigator.userAgent.match(/Android/i);

	/************* Helper Functions *************/

	/** Function: gbPlatformIsIos()
	 * This function allow you to check if the current platform is iOS
	 * @return true if the current plateform is iOS
	 */
	function gbPlatformIsIos()
	{
		return gbUserInfo && gbUserInfo.platform == 'ios';
	}

	/** Function: gbPlatformIsAndroid()
	 * This function allow you to check if the current platform is Android
	 * @return true if the current plateform is Android
	 */
	function gbPlatformIsAndroid()
	{
		return gbUserInfo && gbUserInfo.platform == 'android';
	}

	/** Function : init
	 *  This function initializes communication with the parent PWA (if not already done)
	 */
	function init() 
	{
		if (!gbAngularMode && window.parent) {
			parent.postMessage({url: "goodbarber://init"}, '*');
		}
	}

	/* Function : gbParam
	*  This function returns the value of an argument in location.href.
	*  @param name The name of the argument
	*  @return value
	*/
	function gbParam(name) 
	{
	    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	    if (results) return results[1];
	    return '';
	}

	/* Function : gbIsEmpty
	*  This function tests if an object is empty.
	*  @param obj The action of the form
	*  @return true if the object is empty, false otherwise 
	*/
	function gbIsEmpty ( obj )
	{
	    var name;
	    for ( name in obj )
		{
	        if ( obj.hasOwnProperty ( name ) )
			{
	            return false;
	        }
	    }
	    return true;
	}

	/* Function : gbConstructQueryString
	*  This function construct a query string using the "params" dictionary.
	*  @param params The params to construct the query string
	*  @return The constructed query string
	*/
	function gbConstructQueryString ( params )
	{
		var queryString = "";
		var first = true;
		for ( var key in params )
		{
			if ( params.hasOwnProperty ( key ) )
			{
				if ( !first )
					queryString += "&";
				first = false;
				queryString += key + "=" + params[key];
			}
		}
		return queryString;
	}

	/* Function : gbPostRequest
	*  In native engines and devmode, this function creates a form in document.body and send a POST request to "path" using "getParams" and "postParams".
	*  In Webapp engine, this function delegates its action to the parent window.
	*  @param path The action of the form
	*  @param params The params to send in the request body 
	*/
	function gbPostRequest ( path, getParams, postParams )
	{
	    var shouldRemovePost = false;
	    if (gbPlatformIsIos() && path.startsWith("goodbarber://") && postParams) {
	        shouldRemovePost = true;
	    }
	    
		// As WKWebview doesn't allow anymore access to httpBody, we add as get parameter an id to the request
		if (shouldRemovePost) {
			var date = new Date();
			var timestamp = date.getTime();
			if (!getParams) {
				getParams = {}
			}

			getParams['gbid'] = timestamp;
		}

		var formAction = path;
		if ( !gbIsEmpty ( getParams ) )
			formAction += "?" + gbConstructQueryString ( getParams ); 

		if (gbAngularMode) {
			window.parent.postMessage({url: formAction, params: postParams}, '*');
		} else {
			var form = document.createElement ( "form" );
			form.setAttribute ( "method", "post" );
			form.setAttribute ( "action", formAction );
			for ( var key in postParams )
			{
				if ( postParams.hasOwnProperty ( key ) )
				{
					var hiddenField = document.createElement ( "input" );
					hiddenField.setAttribute ( "type", "hidden" );
					hiddenField.setAttribute ( "name", key );
					hiddenField.setAttribute ( "value", postParams[key] );
					form.appendChild ( hiddenField );
				}
			}
			document.body.appendChild ( form );

			if (gbPlatformIsAndroid())
			{
				Android.post (formAction, JSON.stringify(postParams));
			}
			else 
			{
				if (shouldRemovePost)
				{
					// As WKWebview doesn't allow anymore access to httpBody, we add post params to the dom as hidden
					var postElement = document.createElement('div');
					postElement.setAttribute("class", "gbdata");
					postElement.setAttribute("style", "display: none !important");
					postElement.setAttribute("id", getParams['gbid']);
					var postParamsString = "";
					var i=0;
					for (var key in postParams) {
						if (i>0) {
						    postParamsString += "&";
						}
						postParamsString += key + "=" + postParams[key];
						i++;
					}
					postElement.innerHTML = postParamsString;
		            document.body.appendChild(postElement);
				}
				form.submit ();
			}
		}
	}

	/* Function : gbGetRequest
	*  In native engines, this function launches a navigation to "destination".
	*  In Webapp engine, this function sends the "destination" to parent window with the PostMessage Api
	*  @param path The destination path
	*  @param params (optional) The params to send in the request body 
	*/
	function gbGetRequest ( path, getParams )
	{
		getParams = getParams || {};
		var destination = path;
		if ( !gbIsEmpty ( getParams ) )
			destination += "?" + gbConstructQueryString ( getParams );

		if ( gbDebuggingMode >= 1 )
			alert ( destination );
		
		if ( gbDebuggingMode < 2 ) {
			if (gbAngularMode) {
				window.parent.postMessage({url: destination}, '*');
			} else {
				// Timeout 0 in case of consecutive calls to this method
				window.setTimeout(function (){ document.location.replace ( destination ); }, 0);
			}
		}
	}

	function gbXHRequest ( requestMethod, tag, path, postParams )
	{
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0))
			{
				gbRequestDidSuccess(tag, xhr.responseText, '');
			}
		};
		xhr.open ( requestMethod, path, true );
		xhr.send ( null );
	}

	function gbSendRequest ( resourceUrl, tag, cache, requestMethod, postParams )
	{
		if (gbDevMode && gbToken == '')
		{
			setTimeout(function() { gbSendRequest ( resourceUrl, tag, cache, requestMethod, postParams ) }, 200);
			return;
		}

		postParams = postParams || {};
		requestMethod = requestMethod || "GET";
		
		if ( gbDevMode )
		{
			resourceUrl+= (resourceUrl.match(/\?/g) ? '&' : '?') +'gbToken=' + gbToken;
			gbXHRequest ( requestMethod, tag, resourceUrl, postParams );
		}
		else
		{
			if ( requestMethod == "GET" )
			{
				gbGetRequest ( "goodbarber://request", { "url":encodeURIComponent(resourceUrl), "tag":tag, "cache":cache, "method":requestMethod } );
			}
			else
			{
				gbPostRequest ( "goodbarber://request", { "url":encodeURIComponent(resourceUrl), "tag":tag, "cache":cache, "method":requestMethod }, postParams );
			}
		}
	}


	/************* Website *************/

	/*
	 * The postMessage API is used to communicate between the Website and the plugin.
	 * Messages contain data sent by the website containing a method and sometimes parameters.
	 */
	window.addEventListener("message", function(event) {

		/* Function : gbWebsiteInitPlugin
		 * Initialize the plugin for GB Website
		 */
		function gbWebsiteInitPlugin() {
			gbAngularMode = true;
			gbDevMode = false;

			// Intercept clicks on links in order to call the corresponding method
			var gbCustomLinks = document.getElementsByTagName("a");
			for(var z = 0; z < gbCustomLinks.length; z++) {
				var gbCustomLink = gbCustomLinks[z];
				if (!gbCustomLink.protocol.startsWith('javascript')) {
					gbCustomLink.onclick = function(e){
						e.preventDefault();
						parent.postMessage({url: this.getAttribute("href")}, '*');
						return false;
					};
				}
			}
		}

		/* Function : gbWebsiteSetData
		 * Set a variable with data
		 * @param name The name of the variable
		 * @param value The value of the variable
		 */
		function gbWebsiteSetData(name, value) {
			window[name] = value;
		}

		/* Function : gbWebsiteCallback
		 * Call the callback function asked by the Website if it exists
		 */
		function gbWebsiteCallback(method, args) {
			var callbackFn = window[method];
			if (callbackFn) {
				callbackFn.apply(this, args);
			}
		}

		// if (event.origin != window.document.origin) {
		// 	return;
		// }

		var method;
		var params;
		if (event.data) {
			method = event.data.method;
			params = event.data.params;
		}

		if (method == 'gbWebsiteInitPlugin') {
			gbWebsiteInitPlugin();
		} else if (gbAngularMode == true && method == 'gbWebsiteSetData') {
			gbWebsiteSetData(params[0], params[1]);
		} else if (gbAngularMode == true) {
			// The method is a callback
			gbWebsiteCallback(method, params);
		}

	});

	/************* GoodBarber Plugin API Functions *************/

	/************* [GB Plugin API] HTTP Request Methods *************/

	/* Function : get
	*  Starts a GET request to the url resource, using the "method" method, and passing the "postParams" params if method==POST.
	*  @param resourceUrl The url of the resource to load
	*  @param tag A tag to identify the request
	*  @param cache true if you want to use the app's cache mechanism, false otherwise
	*/
	function get ( url, tag = 0, cache = false)
	{
		return gbSendRequest ( url, tag, cache, "GET", null);
	}

	/* Function : post
	*  Starts a POST request to the url resource, using the "method" method, and passing the "postParams" params if method==POST.
	*  @param resourceUrl The url of the resource to load
	*  @param params HTTP Post Params in your request
	*  @param params HTTP Headers in your request
	*  @param tag A tag to identify the request
	*  @param cache true if you want to use the app's cache mechanism, false otherwise
	*/
	function post ( url, params, headers = {}, tag = 0, cache = false)
	{
		return gbSendRequest ( url, tag, cache, "POST", params);
	}

	/************* [GB Plugin API] Other Methods *************/

	/* Function : share
	*  Ask the user to share a content on a social network.
	*  @param text The text to share
	*  @param link The link to share
	*/
	function share ( text, link )
	{
		text = text || "";
		link = link || "";
		gbGetRequest ( "goodbarber://share", { "text":encodeURIComponent(text), "link":encodeURIComponent(link) } );
	}

	/* Function : getPhoto
	*  Ask the user to take or choose a photo
	*  @param mediaSource The source (camera or library) | values : [all(default)|camera|library]
	*/
	function getPhoto ( mediaSource = "all" )
	{
		mediaSource = mediaSource || "all";
		gbGetRequest ( "goodbarber://getmedia", { "type":"photo", "source":mediaSource } );
	}

	/* Function : getVideo
	*  Ask the user to take or choose a video
	*  @param mediaSource The source (camera or library) | values : [all(default)|camera|library]
	*/
	function getVideo ( mediaSource = "all" )
	{
		mediaSource = mediaSource || "all";
		gbGetRequest ( "goodbarber://getmedia", { "type":"video", "source":mediaSource } );
	}

	/* Function : getLocation
	*  Asks for the user geolocation.
	*/
	function getLocation ()
	{
		function success(position)
		{  
			gbDidSuccessGetLocation ( position.coords.latitude,position.coords.longitude );
		}
		function fail(error)
		{
			switch(error.code) 
			{
				case error.TIMEOUT:
					gbDidFailGetLocation ('Timeout');
					break;
				case error.POSITION_UNAVAILABLE:
					gbDidFailGetLocation ('Position unavailable');
					break;
				case error.PERMISSION_DENIED:
					gbDidFailGetLocation ('Permission denied');
					break;
				case error.UNKNOWN_ERROR:
					gbDidFailGetLocation ('Unknown error');
					break;
			}
		}
		var options = {
		  timeout: 15000
		};

		if ( gbDevMode )
		{
			navigator.geolocation.getCurrentPosition (success, fail, options);
		}
		else
		{
			gbGetRequest ( "goodbarber://getlocation" );
		}
	}

	/* Function : gbGetTimezoneOffset
	* Asks for the time difference between UTC time and local time, in minutes.
	*/
	function getTimezoneOffset ()
	{
		gbGetRequest ( "goodbarber://gettimezoneoffset" );
	}

	/* Function : setPreference
	*  Stores a preference in User Defaults.
	*  @param key The key to store
	*  @param valueString The value to store
	*  @param isGlobal Used to share preference between all plugins of the app. Possible values : 0 or 1.
	*/
	function setPreference ( key, valueString, isGlobal="0" )
	{
		gbGetRequest ( "goodbarber://setpreference", { "key":key, "value":valueString, "global": isGlobal } );
	}

	/* Function : getPreference
	*  Get a preference stored in User Defaults.
	*  @param key The key to get
	*  @param isGlobal Used to get a shared preference between all plugins of the app. Possible values : 0 or 1.
	*/
	function getPreference ( key, isGlobal="0" )
	{
		if ( gbDevMode )
			gbDidSuccessGetPreference ( key, "" );

		gbGetRequest ( "goodbarber://getpreference", { "key":key, "isGlobal": isGlobal } );
	}

	/* Function : getUser
	*  Get the currently connected user. Will call the fail handler gbDidFailGetUser if no user is connected.
	*/
	function getUser ()
	{
		if ( gbDevMode )
			gbDidSuccessGetUser ( { id:0, email:"user@example.com", attribs:{ displayName:"Example User" } } );

		gbGetRequest ( "goodbarber://getuser" );
	}

	/* Function : log
	*  Console log a string. Usefull to log in native iOS with NSLogs
	*/
	function log( log )
	{
		if (gbPlatformIsIos()) 
		{
			gbAlert('Logs', log);
		}
		else 
		{
			console.log(log);
		}
	}

	/* Function : alert
	*  Display an alert
	*/
	function _alert( title, message )
	{
		if (gbPlatformIsIos()) 
		{
			gbGetRequest ( "goodbarber://alert?title=" + encodeURIComponent(title) + '&message=' + encodeURIComponent(message));
		}
		else 
		{
			alert(title + '\n' + message);
		}
	}

	/* Function : print
	*  Print the content of the page
	*/
	function print()
	{
		if (!gbAngularMode) {
	        gbGetRequest ( "goodbarber://print" );
	    } else {
	        window.print();
	    }
	}

	function test() {
		alert("test");
	}

    /************* [GB Plugin API] Storage Methods *************/

	/* Function : setItem
	*  Stores an item in the cache of the app.
	*  @param key The key associated to the item stored.
	*  @param item The item to store in the cache.
	*/
    function setItem( key, item ) {
		var s = JSON.stringify(item);
		gbPostRequest ( "goodbarber://gbsetstorageitem", { "key": key}, { "item": s} );
	}

	/* Function : getItem
	*  Retreive an item stored in the cache of the app.
	*  @param key The key associated to the item stored.
	*  @param callback A callback function that is executed when the item is retreived. The function gets passed one argument: Value which is the item stored.
	*/
	function getItem( key, callback ) {
		var s = gbCallbackToString(callback);
		gbPostRequest ( "goodbarber://gbgetstorageitem", { "key": key}, { "callback": s} );
	}

	/* Function : removeItem
	*  Remove an item stored in the cache of the app.
	*  @param key The key associated to the item stored.
	*/
	function removeItem( key ) {
		gbGetRequest ( "goodbarber://gbremovestorageitem", { "key": key });
	}

	/* Function : clear
	*  Remove all items stored in the cache of the app.
	*/
	function clear() {
		gbGetRequest ( "goodbarber://gbclearstorage", { });
	}

	/* Function : keys
	*  Return a list of keys associated to all the items stored in the cache of the app.
	*  @param callback A callback function that is executed when keys are retreived. The function gets passed one argument: Keys which is the list of keys.
	*/
    function keys(callback) {
		var s = gbCallbackToString(callback);
        gbGetRequest ( "goodbarber://gbstoragekeys", {}, { "callback": callback });
    }

    var storage = {
		setItem: setItem,
		getItem: getItem,
		removeItem: removeItem,
		clear: clear,
        keys: keys
	};


    // public members, exposed with return statement
    return {
    	init: init,
    	version: version,
        storage: storage,
    	get: get,
    	post: post,
    	share: share,
    	getPhoto: getPhoto,
    	getVideo: getVideo,
    	getLocation: getLocation,
    	getTimezoneOffset: getTimezoneOffset,
    	setPreference: setPreference,
    	getPreference: getPreference,
    	getUser: getUser,
    	log: log,
    	alert: _alert,
    	print: print
    };
})();

/************* GoodBarber Plugin API Functions *************/

/************* [GB Plugin API] HTTP Request Methods *************/

/* Function : gbRequest
*  Starts a request to the url resource, using the "method" method, and passing the "postParams" params if method==POST.
*  @param resourceUrl The url of the resource to load
*  @param tag A tag to identify the request
*  @param cache YES if you want to use the app's cache mechanism, NO otherwise
*  @param requestMethod The HTTP method you want to use for the request
*  @param postParams If method==POST, you can pass HTTP Post Params in your request
*/
/*
*  	This function is deprecated
*	You should now use both gb.get() & gb.post() functions
*/
function gbRequest ( resourceUrl, tag, cache, requestMethod, postParams )
{
	if (requestMethod == "POST") {
		return gb.post ( resourceUrl, postParams, tag, cache);
	} else {
		return gb.get ( resourceUrl, tag, cache);
	}
}

/************* [GB Plugin API] Other Methods *************/

/* Function : gbShare
*  Ask the user to share a content on a social network.
*  @param shareText The text to share
*  @param shareLink The link to share
*/
/*
*  	This function is deprecated
*	You should now use the gb.share() function
*/
function gbShare ( shareText, shareLink )
{
	return gb.share ( shareText, shareLink);
}

/* Function : gbGetMedia
*  Ask the user to take or choose a picture/movie.
*  @param mediaType The type of media that you want the user to take or choose | values : [photo(default)|video]
*  @param mediaSource The source (camera or library) | values : [all(default)|camera|library]
*/
/*
*  	This function is deprecated
*	You should now use both gb.get() & gb.post() functions
*/
function gbGetMedia ( mediaType, mediaSource )
{
	mediaType = mediaType || "photo";
	if (mediaType == "photo") {
		return gb.getPhoto(mediaSource);
	} else {
		return gb.getVideo(mediaSource);
	}
}

/* Function : gbGetLocation
*  Asks for the user geolocation.
*/
/*
*  	This function is deprecated
*	You should now use the gb.getLocation() function
*/
function gbGetLocation ()
{
	return gb.getLocation();
}

/* Function : gbGetTimezoneOffset
* Asks for the time difference between UTC time and local time, in minutes.
*/
/*
*  	This function is deprecated
*	You should now use the gb.getTimezoneOffset() function
*/
function gbGetTimezoneOffset ()
{
	return gb.getTimezoneOffset();
}

/* Function : gbSetPreference
*  Stores a preference in User Defaults.
*  @param key The key to store
*  @param valueString The value to store
*  @param isGlobal Used to share preference between all plugins of the app. Possible values : 0 or 1.
*/
/*
*  	This function is deprecated
*	You should now use the gb.setPreference() function
*/
function gbSetPreference ( key, valueString, isGlobal="0" )
{
	return gb.setPreference(key, valueString, isGlobal);
}

/* Function : gbGetPreference
*  Get a preference stored in User Defaults.
*  @param key The key to get
*  @param isGlobal Used to get a shared preference between all plugins of the app. Possible values : 0 or 1.
*/
/*
*  	This function is deprecated
*	You should now use the gb.getPreference() function
*/
function gbGetPreference ( key, isGlobal="0" )
{
	return gb.getPreference(key, isGlobal);
}

/* Function : gbGetUser
*  Get the currently connected user. Will call the fail handler gbDidFailGetUser if no user is connected.
*/
/*
*  	This function is deprecated
*	You should now use the gb.getUser() function
*/
function gbGetUser ()
{
	return gb.getUser();
}

/* Function : gbLogs
*  Console log a string. Usefull to log in native iOS with NSLogs
*/
/*
*  	This function is deprecated
*	You should now use the gb.log() function
*/
function gbLogs( log )
{
	return gb.log(log);
}

/* Function : gbAlert
*  Display an alert
*/
/*
*  	This function is deprecated
*	You should now use the gb.alert() function
*/
function gbAlert( title, message )
{
	return gb.alert(title, message);
}

/* Function : gbPrint
*  Print the content of the page
*/
/*
*  	This function is deprecated
*	You should now use the gb.print() function
*/
function gbPrint()
{
	return gb.print();
}

gb.init();
