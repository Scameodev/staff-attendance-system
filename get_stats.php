<?php
require_once __DIR__ . "/db_connect.php";

$staffResult = $conn->query(
    "SELECT COUNT(*) AS total FROM staff"
);
$presentResult = $conn->query(
    "SELECT COUNT(*) AS total FROM attendance
     WHERE attendance_date = CURDATE() AND status IN ('Present', 'Late')"
);

echo json_encode([
    "success" => true,
    "totalStaff" => (int) $staffResult->fetch_assoc()["total"],
    "presentToday" => (int) $presentResult->fetch_assoc()["total"]
]);

$conn->close();
