<?php
require_once __DIR__ . "/auth.php";

send_json([
    "success" => true,
    "loggedIn" => !empty($_SESSION["admin_logged_in"])
]);
