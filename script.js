// ==================== STORAGE KEYS ====================
const KEYS = {
  WORKERS: 'albowry_workers_v2',
  ATTENDANCE: 'albowry_attendance_v2',
  ADMIN: 'albowry_admin_v2',
  CURRENT_USER: 'albowry_current_user_v2'
};

// ==================== INITIAL DATA ====================
const INDIAN_WORKERS = [
  { name: "Sandeep Jangir", profession: "GM" },
  { name: "Pradeep Kumar Jangid", profession: "Production Head" },
  { name: "Nitesh Kumar Bugalia", profession: "Supervisor" },
  { name: "Rajeev Punia", profession: "Supervisor" },
  { name: "Govind Jangir", profession: "Helper" },
  { name: "Abdul Majid", profession: "Helper" },
  { name: "Akaram Khan", profession: "Helper" },
  { name: "Manoj Kumar Jakhar", profession: "Helper" },
  { name: "Punit Kumar", profession: "Helper" },
  { name: "Pintu", profession: "Helper" },
  { name: "Rajendra Kumar", profession: "Helper" },
  { name: "Surendra Kumar Mahala", profession: "Helper" },
  { name: "Lokesh Kumar Varma", profession: "Helper" },
  { name: "Surendra Budania", profession: "Helper" },
  { name: "Pradeep Singh", profession: "Helper" },
  { name: "Sandip Ratanlal Jangid", profession: "Carpenter" },
  { name: "Ajay Jangir", profession: "Carpenter" },
  { name: "Dharmendra Khyalia", profession: "Carpenter" },
  { name: "Pradip Kumar", profession: "Carpenter" },
  { name: "Rajesh Khyalia", profession: "Carpenter" },
  { name: "Raj Pal", profession: "Carpenter" },
  { name: "Suresh Kumar Jangir", profession: "Carpenter" },
  { name: "Rahul Varma", profession: "Carpenter" },
  { name: "Mukesh Saini", profession: "Carpenter" },
  { name: "Deepak Kumar Jangir", profession: "Carpenter" },
  { name: "Jitendra Jangid", profession: "Carpenter" },
  { name: "Rakesh Kumar Jangir", profession: "Carpenter" },
  { name: "Om Prakash", profession: "Carpenter" },
  { name: "Jeth Mal Jangir", profession: "Carpenter" },
  { name: "Rahul", profession: "Carpenter" },
  { name: "Vijendra Kumar", profession: "Carpenter" },
  { name: "Hajari Lal", profession: "Carpenter" }
];

const PAKISTANI_WORKERS = [
  { name: "Ali Raza", profession: "Assistant Carpenter" },
  { name: "Asad Raza", profession: "Assistant Carpenter" },
  { name: "Kashif Hussain", profession: "Assistant Carpenter" },
  { name: "Mudasir Hussain", profession: "Helper" },
  { name: "Muhammad Amjad", profession: "Helper" },
  { name: "Muhammad Arshad", profession: "Helper" },
  { name: "Muhammad Faheem", profession: "Assistant Carpenter" },
  { name: "Muhammad Imtiaz", profession: "Helper" },
  { name: "Muhammad Naeem", profession: "Helper" },
  { name: "Muhammad Parvaiz", profession: "Assistant Carpenter" },
  { name: "Muhammad Ramzan", profession: "Helper" },
  { name: "Muhammad Rizwan", profession: "Helper" },
  { name: "Muhammad Sikandar", profession: "Assistant Carpenter" },
  { name: "Muhammad Saleem", profession: "Helper" },
  { name: "Sami Ullah", profession: "Assistant Carpenter" },
  { name: "Sharafat Hussain", profession: "Assistant Carpenter" },
  { name: "Matloob Ahmad", profession: "Assistant Carpenter" },
  { name: "Taimoor Ahmad", profession: "Assistant Carpenter" },
  { name: "Sher Bahadur", profession: "Helper" },
  { name: "Muhammad Awais", profession: "Assistant Carpenter" },
  { name: "Muhammad Mansoor", profession: "Assistant Carpenter" }
];

// ==================== RANDOM PASSWORD GENERATOR ====================
function generateUniquePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pw = '';
  for (let i = 0; i < 8; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

// ==================== INITIALIZE ====================
function initData() {
  if (!localStorage.getItem(KEYS.WORKERS)) {
    const workers = [];
    INDIAN_WORKERS.forEach((w, i) => {
      workers.push({
        id: 'IND' + String(i + 1).padStart(4, '0'),
        name: w.name,
        profession: w.profession,
        section: 'Indian',
        password: generateUniquePassword(),
        active: true,
        createdAt: new Date().toISOString()
      });
    });
    PAKISTANI_WORKERS.forEach((w, i) => {
      workers.push({
        id: 'PAK' + String(i + 1).padStart(4, '0'),
        name: w.name,
        profession: w.profession,
        section: 'Pakistani',
        password: generateUniquePassword(),
        active: true,
        createdAt: new Date().toISOString()
      });
    });
    localStorage.setItem(KEYS.WORKERS, JSON.stringify(workers));
  }

  if (!localStorage.getItem(KEYS.ADMIN)) {
    localStorage.setItem(KEYS.ADMIN, JSON.stringify({
      id: 'Pradeep',
      password: 'neev@2111',
      name: 'System Administrator'
    }));
  }

  if (!localStorage.getItem(KEYS.ATTENDANCE)) {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify([]));
  }
}

// ==================== HELPERS ====================
const getWorkers = () => JSON.parse(localStorage.getItem(KEYS.WORKERS)) || [];
const saveWorkers = (w) => localStorage.setItem(KEYS.WORKERS, JSON.stringify(w));
const getAttendance = () => JSON.parse(localStorage.getItem(KEYS.ATTENDANCE)) || [];
const saveAttendance = (a) => localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(a));
const getAdmin = () => JSON.parse(localStorage.getItem(KEYS.ADMIN));
const saveAdmin = (a) => localStorage.setItem(KEYS.ADMIN, JSON.stringify(a));
const getCurrentUser = () => JSON.parse(localStorage.getItem(KEYS.CURRENT_USER));
const setCurrentUser = (u) => localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(u));
const clearCurrentUser = () => localStorage.removeItem(KEYS.CURRENT_USER);

function getTurkeyTime() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
}
function getTurkeyDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
}
function getTurkeyDateFormatted() {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'Europe/Istanbul',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
function formatTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
}
function getGreeting() {
  const hour = new Date().toLocaleString('en-US', {
    timeZone: 'Europe/Istanbul', hour: 'numeric', hour12: false
  });
  const h = parseInt(hour);
  if (h < 12) return 'Good Morning ☀️';
  if (h < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

function showNotification(msg, type = 'success') {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.className = 'notification show ' + type;
  setTimeout(() => n.classList.remove('show'), 3500);
}

function togglePassword(id, btn) {
  const input = document.getElementById(id);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

// ==================== LOGIN PAGE ====================
function switchTab(type, e) {
  document.querySelectorAll('#loginPage .tab-btn').forEach(b => b.classList.remove('active'));
  if (e && e.target) {
    e.target.closest('.tab-btn').classList.add('active');
  }
  document.getElementById('workerLogin').classList.remove('active');
  document.getElementById('adminLogin').classList.remove('active');
  document.getElementById(type + 'Login').classList.add('active');
  document.getElementById('loginError').classList.remove('active');
}

function populateWorkerDropdown() {
  const workers = getWorkers().filter(w => w.active);
  const indian = workers.filter(w => w.section === 'Indian');
  const pakistani = workers.filter(w => w.section === 'Pakistani');
  
  let html = '<option value="">-- Choose your name --</option>';
  if (indian.length) {
    html += '<optgroup label="🇮🇳 Indian Workers">';
    indian.forEach(w => {
      html += `<option value="${w.id}">${w.name} (${w.profession})</option>`;
    });
    html += '</optgroup>';
  }
  if (pakistani.length) {
    html += '<optgroup label="🇵🇰 Pakistani Workers">';
    pakistani.forEach(w => {
      html += `<option value="${w.id}">${w.name} (${w.profession})</option>`;
    });
    html += '</optgroup>';
  }
  document.getElementById('workerSelect').innerHTML = html;
}

function showError(msg) {
  const e = document.getElementById('loginError');
  e.textContent = '⚠️ ' + msg;
  e.classList.add('active');
}

function workerLogin() {
  const id = document.getElementById('workerSelect').value;
  const pw = document.getElementById('workerPassword').value;
  if (!id) return showError('Please select your name from the list');
  if (!pw) return showError('Please enter your password');
  
  const worker = getWorkers().find(w => w.id === id);
  if (!worker) return showError('Worker not found');
  if (!worker.active) return showError('Your account is deactivated. Contact admin.');
  if (worker.password !== pw) return showError('Incorrect password. Please try again.');
  
  setCurrentUser({ ...worker, role: 'worker' });
  showNotification('Login successful! Welcome ' + worker.name);
  showWorkerDashboard();
}

function adminLogin() {
  const id = document.getElementById('adminId').value.trim();
  const pw = document.getElementById('adminPassword').value;
  if (!id || !pw) return showError('Please enter both ID and password');
  
  const admin = getAdmin();
  if (admin.id !== id || admin.password !== pw) {
    return showError('Invalid admin credentials');
  }
  
  setCurrentUser({ ...admin, role: 'admin' });
  showNotification('Welcome back, Admin!');
  showAdminDashboard();
}

function logout() {
  if (!confirm('Are you sure you want to logout?')) return;
  clearCurrentUser();
  showPage('loginPage');
  document.getElementById('workerSelect').value = '';
  document.getElementById('workerPassword').value = '';
  document.getElementById('adminId').value = '';
  document.getElementById('adminPassword').value = '';
  document.getElementById('loginError').classList.remove('active');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ==================== WORKER DASHBOARD ====================
function showWorkerDashboard() {
  const user = getCurrentUser();
  document.getElementById('welcomeGreeting').textContent = getGreeting();
  document.getElementById('workerName').textContent = user.name;
  document.getElementById('workerInfo').textContent = `${user.profession} • ${user.section} Section • ID: ${user.id}`;
  document.getElementById('workerNavName').textContent = user.name;
  document.getElementById('workerAvatar').textContent = user.name.charAt(0);
  document.getElementById('currentDate').textContent = getTurkeyDateFormatted();
  showPage('workerDashboard');
  updateWorkerStatus();
  loadWorkerHistory();
}

function updateWorkerStatus() {
  const user = getCurrentUser();
  if (!user || user.role !== 'worker') return;
  
  const today = getTurkeyDate();
  const attendance = getAttendance();
  const record = attendance.find(a => a.workerId === user.id && a.date === today);
  
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const statusSubtext = document.getElementById('statusSubtext');
  const timesDisplay = document.getElementById('timesDisplay');
  const actionButtons = document.getElementById('actionButtons');
  
  timesDisplay.innerHTML = '';
  actionButtons.innerHTML = '';
  
  if (!record) {
    statusIcon.textContent = '📋';
    statusText.textContent = 'Not Logged In';
    statusSubtext.textContent = 'Click below to start your day';
    actionButtons.innerHTML = `<button class="btn btn-success" onclick="requestLogin()"><span>🔓</span> Request Login</button>`;
    return;
  }
  
  if (record.loginTime) {
    timesDisplay.innerHTML += `<div class="time-item"><small>Login Time</small><strong style="color:#059669">${formatTime(record.loginTime)}</strong></div>`;
  }
  if (record.logoutTime) {
    timesDisplay.innerHTML += `<div class="time-item"><small>Logout Time</small><strong style="color:#dc2626">${formatTime(record.logoutTime)}</strong></div>`;
  }
  if (record.totalHours > 0) {
    timesDisplay.innerHTML += `<div class="time-item"><small>Total Hours</small><strong style="color:#1e40af">${record.totalHours.toFixed(2)}h</strong></div>`;
  }
  if (record.overtimeHours > 0) {
    timesDisplay.innerHTML += `<div class="time-item"><small>Overtime</small><strong style="color:#d97706">${record.overtimeHours.toFixed(2)}h</strong></div>`;
  }
  
  switch (record.status) {
    case 'pending_login':
      statusIcon.textContent = '⏳';
      statusText.textContent = 'Login Pending';
      statusSubtext.textContent = 'Waiting for admin approval';
      actionButtons.innerHTML = `<div class="pending-badge">⏳ Waiting for admin to approve your login...</div>`;
      break;
    case 'logged_in':
      statusIcon.textContent = '✅';
      statusText.textContent = 'You are Logged In';
      statusSubtext.textContent = 'Have a productive day!';
      actionButtons.innerHTML = `<button class="btn btn-danger" onclick="requestLogout()"><span>🔒</span> Request Logout</button>`;
      break;
    case 'pending_logout':
      statusIcon.textContent = '⏳';
      statusText.textContent = 'Logout Pending';
      statusSubtext.textContent = 'Waiting for admin approval';
      actionButtons.innerHTML = `<div class="pending-badge">⏳ Waiting for admin to approve your logout...</div>`;
      break;
    case 'completed':
      statusIcon.textContent = '🎉';
      statusText.textContent = 'Day Completed';
      statusSubtext.textContent = 'Great work today!';
      break;
  }
}

function requestLogin() {
  const user = getCurrentUser();
  const today = getTurkeyDate();
  const attendance = getAttendance();
  
  if (attendance.find(a => a.workerId === user.id && a.date === today)) {
    return showNotification('You already have an attendance record for today', 'error');
  }
  
  attendance.push({
    id: Date.now(),
    workerId: user.id,
    workerName: user.name,
    profession: user.profession,
    section: user.section,
    date: today,
    loginRequestTime: new Date().toISOString(),
    loginTime: null,
    logoutTime: null,
    totalHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    status: 'pending_login'
  });
  
  saveAttendance(attendance);
  showNotification('✅ Login request sent to admin!');
  updateWorkerStatus();
}

function requestLogout() {
  const user = getCurrentUser();
  const today = getTurkeyDate();
  const attendance = getAttendance();
  const record = attendance.find(a => a.workerId === user.id && a.date === today);
  
  if (!record || record.status !== 'logged_in') {
    return showNotification('Cannot logout right now', 'error');
  }
  
  record.logoutRequestTime = new Date().toISOString();
  record.status = 'pending_logout';
  saveAttendance(attendance);
  showNotification('✅ Logout request sent to admin!');
  updateWorkerStatus();
}

function loadWorkerHistory() {
  const user = getCurrentUser();
  const attendance = getAttendance()
    .filter(a => a.workerId === user.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);
  
  document.getElementById('historyCount').textContent = attendance.length + ' records';
  
  const list = document.getElementById('historyList');
  if (attendance.length === 0) {
    list.innerHTML = '<div class="empty"><div>📭</div><h3>No History</h3><p>Your attendance records will appear here</p></div>';
    return;
  }
  
  list.innerHTML = attendance.map(r => `
    <div class="history-item">
      <strong>${r.date}</strong>
      <span style="color:#059669">In: ${formatTime(r.loginTime)}</span>
      <span style="color:#dc2626">Out: ${formatTime(r.logoutTime)}</span>
      <strong style="color:#1e40af">${(r.totalHours || 0).toFixed(2)}h</strong>
      ${r.overtimeHours > 0 ? `<span class="tag tag-warning">OT ${r.overtimeHours.toFixed(2)}h</span>` : '<span></span>'}
    </div>
  `).join('');
}

function changeWorkerPassword() {
  const current = document.getElementById('currentWPassword').value;
  const newPw = document.getElementById('newWPassword').value;
  const confirm = document.getElementById('confirmWPassword').value;
  
  if (!current || !newPw || !confirm) {
    return showNotification('Please fill all fields', 'error');
  }
  if (newPw !== confirm) {
    return showNotification('New passwords do not match', 'error');
  }
  if (newPw.length < 4) {
    return showNotification('Password must be at least 4 characters', 'error');
  }
  
  const user = getCurrentUser();
  const workers = getWorkers();
  const worker = workers.find(w => w.id === user.id);
  
  if (worker.password !== current) {
    return showNotification('Current password is incorrect', 'error');
  }
  
  worker.password = newPw;
  saveWorkers(workers);
  setCurrentUser({ ...user, password: newPw });
  
  document.getElementById('currentWPassword').value = '';
  document.getElementById('newWPassword').value = '';
  document.getElementById('confirmWPassword').value = '';
  
  showNotification('✅ Password updated successfully!');
}

// ==================== ADMIN DASHBOARD ====================
function showAdminDashboard() {
  const user = getCurrentUser();
  document.getElementById('adminNavName').textContent = user.name;
  showPage('adminDashboard');
  document.getElementById('filterDate').value = getTurkeyDate();
  document.getElementById('exportStart').value = getTurkeyDate();
  document.getElementById('exportEnd').value = getTurkeyDate();
  document.getElementById('currentAdminId').value = user.id;
  loadDashboardStats();
}

function showAdminSection(section, e) {
  document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
  if (e && e.target) {
    (e.target.closest ? e.target.closest('.menu-btn') : e.target).classList.add('active');
  }
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + section).classList.add('active');
  
  if (section === 'dashboard') loadDashboardStats();
  if (section === 'approvals') loadApprovals();
  if (section === 'attendance') loadAttendanceData();
  if (section === 'workers') loadWorkers();
}

function loadDashboardStats() {
  const workers = getWorkers().filter(w => w.active);
  const today = getTurkeyDate();
  const attendance = getAttendance().filter(a => a.date === today);
  
  const presentToday = attendance.filter(a => 
    a.status === 'logged_in' || a.status === 'completed' || a.status === 'pending_logout'
  ).length;
  const pending = attendance.filter(a => 
    a.status === 'pending_login' || a.status === 'pending_logout'
  ).length;
  
  const indian = workers.filter(w => w.section === 'Indian');
  const pakistani = workers.filter(w => w.section === 'Pakistani');
  const indianPresent = attendance.filter(a => 
    a.section === 'Indian' && (a.status === 'logged_in' || a.status === 'completed' || a.status === 'pending_logout')
  ).length;
  const pakistaniPresent = attendance.filter(a => 
    a.section === 'Pakistani' && (a.status === 'logged_in' || a.status === 'completed' || a.status === 'pending_logout')
  ).length;
  const indianPending = attendance.filter(a =>
    a.section === 'Indian' && (a.status === 'pending_login' || a.status === 'pending_logout')
  ).length;
  const pakistaniPending = attendance.filter(a =>
    a.section === 'Pakistani' && (a.status === 'pending_login' || a.status === 'pending_logout')
  ).length;
  
  document.getElementById('totalWorkers').textContent = workers.length;
  document.getElementById('presentToday').textContent = presentToday;
  document.getElementById('absentToday').textContent = workers.length - presentToday;
  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('indianTotal').textContent = indian.length;
  document.getElementById('indianPresent').textContent = indianPresent;
  document.getElementById('indianAbsent').textContent = indian.length - indianPresent;
  document.getElementById('indianPending').textContent = indianPending;
  document.getElementById('pakistaniTotal').textContent = pakistani.length;
  document.getElementById('pakistaniPresent').textContent = pakistaniPresent;
  document.getElementById('pakistaniAbsent').textContent = pakistani.length - pakistaniPresent;
  document.getElementById('pakistaniPending').textContent = pakistaniPending;
  
  document.getElementById('indianBar').style.width = 
    (indian.length ? (indianPresent / indian.length * 100) : 0) + '%';
  document.getElementById('pakistaniBar').style.width = 
    (pakistani.length ? (pakistaniPresent / pakistani.length * 100) : 0) + '%';
  
  const badge = document.getElementById('pendingBadge');
  if (pending > 0) {
    badge.textContent = pending;
    badge.classList.add('show');
  } else {
    badge.classList.remove('show');
  }
}

function loadApprovals() {
  const pending = getAttendance().filter(a => 
    a.status === 'pending_login' || a.status === 'pending_logout'
  ).sort((a, b) => new Date(a.loginRequestTime || a.logoutRequestTime) - new Date(b.loginRequestTime || b.logoutRequestTime));
  
  const list = document.getElementById('approvalsList');
  if (pending.length === 0) {
    list.innerHTML = '<div class="empty"><div>✅</div><h3>All Clear!</h3><p>No pending approvals at this moment</p></div>';
    return;
  }
  
  list.innerHTML = pending.map(p => {
    const isLogin = p.status === 'pending_login';
    return `
      <div class="approval-item">
        <div class="approval-info">
          <h4>${p.workerName} 
            <span class="tag tag-${p.section === 'Indian' ? 'indian' : 'pakistani'}">${p.section === 'Indian' ? '🇮🇳' : '🇵🇰'} ${p.section}</span>
            <span class="tag ${isLogin ? 'tag-success' : 'tag-danger'}">${isLogin ? '🔓 LOGIN' : '🔒 LOGOUT'} REQUEST</span>
          </h4>
          <p><strong>Profession:</strong> ${p.profession} • <strong>ID:</strong> ${p.workerId}</p>
          <p><strong>Requested at:</strong> ${formatTime(isLogin ? p.loginRequestTime : p.logoutRequestTime)}</p>
          ${!isLogin ? `<p><strong>Logged in at:</strong> ${formatTime(p.loginTime)}</p>` : ''}
        </div>
        <div class="approval-actions">
          <button class="btn btn-success btn-sm" onclick="approve(${p.id})">✅ Approve</button>
          <button class="btn btn-danger btn-sm" onclick="reject(${p.id})">❌ Reject</button>
        </div>
      </div>
    `;
  }).join('');
}

function approve(id) {
  const attendance = getAttendance();
  const record = attendance.find(a => a.id === id);
  if (!record) return;
  
  if (record.status === 'pending_login') {
    record.loginTime = record.loginRequestTime;
    record.status = 'logged_in';
    showNotification('✅ Login approved for ' + record.workerName);
  } else if (record.status === 'pending_logout') {
    record.logoutTime = record.logoutRequestTime;
    const login = new Date(record.loginTime);
    const logout = new Date(record.logoutTime);
    const hours = (logout - login) / (1000 * 60 * 60);
    record.totalHours = Math.round(hours * 100) / 100;
    record.regularHours = Math.round(Math.min(hours, 9) * 100) / 100;
    record.overtimeHours = Math.max(0, Math.round((hours - 9) * 100) / 100);
    record.status = 'completed';
    showNotification('✅ Logout approved! Total: ' + record.totalHours.toFixed(2) + 'h');
  }
  
  saveAttendance(attendance);
  loadApprovals();
  loadDashboardStats();
}

function reject(id) {
  if (!confirm('Are you sure you want to reject this request?')) return;
  let attendance = getAttendance();
  const record = attendance.find(a => a.id === id);
  if (!record) return;
  
  if (record.status === 'pending_login') {
    attendance = attendance.filter(a => a.id !== id);
  } else if (record.status === 'pending_logout') {
    record.logoutRequestTime = null;
    record.status = 'logged_in';
  }
  
  saveAttendance(attendance);
  showNotification('Request rejected', 'info');
  loadApprovals();
  loadDashboardStats();
}

function loadAttendanceData() {
  const date = document.getElementById('filterDate').value;
  const section = document.getElementById('filterSection').value;
  let attendance = getAttendance().filter(a => a.date === date);
  if (section) attendance = attendance.filter(a => a.section === section);
  
  const table = document.getElementById('attendanceTable');
  if (attendance.length === 0) {
    table.innerHTML = '<div class="empty"><div>📋</div><h3>No Records</h3><p>No attendance found for selected date</p></div>';
    return;
  }
  
  const statusTag = (s) => ({
    'completed': '<span class="tag tag-success">✓ Completed</span>',
    'logged_in': '<span class="tag tag-info">● Logged In</span>',
    'pending_login': '<span class="tag tag-warning">⏳ Login Pending</span>',
    'pending_logout': '<span class="tag tag-warning">⏳ Logout Pending</span>'
  }[s] || s);
  
  table.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th><th>Employee ID</th><th>Name</th><th>Profession</th><th>Section</th>
            <th>Login</th><th>Logout</th><th>Total</th><th>Regular</th><th>OT</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${attendance.map((a, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><code style="color:#1e40af;font-weight:600">${a.workerId}</code></td>
              <td><strong>${a.workerName}</strong></td>
              <td>${a.profession}</td>
              <td><span class="tag tag-${a.section === 'Indian' ? 'indian' : 'pakistani'}">${a.section === 'Indian' ? '🇮🇳' : '🇵🇰'} ${a.section}</span></td>
              <td style="color:#059669;font-weight:500">${formatTime(a.loginTime)}</td>
              <td style="color:#dc2626;font-weight:500">${formatTime(a.logoutTime)}</td>
              <td style="color:#1e40af;font-weight:700">${(a.totalHours || 0).toFixed(2)}h</td>
              <td>${(a.regularHours || 0).toFixed(2)}h</td>
              <td style="color:#d97706;font-weight:600">${a.overtimeHours > 0 ? a.overtimeHours.toFixed(2) + 'h' : '-'}</td>
              <td>${statusTag(a.status)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==================== WORKERS MANAGEMENT ====================
let currentWorkerTab = 'Indian';
let editingWorkerId = null;

function switchWorkerTab(section, e) {
  currentWorkerTab = section;
  document.querySelectorAll('#section-workers .tab-btn').forEach(b => b.classList.remove('active'));
  if (e && e.target) e.target.closest('.tab-btn').classList.add('active');
  loadWorkers();
}

function loadWorkers() {
  const search = document.getElementById('workerSearch').value.toLowerCase();
  let workers = getWorkers().filter(w => w.section === currentWorkerTab);
  
  const indianCount = getWorkers().filter(w => w.section === 'Indian' && w.active).length;
  const pakistaniCount = getWorkers().filter(w => w.section === 'Pakistani' && w.active).length;
  document.getElementById('indianTabCount').textContent = `(${indianCount})`;
  document.getElementById('pakistaniTabCount').textContent = `(${pakistaniCount})`;
  
  if (search) {
    workers = workers.filter(w => 
      w.name.toLowerCase().includes(search) ||
      w.id.toLowerCase().includes(search) ||
      w.profession.toLowerCase().includes(search)
    );
  }
  
  const table = document.getElementById('workersTable');
  if (workers.length === 0) {
    table.innerHTML = '<div class="empty"><div>👷</div><h3>No Workers Found</h3></div>';
    return;
  }
  
  table.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th><th>ID</th><th>Name</th><th>Profession</th>
            <th>Password</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${workers.map((w, i) => `
            <tr style="${!w.active ? 'opacity:0.5' : ''}">
              <td>${i + 1}</td>
              <td><code style="color:#1e40af;font-weight:600">${w.id}</code></td>
              <td><strong>${w.name}</strong></td>
              <td>${w.profession}</td>
              <td>
                <code id="pw-${w.id}" style="background:#f0f9ff;padding:3px 8px;border-radius:4px;color:#1e40af">••••••••</code>
                <button class="btn btn-outline btn-sm" onclick="revealPassword('${w.id}')" style="padding:3px 8px;margin-left:4px" title="Show password">👁️</button>
              </td>
              <td>${w.active ? '<span class="tag tag-success">Active</span>' : '<span class="tag tag-danger">Inactive</span>'}</td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="editWorker('${w.id}')" title="Edit">✏️</button>
                <button class="btn btn-outline btn-sm" onclick="resetWorkerPassword('${w.id}')" title="Reset Password">🔑</button>
                <button class="btn btn-${w.active ? 'danger' : 'success'} btn-sm" onclick="toggleWorker('${w.id}')" title="${w.active ? 'Deactivate' : 'Activate'}">
                  ${w.active ? '🚫' : '✅'}
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteWorker('${w.id}')" title="Delete">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function revealPassword(id) {
  const worker = getWorkers().find(w => w.id === id);
  if (!worker) return;
  const el = document.getElementById('pw-' + id);
  if (el.textContent === '••••••••') {
    el.textContent = worker.password;
    setTimeout(() => { el.textContent = '••••••••'; }, 3000);
  }
}

function resetWorkerPassword(id) {
  if (!confirm('Reset password for this worker? A new random password will be generated.')) return;
  const workers = getWorkers();
  const worker = workers.find(w => w.id === id);
  const newPw = generateUniquePassword();
  worker.password = newPw;
  saveWorkers(workers);
  
  document.getElementById('passwordDisplay').innerHTML = `
    <div class="pw-display">
      <div class="pw-label">New Password for</div>
      <div class="pw-name">${worker.name} (${worker.id})</div>
      <div class="pw-value" style="margin-top:10px">${newPw}</div>
    </div>
    <div class="pw-warning">
      ⚠️ <strong>Important:</strong> Please note down this password and share it with the worker. This is the only time you can view it easily.
    </div>
  `;
  document.getElementById('passwordModal').classList.add('active');
  loadWorkers();
}

function openWorkerModal() {
  editingWorkerId = null;
  document.getElementById('modalTitle').textContent = '➕ Add New Worker';
  document.getElementById('wName').value = '';
  document.getElementById('wProfession').value = '';
  document.getElementById('wSection').value = currentWorkerTab;
  document.getElementById('wPassword').value = generateUniquePassword();
  document.getElementById('workerModal').classList.add('active');
}

function editWorker(id) {
  const worker = getWorkers().find(w => w.id === id);
  if (!worker) return;
  editingWorkerId = id;
  document.getElementById('modalTitle').textContent = '✏️ Edit Worker (' + id + ')';
  document.getElementById('wName').value = worker.name;
  document.getElementById('wProfession').value = worker.profession;
  document.getElementById('wSection').value = worker.section;
  document.getElementById('wPassword').value = worker.password;
  document.getElementById('workerModal').classList.add('active');
}

function closeWorkerModal() {
  document.getElementById('workerModal').classList.remove('active');
}

function generatePassword() {
  document.getElementById('wPassword').value = generateUniquePassword();
  showNotification('New password generated!', 'info');
}

function saveWorker() {
  const name = document.getElementById('wName').value.trim();
  const profession = document.getElementById('wProfession').value;
  const section = document.getElementById('wSection').value;
  const password = document.getElementById('wPassword').value.trim();
  
  if (!name || !profession || !password) {
    return showNotification('Please fill all required fields', 'error');
  }
  
  const workers = getWorkers();
  
  if (editingWorkerId) {
    const worker = workers.find(w => w.id === editingWorkerId);
    worker.name = name;
    worker.profession = profession;
    worker.section = section;
    worker.password = password;
    showNotification('✅ Worker updated successfully!');
  } else {
    const prefix = section === 'Indian' ? 'IND' : 'PAK';
    const sameSection = workers.filter(w => w.section === section);
    const nums = sameSection.map(w => parseInt(w.id.replace(prefix, ''))).filter(n => !isNaN(n));
    const nextNum = nums.length ? Math.max(...nums) + 1 : 1;
    const id = prefix + String(nextNum).padStart(4, '0');
    workers.push({
      id, name, profession, section, password,
      active: true,
      createdAt: new Date().toISOString()
    });
    
    document.getElementById('passwordDisplay').innerHTML = `
      <div class="pw-display">
        <div class="pw-label">Worker Added Successfully</div>
        <div class="pw-name">${name} (${id})</div>
        <div class="pw-value" style="margin-top:10px">${password}</div>
      </div>
      <div class="pw-warning">
        ⚠️ <strong>Save this password!</strong> Share these credentials with the worker.
      </div>
    `;
    document.getElementById('passwordModal').classList.add('active');
    showNotification('✅ Worker added! ID: ' + id);
  }
  
  saveWorkers(workers);
  closeWorkerModal();
  loadWorkers();
  populateWorkerDropdown();
  loadDashboardStats();
}

function toggleWorker(id) {
  const workers = getWorkers();
  const worker = workers.find(w => w.id === id);
  worker.active = !worker.active;
  saveWorkers(workers);
  showNotification(worker.active ? 'Worker activated' : 'Worker deactivated', 'info');
  loadWorkers();
  populateWorkerDropdown();
  loadDashboardStats();
}

function deleteWorker(id) {
  const worker = getWorkers().find(w => w.id === id);
  if (!confirm(`⚠️ Permanently delete ${worker.name}?\n\nThis will also delete ALL their attendance records. This action cannot be undone.`)) return;
  let workers = getWorkers().filter(w => w.id !== id);
  let attendance = getAttendance().filter(a => a.workerId !== id);
  saveWorkers(workers);
  saveAttendance(attendance);
  showNotification('Worker deleted permanently', 'info');
  loadWorkers();
  populateWorkerDropdown();
  loadDashboardStats();
}

// ==================== ADMIN SETTINGS ====================
function updateAdminCredentials() {
  const newId = document.getElementById('newAdminId').value.trim();
  const newPw = document.getElementById('newAdminPassword').value;
  const confirmPw = document.getElementById('confirmAdminPassword').value;
  
  if (!newId || !newPw) {
    return showNotification('Please fill all fields', 'error');
  }
  if (newPw !== confirmPw) {
    return showNotification('Passwords do not match', 'error');
  }
  if (newPw.length < 6) {
    return showNotification('Password must be at least 6 characters', 'error');
  }
  
  const admin = getAdmin();
  admin.id = newId;
  admin.password = newPw;
  saveAdmin(admin);
  
  const user = getCurrentUser();
  user.id = newId;
  user.password = newPw;
  setCurrentUser(user);
  
  document.getElementById('currentAdminId').value = newId;
  document.getElementById('newAdminId').value = '';
  document.getElementById('newAdminPassword').value = '';
  document.getElementById('confirmAdminPassword').value = '';
  
  showNotification('✅ Admin credentials updated!');
}

// ==================== BACKUP / RESTORE ====================
function backupData() {
  const data = {
    workers: getWorkers(),
    attendance: getAttendance(),
    admin: getAdmin(),
    exportDate: new Date().toISOString(),
    version: '2.0'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Albowry_Backup_${getTurkeyDate()}.json`;
  link.click();
  showNotification('✅ Backup downloaded!');
}

function restoreData(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!confirm('This will replace ALL current data. Continue?')) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.workers) saveWorkers(data.workers);
      if (data.attendance) saveAttendance(data.attendance);
      if (data.admin) saveAdmin(data.admin);
      showNotification('✅ Data restored successfully! Please login again.');
      setTimeout(() => { clearCurrentUser(); location.reload(); }, 2000);
    } catch (err) {
      showNotification('Invalid backup file', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('⚠️ WARNING: This will delete ALL attendance records!\n\nWorkers and admin data will remain. Continue?')) return;
  if (!confirm('Are you absolutely sure? This cannot be undone!')) return;
  saveAttendance([]);
  showNotification('All attendance data cleared', 'info');
  loadDashboardStats();
}

// ==================== EXPORT ====================
function setExportDate(range) {
  const today = new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' });
  const now = new Date(today);
  
  if (range === 'today') {
    document.getElementById('exportStart').value = getTurkeyDate();
    document.getElementById('exportEnd').value = getTurkeyDate();
  } else if (range === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    document.getElementById('exportStart').value = monday.toLocaleDateString('en-CA');
    document.getElementById('exportEnd').value = getTurkeyDate();
  } else if (range === 'month') {
    document.getElementById('exportStart').value = getTurkeyDate().substring(0, 8) + '01';
    document.getElementById('exportEnd').value = getTurkeyDate();
  }
}

function exportToExcel() {
  const start = document.getElementById('exportStart').value;
  const end = document.getElementById('exportEnd').value;
  const section = document.getElementById('exportSection').value;
  
  if (!start || !end) return showNotification('Select date range', 'error');
  
  let data = getAttendance().filter(a => a.date >= start && a.date <= end);
  if (section) data = data.filter(a => a.section === section);
  if (data.length === 0) return showNotification('No data to export', 'error');
  
  // Build HTML table for Excel
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; font-family: Arial; }
        .title { background: #1e40af; color: white; font-size: 22px; font-weight: bold; text-align: center; padding: 15px; }
        .subtitle { background: #3b82f6; color: white; text-align: center; padding: 8px; font-size: 12px; }
        .period { background: #dbeafe; text-align: center; padding: 8px; font-weight: 600; }
        th { background: #1e40af; color: white; padding: 10px; border: 1px solid #1e3a8a; text-align: center; font-size: 12px; }
        td { padding: 8px; border: 1px solid #ccc; font-size: 11px; text-align: center; }
        .even { background: #f0f9ff; }
        .indian { color: #9a3412; font-weight: 600; }
        .pakistani { color: #065f46; font-weight: 600; }
        .footer { background: #1e40af; color: white; text-align: center; padding: 10px; font-size: 11px; }
      </style>
    </head>
    <body>
      <table border="1">
        <tr><td colspan="11" class="title">ALBOWRY CARPENTRY - ATTENDANCE REPORT</td></tr>
        <tr><td colspan="11" class="subtitle">Place of Work: Antalya, Turkey | Timezone: Europe/Istanbul (UTC+3) | www.albowry.com</td></tr>
        <tr><td colspan="11" class="period">Period: ${start} to ${end} ${section ? ' | Section: ' + section : ' | All Sections'}</td></tr>
        <tr><td colspan="11" style="height:10px;"></td></tr>
        <tr>
          <th>S.No</th>
          <th>Employee ID</th>
          <th>Full Name</th>
          <th>Profession</th>
          <th>Section</th>
          <th>Date</th>
          <th>Login Time</th>
          <th>Logout Time</th>
          <th>Total Hours</th>
          <th>Regular Hours</th>
          <th>Overtime</th>
        </tr>
        ${data.map((a, i) => `
          <tr class="${i % 2 === 0 ? 'even' : ''}">
            <td>${i + 1}</td>
            <td>${a.workerId}</td>
            <td style="text-align:left;padding-left:10px"><strong>${a.workerName}</strong></td>
            <td>${a.profession}</td>
            <td class="${a.section.toLowerCase()}">${a.section}</td>
            <td>${a.date}</td>
            <td>${formatTime(a.loginTime)}</td>
            <td>${formatTime(a.logoutTime)}</td>
            <td><strong>${(a.totalHours || 0).toFixed(2)}</strong></td>
            <td>${(a.regularHours || 0).toFixed(2)}</td>
            <td>${(a.overtimeHours || 0).toFixed(2)}</td>
          </tr>
        `).join('')}
        <tr>
          <td colspan="8" style="text-align:right;padding:10px;background:#f0f9ff"><strong>TOTAL:</strong></td>
          <td style="background:#dbeafe"><strong>${data.reduce((s, a) => s + (a.totalHours || 0), 0).toFixed(2)}</strong></td>
          <td style="background:#dbeafe"><strong>${data.reduce((s, a) => s + (a.regularHours || 0), 0).toFixed(2)}</strong></td>
          <td style="background:#dbeafe"><strong>${data.reduce((s, a) => s + (a.overtimeHours || 0), 0).toFixed(2)}</strong></td>
        </tr>
        <tr><td colspan="11" style="height:10px;"></td></tr>
        <tr><td colspan="11" class="footer">© 2024 Albowry Carpentry | Generated on ${new Date().toLocaleString()} | www.albowry.com</td></tr>
      </table>
    </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Albowry_Attendance_${start}_to_${end}.xls`;
  link.click();
  showNotification('✅ Excel report downloaded!');
}

function exportToCSV() {
  const start = document.getElementById('exportStart').value;
  const end = document.getElementById('exportEnd').value;
  const section = document.getElementById('exportSection').value;
  
  if (!start || !end) return showNotification('Select date range', 'error');
  
  let data = getAttendance().filter(a => a.date >= start && a.date <= end);
  if (section) data = data.filter(a => a.section === section);
  if (data.length === 0) return showNotification('No data to export', 'error');
  
  const headers = ['S.No', 'Employee ID', 'Name', 'Profession', 'Section', 'Date', 'Login Time', 'Logout Time', 'Total Hours', 'Regular Hours', 'Overtime Hours', 'Status'];
  const rows = data.map((a, i) => [
    i + 1, a.workerId, a.workerName, a.profession, a.section, a.date,
    formatTime(a.loginTime), formatTime(a.logoutTime),
    (a.totalHours || 0).toFixed(2), (a.regularHours || 0).toFixed(2),
    (a.overtimeHours || 0).toFixed(2), a.status
  ]);
  
  let csv = 'ALBOWRY CARPENTRY - ATTENDANCE REPORT\n';
  csv += `Place: Antalya Turkey,Period: ${start} to ${end},Section: ${section || 'All'}\n\n`;
  csv += headers.join(',') + '\n';
  csv += rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Albowry_Attendance_${start}_to_${end}.csv`;
  link.click();
  showNotification('✅ CSV downloaded!');
}

// ==================== CLOCKS ====================
function updateClocks() {
  const t = getTurkeyTime();
  ['loginTime', 'workerTime', 'adminTime', 'workerBigTime'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = t;
  });
}

// ==================== ON LOAD ====================
window.addEventListener('DOMContentLoaded', () => {
  initData();
  populateWorkerDropdown();
  updateClocks();
  setInterval(updateClocks, 1000);
  
  setInterval(() => {
    const user = getCurrentUser();
    if (user && user.role === 'worker') updateWorkerStatus();
    if (user && user.role === 'admin') {
      loadDashboardStats();
      if (document.getElementById('section-approvals').classList.contains('active')) {
        loadApprovals();
      }
    }
  }, 5000);
  
  const user = getCurrentUser();
  if (user) {
    if (user.role === 'worker') showWorkerDashboard();
    else if (user.role === 'admin') showAdminDashboard();
  }
});