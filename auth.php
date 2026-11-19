<?php
require_once __DIR__ . "/config.php";

ini_set("session.cookie_httponly", 1);
ini_set("session.cookie_samesite", "Lax");

$secureCookies = app_env("APP_SECURE_COOKIES", "");

if ($secureCookies === "") {
    $secureCookies = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "1" : "0";
}

ini_set("session.cookie_secure", $secureCookies === "1" ? "1" : "0");

session_start();

function send_json($data, $status = 200)
{
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($data);
    exit;
}

function require_admin()
{
    if (empty($_SESSION["admin_logged_in"])) {
        send_json([
            "success" => false,
            "message" => "Admin login required."
        ], 401);
    }
}
