<?php
require_once __DIR__ . "/auth.php";

if (!empty($_SESSION["admin_logged_in"])) {
    send_json([
        "success" => true,
        "message" => "Already logged in."
    ]);
}

if (isset($_SESSION["login_lock_until"]) && time() < $_SESSION["login_lock_until"]) {
    send_json([
        "success" => false,
        "message" => "Too many attempts. Please try again shortly."
    ], 429);
}

$data = json_decode(file_get_contents("php://input"), true);
$password = $data["password"] ?? "";

if (!password_verify($password, ADMIN_PASSWORD_HASH)) {
    $_SESSION["login_attempts"] = ($_SESSION["login_attempts"] ?? 0) + 1;

    if ($_SESSION["login_attempts"] >= 5) {
        $_SESSION["login_lock_until"] = time() + 30;
        $_SESSION["login_attempts"] = 0;
    }

    send_json([
        "success" => false,
        "message" => "Incorrect pass code."
    ], 401);
}

session_regenerate_id(true);
unset($_SESSION["login_attempts"], $_SESSION["login_lock_until"]);
$_SESSION["admin_logged_in"] = true;

send_json([
    "success" => true,
    "message" => "Admin login successful."
]);
