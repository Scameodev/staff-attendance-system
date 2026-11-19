<?php
require_once __DIR__ . "/db_connect.php";

if ((int) date("H") < 8) {
    echo json_encode([
        "success" => false,
        "message" => "Attendance can only be finalized after 8:00 PM."
    ]);
    exit;
}

$conn->query(
    "INSERT INTO attendance (staff_id, attendance_date, time_in, status)
     SELECT s.staff_id, CURDATE(), NULL, 'Absent'
     FROM staff s
     LEFT JOIN attendance a
       ON a.staff_id = s.staff_id AND a.attendance_date = CURDATE()
     WHERE a.id IS NULL"
);

echo json_encode([
    "success" => true,
    "added" => $conn->affected_rows
]);

$conn->close();
