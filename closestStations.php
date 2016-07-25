<?php

include("basics.php");

$lat = strval(floatval(GET("lat", "exit")));
$lon = strval(floatval(GET("lon", "exit")));

$result = SQL("SELECT id, name, ACOS(SIN(latitude * PI() / 180) * SIN(" . $lat . " * PI() / 180) + COS(latitude * PI() / 180) * COS(" . $lat . " * PI() / 180) * COS(" . $lon . " * PI() / 180 - longitude * PI() / 180)) * 6371000 AS distance, latitude AS lat, longitude AS lon FROM `point` WHERE latitude != 999.999999 AND longitude != 999.999999 ORDER BY distance ASC LIMIT 20;");

echo json_encode($result);

?>