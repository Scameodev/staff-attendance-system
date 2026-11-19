<?php
require_once __DIR__ . "/auth.php";
require_admin();

require_once __DIR__ . "/db_connect.php";

$result = $conn->query(
    "SELECT staff_id, full_name FROM staff ORDER BY staff_id ASC"
);

$staff = [];

while ($row = $result->fetch_assoc()) {
    $staff[] = [
        "staffId" => $row["staff_id"],
        "fullName" => $row["full_name"]
    ];
}

echo json_encode([
    "success" => true,
    "total" => count($staff),
    "staff" => $staff
]);

$conn->close();
