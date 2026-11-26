<?php
require_once __DIR__ . "/db_connect.php";

$month = trim($_GET["month"] ?? date("Y-m"));
$staffId = strtoupper(trim($_GET["staffId"] ?? ""));

$parts = explode("-", $month);
if (
    !preg_match("/^\d{4}-\d{2}$/", $month) ||
    (int) $parts[1] < 1 ||
    (int) $parts[1] > 12
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid month."
    ]);
    exit;
}

$startDate = $month . "-01";
$endDate = date("Y-m-t", strtotime($startDate));

$joinCondition = "a.staff_id = s.staff_id AND a.attendance_date BETWEEN ? AND ?";
$params = [$startDate, $endDate];
$types = "ss";
$extraWhere = "";

if ($staffId !== "") {
    $extraWhere = " WHERE s.staff_id = ?";
    $params[] = $staffId;
    $types .= "s";
}

$sql =
    "SELECT s.staff_id, s.full_name,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
            SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late_count,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
            COUNT(a.id) AS total_days
     FROM staff s
     LEFT JOIN attendance a ON " . $joinCondition . $extraWhere . "
     GROUP BY s.staff_id, s.full_name
     ORDER BY s.full_name ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$rows = [];
$summary = ["present" => 0, "late" => 0, "absent" => 0, "recorded" => 0];

while ($row = $result->fetch_assoc()) {
    $present = (int) $row["present_count"];
    $late = (int) $row["late_count"];
    $absent = (int) $row["absent_count"];
    $total = (int) $row["total_days"];

    $summary["present"] += $present;
    $summary["late"] += $late;
    $summary["absent"] += $absent;
    $summary["recorded"] += $total;

    $rows[] = [
        "staffId" => $row["staff_id"],
        "fullName" => $row["full_name"],
        "present" => $present,
        "late" => $late,
        "absent" => $absent,
        "total" => $total
    ];
}

echo json_encode([
    "success" => true,
    "month" => $month,
    "monthLabel" => date("F Y", strtotime($startDate)),
    "daysInMonth" => (int) date("t", strtotime($startDate)),
    "filteredStaffId" => $staffId,
    "summary" => $summary,
    "rows" => $rows
]);

$stmt->close();
$conn->close();
