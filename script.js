var demoSectionId = 'YOUR_SECTION_ID';

function gbDidSuccessGetLocation ( lat, long )
{
	var s = 'Your Location : \n';
	s += 'Latitude : ' + lat + '\n';
	s += 'Longitude : ' + long + '\n';
	alert(s);
}

function gbDidFailGetLocation ( errorMessage )
{
	alert( "You have to activate your geolocation settings" );
}

function gbDidSuccessGetTimezoneOffset ( offset )
{
	alert( "Your timezone offset : \n" + offset);
}

function gbDidSuccessGetUser ( user )
{
	gbNavigatePush('user', { 'user' : JSON.stringify(JSON.parse(user)) });
}

function gbDidFailGetUser ( errorMessage)
{
	alert( "You're not logged in the app.");
}

function gbDidSuccessGetMedia ( data, fileUrl )
{
	if (fileUrl.indexOf('mp4') > -1) {
		gbNavigatePush('video', { 'fileUrl' : fileUrl });
	} else {
		gbNavigatePush('photo', { 'fileUrl' : fileUrl });
	}
}

function gbDidFailGetMedia ( errorMessage )
{
	setTimeout(function() { alert(errorMessage); }, 500);
}

function gbGetUserInfo() {
	if (gbDevMode) {
		var info = {};
		info['platform'] = "ios";
		info['binaryVersion'] = '1.0';
		info['gbVersion'] = '5000';
		info['osVersion'] = 'iOS10';
		info['deviceCode'] = 'iPhone7,1';
		info['language'] = 'fr';

		return info;
	} else {
		return gbUserInfo;
	}
}

function alertAppInfo() {
	if (gbDevMode) {
		gbUserInfo = gbGetUserInfo();
	}

	var s = "Platform : " + gbUserInfo.platform + "\n";
	s += "App version : " + gbUserInfo.binaryVersion + "\n";
	s += "GoodBarber engine version : " + gbUserInfo.gbVersion + "\n";
	s += "OS version : " + gbUserInfo.osVersion + "\n";
	s += "Device : " + gbUserInfo.deviceCode + "\n";
	s += "Language : " + gbUserInfo.language;
	alert(s);
}