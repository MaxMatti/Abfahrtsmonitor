<?php

//returns a GET-Parameter.
function GET($value, $default = False) {
	if (isset($_GET[$value])) {
		return $_GET[$value];
	} else if ($default == "exit") {
		exit();
	} else {
		return $default;
	}
}

//returns a POST-Parameter.
function POST($value, $default = False) {
	if (isset($_POST[$value])) {
		return $_POST[$value];
	} else if ($default == "exit") {
		exit();
	} else {
		return $default;
	}
}

//performs a SELECT-Query in MySQL and returns the result.
function SQL($query) {
	if ($result = mysql_query($query)) {
		$ergebnis = array();
		while ($num = mysql_fetch_assoc($result)) {
			$ergebnis[] = $num;
		}
		return $ergebnis;
	} else {
		error_log("MySQL-Error at: '" . $query . "', error: '" . mysql_error() . "'");
		return False;
	}
}

//connect to mysql database
include("../generic/credentials.php");
$con = mysql_connect($CREDENTIALS["db_server"], $CREDENTIALS["db_username"], $CREDENTIALS["db_password"]) or exit(mysql_error());
mysql_select_db($CREDENTIALS["db_db"], $con) or exit(mysql_error());
mysql_set_charset('utf8');

session_start();

?>