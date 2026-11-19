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
    finalize: "finalize_attendance.php"
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

let teachers = [];
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

async function loadStaff() {
    const data = await fetchJson(API.staff);
    teachers = data.staff || [];
    totalStaffCount.textContent = data.total ?? teachers.length;
}

async function checkAuth() {
    const data = await fetchJson(API.authCheck);
    if (data.loggedIn) {
        adminBtn.textContent = "ADMIN OPEN";
        adminBtn.classList.add("active");
    }
    return data.loggedIn;
}

async function loadStats() {
    const data = await fetchJson(API.stats);
    totalStaffCount.textContent = data.totalStaff ?? 0;
    presentTodayCount.textContent = data.presentToday ?? 0;
}

async function openAdminPage() {
    adminPage.hidden = false;
    adminBtn.textContent = "ADMIN OPEN";
    adminBtn.classList.add("active");
    window.scrollTo(0, 0);
    await loadStaff();
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

async function init() {
    registerDateInput.value = getTodayDate();
    registerDateInput.max = getTodayDate();
    try {
        await checkAuth();
        await loadStats();
        if (!isBeforeCutoff()) {
            attendanceLocked = true;
            await postJson(API.finalize, {});
        }
        await loadTodayAttendance();
        await loadRecordsForView();
    } catch (err) {
        console.error(err);
        showFeedback(
            feedbackMessage,
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

    if (newStaffName === "") {
        showFeedback(registerFeedback, "Please enter the staff name.", "error");
        return;
    }

    registerStaffBtn.disabled = true;

    try {
        const data = await postJson(API.register, { name: newStaffName });

        if (data.success) {
            teachers.push({
                name: newStaffName,
                staffId: data.staffId
            });
            totalStaffCount.textContent = teachers.length;
            showFeedback(
                registerFeedback,
                data.message + " Staff ID: " + data.staffId,
                "success"
            );
            staffNameInput.value = "";
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
    adminPage.hidden = true;
    adminBtn.textContent = "ADMIN";
    adminBtn.classList.remove("active");
    teachers = [];
});

adminBackBtn.addEventListener("click", function () {
    adminPage.hidden = true;
    adminBtn.textContent = "ADMIN";
    adminBtn.classList.remove("active");
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

function renderStaffList() {
    staffList.innerHTML = "";

    if (teachers.length === 0) {
        const message = document.createElement("div");
        message.className = "no-staff-message";
        message.textContent = "No staff registered.";
        staffList.appendChild(message);
        return;
    }

    teachers.forEach(function (teacher) {
        const item = document.createElement("div");
        item.className = "staff-item";

        const details = document.createElement("div");
        details.className = "staff-details";

        const name = document.createElement("strong");
        name.textContent = teacher.fullName;

        const id = document.createElement("span");
        id.textContent = teacher.staffId;

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
                    staffId: teacher.staffId
                });

                if (data.success) {
                    const index = teachers.findIndex(function (t) {
                        return t.staffId === teacher.staffId;
                    });
                    if (index !== -1) {
                        teachers.splice(index, 1);
                    }
                    presentStaffIds.delete(teacher.staffId);
                    recordedStaffIds.delete(teacher.staffId);
                    todayRecords = todayRecords.filter(function (r) {
                        return r.staffId !== teacher.staffId;
                    });
                    totalStaffCount.textContent = teachers.length;
                    presentTodayCount.textContent = presentStaffIds.size;
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

document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!removeStaffModal.hidden) {
        removeStaffModal.hidden = true;
    } else if (!loginModal.hidden) {
        closeLoginModal();
    }
});

init();
setInterval(checkAttendanceCutoff, 30000);
