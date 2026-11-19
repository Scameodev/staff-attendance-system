<?php
function app_env($key, $default = null)
{
    $value = getenv($key);

    if ($value === false || $value === "") {
        $value = isset($_ENV[$key]) ? $_ENV[$key] : $value;
    }

    if ($value === false || $value === "") {
        $value = isset($_SERVER[$key]) ? $_SERVER[$key] : $value;
    }

    if ($value === false || $value === "") {
        return $default;
    }

    $value = trim($value);

    if (strlen($value) >= 2 && $value[0] === '"' && substr($value, -1) === '"') {
        return substr($value, 1, -1);
    }

    return $value;
}

function app_load_env_file($path)
{
    if (!is_file($path) || !is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === "" || strpos($line, "#") === 0 || strpos($line, "=") === false) {
            continue;
        }

        $parts = explode("=", $line, 2);
        $key = trim($parts[0]);
        $value = trim($parts[1]);

        if ($key === "" || getenv($key) !== false) {
            continue;
        }

        putenv($key . "=" . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

app_load_env_file(__DIR__ . "/.env");

$timezone = app_env("APP_TIMEZONE", date_default_timezone_get());

if (!in_array($timezone, timezone_identifiers_list(), true)) {
    $timezone = "UTC";
}

date_default_timezone_set($timezone);

define("DB_HOST", app_env("DB_HOST", "localhost"));
define("DB_PORT", app_env("DB_PORT", "3306"));
define("DB_NAME", app_env("DB_NAME", "staff_attendance"));
define("DB_USER", app_env("DB_USER", "root"));
define("DB_PASS", app_env("DB_PASS", ""));
define("ADMIN_PASSWORD_HASH", app_env("ADMIN_PASSWORD_HASH", '$2y$12$qXFK.10GvhuBOKTDK8UIz.02cqPJcC/zQnJdhvxGIwmevxQTTjAxi'));
define("APP_TIMEZONE", $timezone);
