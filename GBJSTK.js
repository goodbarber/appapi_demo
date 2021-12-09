/*
*  GBJSTK.js
*  GoodBarber JavaScript ToolKit for Plugins
*
*  Created for Beautiful Apps Plugins by GoodBarber.
*/

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

/** Function : gbInitPWA
 *  This function initializes communication with the parent PWA (if not already done)
 */
function gbInitPWA() 
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

/************* GoodBarber Plugin API Functions *************/

/************* [GB Plugin API] Basic Methods *************/

/* Function : gbMailto
*  Launches the mail Composer.
*  @param to The destination address
*  @param subject (optional) The mail subject
*  @param body The (optional) mail content 
*/
function gbMailto ( to, subject, body )
{
	to = to || "";
	subject = subject || "";
	body = body || "";
	gbGetRequest ( "mailto:" + to, { "subject":encodeURIComponent(subject), "body":encodeURIComponent(body) } );
}

/* Function : gbMaps
*  Launches the Maps native application.
*  @param params The parameters to pass in the query string 
*/
function gbMaps ( params )
{
	params = params || {};
	if ( gbIsEmpty ( params ) )
		gbGetRequest ( "goodbarber://maps?q=" );
	else
		gbGetRequest ( "goodbarber://maps", params );
}

/* Function : gbOpenApp
*  Tests if the current device can handle the URL scheme ("scheme" param), if so opens it, or opens the url ("url" param) otherwise.
*  @param scheme The URL scheme to test
*  @param url The URL to launch otherwise
*/
function gbOpenApp ( scheme, linkUrl )
{
	scheme = scheme || "";
	linkUrl = linkUrl || "";
	gbGetRequest ( "goodbarber://openapp", { "scheme":encodeURIComponent(scheme), "url":encodeURIComponent(linkUrl) } );
}

/* Function : gbGoToSection
*  Goes to the section identified by its "id".
*  @param id The id of the destination section
*/
function gbGoToSection ( id )
{
	gbGetRequest ( "goodbarber://gotosection", { "id":id } );
}

/************* [GB Plugin API] Navigation Methods *************/

/* Function : gbNavigatePush
*  Launch a push navigation between two pages of the plugin.
*  @param page The destination page
*  @param postParams The postParams to give to the destination page
*/
function gbNavigatePush ( page, postParams )
{
	gbPostRequest ( "goodbarber://navigate.push", { "page":page }, postParams );
}

/* Function : gbNavigateModal
*  Launch a modal navigation between two pages of the plugin.
*  @param page The destination page
*  @param postParams The postParams to give to the destination page
*/
function gbNavigateModal ( page, postParams )
{
	gbPostRequest ( "goodbarber://navigate.modal", { "page":page }, postParams );
}

/* Function : gbNavigateBack
*  Launch a back navigation between two pages of the plugin.
*/
function gbNavigateBack ()
{
	gbGetRequest ( "goodbarber://navigate.back" );
}

/************* [GB Plugin API] HTTP Request Methods *************/

/* Function : gbRequest
*  Starts a request to the url resource, using the "method" method, and passing the "postParams" params if method==POST.
*  @param resourceUrl The url of the resource to load
*  @param tag A tag to identify the request
*  @param cache YES if you want to use the app's cache mechanism, NO otherwise
*  @param requestMethod The HTTP method you want to use for the request
*  @param postParams If method==POST, you can pass HTTP Post Params in your request
*/
function gbRequest ( resourceUrl, tag, cache, requestMethod, postParams )
{
	if (gbDevMode && gbToken == '')
	{
		setTimeout(function() { gbRequest ( resourceUrl, tag, cache, requestMethod, postParams ) }, 200);
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

/************* [GB Plugin API] Other Methods *************/

/* Function : gbShare
*  Ask the user to share a content on a social network.
*  @param shareText The text to share
*  @param shareLink The link to share
*/
function gbShare ( shareText, shareLink )
{
	shareText = shareText || "";
	shareLink = shareLink || "";
	gbGetRequest ( "goodbarber://share", { "text":encodeURIComponent(shareText), "link":encodeURIComponent(shareLink) } );
}

/* Function : gbGetMedia
*  Ask the user to take or choose a picture/movie.
*  @param mediaType The type of media that you want the user to take or choose | values : [photo(default)|video]
*  @param mediaSource The source (camera or library) | values : [all(default)|camera|library]
*/
function gbGetMedia ( mediaType, mediaSource )
{
	mediaType = mediaType || "photo";
	mediaSource = mediaSource || "all";
	gbGetRequest ( "goodbarber://getmedia", { "type":mediaType, "source":mediaSource } );
}

/* Function : gbGetLocation
*  Asks for the user geolocation.
*/
function gbGetLocation ()
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
function gbGetTimezoneOffset ()
{
	gbGetRequest ( "goodbarber://gettimezoneoffset" );
}

/* Function : gbSetPreference
*  Stores a preference in User Defaults.
*  @param key The key to store
*  @param valueString The value to store
*  @param isGlobal Used to share preference between all plugins of the app. Possible values : 0 or 1.
*/
function gbSetPreference ( key, valueString, isGlobal="0" )
{
	gbGetRequest ( "goodbarber://setpreference", { "key":key, "value":valueString, "global": isGlobal } );
}

/* Function : gbGetPreference
*  Get a preference stored in User Defaults.
*  @param key The key to get
*  @param isGlobal Used to get a shared preference between all plugins of the app. Possible values : 0 or 1.
*/
function gbGetPreference ( key, isGlobal="0" )
{
	if ( gbDevMode )
		gbDidSuccessGetPreference ( key, "" );

	gbGetRequest ( "goodbarber://getpreference", { "key":key, "isGlobal": isGlobal } );
}

/* Function : gbGetUser
*  Get the currently connected user. Will call the fail handler gbDidFailGetUser if no user is connected.
*/
function gbGetUser ()
{
	if ( gbDevMode )
		gbDidSuccessGetUser ( { id:0, email:"user@example.com", attribs:{ displayName:"Example User" } } );

	gbGetRequest ( "goodbarber://getuser" );
}

/* Function : gbGetUser
*  Console log a string. Usefull to log in native iOS with NSLogs
*/
function gbLogs( log )
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

/* Function : gbGetUser
*  Display an alert
*/
function gbAlert( title, message )
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

/* Function : gbPrint
*  Print the content of the page
*/
function gbPrint()
{
	if (!gbAngularMode) {
        gbGetRequest ( "goodbarber://print" );
    } else {
        window.print();
    }
}

/************* Website *************/

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

/*
 * The postMessage API is used to communicate between the Website and the plugin.
 * Messages contain data sent by the website containing a method and sometimes parameters.
 */
window.addEventListener("message", function(event) {
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

gbInitPWA();
