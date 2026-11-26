<?php
require_once __DIR__ . "/auth.php";
require_admin();

require_once __DIR__ . "/db_connect.php";

$data = json_decode(file_get_contents("php://input"), true);

$staffId = strtoupper(trim($data["staffId"] ?? ""));
$fullName = strtoupper(trim($data["fullName"] ?? ""));
$phone = trim($data["phone"] ?? "");

if ($staffId === "" || $fullName === "" || $phone === "") {
    echo json_encode([
        "success" => false,
        "message" => "Staff ID, full name, and phone number are required."
    ]);
    exit;
}

if (mb_strlen($fullName) > 100) {
    echo json_encode([
        "success" => false,
        "message" => "Staff name must not exceed 100 characters."
    ]);
    exit;
}

if (mb_strlen($phone) > 11) {
    echo json_encode([
        "success" => false,
        "message" => "Phone number must not exceed 11 characters."
    ]);
    exit;
}

$exists = $conn->prepare(
    "SELECT staff_id FROM staff WHERE staff_id = ?"
);
$exists->bind_param("s", $staffId);
$exists->execute();
$existing = $exists->get_result();

if ($existing->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Staff member not found."
    ]);
    exit;
}

$duplicate = $conn->prepare(
    "SELECT staff_id FROM staff
     WHERE LOWER(full_name) = LOWER(?) AND staff_id <> ?"
);
$duplicate->bind_param("ss", $fullName, $staffId);
$duplicate->execute();

if ($duplicate->get_result()->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Another staff member already has this name."
    ]);
    exit;
}

$update = $conn->prepare(
    "UPDATE staff SET full_name = ?, phone = ? WHERE staff_id = ?"
);
$update->bind_param("sss", $fullName, $phone, $staffId);
$update->execute();

echo json_encode([
    "success" => true,
    "message" => "Staff information updated.",
    "staff" => [
        "staffId" => $staffId,
        "fullName" => $fullName,
        "phone" => $phone
    ]
]);

$exists->close();
$duplicate->close();
$update->close();
$conn->close();
