<?php
header("Content-Type: application/json; charset=utf-8");

$host = "localhost";
$username = "root";
$password = "";
$database = "staff_attendance";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Connection failed: " . $conn->connect_error
    ]);
    exit;
}

$conn->set_charset("utf8mb4");
