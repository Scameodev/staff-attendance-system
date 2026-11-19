<?php
ini_set("session.cookie_httponly", 1);
ini_set("session.cookie_samesite", "Lax");
session_start();

define("ADMIN_PASSWORD_HASH", '$2y$12$qXFK.10GvhuBOKTDK8UIz.02cqPJcC/zQnJdhvxGIwmevxQTTjAxi');

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
