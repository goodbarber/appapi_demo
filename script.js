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
	if (mediaType === 'video') {
		document.location.href = "./video";
	} else {
		document.location.href = "./photo";
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

function alertSetPreference() {
	var myPref = prompt("Enter a value:");
	if (myPref != null) {
		gbSetPreference("myKey", myPref);
	}
}

function gbDidSuccessGetPreference(key, value) {
	if (key == "myKey") {
		if (value == null || value == "") {
			alert("No preference set.");
		} else {
			alert("Your preference set is " + value + ".");
		}
	}
}
