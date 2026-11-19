<?php
require_once __DIR__ . "/auth.php";
require_admin();

require_once __DIR__ . "/db_connect.php";

$data = json_decode(file_get_contents("php://input"), true);

$staffId = strtoupper(trim($data["staffId"] ?? ""));

if ($staffId === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please choose a staff member."
    ]);
    exit;
}

$deleteAttendance = $conn->prepare(
    "DELETE FROM attendance WHERE staff_id = ?"
);
$deleteAttendance->bind_param("s", $staffId);
$deleteAttendance->execute();

$deleteStaff = $conn->prepare(
    "DELETE FROM staff WHERE staff_id = ?"
);
$deleteStaff->bind_param("s", $staffId);
$deleteStaff->execute();

if ($deleteStaff->affected_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Staff member not found."
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Staff member removed successfully.",
    "staffId" => $staffId
]);

$deleteAttendance->close();
$deleteStaff->close();
$conn->close();
