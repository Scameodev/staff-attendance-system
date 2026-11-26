<?php
require_once __DIR__ . "/db_connect.php";

$staffId = strtoupper(trim($_GET["staffId"] ?? ""));

if ($staffId === "") {
    echo json_encode([
        "success" => false,
        "message" => "A Staff ID is required."
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
        "message" => "Staff member not found."
    ]);
    exit;
}

$staff = $staffResult->fetch_assoc();

$stmt = $conn->prepare(
    "SELECT attendance_date, time_in, status
     FROM attendance
     WHERE staff_id = ?
     ORDER BY attendance_date DESC, id DESC
     LIMIT 365"
);
$stmt->bind_param("s", $staffId);
$stmt->execute();
$result = $stmt->get_result();

$records = [];
$summary = ["present" => 0, "late" => 0, "absent" => 0];

while ($row = $result->fetch_assoc()) {
    $status = $row["status"];
    if ($status === "Present") {
        $summary["present"]++;
    } elseif ($status === "Late") {
        $summary["late"]++;
    } elseif ($status === "Absent") {
        $summary["absent"]++;
    }

    $records[] = [
        "date" => $row["attendance_date"],
        "timeIn" => $row["time_in"]
            ? date("g:i A", strtotime($row["time_in"]))
            : "-",
        "status" => $status
    ];
}

echo json_encode([
    "success" => true,
    "staffId" => $staffId,
    "fullName" => $staff["full_name"],
    "summary" => $summary,
    "records" => $records
]);

$staffStmt->close();
$stmt->close();
$conn->close();
