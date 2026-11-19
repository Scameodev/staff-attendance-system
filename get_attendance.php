<?php
require_once __DIR__ . "/db_connect.php";

$date = $_GET["date"] ?? date("Y-m-d");
$parts = explode("-", $date);

if (
    !preg_match("/^\d{4}-\d{2}-\d{2}$/", $date) ||
    !checkdate((int) $parts[1], (int) $parts[2], (int) $parts[0])
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid date."
    ]);
    exit;
}

$stmt = $conn->prepare(
    "SELECT a.staff_id, s.full_name, a.time_in, a.status
     FROM attendance a
     JOIN staff s ON s.staff_id = a.staff_id
     WHERE a.attendance_date = ?
     ORDER BY a.id ASC"
);
$stmt->bind_param("s", $date);
$stmt->execute();
$result = $stmt->get_result();

$records = [];
$presentCount = 0;

while ($row = $result->fetch_assoc()) {
    if ($row["status"] === "Present" || $row["status"] === "Late") {
        $presentCount++;
    }

    $records[] = [
        "staffId" => $row["staff_id"],
        "fullName" => $row["full_name"],
        "timeIn" => $row["time_in"]
            ? date("g:i A", strtotime($row["time_in"]))
            : "-",
        "status" => $row["status"]
    ];
}

echo json_encode([
    "success" => true,
    "date" => $date,
    "presentCount" => $presentCount,
    "records" => $records
]);

$stmt->close();
$conn->close();
