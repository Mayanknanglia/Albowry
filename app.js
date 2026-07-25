// ========== CONFIG ==========
const REG_HOURS = 8;
const DEFAULT_PW = 'Worker@123';
const CURRENT_YEAR = 2026;

const COL = {
  WORKERS: 'workers',
  ATTENDANCE: 'attendance',
  ADMIN: 'admin'
};

const K = { U: 'alb_user_session' };

// ========== WORKERS DATA ==========
const IND = [
  {n:"Sandeep Jangir",p:"GM"},{n:"Pradeep Kumar Jangid",p:"Production Head"},
  {n:"Nitesh Kumar Bugalia",p:"Supervisor"},{n:"Rajeev Punia",p:"Supervisor"},
  {n:"Govind Jangir",p:"Helper"},{n:"Abdul Majid",p:"Helper"},
  {n:"Akaram Khan",p:"Helper"},{n:"Manoj Kumar Jakhar",p:"Helper"},
  {n:"Punit Kumar",p:"Helper"},{n:"Pintu",p:"Helper"},
  {n:"Rajendra Kumar",p:"Helper"},{n:"Surendra Kumar Mahala",p:"Helper"},
  {n:"Lokesh Kumar Varma",p:"Helper"},{n:"Surendra Budania",p:"Helper"},
  {n:"Pradeep Singh",p:"Helper"},{n:"Sandip Ratanlal Jangid",p:"Carpenter"},
  {n:"Ajay Jangir",p:"Carpenter"},{n:"Dharmendra Khyalia",p:"Carpenter"},
  {n:"Pradip Kumar",p:"Carpenter"},{n:"Rajesh Khyalia",p:"Carpenter"},
  {n:"Raj Pal",p:"Carpenter"},{n:"Suresh Kumar Jangir",p:"Carpenter"},
  {n:"Rahul Varma",p:"Carpenter"},{n:"Mukesh Saini",p:"Carpenter"},
  {n:"Deepak Kumar Jangir",p:"Carpenter"},{n:"Jitendra Jangid",p:"Carpenter"},
  {n:"Rakesh Kumar Jangir",p:"Carpenter"},{n:"Om Prakash",p:"Carpenter"},
  {n:"Jeth Mal Jangir",p:"Carpenter"},{n:"Rahul",p:"Carpenter"},
  {n:"Vijendra Kumar",p:"Carpenter"},{n:"Hajari Lal",p:"Carpenter"}
];
const PAK = [
  {n:"Ali Raza",p:"Assistant Carpenter"},{n:"Asad Raza",p:"Assistant Carpenter"},
  {n:"Kashif Hussain",p:"Assistant Carpenter"},{n:"Mudasir Hussain",p:"Helper"},
  {n:"Muhammad Amjad",p:"Helper"},{n:"Muhammad Arshad",p:"Helper"},
  {n:"Muhammad Faheem",p:"Assistant Carpenter"},{n:"Muhammad Imtiaz",p:"Helper"},
  {n:"Muhammad Naeem",p:"Helper"},{n:"Muhammad Parvaiz",p:"Assistant Carpenter"},
  {n:"Muhammad Ramzan",p:"Helper"},{n:"Muhammad Rizwan",p:"Helper"},
  {n:"Muhammad Sikandar",p:"Assistant Carpenter"},{n:"Muhammad Saleem",p:"Helper"},
  {n:"Sami Ullah",p:"Assistant Carpenter"},{n:"Sharafat Hussain",p:"Assistant Carpenter"},
  {n:"Matloob Ahmad",p:"Assistant Carpenter"},{n:"Taimoor Ahmad",p:"Assistant Carpenter"},
  {n:"Sher Bahadur",p:"Helper"},{n:"Muhammad Awais",p:"Assistant Carpenter"},
  {n:"Muhammad Mansoor",p:"Assistant Carpenter"}
];

let workersCache = [];
let attendanceCache = [];
let adminCache = null;

// ========== FIREBASE HELPERS ==========
async function fbGetAll(colName) {
  try {
    const snapshot = await window.fbGetDocs(window.fbCollection(window.fbDB, colName));
    const data = [];
    snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    return data;
  } catch (e) {
    console.error('Fetch error:', e);
    return [];
  }
}

async function fbGetOne(colName, docId) {
  try {
    const docRef = window.fbDoc(window.fbDB, colName, docId);
    const docSnap = await window.fbGetDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
    return null;
  } catch (e) {
    console.error('Error:', e);
    return null;
  }
}

async function fbSave(colName, docId, data) {
  try {
    await window.fbSetDoc(window.fbDoc(window.fbDB, colName, docId), data);
    return true;
  } catch (e) {
    console.error('Save error:', e);
    toast('❌ Save failed. Check internet.', 'err');
    return false;
  }
}

async function fbDelete(colName, docId) {
  try {
    await window.fbDeleteDoc(window.fbDoc(window.fbDB, colName, docId));
    return true;
  } catch (e) {
    console.error('Delete error:', e);
    return false;
  }
}

function fbListen(colName, callback) {
  return window.fbOnSnapshot(window.fbCollection(window.fbDB, colName), (snapshot) => {
    const data = [];
    snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}

// ========== INIT DATABASE ==========
async function initDB() {
  console.log('🔥 Initializing database...');
  
  // Check workers
  const existingWorkers = await fbGetAll(COL.WORKERS);
  if (existingWorkers.length === 0) {
    console.log('First time setup - Creating workers...');
    toast('First time setup - Creating workers...', 'info');
    
    for (let i = 0; i < IND.length; i++) {
      const w = IND[i];
      const id = 'IND' + String(i+1).padStart(4,'0');
      await fbSave(COL.WORKERS, id, { 
        wid: id, name: w.n, prof: w.p, sec: 'Indian', 
        pw: DEFAULT_PW, on: true, createdAt: new Date().toISOString() 
      });
    }
    for (let i = 0; i < PAK.length; i++) {
      const w = PAK[i];
      const id = 'PAK' + String(i+1).padStart(4,'0');
      await fbSave(COL.WORKERS, id, { 
        wid: id, name: w.n, prof: w.p, sec: 'Pakistani', 
        pw: DEFAULT_PW, on: true, createdAt: new Date().toISOString() 
      });
    }
    console.log('✅ Workers created!');
  }
  
  // Check admin
  const admin = await fbGetOne(COL.ADMIN, 'main');
  if (!admin) {
    await fbSave(COL.ADMIN, 'main', { 
      adminId: 'ADMIN001', pw: 'Admin@2026', name: 'Administrator' 
    });
    console.log('✅ Admin created!');
  }
  
  // Setup real-time listeners
  fbListen(COL.WORKERS, (data) => {
    workersCache = data;
    fillDropdown();
    const u = gU();
    if (u && u.role === 'admin') {
      loadStats();
      if (document.getElementById('sec-workers')?.classList.contains('active')) {
        loadWorkerTable();
      }
    }
  });
  
  fbListen(COL.ATTENDANCE, (data) => {
    attendanceCache = data;
    const u = gU();
    if (u && u.role === 'worker') {
      updWorkerStatus();
      loadWHistory();
      loadWQuickStats();
    }
    if (u && u.role === 'admin') {
      loadStats();
      const active = document.querySelector('.sec.active');
      if (active) {
        if (active.id === 'sec-approve') loadApprovals();
        if (active.id === 'sec-live') loadLive();
        if (active.id === 'sec-attend') loadAttend();
        if (active.id === 'sec-endday') loadEndDay();
      }
    }
  });
  
  fbListen(COL.ADMIN, (data) => {
    if (data.length > 0) adminCache = data[0];
  });
  
  // Hide loading screen
  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    if (ls) ls.style.display = 'none';
  }, 1500);
  
  console.log('🔥 Firebase ready & listening!');
}

// ========== HELPERS ==========
const gW = () => workersCache;
const gA = () => attendanceCache;
const gAD = () => adminCache || { adminId: 'ADMIN001', pw: 'Admin@2026', name: 'Administrator' };
const gU = () => JSON.parse(localStorage.getItem(K.U));
const sU = d => localStorage.setItem(K.U, JSON.stringify(d));
const cU = () => localStorage.removeItem(K.U);

function tTime() {
  return new Date().toLocaleString('en-US', { timeZone:'Europe/Istanbul', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true });
}
function tDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone:'Europe/Istanbul' });
}
function tDateFull() {
  return new Date().toLocaleDateString('en-US', { timeZone:'Europe/Istanbul', weekday:'long', year:'numeric', month:'long', day:'numeric' });
}
function fmtTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-US', { timeZone:'Europe/Istanbul', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true });
}
function greet() {
  const h = parseInt(new Date().toLocaleString('en-US', { timeZone:'Europe/Istanbul', hour:'numeric', hour12:false }));
  return h < 12 ? 'Good Morning ☀️' : h < 17 ? 'Good Afternoon 🌤️' : 'Good Evening 🌙';
}

function toast(msg, type='ok') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3500);
}

function togglePw(id, btn) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
  btn.textContent = el.type === 'password' ? '👁' : '🙈';
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function confirmDlg(title, msg, cb) {
  document.getElementById('mcTitle').textContent = title;
  document.getElementById('mcMsg').textContent = msg;
  const yes = document.getElementById('mcYes');
  const newYes = yes.cloneNode(true);
  yes.parentNode.replaceChild(newYes, yes);
  newYes.onclick = () => { closeModal('mConfirm'); cb(); };
  openModal('mConfirm');
}

// ========== LOGIN ==========
function switchLogin(type, btn) {
  document.querySelectorAll('.ltabs .ltab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.lform').forEach(f => f.classList.remove('active'));
  document.getElementById(type + 'LoginForm').classList.add('active');
  document.getElementById('loginErr').classList.remove('show');
}

function showErr(msg) {
  const e = document.getElementById('loginErr');
  e.textContent = '⚠️ ' + msg;
  e.classList.add('show');
}

function fillDropdown() {
  const w = gW().filter(x => x.on);
  const ind = w.filter(x => x.sec === 'Indian').sort((a,b) => a.wid.localeCompare(b.wid));
  const pak = w.filter(x => x.sec === 'Pakistani').sort((a,b) => a.wid.localeCompare(b.wid));
  let h = '<option value="">— Choose your name —</option>';
  if (ind.length) {
    h += '<optgroup label="🇮🇳 Indian Workers">';
    ind.forEach(x => h += `<option value="${x.wid}">${x.name} — ${x.prof}</option>`);
    h += '</optgroup>';
  }
  if (pak.length) {
    h += '<optgroup label="🇵🇰 Pakistani Workers">';
    pak.forEach(x => h += `<option value="${x.wid}">${x.name} — ${x.prof}</option>`);
    h += '</optgroup>';
  }
  const sel = document.getElementById('workerSelect');
  if (sel) sel.innerHTML = h;
}

function workerLogin(e) {
  e.preventDefault();
  const id = document.getElementById('workerSelect').value;
  const pw = document.getElementById('workerPw').value;
  if (!id) return showErr('Please select your name');
  const w = gW().find(x => x.wid === id);
  if (!w) return showErr('Worker not found');
  if (!w.on) return showErr('Account deactivated. Contact admin.');
  if (w.pw !== pw) return showErr('Incorrect password');
  sU({ ...w, id: w.wid, role: 'worker' });
  toast('Welcome, ' + w.name + '!');
  loadWorkerDash();
  return false;
}

function adminLogin(e) {
  e.preventDefault();
  const id = document.getElementById('adminId').value.trim();
  const pw = document.getElementById('adminPw').value;
  if (!id || !pw) return showErr('Enter ID and password');
  const ad = gAD();
  if (ad.adminId !== id || ad.pw !== pw) return showErr('Invalid admin credentials');
  sU({ ...ad, id: ad.adminId, role: 'admin' });
  toast('Welcome back, Admin!');
  loadAdminDash();
  return false;
}

function logout() {
  confirmDlg('Logout?', 'Are you sure you want to logout from Albowry Attendance?', () => {
    cU();
    showPage('loginPage');
    document.getElementById('workerSelect').value = '';
    document.getElementById('workerPw').value = '';
    document.getElementById('adminId').value = '';
    document.getElementById('adminPw').value = '';
    document.getElementById('loginErr').classList.remove('show');
  });
}

// ========== WORKER DASHBOARD ==========
function loadWorkerDash() {
  const u = gU();
  document.getElementById('wGreet').textContent = greet();
  document.getElementById('wName').textContent = u.name;
  document.getElementById('wInfo').textContent = `${u.prof} • ${u.sec} Section • ${u.id}`;
  document.getElementById('wNavName').textContent = u.name;
  document.getElementById('wAvatar').textContent = u.name.charAt(0);
  document.getElementById('wDate').textContent = tDateFull();
  showPage('workerPage');
  updWorkerStatus();
  loadWHistory();
  loadWQuickStats();
}

async function doCheckIn() {
  const u = gU();
  const today = tDate();
  const existing = gA().find(a => a.wid === u.id && a.date === today);
  
  if (existing) {
    if (existing.status === 'pending_checkin') return toast('Check-in request already pending!', 'err');
    if (existing.status === 'checked_in' || existing.status === 'pending_checkout') return toast('You are already checked in!', 'err');
    if (existing.status === 'completed') return toast('You have already completed today\'s work', 'err');
  }
  
  confirmDlg('Request Check-In?', 'Send check-in request to admin? Your time will be recorded now.', async () => {
    const now = new Date().toISOString();
    const recId = 'att_' + Date.now() + '_' + u.id;
    const success = await fbSave(COL.ATTENDANCE, recId, {
      recId: recId,
      wid: u.id,
      name: u.name,
      prof: u.prof,
      sec: u.sec,
      date: today,
      checkinReqTime: now,
      checkinTime: null,
      checkoutReqTime: null,
      checkoutTime: null,
      total: 0,
      regular: 0,
      ot: 0,
      status: 'pending_checkin'
    });
    if (success) toast('✅ Check-in request sent to admin!');
  });
}

async function doCheckOut() {
  const u = gU();
  const today = tDate();
  const rec = gA().find(a => a.wid === u.id && a.date === today);
  
  if (!rec) return toast('Please check-in first!', 'err');
  if (rec.status === 'pending_checkin') return toast('Wait for check-in approval', 'err');
  if (rec.status === 'completed') return toast('Already checked out today', 'err');
  if (rec.status === 'pending_checkout') return toast('Check-out already pending!', 'err');
  if (rec.status !== 'checked_in') return toast('Cannot check-out now', 'err');
  
  confirmDlg('Request Check-Out?', 'Send check-out request to admin?', async () => {
    const now = new Date().toISOString();
    const success = await fbSave(COL.ATTENDANCE, rec.id, {
      ...rec,
      checkoutReqTime: now,
      status: 'pending_checkout'
    });
    if (success) toast('✅ Check-out request sent!');
  });
}

function updWorkerStatus() {
  const u = gU();
  if (!u || u.role !== 'worker') return;
  const today = tDate();
  const rec = gA().find(a => a.wid === u.id && a.date === today);

  const btnIn = document.getElementById('btnCheckin');
  const btnOut = document.getElementById('btnCheckout');
  const status = document.getElementById('wacStatus');
  const icon = document.getElementById('wsIcon');
  const txt = document.getElementById('wsText');
  const sub = document.getElementById('wsSub');
  const times = document.getElementById('wsTimes');
  if (!btnIn) return;
  times.innerHTML = '';

  if (!rec) {
    btnIn.disabled = false;
    btnOut.disabled = true;
    status.className = 'wac-status';
    status.innerHTML = '<span>📋</span> Ready to start. Click CHECK IN to send request to admin.';
    icon.textContent = '📋';
    txt.textContent = 'Not Started';
    sub.textContent = 'Waiting to begin your day';
    return;
  }

  if (rec.checkinReqTime) times.innerHTML += `<div class="wsc-time-item"><small>Check-in Requested</small><b style="color:#f59e0b">${fmtTime(rec.checkinReqTime)}</b></div>`;
  if (rec.checkinTime) times.innerHTML += `<div class="wsc-time-item"><small>Approved Check-in</small><b style="color:#059669">${fmtTime(rec.checkinTime)}</b></div>`;
  if (rec.checkoutReqTime) times.innerHTML += `<div class="wsc-time-item"><small>Check-out Requested</small><b style="color:#f59e0b">${fmtTime(rec.checkoutReqTime)}</b></div>`;
  if (rec.checkoutTime) times.innerHTML += `<div class="wsc-time-item"><small>Approved Check-out</small><b style="color:#dc2626">${fmtTime(rec.checkoutTime)}</b></div>`;
  if (rec.total > 0) times.innerHTML += `<div class="wsc-time-item"><small>Total Hours</small><b style="color:#1e40af">${rec.total.toFixed(2)}h</b></div>`;
  if (rec.regular > 0) times.innerHTML += `<div class="wsc-time-item"><small>Regular</small><b style="color:#1e40af">${rec.regular.toFixed(2)}h</b></div>`;
  if (rec.ot > 0) times.innerHTML += `<div class="wsc-time-item"><small>Overtime</small><b style="color:#d97706">${rec.ot.toFixed(2)}h</b></div>`;

  switch (rec.status) {
    case 'pending_checkin':
      btnIn.disabled = true;
      btnOut.disabled = true;
      status.className = 'wac-status pending';
      status.innerHTML = '<span>⏳</span> Check-in request sent. Waiting for admin approval...';
      icon.textContent = '⏳'; txt.textContent = 'Check-in Pending'; sub.textContent = 'Waiting for admin approval';
      break;
    case 'checked_in':
      btnIn.disabled = true;
      btnOut.disabled = false;
      status.className = 'wac-status active';
      status.innerHTML = '<span>🟢</span> Checked in at ' + fmtTime(rec.checkinTime) + '. Click CHECK OUT when done.';
      icon.textContent = '🟢'; txt.textContent = 'Currently Working'; sub.textContent = 'Have a productive day!';
      break;
    case 'pending_checkout':
      btnIn.disabled = true;
      btnOut.disabled = true;
      status.className = 'wac-status pending';
      status.innerHTML = '<span>⏳</span> Check-out request sent. Waiting for admin approval...';
      icon.textContent = '⏳'; txt.textContent = 'Check-out Pending'; sub.textContent = 'Waiting for admin approval';
      break;
    case 'completed':
      btnIn.disabled = true;
      btnOut.disabled = true;
      status.className = 'wac-status done';
      status.innerHTML = '<span>🎉</span> Day completed! Total: ' + rec.total.toFixed(2) + 'h';
      icon.textContent = '🎉'; txt.textContent = 'Day Completed'; sub.textContent = 'Great work today!';
      break;
  }
}

function loadWQuickStats() {
  const u = gU();
  if (!u) return;
  const my = gA().filter(a => a.wid === u.id && a.status === 'completed');
  const el1 = document.getElementById('wTotalDays');
  const el2 = document.getElementById('wTotalHrs');
  const el3 = document.getElementById('wTotalOT');
  if (el1) el1.textContent = my.length;
  if (el2) el2.textContent = my.reduce((s, a) => s + (a.total || 0), 0).toFixed(1) + 'h';
  if (el3) el3.textContent = my.reduce((s, a) => s + (a.ot || 0), 0).toFixed(1) + 'h';
}

function loadWHistory() {
  const u = gU();
  if (!u) return;
  const hist = gA().filter(a => a.wid === u.id && a.status === 'completed').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  const cnt = document.getElementById('wHistCount');
  if (cnt) cnt.textContent = hist.length + ' records';
  const el = document.getElementById('wHistory');
  if (!el) return;
  if (!hist.length) {
    el.innerHTML = '<div class="empty"><div class="em-icon">📭</div><h3>No History Yet</h3></div>';
    return;
  }
  el.innerHTML = hist.map(r => `
    <div class="hist-item">
      <b>${r.date}</b>
      <span style="color:#059669">🔓 ${fmtTime(r.checkinTime)}</span>
      <span style="color:#dc2626">🔒 ${fmtTime(r.checkoutTime)}</span>
      <b style="color:#1e40af">${r.total.toFixed(2)}h</b>
      ${r.ot > 0 ? `<span class="tag tag-o">OT ${r.ot.toFixed(2)}h</span>` : '<span></span>'}
    </div>`).join('');
}

async function changeWorkerPw(e) {
  e.preventDefault();
  const old = document.getElementById('cwOld').value;
  const nw = document.getElementById('cwNew').value;
  const cf = document.getElementById('cwConf').value;
  if (nw !== cf) return toast('Passwords don\'t match', 'err');
  if (nw.length < 4) return toast('Min 4 characters', 'err');
  const u = gU();
  const w = gW().find(x => x.wid === u.id);
  if (w.pw !== old) return toast('Current password wrong', 'err');
  const success = await fbSave(COL.WORKERS, u.id, { ...w, pw: nw });
  if (success) {
    sU({ ...u, pw: nw });
    document.getElementById('cwOld').value = '';
    document.getElementById('cwNew').value = '';
    document.getElementById('cwConf').value = '';
    toast('✅ Password updated!');
  }
  return false;
}

// ========== ADMIN DASHBOARD ==========
function loadAdminDash() {
  const u = gU();
  document.getElementById('aNavName').textContent = u.name;
  showPage('adminPage');
  document.getElementById('fDate').value = tDate();
  document.getElementById('expStart').value = tDate();
  document.getElementById('expEnd').value = tDate();
  document.getElementById('setCurId').value = u.id;
  loadStats();
}

function goSection(sec, btn) {
  document.querySelectorAll('.side-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  document.getElementById('sec-' + sec).classList.add('active');
  if (sec === 'dash') loadStats();
  if (sec === 'approve') loadApprovals();
  if (sec === 'live') loadLive();
  if (sec === 'attend') loadAttend();
  if (sec === 'workers') loadWorkerTable();
  if (sec === 'endday') loadEndDay();
}

function loadStats() {
  const ws = gW().filter(w => w.on);
  const today = tDate();
  const att = gA().filter(a => a.date === today);
  const present = att.filter(a => ['checked_in','completed','pending_checkout'].includes(a.status)).length;
  const pend = att.filter(a => ['pending_checkin','pending_checkout'].includes(a.status)).length;
  const ind = ws.filter(w => w.sec === 'Indian');
  const pak = ws.filter(w => w.sec === 'Pakistani');
  const indP = att.filter(a => a.sec === 'Indian' && ['checked_in','completed','pending_checkout'].includes(a.status)).length;
  const pakP = att.filter(a => a.sec === 'Pakistani' && ['checked_in','completed','pending_checkout'].includes(a.status)).length;
  const indPend = att.filter(a => a.sec === 'Indian' && ['pending_checkin','pending_checkout'].includes(a.status)).length;
  const pakPend = att.filter(a => a.sec === 'Pakistani' && ['pending_checkin','pending_checkout'].includes(a.status)).length;

  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  
  setText('sTotalW', ws.length);
  setText('sPresent', present);
  setText('sAbsent', ws.length - present);
  setText('sPending', pend);
  setText('dashDate', tDateFull());
  setText('dIndT', ind.length);
  setText('dIndP', indP);
  setText('dIndA', ind.length - indP);
  setText('dIndPend', indPend);
  setText('dPakT', pak.length);
  setText('dPakP', pakP);
  setText('dPakA', pak.length - pakP);
  setText('dPakPend', pakPend);
  
  const indPct = ind.length ? Math.round(indP / ind.length * 100) : 0;
  const pakPct = pak.length ? Math.round(pakP / pak.length * 100) : 0;
  const indBar = document.getElementById('dIndBar');
  const pakBar = document.getElementById('dPakBar');
  if (indBar) indBar.style.width = indPct + '%';
  if (pakBar) pakBar.style.width = pakPct + '%';
  setText('dIndPct', indPct + '% Attendance');
  setText('dPakPct', pakPct + '% Attendance');

  const b = document.getElementById('sBadge');
  if (b) {
    if (pend > 0) { b.textContent = pend; b.classList.add('show'); } 
    else b.classList.remove('show');
  }
}

function loadApprovals() {
  const pend = gA().filter(a => ['pending_checkin','pending_checkout'].includes(a.status));
  const el = document.getElementById('approveList');
  if (!el) return;
  if (!pend.length) {
    el.innerHTML = '<div class="empty"><div class="em-icon">✅</div><h3>All Clear!</h3><p>No pending approvals</p></div>';
    return;
  }
  el.innerHTML = pend.map(p => {
    const isCheckin = p.status === 'pending_checkin';
    return `<div class="appr-item">
      <div class="appr-info">
        <h4>${p.name} 
          <span class="tag tag-${p.sec === 'Indian' ? 'ind' : 'pak'}">${p.sec === 'Indian' ? '🇮🇳' : '🇵🇰'} ${p.sec}</span>
          <span class="tag ${isCheckin ? 'tag-g' : 'tag-r'}">${isCheckin ? '🔓 CHECK-IN' : '🔒 CHECK-OUT'}</span>
        </h4>
        <p><b>${p.prof}</b> • ID: <code>${p.wid}</code></p>
        <p><b>Time:</b> ${fmtTime(isCheckin ? p.checkinReqTime : p.checkoutReqTime)}</p>
        ${!isCheckin && p.checkinTime ? `<p><b>Checked in at:</b> ${fmtTime(p.checkinTime)}</p>` : ''}
      </div>
      <div class="appr-btns">
        <button class="btn btn-success btn-sm" onclick="doApprove('${p.id}')">✅ Approve</button>
        <button class="btn btn-danger btn-sm" onclick="doReject('${p.id}')">❌ Reject</button>
      </div>
    </div>`;
  }).join('');
}

async function doApprove(id) {
  const r = gA().find(a => a.id === id);
  if (!r) return;
  const updated = { ...r };
  if (r.status === 'pending_checkin') {
    updated.checkinTime = r.checkinReqTime;
    updated.status = 'checked_in';
  } else if (r.status === 'pending_checkout') {
    updated.checkoutTime = r.checkoutReqTime;
    const hrs = (new Date(updated.checkoutTime) - new Date(updated.checkinTime)) / 36e5;
    updated.total = Math.round(hrs * 100) / 100;
    updated.regular = Math.round(Math.min(hrs, REG_HOURS) * 100) / 100;
    updated.ot = Math.max(0, Math.round((hrs - REG_HOURS) * 100) / 100);
    updated.status = 'completed';
  }
  const success = await fbSave(COL.ATTENDANCE, id, updated);
  if (success) toast('✅ Approved: ' + r.name);
}

function doReject(id) {
  confirmDlg('Reject Request?', 'This will be rejected. Continue?', async () => {
    const r = gA().find(a => a.id === id);
    if (r.status === 'pending_checkin') {
      await fbDelete(COL.ATTENDANCE, id);
    } else {
      await fbSave(COL.ATTENDANCE, id, { ...r, checkoutReqTime: null, status: 'checked_in' });
    }
    toast('Rejected', 'info');
  });
}

function approveAll() {
  const pend = gA().filter(a => ['pending_checkin','pending_checkout'].includes(a.status));
  if (!pend.length) return toast('No pending', 'info');
  confirmDlg('Approve All?', `Approve all ${pend.length} requests?`, async () => {
    for (const r of pend) {
      const updated = { ...r };
      if (r.status === 'pending_checkin') {
        updated.checkinTime = r.checkinReqTime;
        updated.status = 'checked_in';
      } else if (r.status === 'pending_checkout') {
        updated.checkoutTime = r.checkoutReqTime;
        const hrs = (new Date(updated.checkoutTime) - new Date(updated.checkinTime)) / 36e5;
        updated.total = Math.round(hrs * 100) / 100;
        updated.regular = Math.round(Math.min(hrs, REG_HOURS) * 100) / 100;
        updated.ot = Math.max(0, Math.round((hrs - REG_HOURS) * 100) / 100);
        updated.status = 'completed';
      }
      await fbSave(COL.ATTENDANCE, r.id, updated);
    }
    toast('✅ All approved!');
  });
}

function loadEndDay() {
  const today = tDate();
  const working = gA().filter(a => a.date === today && (a.status === 'checked_in' || a.status === 'pending_checkout'));
  const cnt = document.getElementById('edWorkingCount');
  if (cnt) cnt.textContent = working.length;
  const el = document.getElementById('edWorkingList');
  if (!el) return;
  if (!working.length) {
    el.innerHTML = '<div class="empty"><div class="em-icon">✅</div><h3>All Clear!</h3></div>';
    return;
  }
  el.innerHTML = working.map(w => `
    <div class="ed-worker-item">
      <div class="ed-info">
        <h4>${w.name} <span class="tag tag-${w.sec === 'Indian' ? 'ind' : 'pak'}">${w.sec === 'Indian' ? '🇮🇳' : '🇵🇰'}</span></h4>
        <p>${w.prof} • ${w.wid}</p>
      </div>
      <div class="ed-time">🟢 ${fmtTime(w.checkinTime)}</div>
    </div>
  `).join('');
}

function endDayForAll() {
  const today = tDate();
  const working = gA().filter(a => a.date === today && (a.status === 'checked_in' || a.status === 'pending_checkout'));
  if (!working.length) return toast('No active workers', 'info');
  const timeInput = document.getElementById('edLogoutTime').value;
  if (!timeInput) return toast('Select logout time', 'err');
  confirmDlg('End Day?', `Auto-checkout ${working.length} workers at ${timeInput}?`, async () => {
    const [h, m] = timeInput.split(':');
    for (const r of working) {
      const cd = new Date();
      cd.setHours(parseInt(h), parseInt(m), 0, 0);
      const updated = { ...r };
      updated.checkoutTime = cd.toISOString();
      updated.checkoutReqTime = updated.checkoutReqTime || updated.checkoutTime;
      const hrs = (new Date(updated.checkoutTime) - new Date(updated.checkinTime)) / 36e5;
      updated.total = Math.round(hrs * 100) / 100;
      updated.regular = Math.round(Math.min(hrs, REG_HOURS) * 100) / 100;
      updated.ot = Math.max(0, Math.round((hrs - REG_HOURS) * 100) / 100);
      updated.status = 'completed';
      await fbSave(COL.ATTENDANCE, r.id, updated);
    }
    toast('✅ Day ended for ' + working.length + ' workers!');
  });
}

function approveAllPendingToday() { approveAll(); }

function loadLive() {
  const today = tDate();
  const att = gA().filter(a => a.date === today);
  const working = att.filter(a => a.status === 'checked_in');
  const done = att.filter(a => a.status === 'completed');
  const lc = document.getElementById('liveCount');
  const dc = document.getElementById('doneCount');
  if (lc) lc.textContent = working.length;
  if (dc) dc.textContent = done.length;
  
  const liveEl = document.getElementById('liveList');
  if (liveEl) {
    if (!working.length) liveEl.innerHTML = '<div class="empty"><div class="em-icon">💤</div><h3>No one working</h3></div>';
    else liveEl.innerHTML = working.map(w => `
      <div class="live-item">
        <div class="li-info">
          <h4>${w.name} <span class="tag tag-${w.sec === 'Indian' ? 'ind' : 'pak'}">${w.sec === 'Indian' ? '🇮🇳' : '🇵🇰'}</span></h4>
          <p>${w.prof} • ${w.wid}</p>
        </div>
        <div class="li-time">🟢 ${fmtTime(w.checkinTime)}</div>
      </div>`).join('');
  }
  
  const doneEl = document.getElementById('doneList');
  if (doneEl) {
    if (!done.length) doneEl.innerHTML = '<div class="empty"><div class="em-icon">📋</div><h3>None completed</h3></div>';
    else doneEl.innerHTML = done.map(w => `
      <div class="live-item">
        <div class="li-info">
          <h4>${w.name} <span class="tag tag-${w.sec === 'Indian' ? 'ind' : 'pak'}">${w.sec === 'Indian' ? '🇮🇳' : '🇵🇰'}</span></h4>
          <p>${w.prof} • ${w.total.toFixed(2)}h ${w.ot > 0 ? '(OT ' + w.ot.toFixed(2) + 'h)' : ''}</p>
        </div>
        <div class="li-time">✅ ${fmtTime(w.checkoutTime)}</div>
      </div>`).join('');
  }
}

function loadAttend() {
  const date = document.getElementById('fDate').value;
  const sec = document.getElementById('fSec').value;
  let att = gA().filter(a => a.date === date);
  if (sec) att = att.filter(a => a.sec === sec);
  const el = document.getElementById('attendTable');
  if (!el) return;
  if (!att.length) {
    el.innerHTML = '<div class="empty"><div class="em-icon">📋</div><h3>No Records</h3></div>';
    return;
  }
  const stag = s => ({
    completed: '<span class="tag tag-g">✓ Completed</span>',
    checked_in: '<span class="tag tag-b">🟢 Working</span>',
    pending_checkin: '<span class="tag tag-o">⏳ Check-in Pending</span>',
    pending_checkout: '<span class="tag tag-o">⏳ Check-out Pending</span>'
  }[s] || s);
  el.innerHTML = `<div class="t-wrap"><table>
    <thead><tr><th>#</th><th>ID</th><th>Name</th><th>Prof</th><th>Section</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Regular</th><th>OT</th><th>Status</th></tr></thead>
    <tbody>${att.map((a, i) => `<tr>
      <td>${i + 1}</td><td><code>${a.wid}</code></td><td><b>${a.name}</b></td><td>${a.prof}</td>
      <td><span class="tag tag-${a.sec === 'Indian' ? 'ind' : 'pak'}">${a.sec === 'Indian' ? '🇮🇳' : '🇵🇰'} ${a.sec}</span></td>
      <td style="color:#059669">${fmtTime(a.checkinTime)}</td>
      <td style="color:#dc2626">${fmtTime(a.checkoutTime)}</td>
      <td style="color:var(--p);font-weight:700">${(a.total || 0).toFixed(2)}h</td>
      <td>${(a.regular || 0).toFixed(2)}h</td>
      <td style="color:#d97706;font-weight:600">${a.ot > 0 ? a.ot.toFixed(2) + 'h' : '-'}</td>
      <td>${stag(a.status)}</td>
    </tr>`).join('')}</tbody></table></div>`;
}

// ========== WORKERS MGT ==========
let curTab = 'Indian';
let editId = null;

function swWorkerTab(sec, btn) {
  curTab = sec;
  document.querySelectorAll('#sec-workers .ltab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadWorkerTable();
}

function loadWorkerTable() {
  const q = (document.getElementById('wSearch')?.value || '').toLowerCase();
  let ws = gW().filter(w => w.sec === curTab).sort((a,b) => a.wid.localeCompare(b.wid));
  const ic = document.getElementById('indCount');
  const pc = document.getElementById('pakCount');
  if (ic) ic.textContent = '(' + gW().filter(w => w.sec === 'Indian' && w.on).length + ')';
  if (pc) pc.textContent = '(' + gW().filter(w => w.sec === 'Pakistani' && w.on).length + ')';
  if (q) ws = ws.filter(w => w.name.toLowerCase().includes(q) || w.wid.toLowerCase().includes(q) || w.prof.toLowerCase().includes(q));
  const el = document.getElementById('workerTable');
  if (!el) return;
  if (!ws.length) {
    el.innerHTML = '<div class="empty"><div class="em-icon">👷</div><h3>No Workers</h3></div>';
    return;
  }
  el.innerHTML = `<div class="t-wrap"><table>
    <thead><tr><th>#</th><th>ID</th><th>Name</th><th>Profession</th><th>Password</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${ws.map((w, i) => `<tr style="${w.on ? '' : 'opacity:.5'}">
      <td>${i + 1}</td>
      <td><code>${w.wid}</code></td>
      <td><b>${w.name}</b></td>
      <td>${w.prof}</td>
      <td>
        <code id="p-${w.wid}" style="letter-spacing:2px">••••••••</code>
        <button class="btn btn-outline btn-sm" onclick="showPw('${w.wid}')" style="padding:3px 8px;margin-left:4px">👁</button>
      </td>
      <td>${w.on ? '<span class="tag tag-g">Active</span>' : '<span class="tag tag-r">Inactive</span>'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline btn-sm" onclick="editW('${w.wid}')">✏️</button>
        <button class="btn btn-outline btn-sm" onclick="resetPw('${w.wid}')">🔑</button>
        <button class="btn btn-${w.on ? 'danger' : 'success'} btn-sm" onclick="toggleW('${w.wid}')">${w.on ? '🚫' : '✅'}</button>
        <button class="btn btn-danger btn-sm" onclick="delW('${w.wid}')">🗑️</button>
      </td>
    </tr>`).join('')}</tbody></table></div>`;
}

function showPw(id) {
  const w = gW().find(x => x.wid === id);
  const el = document.getElementById('p-' + id);
  if (el.textContent === '••••••••') { 
    el.textContent = w.pw; 
    setTimeout(() => el.textContent = '••••••••', 4000); 
  }
}

function resetPw(id) {
  confirmDlg('Reset Password?', 'Reset to default: ' + DEFAULT_PW, async () => {
    const w = gW().find(x => x.wid === id);
    await fbSave(COL.WORKERS, id, { ...w, pw: DEFAULT_PW });
    document.getElementById('mPwBody').innerHTML = `
      <div class="pw-show"><div class="pw-lbl">Password Reset</div><div class="pw-name">${w.name} (${w.wid})</div><div class="pw-val">${DEFAULT_PW}</div></div>
      <div class="pw-warn">⚠️ Inform the worker about their new password.</div>`;
    openModal('mPw');
  });
}

function openAddWorker() {
  editId = null;
  document.getElementById('mwTitle').textContent = '➕ Add New Worker';
  document.getElementById('mwName').value = '';
  document.getElementById('mwProf').value = '';
  document.getElementById('mwSec').value = curTab;
  document.getElementById('mwPw').value = DEFAULT_PW;
  openModal('mWorker');
}

function editW(id) {
  const w = gW().find(x => x.wid === id);
  editId = id;
  document.getElementById('mwTitle').textContent = '✏️ Edit Worker (' + id + ')';
  document.getElementById('mwName').value = w.name;
  document.getElementById('mwProf').value = w.prof;
  document.getElementById('mwSec').value = w.sec;
  document.getElementById('mwPw').value = w.pw;
  openModal('mWorker');
}

async function saveWorkerForm(e) {
  e.preventDefault();
  const name = document.getElementById('mwName').value.trim();
  const prof = document.getElementById('mwProf').value;
  const sec = document.getElementById('mwSec').value;
  const pw = document.getElementById('mwPw').value.trim();
  if (!name || !prof || !pw) return toast('Fill all fields', 'err');
  if (editId) {
    const w = gW().find(x => x.wid === editId);
    await fbSave(COL.WORKERS, editId, { ...w, name, prof, sec, pw });
    toast('✅ Updated!');
  } else {
    const pre = sec === 'Indian' ? 'IND' : 'PAK';
    const nums = gW().filter(w => w.wid.startsWith(pre)).map(w => parseInt(w.wid.replace(pre, ''))).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    const wid = pre + String(next).padStart(4, '0');
    await fbSave(COL.WORKERS, wid, { wid, name, prof, sec, pw, on: true, createdAt: new Date().toISOString() });
    document.getElementById('mPwBody').innerHTML = `
      <div class="pw-show"><div class="pw-lbl">✅ Added</div><div class="pw-name">${name} (${wid})</div><div class="pw-val">${pw}</div></div>
      <div class="pw-warn">⚠️ Save & share credentials!</div>`;
    openModal('mPw');
    toast('✅ Added: ' + wid);
  }
  closeModal('mWorker');
  return false;
}

async function toggleW(id) {
  const w = gW().find(x => x.wid === id);
  await fbSave(COL.WORKERS, id, { ...w, on: !w.on });
  toast(w.on ? 'Deactivated' : 'Activated', 'info');
}

function delW(id) {
  const w = gW().find(x => x.wid === id);
  confirmDlg('Delete?', `Delete ${w.name} and all attendance data?`, async () => {
    await fbDelete(COL.WORKERS, id);
    const theirAtt = gA().filter(a => a.wid === id);
    for (const a of theirAtt) await fbDelete(COL.ATTENDANCE, a.id);
    toast('Deleted', 'info');
  });
}

// ========== SETTINGS ==========
async function updateAdmin() {
  const nid = document.getElementById('setNewId').value.trim();
  const npw = document.getElementById('setNewPw').value;
  const cpw = document.getElementById('setConfPw').value;
  if (!nid || !npw) return toast('Fill all fields', 'err');
  if (npw !== cpw) return toast('Passwords don\'t match', 'err');
  if (npw.length < 6) return toast('Min 6 characters', 'err');
  await fbSave(COL.ADMIN, 'main', { adminId: nid, pw: npw, name: 'Administrator' });
  const u = gU(); u.id = nid; u.pw = npw; sU(u);
  document.getElementById('setCurId').value = nid;
  document.getElementById('setNewId').value = '';
  document.getElementById('setNewPw').value = '';
  document.getElementById('setConfPw').value = '';
  toast('✅ Admin credentials updated!');
}

function backupAll() {
  const d = { workers: gW(), attendance: gA(), admin: gAD(), date: new Date().toISOString(), v: '7.0-firebase' };
  const b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
  const l = document.createElement('a');
  l.href = URL.createObjectURL(b); 
  l.download = 'Albowry_Backup_' + tDate() + '.json'; 
  l.click();
  toast('✅ Backup downloaded!');
}

function resetAllPasswords() {
  confirmDlg('Reset All Passwords?', 'Reset all to: ' + DEFAULT_PW, async () => {
    for (const w of gW()) {
      await fbSave(COL.WORKERS, w.wid, { ...w, pw: DEFAULT_PW });
    }
    toast('✅ All passwords reset!');
  });
}

function clearAttendanceData() {
  confirmDlg('Clear All Attendance?', 'Delete ALL attendance permanently?', async () => {
    for (const a of gA()) await fbDelete(COL.ATTENDANCE, a.id);
    toast('Cleared', 'info');
  });
}

// ========== EXPORT ==========
function setExpDate(range) {
  const t = tDate();
  if (range === 'today') {
    document.getElementById('expStart').value = t;
    document.getElementById('expEnd').value = t;
  } else if (range === 'week') {
    const n = new Date(); 
    const d = n.getDay(); 
    const diff = n.getDate() - d + (d === 0 ? -6 : 1);
    document.getElementById('expStart').value = new Date(n.setDate(diff)).toLocaleDateString('en-CA');
    document.getElementById('expEnd').value = tDate();
  } else if (range === 'month') {
    document.getElementById('expStart').value = t.substring(0, 8) + '01';
    document.getElementById('expEnd').value = t;
  }
}

function exportExcel() {
  const s = document.getElementById('expStart').value;
  const e = document.getElementById('expEnd').value;
  const sec = document.getElementById('expSec').value;
  if (!s || !e) return toast('Select dates', 'err');
  let data = gA().filter(a => a.date >= s && a.date <= e);
  if (sec) data = data.filter(a => a.sec === sec);
  if (!data.length) return toast('No data', 'err');
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="UTF-8"><style>
    table{border-collapse:collapse;font-family:Arial}
    .t{background:#1e40af;color:#fff;font-size:22px;font-weight:bold;text-align:center;padding:16px}
    .s{background:#3b82f6;color:#fff;text-align:center;padding:10px;font-size:12px}
    .p{background:#dbeafe;text-align:center;padding:10px;font-weight:600}
    th{background:#1e40af;color:#fff;padding:10px;border:1px solid #1e3a8a;text-align:center;font-size:11px}
    td{padding:8px;border:1px solid #ccc;font-size:11px;text-align:center}
    .e{background:#f0f9ff}.f{background:#1e40af;color:#fff;text-align:center;padding:10px;font-size:11px}
  </style></head><body><table border="1">
    <tr><td colspan="11" class="t">ALBOWRY CARPENTRY - ATTENDANCE REPORT</td></tr>
    <tr><td colspan="11" class="s">Antalya, Turkey | www.albowry.com | Regular: ${REG_HOURS}h/day</td></tr>
    <tr><td colspan="11" class="p">Period: ${s} to ${e} ${sec ? '| ' + sec : '| All'}</td></tr>
    <tr><td colspan="11"></td></tr>
    <tr><th>S.No</th><th>ID</th><th>Name</th><th>Profession</th><th>Section</th><th>Date</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Regular</th><th>OT</th></tr>
    ${data.map((a, i) => `<tr class="${i % 2 === 0 ? 'e' : ''}">
      <td>${i + 1}</td><td>${a.wid}</td><td style="text-align:left"><b>${a.name}</b></td>
      <td>${a.prof}</td><td>${a.sec}</td><td>${a.date}</td>
      <td>${fmtTime(a.checkinTime)}</td><td>${fmtTime(a.checkoutTime)}</td>
      <td><b>${(a.total || 0).toFixed(2)}</b></td><td>${(a.regular || 0).toFixed(2)}</td><td>${(a.ot || 0).toFixed(2)}</td>
    </tr>`).join('')}
    <tr><td colspan="8" style="text-align:right;background:#f0f9ff;padding:10px"><b>TOTALS:</b></td>
      <td style="background:#dbeafe"><b>${data.reduce((s, a) => s + (a.total || 0), 0).toFixed(2)}</b></td>
      <td style="background:#dbeafe"><b>${data.reduce((s, a) => s + (a.regular || 0), 0).toFixed(2)}</b></td>
      <td style="background:#dbeafe"><b>${data.reduce((s, a) => s + (a.ot || 0), 0).toFixed(2)}</b></td>
    </tr>
    <tr><td colspan="11"></td></tr>
    <tr><td colspan="11" class="f">© ${CURRENT_YEAR} Albowry Carpentry | www.albowry.com</td></tr>
  </table></body></html>`;
  const b = new Blob([html], { type: 'application/vnd.ms-excel' });
  const l = document.createElement('a');
  l.href = URL.createObjectURL(b); 
  l.download = `Albowry_${s}_to_${e}.xls`; 
  l.click();
  toast('✅ Excel downloaded!');
}

function exportCSV() {
  const s = document.getElementById('expStart').value;
  const e = document.getElementById('expEnd').value;
  const sec = document.getElementById('expSec').value;
  if (!s || !e) return toast('Select dates', 'err');
  let data = gA().filter(a => a.date >= s && a.date <= e);
  if (sec) data = data.filter(a => a.sec === sec);
  if (!data.length) return toast('No data', 'err');
  let csv = 'ALBOWRY CARPENTRY\nPeriod: ' + s + ' to ' + e + '\n\n';
  csv += 'S.No,ID,Name,Profession,Section,Date,Check-in,Check-out,Total,Regular,OT,Status\n';
  csv += data.map((a, i) => [i+1, a.wid, `"${a.name}"`, a.prof, a.sec, a.date,
    fmtTime(a.checkinTime), fmtTime(a.checkoutTime),
    (a.total || 0).toFixed(2), (a.regular || 0).toFixed(2), (a.ot || 0).toFixed(2), a.status].join(',')).join('\n');
  const b = new Blob([csv], { type: 'text/csv' });
  const l = document.createElement('a');
  l.href = URL.createObjectURL(b); 
  l.download = `Albowry_${s}_to_${e}.csv`; 
  l.click();
  toast('✅ CSV downloaded!');
}

// ========== PWA INSTALL ==========
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBanner').classList.add('show');
});

function installApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(r => {
      if (r.outcome === 'accepted') toast('✅ App installed!');
      deferredPrompt = null;
      document.getElementById('installBanner').classList.remove('show');
    });
  } else {
    toast('Use browser menu → Add to Home Screen', 'info');
  }
}

function dismissInstall() {
  document.getElementById('installBanner').classList.remove('show');
}

// ========== CLOCKS ==========
function updateClocks() {
  const t = tTime();
  ['loginClock', 'wClock', 'aClock', 'wBigClock'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = t;
  });
}

// ========== BOOT ==========
async function boot() {
  console.log('🚀 Booting Albowry Attendance...');
  await initDB();
  fillDropdown();
  updateClocks();
  setInterval(updateClocks, 1000);
  const u = gU();
  if (u) {
    if (u.role === 'worker') loadWorkerDash();
    else if (u.role === 'admin') loadAdminDash();
  }
}

// Wait for Firebase to be ready
if (window.fbReady) {
  boot();
} else {
  window.addEventListener('firebase-ready', boot);
}
