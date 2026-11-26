<?php
require_once __DIR__ . "/db_connect.php";

if ((int) date("H") >= 16) {
    echo json_encode([
        "success" => false,
        "message" => "Attendance is closed for today. Unmarked staff will be recorded as Absent."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$staffId = strtoupper(trim($data["staffId"] ?? ""));

if ($staffId === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please enter a Staff ID."
    ]);
    exit;
}

$staffStmt = $conn->prepare(
    "SELECT full_name FROM staff WHERE staff_id = ?"
);
$staffStmt->bind_param("s", $staffId);
$staffStmt->execute();
$staffResult = $staffStmt->get_result();

if ($staffResult->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Staff ID not found. Please enter a valid Staff ID."
    ]);
    exit;
}

$staffName = $staffResult->fetch_assoc()["full_name"];

$existingStmt = $conn->prepare(
    "SELECT staff_id FROM attendance
     WHERE staff_id = ? AND attendance_date = CURDATE()"
);
$existingStmt->bind_param("s", $staffId);
$existingStmt->execute();

if ($existingStmt->get_result()->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "alreadyRecorded" => true,
        "message" => "Attendance for " . $staffName . " (" . $staffId . ") has already been recorded."
    ]);
    exit;
}

$time = date("H:i:s");
$status = $time >= "08:00:00" ? "Late" : "Present";

$insert = $conn->prepare(
    "INSERT INTO attendance (staff_id, attendance_date, time_in, status)
     VALUES (?, CURDATE(), ?, ?)"
);
$insert->bind_param("sss", $staffId, $time, $status);
$insert->execute();

echo json_encode([
    "success" => true,
    "alreadyRecorded" => false,
    "message" => "Attendance marked " . $status . " for " . $staffName . " at " . date("g:i A", strtotime($time)),
    "name" => $staffName,
    "staffId" => $staffId,
    "timeIn" => date("g:i A", strtotime($time)),
    "time24" => date("H:i", strtotime($time)),
    "status" => $status
]);

$staffStmt->close();
$existingStmt->close();
$insert->close();
$conn->close();
