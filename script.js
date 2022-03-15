var mediaType = 'photo';

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
	gbRequest("./user?user="+JSON.stringify(JSON.parse(user)), 0, false, "GET");
}

function gbDidFailGetUser ( errorMessage)
{
	alert( "You're not logged in the app.");
}

function gbDidSuccessGetMedia ( data, fileUrl )
{
	var fileUrlEncoded = encodeURIComponent(fileUrl);
	if (mediaType === 'video') {
		gb.location.href = "video?fileUrl="+fileUrlEncoded;
	} else {
		gb.location.href = "photo?fileUrl="+fileUrlEncoded;
	}
}

function gbDidFailGetMedia ( errorMessage )
{
	setTimeout(function() { alert(errorMessage); }, 500);
}

function gbGetUserInfo() {
	return gbUserInfo;
}

function alertAppInfo() {
	var s = "Platform : " + gbUserInfo.platform + "\n";
	s += "App version : " + gbUserInfo.binaryVersion + "\n";
	s += "GoodBarber engine version : " + gbUserInfo.gbVersion + "\n";
	s += "OS version : " + gbUserInfo.osVersion + "\n";
	s += "Device : " + gbUserInfo.deviceCode + "\n";
	s += "Language : " + gbUserInfo.language;
	alert(s);
}
