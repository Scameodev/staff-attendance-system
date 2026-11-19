CREATE TABLE IF NOT EXISTS staff (
  id INT NOT NULL AUTO_INCREMENT,
  staff_id VARCHAR(20) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY staff_id (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS attendance (
  id INT NOT NULL AUTO_INCREMENT,
  staff_id VARCHAR(20) NOT NULL,
  attendance_date DATE NOT NULL,
  time_in TIME DEFAULT NULL,
  status ENUM('Present','Late','Absent') NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_staff_day (staff_id, attendance_date),
  CONSTRAINT attendance_ibfk_1 FOREIGN KEY (staff_id) REFERENCES staff (staff_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
