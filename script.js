const API = {
    authCheck: "auth_check.php",
    login: "login.php",
    logout: "logout.php",
    stats: "get_stats.php",
    staff: "get_staff.php",
    attendance: "get_attendance.php",
    register: "register_staff.php",
    mark: "mark_attendance.php",
    remove: "remove_staff.php",
    finalize: "finalize_attendance.php",
    updateTime: "update_attendance_time.php",
    updateStaff: "update_staff.php",
    report: "get_monthly_report.php"
};

const CUTOFF_HOUR = 16;
const CUTOFF_MINUTE = 0;

const markAttendanceBtn = document.getElementById("markAttendanceBtn");
const feedbackMessage = document.getElementById("feedbackMessage");
const staffIdInput = document.getElementById("staffIdInput");
const totalStaffCount = document.getElementById("totalStaffCount");
const presentTodayCount = document.getElementById("presentTodayCount");
const attendanceTableBody = document.getElementById("attendanceTableBody");
const recordsSection = document.getElementById("recordsSection");
const recordsTitle = document.getElementById("recordsTitle");
const registerStaffBtn = document.getElementById("registerStaffBtn");
const staffNameInput = document.getElementById("staffNameInput");
const registerFeedback = document.getElementById("registerFeedback");
const registerPhoneInput = document.getElementById("registerPhoneInput");
const registerDateInput = document.getElementById("registerDateInput");
const adminBtn = document.getElementById("adminBtn");
const adminPage = document.getElementById("adminPage");
const adminBackBtn = document.getElementById("adminBackBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginFeedback = document.getElementById("loginFeedback");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const closeLoginBtn = document.getElementById("closeLoginBtn");
const openRemoveStaffBtn = document.getElementById("openRemoveStaffBtn");
const closeRemoveStaffBtn = document.getElementById("closeRemoveStaffBtn");
const removeStaffModal = document.getElementById("removeStaffModal");
const staffList = document.getElementById("staffList");
const editTimeModal = document.getElementById("editTimeModal");
const editTimeForm = document.getElementById("editTimeForm");
const editTimeStaffLabel = document.getElementById("editTimeStaffLabel");
const editTimeDateInput = document.getElementById("editTimeDateInput");
const editTimeInput = document.getElementById("editTimeInput");
const editTimeFeedback = document.getElementById("editTimeFeedback");
const editTimeSubmitBtn = document.getElementById("editTimeSubmitBtn");
const closeEditTimeBtn = document.getElementById("closeEditTimeBtn");
const adminTimeDateInput = document.getElementById("adminTimeDateInput");
const adminTimeTableBody = document.getElementById("adminTimeTableBody");
const reportMonthInput = document.getElementById("reportMonthInput");
const reportStaffIdInput = document.getElementById("reportStaffIdInput");
const generateReportBtn = document.getElementById("generateReportBtn");
const reportFeedback = document.getElementById("reportFeedback");
const reportResults = document.getElementById("reportResults");
const reportTitle = document.getElementById("reportTitle");
const reportSummary = document.getElementById("reportSummary");
const reportTableBody = document.getElementById("reportTableBody");
const reportNote = document.getElementById("reportNote");
const staffDirectoryBody = document.getElementById("staffDirectoryBody");
const staffDirectoryCount = document.getElementById("staffDirectoryCount");
const dashboardFeedback = document.getElementById("dashboardFeedback");
const staffSearchInput = document.getElementById("staffSearchInput");
const editStaffModal = document.getElementById("editStaffModal");
const editStaffForm = document.getElementById("editStaffForm");
const editStaffName = document.getElementById("editStaffName");
const editStaffPhone = document.getElementById("editStaffPhone");
const editStaffFeedback = document.getElementById("editStaffFeedback");
const editStaffSubmitBtn = document.getElementById("editStaffSubmitBtn");
const closeEditStaffBtn = document.getElementById("closeEditStaffBtn");

let staffMembers = [];
let adminLoggedIn = false;
let editingRecord = null;
let editingStaff = null;
let todayRecords = [];
let attendanceLocked = false;
let attendanceDay = getTodayDate();

const presentStaffIds = new Set();
const recordedStaffIds = new Set();

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function isBeforeCutoff() {
    const currentDate = new Date();
    return currentDate.getHours() < CUTOFF_HOUR ||
        (currentDate.getHours() === CUTOFF_HOUR &&
            currentDate.getMinutes() < CUTOFF_MINUTE);
}

async function fetchJson(url, options) {
    const response = await fetch(url, options);
    return response.json();
}

function postJson(url, payload) {
    return fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {})
    });
}

function showFeedback(element, message, type) {
    element.textContent = message;
    element.classList.remove("success", "error");
    if (!type) return;
    element.classList.add(type);
    setTimeout(function () {
        if (element.textContent === message) {
            element.textContent = "";
            element.classList.remove(type);
        }
    }, 2500);
}

function statusClass(status) {
    if (status === "Present") return "present-staff";
    if (status === "Late") return "late-staff";
    return "absent-staff";
}

function renderRecords(rows) {
    attendanceTableBody.innerHTML = "";
    rows.forEach(function (row) {
        const tr = attendanceTableBody.insertRow();
        tr.insertCell(0).textContent = row.fullName;
        tr.insertCell(1).textContent = row.staffId;

        tr.insertCell(2).textContent = row.timeIn;
        const statusCell = tr.insertCell(3);
        statusCell.textContent = row.status;
        statusCell.classList.remove("present-staff", "late-staff", "absent-staff");
        statusCell.classList.add(statusClass(row.status));
    });
    recordsSection.style.display = rows.length > 0 ? "block" : "none";
}

function renderAdminTimeRecords(rows) {
    adminTimeTableBody.innerHTML = "";

    if (rows.length === 0) {
        const tr = adminTimeTableBody.insertRow();
        const td = tr.insertCell(0);
        td.colSpan = 4;
        td.className = "empty-note";
        td.textContent = "No attendance records for this date.";
        return;
    }

    rows.forEach(function (row) {
        const tr = adminTimeTableBody.insertRow();
        tr.insertCell(0).textContent = row.fullName;
        tr.insertCell(1).textContent = row.staffId;

        const timeCell = tr.insertCell(2);
        timeCell.className = "time-in-cell";
        timeCell.textContent = row.timeIn;

        const actionCell = tr.insertCell(3);
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "edit-time-btn";
        editBtn.textContent = "EDIT";
        editBtn.addEventListener("click", function () {
            openEditTimeModal(row);
        });
        actionCell.appendChild(editBtn);
    });
}

async function loadAdminTimeRecords() {
    const date = adminTimeDateInput.value || getTodayDate();
    const data = await fetchJson(
        API.attendance + "?date=" + encodeURIComponent(date)
    );
    renderAdminTimeRecords(data.records || []);
}

function closeEditTimeModal() {
    editTimeModal.hidden = true;
    editingRecord = null;
    showFeedback(editTimeFeedback, "", null);
}

function openEditTimeModal(row) {
    editingRecord = row;
    editTimeStaffLabel.textContent = row.fullName + " (" + row.staffId + ")";
    editTimeDateInput.value = adminTimeDateInput.value || getTodayDate();
    editTimeInput.value = row.time24 || "";
    showFeedback(editTimeFeedback, "", null);
    editTimeModal.hidden = false;
    editTimeInput.focus();
}

editTimeForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!editingRecord || !editTimeInput.value) {
        showFeedback(editTimeFeedback, "Please enter a time.", "error");
        return;
    }

    editTimeSubmitBtn.disabled = true;

    try {
        const data = await postJson(API.updateTime, {
            staffId: editingRecord.staffId,
            date: editTimeDateInput.value,
            timeIn: editTimeInput.value
        });

        if (data.success) {
            closeEditTimeModal();
            await loadAdminTimeRecords();
            await loadTodayAttendance();
            await loadRecordsForView();
            await loadReport();
        } else {
            showFeedback(editTimeFeedback, data.message, "error");
        }
    } catch (err) {
        console.error(err);
        showFeedback(editTimeFeedback, "Could not reach the server.", "error");
    } finally {
        editTimeSubmitBtn.disabled = false;
    }
});

function syncTodayState(rows) {
    todayRecords = rows;
    presentStaffIds.clear();
    recordedStaffIds.clear();
    rows.forEach(function (row) {
        recordedStaffIds.add(row.staffId);
        if (row.status === "Present" || row.status === "Late") {
            presentStaffIds.add(row.staffId);
        }
    });
    presentTodayCount.textContent = presentStaffIds.size;
}

function makeDirectoryButton(label, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    return button;
}

function renderStaffDirectory() {
    const search = staffSearchInput.value.trim().toLowerCase();
    const visibleMembers = staffMembers.filter(function (staffMember) {
        return search === "" ||
            staffMember.fullName.toLowerCase().indexOf(search) !== -1 ||
            staffMember.staffId.toLowerCase().indexOf(search) !== -1;
    });

    staffDirectoryCount.textContent =
        visibleMembers.length === staffMembers.length
            ? visibleMembers.length === 1
                ? "1 staff"
                : visibleMembers.length + " staff"
            : visibleMembers.length + " of " + staffMembers.length + " staff";

    staffDirectoryBody.innerHTML = "";

    if (visibleMembers.length === 0) {
        const tr = staffDirectoryBody.insertRow();
        const td = tr.insertCell(0);
        td.colSpan = 4;
        td.className = "empty-note";
        td.textContent = staffMembers.length === 0
            ? "No staff registered."
            : "No staff match the current search.";
        return;
    }

    visibleMembers.forEach(function (staffMember) {
        const tr = staffDirectoryBody.insertRow();
        tr.insertCell(0).textContent = staffMember.fullName;

        const idCell = tr.insertCell(1);
        idCell.className = "staff-id-cell";
        idCell.textContent = staffMember.staffId;

        tr.insertCell(2).textContent = staffMember.phone || "-";

        const actionsCell = tr.insertCell(3);
        if (adminLoggedIn) {
            const editBtn = makeDirectoryButton("EDIT", "directory-action-btn edit");
            editBtn.addEventListener("click", function () {
                openEditStaffModal(staffMember);
            });
            actionsCell.appendChild(editBtn);
        }
    });
}

function closeEditStaffModal() {
    editStaffModal.hidden = true;
    editingStaff = null;
    showFeedback(editStaffFeedback, "", null);
}

function openEditStaffModal(staff) {
    editingStaff = staff;
    editStaffName.value = staff.fullName || "";
    editStaffPhone.value = staff.phone || "";
    showFeedback(editStaffFeedback, "", null);
    editStaffModal.hidden = false;
    editStaffName.focus();
}

editStaffForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!editingStaff) return;

    const newPhone = editStaffPhone.value.trim();
    if (newPhone === "") {
        showFeedback(editStaffFeedback, "Please enter the phone number.", "error");
        return;
    }

    if (newPhone.length > 11) {
        showFeedback(editStaffFeedback, "Phone number must not exceed 11 characters.", "error");
        return;
    }

    editStaffSubmitBtn.disabled = true;

    try {
        const result = await postJson(API.updateStaff, {
            staffId: editingStaff.staffId,
            fullName: editStaffName.value.trim().toUpperCase(),
            phone: newPhone
        });

        if (!result.success) {
            showFeedback(editStaffFeedback, result.message, "error");
            return;
        }

        await loadStaff();
        closeEditStaffModal();
        showFeedback(dashboardFeedback, "Staff information updated.", "success");
    } catch (err) {
        console.error(err);
        showFeedback(editStaffFeedback, "Could not reach the server.", "error");
    } finally {
        editStaffSubmitBtn.disabled = false;
    }
});

async function loadStaff() {
    const data = await fetchJson(API.staff);
    staffMembers = data.staff || [];
    totalStaffCount.textContent = data.total ?? staffMembers.length;
    renderStaffDirectory();
}

async function checkAuth() {
    const data = await fetchJson(API.authCheck);
    adminLoggedIn = Boolean(data.loggedIn);
    if (adminLoggedIn) {
        adminBtn.textContent = "ADMIN OPEN";
        adminBtn.classList.add("active");
    }
    return adminLoggedIn;
}

async function loadStats() {
    const data = await fetchJson(API.stats);
    totalStaffCount.textContent = data.totalStaff ?? 0;
    presentTodayCount.textContent = data.presentToday ?? 0;
}

async function openAdminPage() {
    adminLoggedIn = true;
    renderStaffDirectory();
    adminPage.hidden = false;
    adminBtn.textContent = "ADMIN OPEN";
    adminBtn.classList.add("active");
    window.scrollTo(0, 0);
    await loadStaff();

    await loadTodayAttendance();
    await loadRecordsForView();
    await loadAdminTimeRecords();
}

async function loadTodayAttendance() {
    const data = await fetchJson(
        API.attendance + "?date=" + getTodayDate()
    );
    syncTodayState(data.records || []);
}

async function loadRecordsForView() {
    const date = registerDateInput.value || getTodayDate();
    const data = await fetchJson(
        API.attendance + "?date=" + encodeURIComponent(date)
    );
    renderRecords(data.records || []);
    recordsTitle.textContent = date === getTodayDate()
        ? "Today's Attendance Records"
        : "Attendance Records — " + date;
}

function appendCountCells(row, present, late, absent) {
    [present, late, absent].forEach(function (value, index) {
        const td = row.insertCell(index + 2);
        td.className = "num " + (index === 1 ? "late" : index === 2 ? "absent" : "");
        td.textContent = value;
    });
}

function renderReport(data) {
    reportResults.hidden = false;
    reportTitle.textContent =
        "Monthly Report — " +
        data.monthLabel +
        (data.filteredStaffId ? " (" + data.filteredStaffId + ")" : "");

    reportSummary.innerHTML = "";
    [
        { label: "Present", value: data.summary.present, cls: "present" },
        { label: "Late Comers", value: data.summary.late, cls: "late" },
        { label: "Absent", value: data.summary.absent, cls: "absent" }
    ].forEach(function (item) {
        const card = document.createElement("div");
        card.className = "report-summary-card " + item.cls;

        const value = document.createElement("div");
        value.className = "value";
        value.textContent = item.value;

        const label = document.createElement("div");
        label.className = "label";
        label.textContent = item.label;

        card.appendChild(value);
        card.appendChild(label);
        reportSummary.appendChild(card);
    });

    reportTableBody.innerHTML = "";
    if (data.rows.length === 0) {
        const tr = reportTableBody.insertRow();
        const td = tr.insertCell(0);
        td.colSpan = 5;
        td.className = "empty-note";
        td.textContent = "No matching staff found.";
    } else {
        data.rows.forEach(function (row) {
            const tr = reportTableBody.insertRow();
            tr.insertCell(0).textContent = row.fullName;
            tr.insertCell(1).textContent = row.staffId;
            appendCountCells(tr, row.present, row.late, row.absent);
        });

        const totalRow = reportTableBody.insertRow();
        totalRow.className = "report-total-row";
        totalRow.insertCell(0).textContent = "TOTAL";
        totalRow.insertCell(1).textContent = data.rows.length + " staff";
        appendCountCells(
            totalRow,
            data.summary.present,
            data.summary.late,
            data.summary.absent
        );
    }

    reportNote.textContent =
        data.daysInMonth +
        " days in this month · " +
        data.summary.recorded +
        " total attendance records.";
}

async function loadReport() {
    const month = reportMonthInput.value;
    const staffId = reportStaffIdInput.value.trim().toUpperCase();

    if (!/^\d{4}-\d{2}$/.test(month)) {
        showFeedback(reportFeedback, "Please select a month.", "error");
        return;
    }

    generateReportBtn.disabled = true;

    try {
        const params = new URLSearchParams({ month: month });
        if (staffId !== "") {
            params.set("staffId", staffId);
        }
        const data = await fetchJson(API.report + "?" + params.toString());

        if (data.success) {
            showFeedback(reportFeedback, "", null);
            renderReport(data);
        } else {
            reportResults.hidden = true;
            showFeedback(reportFeedback, data.message, "error");
        }
    } catch (err) {
        console.error(err);
        showFeedback(reportFeedback, "Could not reach the server.", "error");
    } finally {
        generateReportBtn.disabled = false;
    }
}

generateReportBtn.addEventListener("click", loadReport);
reportMonthInput.addEventListener("change", loadReport);
reportStaffIdInput.addEventListener("change", loadReport);

reportStaffIdInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        loadReport();
    }
});

async function init() {
    registerDateInput.value = getTodayDate();
    registerDateInput.max = getTodayDate();
    adminTimeDateInput.value = getTodayDate();
    adminTimeDateInput.max = getTodayDate();
    reportMonthInput.value = getTodayDate().slice(0, 7);
    reportMonthInput.max = getTodayDate().slice(0, 7);
    try {
        await checkAuth();
        await loadStats();
        await loadStaff();
        if (!isBeforeCutoff()) {
            attendanceLocked = true;
            await postJson(API.finalize, {});
        }
        await loadTodayAttendance();
        await loadRecordsForView();
        await loadReport();
    } catch (err) {
        console.error(err);
        showFeedback(
            dashboardFeedback,
            "Could not load data. Make sure XAMPP and the database are running.",
            "error"
        );
    }
}

async function checkAttendanceCutoff() {
    const currentDay = getTodayDate();

    if (currentDay !== attendanceDay) {
        await resetAttendanceForNewDay();
        return;
    }

    if (!isBeforeCutoff() && !attendanceLocked) {
        attendanceLocked = true;
        try {
            await postJson(API.finalize, {});
            await loadTodayAttendance();
            if (registerDateInput.value === currentDay) {
                await loadRecordsForView();
            }
        } catch (err) {
            attendanceLocked = false;
            console.error(err);
        }
    }
}

async function resetAttendanceForNewDay() {
    attendanceTableBody.innerHTML = "";
    recordedStaffIds.clear();
    presentStaffIds.clear();
    todayRecords = [];
    attendanceLocked = false;
    attendanceDay = getTodayDate();
    presentTodayCount.textContent = "0";
    recordsSection.style.display = "none";
    await init();
}

markAttendanceBtn.addEventListener("click", async function () {
    const enterId = staffIdInput.value.trim().toUpperCase();

    if (enterId === "") {
        showFeedback(feedbackMessage, "Please enter a Staff ID.", "error");
        return;
    }

    if (attendanceLocked || !isBeforeCutoff()) {
        showFeedback(
            feedbackMessage,
            "Attendance is closed for today. Unmarked staff will be recorded as Absent.",
            "error"
        );
        staffIdInput.value = "";
        return;
    }

    markAttendanceBtn.disabled = true;

    try {
        const data = await postJson(API.mark, { staffId: enterId });

        if (data.success) {
            showFeedback(feedbackMessage, data.message, "success");
            staffIdInput.value = "";

            const row = {
                staffId: data.staffId,
                fullName: data.name,
                timeIn: data.timeIn,
                time24: data.time24,
                status: data.status
            };
            todayRecords.push(row);
            recordedStaffIds.add(row.staffId);
            presentStaffIds.add(row.staffId);
            presentTodayCount.textContent = presentStaffIds.size;

            if (registerDateInput.value === getTodayDate()) {
                renderRecords(todayRecords);
            }
        } else {
            showFeedback(feedbackMessage, data.message, "error");
            if (!data.alreadyRecorded) {
                staffIdInput.value = "";
            }
        }
    } catch (err) {
        console.error(err);
        showFeedback(feedbackMessage, "Could not reach the server.", "error");
    } finally {
        markAttendanceBtn.disabled = false;
    }
});

staffIdInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        markAttendanceBtn.click();
    }
});

registerStaffBtn.addEventListener("click", async function () {
    const newStaffName = staffNameInput.value.trim();
    const newStaffPhone = registerPhoneInput.value.trim();

    if (newStaffName === "") {
        showFeedback(registerFeedback, "Please enter the staff name.", "error");
        return;
    }

    if (newStaffPhone === "") {
        showFeedback(registerFeedback, "Please enter the phone number.", "error");
        return;
    }

    if (newStaffPhone.length > 11) {
        showFeedback(registerFeedback, "Phone number must not exceed 11 characters.", "error");
        return;
    }

    registerStaffBtn.disabled = true;

    try {
        const data = await postJson(API.register, {
            name: newStaffName.toUpperCase(),
            phone: newStaffPhone
        });

        if (data.success) {
            await loadStaff();
            showFeedback(
                registerFeedback,
                data.message + " Staff ID: " + data.staffId,
                "success"
            );
            staffNameInput.value = "";
            registerPhoneInput.value = "";
        } else {
            showFeedback(registerFeedback, data.message, "error");
        }
    } catch (err) {
        console.error(err);
        showFeedback(registerFeedback, "Could not reach the server.", "error");
    } finally {
        registerStaffBtn.disabled = false;
    }
});

staffNameInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        registerStaffBtn.click();
    }
});

registerPhoneInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        registerStaffBtn.click();
    }
});

function closeLoginModal() {
    loginModal.hidden = true;
    showFeedback(loginFeedback, "", null);
}

adminBtn.addEventListener("click", async function () {
    if (!adminPage.hidden) {
        window.scrollTo(0, 0);
        return;
    }

    try {
        const data = await fetchJson(API.authCheck);
        if (data.loggedIn) {
            await openAdminPage();
            return;
        }
        adminPasswordInput.value = "";
        loginModal.hidden = false;
        adminPasswordInput.focus();
    } catch (err) {
        console.error(err);
        alert("Could not reach the server.");
    }
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const password = adminPasswordInput.value;

    if (password === "") {
        showFeedback(loginFeedback, "Please enter the pass code.", "error");
        return;
    }

    loginSubmitBtn.disabled = true;

    try {
        const data = await postJson(API.login, { password: password });

        if (data.success) {
            closeLoginModal();
            await openAdminPage();
        } else {
            showFeedback(loginFeedback, data.message, "error");
            adminPasswordInput.value = "";
        }
    } catch (err) {
        console.error(err);
        showFeedback(loginFeedback, "Could not reach the server.", "error");
    } finally {
        loginSubmitBtn.disabled = false;
    }
});

closeLoginBtn.addEventListener("click", closeLoginModal);

loginModal.addEventListener("click", function (event) {
    if (event.target === loginModal) {
        closeLoginModal();
    }
});

adminLogoutBtn.addEventListener("click", async function () {
    try {
        await postJson(API.logout, {});
    } catch (err) {
        console.error(err);
    }
    adminLoggedIn = false;
    adminPage.hidden = true;
    adminBtn.textContent = "ADMIN";
    adminBtn.classList.remove("active");
    renderStaffDirectory();
});

adminBackBtn.addEventListener("click", function () {
    adminPage.hidden = true;
    adminBtn.textContent = adminLoggedIn ? "ADMIN OPEN" : "ADMIN";
    adminBtn.classList.toggle("active", adminLoggedIn);
});

function enforcePastDate() {
    if (registerDateInput.value > getTodayDate()) {
        registerDateInput.value = getTodayDate();
    }
}

registerDateInput.addEventListener("change", function () {
    enforcePastDate();
    loadRecordsForView();
});
registerDateInput.addEventListener("input", enforcePastDate);

adminTimeDateInput.addEventListener("change", function () {
    if (adminTimeDateInput.value > getTodayDate()) {
        adminTimeDateInput.value = getTodayDate();
    }
    loadAdminTimeRecords();
});

staffSearchInput.addEventListener("input", renderStaffDirectory);

function renderStaffList() {
    staffList.innerHTML = "";

    if (staffMembers.length === 0) {
        const message = document.createElement("div");
        message.className = "no-staff-message";
        message.textContent = "No staff registered.";
        staffList.appendChild(message);
        return;
    }

    staffMembers.forEach(function (staffMember) {
        const item = document.createElement("div");
        item.className = "staff-item";

        const details = document.createElement("div");
        details.className = "staff-details";

        const name = document.createElement("strong");
        name.textContent = staffMember.fullName;

        const id = document.createElement("span");
        id.textContent = staffMember.staffId;

        details.appendChild(name);
        details.appendChild(id);

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "remove-staff-btn";
        removeBtn.textContent = "REMOVE";
        removeBtn.addEventListener("click", async function () {
            removeBtn.disabled = true;
            try {
                const data = await postJson(API.remove, {
                    staffId: staffMember.staffId
                });

                if (data.success) {
                    const index = staffMembers.findIndex(function (t) {
                        return t.staffId === staffMember.staffId;
                    });
                    if (index !== -1) {
                        staffMembers.splice(index, 1);
                    }
                    presentStaffIds.delete(staffMember.staffId);
                    recordedStaffIds.delete(staffMember.staffId);
                    todayRecords = todayRecords.filter(function (r) {
                        return r.staffId !== staffMember.staffId;
                    });
                    totalStaffCount.textContent = staffMembers.length;
                    presentTodayCount.textContent = presentStaffIds.size;
                    renderStaffDirectory();
                    renderStaffList();
                    if (registerDateInput.value === getTodayDate()) {
                        renderRecords(todayRecords);
                    }
                } else {
                    alert(data.message);
                }
            } catch (err) {
                console.error(err);
                alert("Could not reach the server.");
            } finally {
                removeBtn.disabled = false;
            }
        });

        item.appendChild(details);
        item.appendChild(removeBtn);
        staffList.appendChild(item);
    });
}

openRemoveStaffBtn.addEventListener("click", function () {
    renderStaffList();
    removeStaffModal.hidden = false;
});

closeRemoveStaffBtn.addEventListener("click", function () {
    removeStaffModal.hidden = true;
});

removeStaffModal.addEventListener("click", function (event) {
    if (event.target === removeStaffModal) {
        removeStaffModal.hidden = true;
    }
});

closeEditTimeBtn.addEventListener("click", closeEditTimeModal);
closeEditStaffBtn.addEventListener("click", closeEditStaffModal);

editTimeModal.addEventListener("click", function (event) {
    if (event.target === editTimeModal) {
        closeEditTimeModal();
    }
});

editStaffModal.addEventListener("click", function (event) {
    if (event.target === editStaffModal) {
        closeEditStaffModal();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!editStaffModal.hidden) {
        closeEditStaffModal();
    } else if (!editTimeModal.hidden) {
        closeEditTimeModal();
    } else if (!removeStaffModal.hidden) {
        removeStaffModal.hidden = true;
    } else if (!loginModal.hidden) {
        closeLoginModal();
    }
});

init();
setInterval(checkAttendanceCutoff, 30000);
