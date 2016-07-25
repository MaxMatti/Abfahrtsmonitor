var positionWatcher, positionAvailable, positionStatus, currentPosition, distanceThreshold, db;

var stations = Array();

function load() {
	initStationList();
	initPositionWatcher();
	initIndexedDB();
}

function initIndexedDB() {
	var DBOpenRequest = window.indexedDB.open("stations", 1);
	DBOpenRequest.addEventListener("success", function (e) { db = e.target.result; }, true);
	DBOpenRequest.addEventListener("error", function (e) { displayMessage("Could not initialize offline storage.\nError-Code: " + e.target.errorCode) }, true);
	DBOpenRequest.addEventListener("upgradeneeded", upgradeDB, true);
}

function upgradeDB(e) {
	db = e.target.result;
	var objectStore = db.createObjectStore("stations", { keyPath: "id" });
	objectStore.createIndex("name", "name", { unique: false });
	objectStore.createIndex("lat", "lat", { unique: false });
	objectStore.createIndex("lon", "lon", { unique: false });
	objectStore.transaction.addEventListener("complete", function (e) { db = e.target.result; }, true);
}

function refillStationDB(stations) {
	var transaction = db.transaction(["stations"], "readwrite");
	var objectStore = transaction.objectStore("stations");
	for (var i = 0; i < stations.length; i++) {
		objectStore.put(stations[i]);
	}
}

function initStationList() {
	var title = document.createElement("div");
	title.className = "title";
	var span = document.createElement("span");
	span.appendChild(document.createTextNode("Haltestellen"));
	title.appendChild(span);

	var text = document.createElement("input");
	text.type = "text";
	text.id = "searchbox";
	text.placeholder = "Suche";
	text.addEventListener("input", searchStation, true);
	var search = document.createElement("div");
	search.className = "search";
	search.appendChild(text);

	var list = document.createElement("div");
	list.className = "list";

	var elem = document.createElement("div");
	elem.id = "displaystationlist";
	elem.appendChild(title);
	elem.appendChild(search);
	elem.appendChild(list);
	document.body.appendChild(elem);
	title.addEventListener("click", function (elem) { return function (e) { elem.classList.toggle("collapsed"); }; } (elem), true);
}

function searchStation(e) {
	var request = new XMLHttpRequest();
	request.addEventListener("load", updateCurrentStations, true);
	request.addEventListener("error", offlineMode, true);
	request.addEventListener("abort", offlineMode, true);
	if (currentPosition) {
		request.open("GET", "searchStation.php?q=" + encodeURIComponent(e.currentTarget.value) + "&lat=" + encodeURIComponent(currentPosition.coords.latitude) + "&lon=" + encodeURIComponent(currentPosition.coords.longitude), true);
	} else {
		request.open("GET", "searchStation.php?q=" + encodeURIComponent(e.currentTarget.value), true);
	}
	request.send();
}

function initPositionWatcher() {
	if (navigator.geolocation) {
		var positionOptions = {enableHighAccuracy: false, maximumAge: 30000, timeout: 27000};
		positionWatcher = navigator.geolocation.watchPosition(findClosestStations, processNoPosition, positionOptions);
	}
}

function processNoPosition(error) {
	positionAvailable = false;
	positionStatus = "Could not get current location.\nError: ";
	if (error.code == 1) {
		positionStatus += "No permissions.";
	} else if (error.code == 2) {
		positionStatus += "Position not available.";
	} else if (error.code == 3) {
		positionStatus += "Took too long to detect position.";
	} else {
		positionStatus += "Unknown Error.";
	}
	displayMessage(positionStatus);
}

function findClosestStations(position) {
	if (currentPosition == null || distance(position.coords.latitude, position.coords.longitude, currentPosition.coords.latitude, currentPosition.coords.longitude) > distanceThreshold) {
		var request = new XMLHttpRequest();
		request.addEventListener("load", updateCurrentStations, true);
		request.addEventListener("error", offlineMode, true);
		request.addEventListener("abort", offlineMode, true);
		request.open("GET", "closestStations.php?lat=" + encodeURIComponent(position.coords.latitude) + "&lon=" + encodeURIComponent(position.coords.longitude), true);
		request.send();
		currentPosition = position;
		positionStatus = "updating";
		distanceThreshold = 2000;
		positionAvailable = true;
	}
}

function offlineMode(e) {
	if (!document.getElementById("offlineMode")) {
		displayMessage("Seems like the network is not available.\nGot " + db.transaction("stations").objectStore("stations").index("name").count() + " stations in offline cache.");
	}
	askForDisplayStations(null);
}

// Magic incantation formula from
// http://www.movable-type.co.uk/scripts/latlong.html
function distance(lat1, lon1, lat2, lon2) {
	return Math.acos(Math.sin(lat1.toRadians()) * Math.sin(lat2.toRadians()) + Math.cos(lat1.toRadians()) * Math.cos(lat2.toRadians()) * Math.cos((lon2-lon1).toRadians())) * 6371e3;
}

// used in distance(); from external source
Number.prototype.toRadians = function() {
	return this * Math.PI / 180;
}

function updateCurrentStations(event) {
	if (!event.target || !event.target.response) {
		console.log(event);
		return;
	}
	if (document.getElementById("offlineMode")) {
		document.getElementById("offlineMode").parentNode.removeChild(document.getElementById("offlineMode"));
	}
	if (event.target.response.length > 0) {
		var stations;
		try {
			stations = JSON.parse(event.target.response);
		} catch (e) {
			console.log("Error parsing JSON from current station request: " + e.message);
			console.log(event.target.response);
			askForDisplayStations(null);
			return;
		}
		if (stations.length > 1 && currentPosition && (currentPosition.coords.accuracy < stations[0].distance / 2 && (stations[0].distance < stations[1].distance / 4 || stations[0].distance < stations[1].distance - 1000))) {
			askForDisplayStations(Array(stations[0]));
		}
		askForDisplayStations(stations);
		refillStationDB(stations);
	} else {
		console.log("Error parsing JSON from current station request: Response-Body is 0 bytes long.");
		askForDisplayStations(null);
	}
}

function askForDisplayStations(stations) {
	var list = document.querySelector("div#displaystationlist > div.list");

	for (var i = 0; i < list.children.length; i++) {
		if (!list.children[i].classList.contains("selected")) {
			list.removeChild(list.children[i]);
			i--;
		}
	}

	loop1:
	for (var i = 0; i < Math.min(stations.length, 10); i++) {
		loop2:
		for (var j = 0; j < document.getElementById("displaystationlist").children.length; j++) {
			if (document.getElementById("displaystationlist").children[j].dataset["stationID"] == stations[i]["id"]) {
				continue loop1;
			}
		}

		var span1 = document.createElement("span");
		span1.innerHTML = stations[i]["name"];

		var span2 = document.createElement("span");
		if (parseInt(stations[i]["distance"]).toString() != "NaN") {
			span2.innerHTML = "(" + parseInt(stations[i]["distance"]) + "m)";
		} else {
			span2.innerHTML = "";
		}

		var div = document.createElement("div");
		div.className = "item";
		div.addEventListener("click", toggleStation, true);
		div.dataset["stationID"] = stations[i]["id"];
		div.appendChild(span1);
		div.appendChild(span2);

		list.appendChild(div);
	}

	if (document.getElementById("displaystationlist").classList.contains("collapsed")) {
		document.getElementById("displaystationlist").classList.remove("collapsed");
	}
}

function toggleStation(e) {
	e.currentTarget.classList.toggle("selected");
	updateStationDepartures();
}

function updateStationDepartures() {
	var divs = document.querySelectorAll("div#displaystationlist > div.list > div.item");
	var current;
	for (var i = 0; i < divs.length; i++) {
		if (divs[i].classList.contains("selected")) {
			if (document.getElementById("station" + divs[i].dataset["stationID"])) {
				current = document.getElementById("station" + divs[i].dataset["stationID"]);
			} else {
				current = document.createElement("div");
				current.className = "stationDepartures";
				current.id = "station" + divs[i].dataset["stationID"];
				var interval = window.setInterval(function (e) { return function () { updateStation(e); }; } (current), 10000);
				current.dataset["interval"] = interval;
				var request = db.transaction("stations").objectStore("stations").get(current.id.substr(7));
				request.onsuccess = function (current) { return function (e) { current.dataset["stationName"] = e.target.result.name; updateStation(current) }; } (current);
				request.onerror = function (current) { return function (e) { window.clearTimeout(current.dataset["interval"]); current.parentNode.removeChild(current); }; } (current);
				document.body.appendChild(current);
			}
		} else if (document.getElementById("station" + divs[i].dataset["stationID"])) {
			document.getElementById("station" + divs[i].dataset["stationID"]).parentNode.removeChild(document.getElementById("station" + divs[i].dataset["stationID"]));
		}
	}
}

function updateStation(station) {
	var divs = document.querySelectorAll("div#displaystationlist > div.list > div.item.selected");
	var quitting = true;
	for (var i = 0; i < divs.length; i++) {
		if (station.id == "station" + divs[i].dataset["stationID"]) {
			quitting = false;
			break;
		}
	}
	if (quitting) {
		window.clearTimeout(station.dataset["interval"]);
		station.parentNode.removeChild(station);
		return;
	}
	station.classList.add("loading");

	if (station.children.length == 0) {
		var span = document.createElement("span");
		span.appendChild(document.createTextNode(station.dataset["stationName"].toString()));
		var title = document.createElement("div");
		title.className = "title";
		title.appendChild(span);
		station.appendChild(title);
		title.addEventListener("click", function (station) { return function (e) { station.classList.toggle("collapsed"); }; } (station), true);
		var departureHolder = document.createElement("div");
		departureHolder.className = "list";
		station.appendChild(departureHolder);
	}
	var request = new XMLHttpRequest();
	request.addEventListener("load", function (station) { return function (e) { fillStation(e, station); }; } (station), true);
	request.addEventListener("error", offlineMode, true);
	request.addEventListener("abort", offlineMode, true);
	request.open("GET", "/dvbapi/abfahrtsmonitor/Abfahrten.do?ort=Dresden&hst=" + encodeURIComponent(station.dataset["stationName"]) + "&vz=0&lim=8");
	request.send();
}

function fillStation(event, station) {
	if (!event.target || !event.target.response) {
		console.log(event);
		return;
	}
	if (document.getElementById("offlineMode")) {
		document.getElementById("offlineMode").parentNode.removeChild(document.getElementById("offlineMode"));
	}
	if (event.target.response.length > 0) {
		var departures;
		try {
			departures = JSON.parse(event.target.response);
		} catch (e) {
			console.log("Error parsing JSON from station departure request: " + e.message);
			console.log(event.target.response);
			return;
		}
		if (station.children.length > 1) {
			station.removeChild(station.children[1]);
		}
		var departureHolder = document.createElement("div");
		departureHolder.className = "list";
		for (var i = 0; i < departures.length; i++) {
			var span = document.createElement("span");
			span.appendChild(document.createTextNode(departures[i][0] + " nach " + departures[i][1] + (departures[i][2].length > 0 ? " in " + departures[i][2] + "min." : " jetzt.")));
			span.className = "item";
			var elem = document.createElement("div");
			elem.className = "item";
			elem.appendChild(span);
			departureHolder.appendChild(elem);
		}
		station.appendChild(departureHolder);
	} else {
		console.log("Error parsing JSON from station departure request: Response-Body is 0 bytes long.");
	}
}

function displayMessage(message, id = "", backgroundColor = "#eed222", color = "#293542", timeout = -1) {
	var popup = document.createElement("div");
	popup.className = "popup";
	popup.style.color = color;
	popup.style.backgroundColor = backgroundColor;
	popup.appendChild(document.createTextNode(message));
	if (id.length > 0) {
		popup.id = id;
	}
	if (timeout > 0) {
		window.setTimeout(function (popup) { return function() { removePopup(popup); }; } (popup), timeout);
	} else if (timeout == -1) {
		var btn = document.createElement("button");
		btn.innerHTML = "Ok";
		btn.addEventListener("click", function (popup) { return function(e) { removePopup(popup); }; } (popup), true);
		popup.appendChild(btn);
	}
	if (!document.getElementById("warnings")) {
		var warnings = document.createElement("div");
		warnings.id = "warnings";
		document.body.insertBefore(warnings, document.body.children[0]);
	}
	document.getElementById("warnings").appendChild(popup);
}

function removePopup(popup) {
	if (popup.parentNode.id == "warnings") {
		document.getElementById("warnings").removeChild(popup);
		if (document.getElementById("warnings").children.length == 0) {
			document.getElementById("warnings").parentNode.removeChild(document.getElementById("warnings"));
		}
	} else {
		popup.parentNode.removeChild(popup);
	}
}

window.addEventListener("load", load, true);