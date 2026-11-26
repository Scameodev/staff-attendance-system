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

function ensure_staff_columns($conn)
{
    $result = $conn->query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff'"
    );

    if ($result === false) {
        return;
    }

    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = $row["COLUMN_NAME"];
    }

    $definitions = [
        "phone" => "VARCHAR(30) NULL AFTER full_name"
    ];

    foreach ($definitions as $column => $definition) {
        if (!in_array($column, $columns, true)) {
            $conn->query("ALTER TABLE staff ADD COLUMN $column $definition");
        }
    }
}

ensure_staff_columns($conn);
