<?php

include("basics.php");

$id = mysql_real_escape_string(GET("id", "exit"));
$lat = strval(floatval(GET("lat")));
$lon = strval(floatval(GET("lon")));
if ($lat && $lon) {
	$result = SQL("SELECT id, name, ACOS(SIN(latitude * PI() / 180) * SIN(" . $lat . " * PI() / 180) + COS(latitude * PI() / 180) * COS(" . $lat . " * PI() / 180) * COS(" . $lon . " * PI() / 180 - longitude * PI() / 180)) * 6371000 AS distance, latitude AS lat, longitude AS lon FROM `point` WHERE name = '" . $id . "' LIMIT 1;");
} else {
	$result = SQL("SELECT id, name, latitude AS lat, longitude AS lon FROM `point` WHERE name = '" . $id . "' LIMIT 1;");
}

echo json_encode($result);

?>