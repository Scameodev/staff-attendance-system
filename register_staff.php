<?php
require_once __DIR__ . "/auth.php";
require_admin();

require_once __DIR__ . "/db_connect.php";

$data = json_decode(file_get_contents("php://input"), true);

$staffName = trim($data["name"] ?? "");

if ($staffName === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please enter the staff name."
    ]);
    exit;
}

if (mb_strlen($staffName) > 60) {
    echo json_encode([
        "success" => false,
        "message" => "Staff name must not exceed 60 characters."
    ]);
    exit;
}

$check = $conn->prepare(
    "SELECT staff_id FROM staff WHERE LOWER(full_name) = LOWER(?)"
);
$check->bind_param("s", $staffName);
$check->execute();
$result = $check->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "This staff member is already registered."
    ]);
    exit;
}

$query = $conn->query(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(staff_id, 4) AS UNSIGNED)), 0) + 1 AS next_number FROM staff"
);
$row = $query->fetch_assoc();

$newStaffId = "STF" . str_pad($row["next_number"], 3, "0", STR_PAD_LEFT);

$insert = $conn->prepare(
    "INSERT INTO staff (staff_id, full_name) VALUES (?, ?)"
);
$insert->bind_param("ss", $newStaffId, $staffName);
$insert->execute();

echo json_encode([
    "success" => true,
    "message" => $staffName . " registered successfully!",
    "staffId" => $newStaffId
]);

$check->close();
$insert->close();
$conn->close();
