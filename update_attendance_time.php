<?php
require_once __DIR__ . "/auth.php";
require_admin();

require_once __DIR__ . "/db_connect.php";

$data = json_decode(file_get_contents("php://input"), true);

$staffId = strtoupper(trim($data["staffId"] ?? ""));
$date = $data["date"] ?? date("Y-m-d");
$timeIn = trim($data["timeIn"] ?? "");

if ($staffId === "" || $timeIn === "") {
    echo json_encode([
        "success" => false,
        "message" => "Staff ID and time are required."
    ]);
    exit;
}

$parts = explode("-", $date);
if (
    !preg_match("/^\d{4}-\d{2}-\d{2}$/", $date) ||
    !checkdate((int) $parts[1], (int) $parts[2], (int) $parts[0])
) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid date."
    ]);
    exit;
}

if (!preg_match("/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/", $timeIn)) {
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid time."
    ]);
    exit;
}

if (strlen($timeIn) === 5) {
    $timeIn .= ":00";
}

$status = $timeIn >= "08:00:00" ? "Late" : "Present";

$stmt = $conn->prepare(
    "UPDATE attendance
     SET time_in = ?, status = ?
     WHERE staff_id = ? AND attendance_date = ?"
);
$stmt->bind_param("ssss", $timeIn, $status, $staffId, $date);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "No attendance record found for this staff member on that date."
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Time In updated for " . $staffId . ".",
    "staffId" => $staffId,
    "date" => $date,
    "timeIn" => date("g:i A", strtotime($timeIn)),
    "time24" => substr($timeIn, 0, 5),
    "status" => $status
]);

$stmt->close();
$conn->close();
