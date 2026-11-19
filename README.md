# Staff Attendance System

PHP/MySQL attendance tracker with admin login, staff registration, attendance marking, and daily records.

## Important

A public GitHub link only shares source code. To let other teachers use the app, either deploy it on a server or have each teacher run it locally with XAMPP.

## Local setup (XAMPP)

1. Copy this folder into `C:\xampp\htdocs\` (or `htdocs` on another OS).
2. Start Apache and MySQL in XAMPP.
3. Open `http://localhost/phpmyadmin` and create a database named `staff_attendance`.
4. Import `schema.sql` into that database.
5. Optionally copy `.env.example` to `.env` and edit values. Defaults already match XAMPP (`localhost`, `root`, empty password).
6. Open `http://localhost/<folder-name>/index.html`.

## Shared hosting / cPanel

1. Upload all files to the public HTML folder.
2. Create a MySQL database and user; note the database name, user, password, and host.
3. Import `schema.sql` via phpMyAdmin.
4. Create a `.env` file in the project root with your values:

   ```text
   DB_HOST=your-mysql-host
   DB_PORT=3306
   DB_NAME=your-database
   DB_USER=your-user
   DB_PASS=your-password
   APP_TIMEZONE=Africa/Lagos
   APP_SECURE_COOKIES=1
   ADMIN_PASSWORD_HASH=your-bcrypt-hash
   ```

5. Point your domain or subdomain to the project folder.
6. Ensure PHP 7.4 or newer with `mysqli` enabled.

## Docker / VPS deployment

1. Install Docker and Docker Compose on the server.
2. Run `docker compose up -d --build` from this folder.
3. Open `http://<server-ip>:8080`.
4. Stop with `docker compose down`.
5. For production, edit `docker-compose.yml` to change database passwords, set `ADMIN_PASSWORD_HASH`, set `APP_SECURE_COOKIES=1`, and put HTTPS/reverse proxy in front.

The Docker setup uses database name `staff_attendance`, user `staff_user`, password `staff_pass`, and root password `rootpass`. `schema.sql` is imported automatically on first run.

## Admin password

The default bcrypt hash is kept in `config.php` as a fallback so local XAMPP keeps working. Override it with `ADMIN_PASSWORD_HASH` in `.env` or in the `web` service environment.

Generate a new hash:

```bash
php -r 'echo password_hash("your-new-password", PASSWORD_BCRYPT), PHP_EOL;'
```

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_HOST` | `localhost` | MySQL host (`db` in Docker) |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `staff_attendance` | Database name |
| `DB_USER` | `root` | Database user |
| `DB_PASS` | empty | Database password |
| `APP_TIMEZONE` | server default | Timezone used for attendance cutoffs |
| `APP_SECURE_COOKIES` | auto | Set to `1` behind HTTPS |
| `ADMIN_PASSWORD_HASH` | built-in hash | Bcrypt hash for admin login |
