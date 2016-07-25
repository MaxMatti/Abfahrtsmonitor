<?php

include("basics.php");

$query = mysql_real_escape_string(GET("q", "exit"));
$lat = strval(floatval(GET("lat")));
$lon = strval(floatval(GET("lon")));

if ($lat && $lon) {
	$result = SQL("SELECT id, name, ACOS(SIN(latitude * PI() / 180) * SIN(" . $lat . " * PI() / 180) + COS(latitude * PI() / 180) * COS(" . $lat . " * PI() / 180) * COS(" . $lon . " * PI() / 180 - longitude * PI() / 180)) * 6371000 AS distance, latitude AS lat, longitude AS lon FROM `point` WHERE LOWER(`name`) LIKE LOWER('%" . $query . "%') OR LOWER(`searchstring`) LIKE LOWER('%" . $query . "%') ORDER BY distance ASC LIMIT 20;");
} else {
	$result = SQL("SELECT id, name, latitude AS lat, longitude AS lon FROM `point` WHERE LOWER(`name`) LIKE LOWER('%" . $query . "%') OR LOWER(`searchstring`) LIKE LOWER('%" . $query . "%') LIMIT 20;");
}

echo json_encode($result);

?>