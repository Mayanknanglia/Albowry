// AL BOWRY - UI Render Functions v17
// All rendering logic for admin panel and worker dashboard

var _workerTabActive = 'Indian';
var _clockInterval = null;

// ====== BOOTSTRAP ======
function bootstrap() {
  setLoadingText('Connecting to Firebase...');
  function startApp() {
    setLoadingText('Loading data...');
    startRealtimeSync();
    var waitCount = 0;
    var waitInterval = setInterval(function() {
      waitCount++;
      if ((_syncStatus.workers && _syncStatus.attendance && _syncStatus.admin) || waitCount > 30) {
        clearInterval(waitInterval);
        setLoadingText('Initializing workers...');
        initWorkers().then(function() {
          setLoadingText('Ready!');
          setTimeout(function() { hideLoading(); checkSession(); }, 500);
        });
      }
    }, 200);
  }
  if (window._firebaseReady) startApp();
  else window._onFirebaseReady = startApp;
}

function setLoadingText(txt) {
  var el = document.getElementById('loadingText');
  if (el) el.textContent = txt;
}

function hideLoading() {
  var el = document.getElementById('loadingScreen');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.5s ease';
    setTimeout(function() { el.style.display = 'none'; }, 500);
  }
}

function checkSession() {
  var s = getSession();
  if (!s) { showLoginPage(); return; }
  if (s.role === 'admin') showAdminPanel(s);
  else if (s.role === 'worker') showWorkerDashboard(s);
  else showLoginPage();
}

// ====== LOGIN ======
function showLoginPage() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('workerDashboard').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'none';
  populateWorkerDropdown();
  setCurrentTimeOnLogin();
}

function populateWorkerDropdown() {
  var sel = document.getElementById('workerNameSel');
  if (!sel) return;
  var val = sel.value;
  sel.innerHTML = '<option value="">— Choose your name —</option>';
  var ws = gW();
  var sections = ['Indian', 'Pakistani'];
  for (var s=0; s<sections.length; s++) {
    var grp = document.createElement('optgroup');
    grp.label = '— ' + sections[s].toUpperCase() + ' —';
    var cnt = 0;
    for (var i=0; i<ws.length; i++) {
      if (!ws[i].on || ws[i].sec !== sections[s]) continue;
      var opt = document.createElement('option');
      opt.value = ws[i].wid;
      opt.text = ws[i].name + ' (' + ws[i].prof + ')';
      grp.appendChild(opt); cnt++;
    }
    if (cnt > 0) sel.appendChild(grp);
  }
  if (val) sel.value = val;
}

function setCurrentTimeOnLogin() {
  var hr = new Date().getHours();
  var inputs = document.querySelectorAll('input[name="loginShift"]');
  for (var i=0; i<inputs.length; i++) {
    inputs[i].checked = (hr >= 8 && hr < 20) ? (inputs[i].value === 'Day') : (inputs[i].value === 'Night');
  }
}

function switchLoginTab(tab) {
  document.getElementById('tabWorker').classList.toggle('active', tab === 'worker');
  document.getElementById('tabAdmin').classList.toggle('active', tab === 'admin');
  document.getElementById('workerLoginForm').style.display = tab === 'worker' ? 'block' : 'none';
  document.getElementById('adminLoginForm').style.display = tab === 'admin' ? 'block' : 'none';
}

function doWorkerLogin() {
  var wid = document.getElementById('workerNameSel').value;
  var pw = document.getElementById('workerPw').value;
  var inputs = document.querySelectorAll('input[name="loginShift"]');
  var shift = 'Day';
  for (var i=0; i<inputs.length; i++) if (inputs[i].checked) { shift = inputs[i].value; break; }
  if (!wid) { showToast('Please select your name', 'error'); return; }
  if (!pw) { showToast('Please enter password', 'error'); return; }
  var r = workerLogin(wid, pw, shift);
  if (r.ok) { document.getElementById('workerPw').value = ''; showWorkerDashboard(r.session); }
  else showToast(r.msg, 'error');
}

function doAdminLogin() {
  var id = document.getElementById('adminIdInp').value.trim();
  var pw = document.getElementById('adminPwInp').value;
  if (!id || !pw) { showToast('Enter ID and Password', 'error'); return; }
  var r = adminLogin(id, pw);
  if (r.ok) {
    document.getElementById('adminPwInp').value = '';
    var s = getSession();
    speakWelcome(s.name || 'Admin');
    showAdminPanel(s);
  } else showToast(r.msg, 'error');
}

// ====== WORKER DASHBOARD ======
function showWorkerDashboard(session) {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('workerDashboard').style.display = 'block';
  document.getElementById('adminPanel').style.display = 'none';
  renderWorkerUI();
  if (_clockInterval) clearInterval(_clockInterval);
  _clockInterval = startClock('workerClock');
}

function renderWorkerUI() {
  var s = getSession();
  if (!s || s.role !== 'worker') return;
  var w = findWorker(s.wid);
  if (!w) return;

  document.getElementById('workerAvatar').textContent = getInitials(w.name);
  document.getElementById('workerHeroName').textContent = w.name;
  document.getElementById('workerHeroProfession').textContent = w.prof;
  document.getElementById('workerHeroSection').textContent = w.sec;
  var badge = document.getElementById('workerHeroShift');
  badge.textContent = (s.shift || w.shift) + ' Shift';
  badge.className = 'shift-badge shift-' + (s.shift || w.shift).toLowerCase();

  var today = tD();
  var all = gA();
  var todayAtt = null;
  for (var i=0; i<all.length; i++) if (all[i].wid === w.wid && all[i].date === today) { todayAtt = all[i]; break; }
  updateWorkerAttStatus(todayAtt);

  var stats = getWorkerStats(w.wid);
  document.getElementById('wstatDays').textContent = stats.totalDays;
  document.getElementById('wstatHours').textContent = stats.totalHrs + 'h';
  document.getElementById('wstatOT').textContent = stats.totalOT + 'h';
  renderWorkerHistory(stats.records);
}

function updateWorkerAttStatus(att) {
  var icon = document.getElementById('workerStatusIcon');
  var text = document.getElementById('workerStatusText');
  var detail = document.getElementById('workerStatusDetail');
  var pending = document.getElementById('pendingMsg');
  var completed = document.getElementById('completedMsg');
  var compDet = document.getElementById('completedDetail');
  var btnIn = document.getElementById('btnCheckin');
  var btnOut = document.getElementById('btnCheckout');
  var card = document.getElementById('workerStatusCard');

  pending.style.display = 'none';
  completed.style.display = 'none';
  btnIn.style.display = 'none';
  btnOut.style.display = 'none';
  card.className = 'worker-status-display';

  if (!att) {
    icon.textContent = 'schedule'; icon.style.color = '#94a3b8';
    text.textContent = 'Not checked in today';
    detail.textContent = 'Tap the button below to request check-in';
    btnIn.style.display = 'flex';
    card.className = 'worker-status-display status-idle';
  } else if (att.status === 'pending_checkin') {
    icon.textContent = 'hourglass_top'; icon.style.color = '#d97706';
    text.textContent = 'Check-in Pending';
    detail.textContent = 'Requested at ' + fmtTime(att.checkinReqTime);
    pending.style.display = 'flex';
    card.className = 'worker-status-display status-pending';
  } else if (att.status === 'checked_in') {
    icon.textContent = 'engineering'; icon.style.color = '#059669';
    text.textContent = 'Currently Working';
    detail.textContent = 'Checked in at ' + fmtTime(att.checkinTime);
    btnOut.style.display = 'flex';
    card.className = 'worker-status-display status-working';
  } else if (att.status === 'pending_checkout') {
    icon.textContent = 'hourglass_bottom'; icon.style.color = '#d97706';
    text.textContent = 'Checkout Pending';
    detail.textContent = 'Checked in at ' + fmtTime(att.checkinTime);
    pending.style.display = 'flex';
    card.className = 'worker-status-display status-pending';
  } else if (att.status === 'completed') {
    icon.textContent = 'verified'; icon.style.color = '#059669';
    text.textContent = 'Completed';
    detail.textContent = '';
    completed.style.display = 'flex';
    compDet.textContent = fmtTime(att.checkinTime) + ' → ' + fmtTime(att.checkoutTime) + ' · ' + (att.total || 0) + 'h · OT: ' + (att.ot || 0) + 'h';
    card.className = 'worker-status-display status-completed';
  }
}

function renderWorkerHistory(records) {
  var tbody = document.getElementById('workerHistBody');
  var count = document.getElementById('workerHistCount');
  if (!tbody) return;
  var completed = [];
  for (var i=0; i<records.length; i++) if (records[i].status === 'completed') completed.push(records[i]);
  if (count) count.textContent = completed.length + ' records';
  if (completed.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No records yet</td></tr>';
    return;
  }
  var html = '';
  for (var j=0; j<completed.length && j<15; j++) {
    var a = completed[j];
    html += '<tr><td>' + (j+1) + '</td><td>' + fmtDate(a.date+'T00:00:00') + '</td>' +
      '<td><span class="shift-badge shift-' + (a.shift||'day').toLowerCase() + '">' + (a.shift||'Day') + '</span></td>' +
      '<td>' + fmtTime(a.checkinTime) + '</td><td>' + fmtTime(a.checkoutTime) + '</td>' +
      '<td><strong>' + (a.total||0) + 'h</strong></td><td>' + (a.ot||0) + 'h</td>' +
      '<td><span class="badge badge-success">Done</span>' + (a.backdated ? ' <span class="tag-manual">M</span>' : '') + '</td></tr>';
  }
  tbody.innerHTML = html;
}

function requestCheckin() {
  var s = getSession();
  if (!s) return;
  workerCheckinReq(s.wid, s.shift).then(function(r) {
    if (r.ok) showToast(r.msg, 'success');
    else showToast(r.msg, 'error');
  });
}

function requestCheckout() {
  var s = getSession();
  if (!s) return;
  workerCheckoutReq(s.wid).then(function(r) {
    if (r.ok) showToast(r.msg, 'success');
    else showToast(r.msg, 'error');
  });
}

function doChangeWorkerPw() {
  var s = getSession();
  if (!s) return;
  var o = document.getElementById('wpOld').value;
  var n = document.getElementById('wpNew').value;
  var c = document.getElementById('wpConf').value;
  if (!o || !n || !c) { showToast('Fill all fields', 'error'); return; }
  if (n !== c) { showToast('Passwords do not match', 'error'); return; }
  changeWorkerPassword(s.wid, o, n).then(function(r) {
    if (r.ok) {
      showToast(r.msg, 'success');
      document.getElementById('wpOld').value = '';
      document.getElementById('wpNew').value = '';
      document.getElementById('wpConf').value = '';
    } else showToast(r.msg, 'error');
  });
}

// ====== ADMIN PANEL ======
function showAdminPanel(session) {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('workerDashboard').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';

  var el = document.getElementById('adminDisplayName');
  if (el) el.textContent = session.name || 'Admin';

  if (_clockInterval) clearInterval(_clockInterval);
  _clockInterval = startClock('adminClock');

  var today = tD();
  var dateIds = ['attDate','histDate','dwDate','customDate','bulkDate','histBdDate','histBulkDate','expFrom','expTo'];
  for (var i=0; i<dateIds.length; i++) {
    var d = document.getElementById(dateIds[i]);
    if (d && d.type === 'date') d.value = today;
  }
  var now = new Date().toLocaleTimeString('en-GB', { timeZone:TZ, hour:'2-digit', minute:'2-digit' });
  var timeIds = ['qcInTime','qcOutTime'];
  for (var j=0; j<timeIds.length; j++) {
    var t = document.getElementById(timeIds[j]);
    if (t) t.value = now;
  }
  var msel = document.getElementById('monthlyMonth');
  if (msel) msel.value = new Date().getMonth() + 1;
  var sn = document.getElementById('setAdminName');
  if (sn && _adminData.name) sn.value = _adminData.name;

  if (typeof initHistory === 'function') initHistory();
  renderWorkerDropdowns();
  populateWorkerDropdown();
  showSection('secDashboard');
  renderDashboard();
  renderApprovals();
  renderLiveStatus();
  renderAttendanceView();
  renderAdminWorkers();
  renderManualEntry();
  updateEndDayStats();
  updateSettingsInfo();
}

// ====== DASHBOARD ======
function renderDashboard() {
  var today = tD(); var all = gA(); var ws = gW();
  var active = [];
  for (var i=0; i<ws.length; i++) if (ws[i].on) active.push(ws[i]);
  var present = getPresentWorkerIds(today, all, 'All');
  var working=0, done=0, pending=0;
  for (var j=0; j<all.length; j++) {
    var a = all[j];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (d !== today) continue;
    if (a.status === 'checked_in') working++;
    else if (a.status === 'completed') done++;
    else if (a.status === 'pending_checkin' || a.status === 'pending_checkout') pending++;
  }
  setEl('dTotalWorkers', active.length);
  setEl('dPresent', present.length);
  setEl('dAbsent', active.length - present.length);
  setEl('dWorking', working);
  setEl('dDone', done);
  setEl('dPending', pending);
  setEl('approvalCount', pending);

  var dW=0,nW=0,dP=0,nP=0,iT=0,pT=0,iP=0,pP=0;
  for (var k=0; k<active.length; k++) {
    if (active[k].shift === 'Day') dW++; else nW++;
    if (active[k].sec === 'Indian') iT++; else pT++;
  }
  for (var l=0; l<present.length; l++) {
    var pw = findWorker(present[l]); if (!pw) continue;
    if (pw.shift === 'Day') dP++; else nP++;
    if (pw.sec === 'Indian') iP++; else pP++;
  }
  setEl('dDayPresent', dP); setEl('dDayTotal', dW);
  setEl('dNightPresent', nP); setEl('dNightTotal', nW);
  setEl('dIndPresent', iP); setEl('dIndTotal', iT);
  setEl('dPakPresent', pP); setEl('dPakTotal', pT);

  var absent = getAbsentWorkers(today, all, active, 'All', 'All');
  setEl('dashAbsentCount', absent.length);
  var abC = document.getElementById('dashAbsentList');
  if (abC) {
    if (absent.length === 0) {
      abC.innerHTML = '<div class="all-present-msg"><span class="material-symbols-outlined">celebration</span> All workers present today!</div>';
    } else {
      var html = '';
      for (var ab=0; ab<absent.length; ab++) {
        var w = absent[ab];
        html += '<div class="absent-tag"><div class="absent-tag-init">' + getInitials(w.name) + '</div>' +
          '<div class="absent-tag-info"><div class="absent-tag-name">' + w.name + '</div>' +
          '<div class="absent-tag-meta">' + w.wid + ' · ' + w.shift + '</div></div></div>';
      }
      abC.innerHTML = html;
    }
  }
}

// ====== APPROVALS ======
function renderApprovals() {
  var all = gA(); var pending = []; var recent = [];
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    if (a.status === 'pending_checkin' || a.status === 'pending_checkout') pending.push(a);
    if (a.status === 'checked_in' && a.checkinTime) {
      if ((Date.now() - new Date(a.checkinTime).getTime())/3600000 < 2) recent.push(a);
    }
    if (a.status === 'completed' && a.checkoutTime) {
      if ((Date.now() - new Date(a.checkoutTime).getTime())/3600000 < 2) recent.push(a);
    }
  }
  setEl('pendingCount', pending.length);
  setEl('approvalCount', pending.length);

  var c = document.getElementById('pendingApprovalsContainer');
  if (c) {
    if (pending.length === 0) {
      c.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">check_circle</span><p>No pending requests</p></div>';
    } else {
      var h = '<div class="approval-list">';
      for (var j=0; j<pending.length; j++) {
        var p = pending[j];
        var isIn = p.status === 'pending_checkin';
        h += '<div class="approval-item"><div class="approval-info"><div class="approval-name">' + p.name + '</div>' +
          '<div class="approval-meta">' + p.wid + ' · ' + p.sec + ' · ' + (p.shift||'Day') + '</div>' +
          '<div class="approval-time">' + (isIn ? 'In: '+fmtTime(p.checkinReqTime) : 'Out: '+fmtTime(p.checkoutReqTime)) + '</div></div>' +
          '<span class="badge ' + (isIn ? 'badge-success' : 'badge-warn') + '">' + (isIn ? 'CHECK IN' : 'CHECK OUT') + '</span>' +
          '<div class="approval-actions">' +
          '<button class="btn btn-success btn-sm" onclick="approveRecord(\''+p.recId+'\','+isIn+')"><span class="material-symbols-outlined">check</span> Approve</button>' +
          '<button class="btn btn-danger btn-sm" onclick="rejectRecord(\''+p.recId+'\')"><span class="material-symbols-outlined">close</span> Reject</button>' +
          '</div></div>';
      }
      h += '</div>';
      c.innerHTML = h;
    }
  }

  var u = document.getElementById('undoContainer');
  if (u) {
    if (recent.length === 0) {
      u.innerHTML = '<div class="text-muted text-center py-3">No recent approvals</div>';
    } else {
      var uH = '<div class="undo-list">';
      for (var r=0; r<recent.length; r++) {
        var ua = recent[r];
        uH += '<div class="undo-item"><div class="undo-info"><strong>' + ua.name + '</strong> · ' + ua.wid +
          '<div class="undo-detail">' + (ua.status === 'checked_in' ? 'In: '+fmtTime(ua.checkinTime) : 'Done · Out: '+fmtTime(ua.checkoutTime)) + '</div></div>' +
          '<button class="btn btn-warning btn-sm" onclick="doUndoApproval(\''+ua.recId+'\')"><span class="material-symbols-outlined">undo</span> Undo</button></div>';
      }
      uH += '</div>';
      u.innerHTML = uH;
    }
  }
}

function approveRecord(recId, isCheckin) {
  if (isCheckin) adminApproveCheckin(recId).then(function() { renderApprovals(); renderDashboard(); });
  else adminApproveCheckout(recId).then(function() { renderApprovals(); renderDashboard(); });
}
function rejectRecord(recId) { adminReject(recId).then(function() { renderApprovals(); renderDashboard(); }); }
function doUndoApproval(recId) { showConfirm('Undo this approval?', function() { undoApproval(recId).then(function() { renderApprovals(); renderDashboard(); }); }); }

// ====== LIVE STATUS ======
function renderLiveStatus() {
  var today = tD(); var all = gA(); var working = [], done = [];
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (d !== today) continue;
    if (a.status === 'checked_in' || a.status === 'pending_checkout') working.push(a);
    else if (a.status === 'completed') done.push(a);
  }
  setEl('liveWorkingCount', working.length);
  setEl('liveDoneCount', done.length);

  var wEl = document.getElementById('liveWorkingList');
  if (wEl) {
    if (working.length === 0) {
      wEl.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">person_off</span><p>No one working</p></div>';
    } else {
      var h = '<div class="live-worker-list">';
      for (var j=0; j<working.length; j++) {
        var w = working[j];
        var el = w.checkinTime ? Math.round((Date.now() - new Date(w.checkinTime).getTime())/3600000 * 10)/10 : 0;
        h += '<div class="live-worker-item"><div class="live-worker-avatar">' + getInitials(w.name) + '</div>' +
          '<div class="live-worker-info"><div class="live-worker-name">' + w.name + '</div>' +
          '<div class="live-worker-meta">' + w.wid + ' · ' + (w.shift||'Day') + '</div>' +
          '<div class="live-worker-time">In: ' + fmtTime(w.checkinTime) + ' · ' + el + 'h</div></div>' +
          '<button class="btn btn-sm btn-danger" onclick="adminCheckoutLive(\''+w.recId+'\')"><span class="material-symbols-outlined">logout</span></button></div>';
      }
      h += '</div>';
      wEl.innerHTML = h;
    }
  }

  var dEl = document.getElementById('liveDoneList');
  if (dEl) {
    if (done.length === 0) {
      dEl.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">hourglass_empty</span><p>No completions yet</p></div>';
    } else {
      var dH = '<div class="live-worker-list">';
      for (var k=0; k<done.length; k++) {
        var da = done[k];
        dH += '<div class="live-worker-item"><div class="live-worker-avatar" style="background:linear-gradient(135deg,#059669,#10b981)">' + getInitials(da.name) + '</div>' +
          '<div class="live-worker-info"><div class="live-worker-name">' + da.name + '</div>' +
          '<div class="live-worker-time">' + fmtTime(da.checkinTime) + ' → ' + fmtTime(da.checkoutTime) + ' · ' + (da.total||0) + 'h</div></div>' +
          '<span class="badge badge-success">Done</span></div>';
      }
      dH += '</div>';
      dEl.innerHTML = dH;
    }
  }
}
function adminCheckoutLive(recId) { showConfirm('Checkout now?', function() { adminApproveCheckout(recId).then(function() { renderLiveStatus(); renderDashboard(); }); }); }

// ====== ATTENDANCE VIEW ======
function renderAttendanceView() {
  var date = document.getElementById('attDate') ? document.getElementById('attDate').value : tD();
  if (!date) date = tD();
  var shift = document.getElementById('attShift') ? document.getElementById('attShift').value : 'All';
  var section = document.getElementById('attSection') ? document.getElementById('attSection').value : 'All';
  var status = document.getElementById('attStatus') ? document.getElementById('attStatus').value : 'All';
  var all = gA(); var ws = gW();

  var presentWids = []; var presentRecs = []; var processed = [];
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (d !== date) continue;
    if (a.status !== 'checked_in' && a.status !== 'pending_checkout' && a.status !== 'completed') continue;
    if (shift !== 'All' && a.shift !== shift) continue;
    if (section !== 'All' && a.sec !== section) continue;
    if (indexOf(processed, a.wid) !== -1) continue;
    var w = findWorker(a.wid); if (!w) continue;
    processed.push(a.wid); presentWids.push(a.wid);
    presentRecs.push({ worker:w, att:a });
  }

  var absent = [];
  for (var j=0; j<ws.length; j++) {
    var w2 = ws[j];
    if (!w2.on) continue;
    if (section !== 'All' && w2.sec !== section) continue;
    if (shift !== 'All' && w2.shift !== shift) continue;
    if (indexOf(presentWids, w2.wid) !== -1) continue;
    absent.push(w2);
  }

  var total = presentRecs.length + absent.length;
  setEl('attSumTotal', total);
  setEl('attSumPresent', presentRecs.length);
  setEl('attSumAbsent', absent.length);
  setEl('attPresentCount', presentRecs.length);
  setEl('attAbsentCount', absent.length);

  var pBody = document.getElementById('attPresentBody');
  if (pBody) {
    if (status === 'Absent') document.getElementById('attPresentCard').style.display = 'none';
    else {
      document.getElementById('attPresentCard').style.display = 'block';
      if (presentRecs.length === 0) {
        pBody.innerHTML = '<tr><td colspan="11" class="text-center text-muted">No present workers</td></tr>';
      } else {
        var pH = '';
        for (var p=0; p<presentRecs.length; p++) {
          var pr = presentRecs[p];
          var sb = getStatusBadge(pr.att.status);
          var isM = pr.att.backdated ? '<span class="tag-manual">M</span>' : '';
          pH += '<tr><td>' + (p+1) + '</td><td><strong>' + pr.worker.name + '</strong> ' + isM + '<br><small>' + pr.worker.wid + '</small></td>' +
            '<td>' + pr.worker.sec + '</td><td><span class="shift-badge shift-' + (pr.att.shift||'day').toLowerCase() + '">' + (pr.att.shift||'Day') + '</span></td>' +
            '<td>' + fmtTime(pr.att.checkinTime || pr.att.checkinReqTime) + '</td>' +
            '<td>' + (pr.att.checkoutTime ? fmtTime(pr.att.checkoutTime) : '-') + '</td>' +
            '<td>' + (pr.att.total ? '<strong>'+pr.att.total+'h</strong>' : '-') + '</td>' +
            '<td>' + (pr.att.regular||0) + 'h</td>' +
            '<td>' + (pr.att.ot ? '<span class="ot-val">'+pr.att.ot+'h</span>' : '-') + '</td>' +
            '<td>' + sb + '</td>' +
            '<td><button class="btn-icon btn-edit" onclick="editAttRecord(\''+pr.att.recId+'\')"><span class="material-symbols-outlined">edit</span></button>' +
            '<button class="btn-icon btn-delete" onclick="deleteAttRecord(\''+pr.att.recId+'\')"><span class="material-symbols-outlined">delete</span></button></td></tr>';
        }
        pBody.innerHTML = pH;
      }
    }
  }

  var abG = document.getElementById('attAbsentGrid');
  if (abG) {
    if (status === 'Present') document.getElementById('attAbsentCard').style.display = 'none';
    else {
      document.getElementById('attAbsentCard').style.display = 'block';
      if (absent.length === 0) {
        abG.innerHTML = '<div class="all-present-msg"><span class="material-symbols-outlined">celebration</span> All present!</div>';
      } else {
        var aH = '';
        for (var ab=0; ab<absent.length; ab++) {
          var abW = absent[ab];
          aH += '<div class="absent-card"><div class="absent-initials">' + getInitials(abW.name) + '</div>' +
            '<div class="absent-info"><div class="absent-name">' + abW.name + '</div>' +
            '<div class="absent-meta">' + abW.wid + ' · ' + abW.prof + '</div>' +
            '<div class="absent-meta">' + abW.sec + ' · ' + abW.shift + '</div></div>' +
            '<button class="btn-absent-in" onclick="quickAttAbsent(\''+abW.wid+'\',\''+date+'\')"><span class="material-symbols-outlined">add_circle</span> Add</button></div>';
        }
        abG.innerHTML = aH;
      }
    }
  }
}

function quickAttAbsent(wid, date) {
  if (typeof quickAddAbsent === 'function') { quickAddAbsent(wid, date); return; }
  var w = findWorker(wid); if (!w) return;
  var shift = w.shift || 'Day';
  var dIn = shift === 'Night' ? '20:00' : '08:00';
  var dOut = shift === 'Night' ? '08:00' : '20:00';
  manualCheckin(wid, shift, date, dIn).then(function(r1) {
    if (!r1.ok) { showToast(r1.msg, 'error'); return; }
    setTimeout(function() {
      manualCheckout(wid, shift, date, dOut).then(function(r2) {
        if (r2.ok) showToast(w.name + ' attendance added!', 'success');
        renderAttendanceView();
      });
    }, 300);
  });
}

function editAttRecord(recId) { if (typeof editHistRecord === 'function') editHistRecord(recId); }
function deleteAttRecord(recId) {
  if (typeof deleteHistRecord === 'function') { deleteHistRecord(recId); return; }
  showConfirm('Delete this record?', function() {
    FB.delete('attendance', recId).then(function() { showToast('Deleted!', 'info'); renderAttendanceView(); });
  });
}

// ====== WORKERS ======
function setWorkerTab(tab) {
  _workerTabActive = tab;
  document.getElementById('wtabIndian').classList.toggle('active', tab === 'Indian');
  document.getElementById('wtabPakistani').classList.toggle('active', tab === 'Pakistani');
  renderAdminWorkers();
}

function renderAdminWorkers() {
  var search = document.getElementById('workerSearch') ? document.getElementById('workerSearch').value.toLowerCase() : '';
  var statusF = document.getElementById('workerStatusFilter') ? document.getElementById('workerStatusFilter').value : 'All';
  var ws = gW(); var filtered = [];
  var iC=0, pC=0;
  for (var x=0; x<ws.length; x++) {
    if (ws[x].on && ws[x].sec === 'Indian') iC++;
    if (ws[x].on && ws[x].sec === 'Pakistani') pC++;
  }
  setEl('wtabIndCount', iC); setEl('wtabPakCount', pC);

  for (var i=0; i<ws.length; i++) {
    var w = ws[i];
    if (w.sec !== _workerTabActive) continue;
    if (statusF === 'Active' && !w.on) continue;
    if (statusF === 'Inactive' && w.on) continue;
    if (search && (w.name+w.wid+w.prof+w.sec).toLowerCase().indexOf(search) === -1) continue;
    filtered.push(w);
  }

  var tbody = document.getElementById('workersTableBody'); if (!tbody) return;
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No workers found</td></tr>';
    return;
  }
  var html = '';
  for (var j=0; j<filtered.length; j++) {
    var fw = filtered[j];
    html += '<tr class="' + (!fw.on ? 'row-inactive' : '') + '"><td>' + (j+1) + '</td>' +
      '<td><span class="worker-id-badge">' + fw.wid + '</span></td>' +
      '<td><strong>' + fw.name + '</strong></td>' +
      '<td>' + fw.prof + '</td><td>' + fw.sec + '</td>' +
      '<td><span class="shift-badge shift-' + (fw.shift||'day').toLowerCase() + ' shift-clickable" onclick="doToggleShift(\''+fw.wid+'\')">' + (fw.shift||'Day') + '</span></td>' +
      '<td><span class="status-dot ' + (fw.on ? 'status-active' : 'status-inactive') + '"></span>' + (fw.on ? 'Active' : 'Inactive') + '</td>' +
      '<td class="action-cell">' +
        '<button class="btn-icon btn-edit" onclick="showEditWorker(\''+fw.wid+'\')" title="Edit"><span class="material-symbols-outlined">edit</span></button>' +
        '<button class="btn-icon ' + (fw.on ? 'btn-warn' : 'btn-success') + '" onclick="doToggleActive(\''+fw.wid+'\')" title="' + (fw.on ? 'Deactivate' : 'Activate') + '"><span class="material-symbols-outlined">' + (fw.on ? 'person_off' : 'person') + '</span></button>' +
        '<button class="btn-icon btn-info" onclick="doResetWorkerPw(\''+fw.wid+'\')" title="Reset Password"><span class="material-symbols-outlined">lock_reset</span></button>' +
        '<button class="btn-icon btn-delete" onclick="doDeleteWorker(\''+fw.wid+'\')" title="Delete"><span class="material-symbols-outlined">delete</span></button>' +
      '</td></tr>';
  }
  tbody.innerHTML = html;
}

function showAddWorker() {
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Worker ID</label><input type="text" id="awId" class="form-control" placeholder="e.g. IND0038"></div>' +
    '<div class="form-group"><label class="form-label">Full Name</label><input type="text" id="awName" class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Profession</label><input type="text" id="awProf" class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Section</label><select id="awSec" class="form-control"><option value="Indian">Indian</option><option value="Pakistani">Pakistani</option></select></div>' +
    '<div class="form-group"><label class="form-label">Shift</label><select id="awShift" class="form-control"><option value="Day">Day</option><option value="Night">Night</option></select></div>' +
    '</div><div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="doAddWorker()">Add Worker</button></div>';
  showModal(html, 'Add New Worker');
}
function doAddWorker() {
  var id = document.getElementById('awId').value.trim().toUpperCase();
  var name = document.getElementById('awName').value.trim();
  var prof = document.getElementById('awProf').value.trim();
  var sec = document.getElementById('awSec').value;
  var shift = document.getElementById('awShift').value;
  if (!id || !name) { showToast('ID and Name required', 'error'); return; }
  addWorker(id, name, prof, sec, shift).then(function(r) {
    if (r.ok) { closeModal(); renderAdminWorkers(); }
    else showToast(r.msg, 'error');
  });
}
function showEditWorker(wid) {
  var w = findWorker(wid); if (!w) return;
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">ID</label><input type="text" value="'+w.wid+'" readonly class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Name</label><input type="text" id="ewName" value="'+w.name+'" class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Profession</label><input type="text" id="ewProf" value="'+w.prof+'" class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Section</label><select id="ewSec" class="form-control"><option value="Indian"'+(w.sec==='Indian'?' selected':'')+'>Indian</option><option value="Pakistani"'+(w.sec==='Pakistani'?' selected':'')+'>Pakistani</option></select></div>' +
    '<div class="form-group"><label class="form-label">Shift</label><select id="ewShift" class="form-control"><option value="Day"'+(w.shift==='Day'?' selected':'')+'>Day</option><option value="Night"'+(w.shift==='Night'?' selected':'')+'>Night</option></select></div>' +
    '</div><div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="doEditWorker(\''+wid+'\')">Save</button></div>';
  showModal(html, 'Edit Worker - ' + w.name);
}
function doEditWorker(wid) {
  editWorker(wid, {
    name: document.getElementById('ewName').value.trim(),
    prof: document.getElementById('ewProf').value.trim(),
    sec: document.getElementById('ewSec').value,
    shift: document.getElementById('ewShift').value
  }).then(function(r) { if (r.ok) { closeModal(); renderAdminWorkers(); } else showToast(r.msg, 'error'); });
}
function doToggleShift(wid) { toggleWorkerShift(wid).then(function() { renderAdminWorkers(); }); }
function doToggleActive(wid) {
  var w = findWorker(wid); if (!w) return;
  showConfirm((w.on ? 'Deactivate' : 'Activate') + ' ' + w.name + '?', function() {
    toggleWorkerActive(wid).then(function() { renderAdminWorkers(); });
  });
}
function doResetWorkerPw(wid) {
  var w = findWorker(wid); if (!w) return;
  showConfirm('Reset password for ' + w.name + ' to Worker@123?', function() {
    FB.update('workers', wid, { pw:'Worker@123' }).then(function() { showToast('Password reset', 'success'); });
  });
}
function doDeleteWorker(wid) {
  var w = findWorker(wid); if (!w) return;
  showConfirm('Delete ' + w.name + '? Attendance records will remain.', function() {
    deleteWorker(wid).then(function() { renderAdminWorkers(); });
  });
}

// ====== MANUAL ENTRY QUICK ======
function doQuickCheckin() {
  var wid = document.getElementById('qcInWorker').value;
  var shift = document.getElementById('qcInShift').value;
  var time = document.getElementById('qcInTime').value;
  if (!wid) { showToast('Select worker', 'error'); return; }
  if (!time) { showToast('Enter time', 'error'); return; }
  manualCheckin(wid, shift, tD(), time).then(function(r) {
    if (r.ok) showToast(r.msg, 'success'); else showToast(r.msg, 'error');
    renderManualEntry();
  });
}
function doQuickCheckout() {
  var wid = document.getElementById('qcOutWorker').value;
  var time = document.getElementById('qcOutTime').value;
  if (!wid) { showToast('Select worker', 'error'); return; }
  if (!time) { showToast('Enter time', 'error'); return; }
  manualCheckout(wid, null, tD(), time).then(function(r) {
    if (r.ok) showToast(r.msg, 'success'); else showToast(r.msg, 'error');
    renderManualEntry();
  });
}

// ====== END DAY ======
function updateEndDayStats() {
  var today = tD(); var all = gA(); var w=0, p=0;
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (d !== today) continue;
    if (a.status === 'checked_in') w++;
    else if (a.status === 'pending_checkout') p++;
  }
  setEl('edsWorking', w); setEl('edsPending', p);
}
function doEndDay() {
  var time = document.getElementById('endDayTime').value;
  if (!time) { showToast('Enter time', 'error'); return; }
  showConfirm('Checkout ALL active workers at ' + time + '?', function() {
    endDay(time).then(function(r) {
      showToast(r.msg, 'success');
      updateEndDayStats();
      renderDashboard();
    });
  });
}

// ====== MONTHLY ======
function generateMonthlyReport() {
  var wid = document.getElementById('monthlyWorker').value;
  var y = parseInt(document.getElementById('monthlyYear').value);
  var m = parseInt(document.getElementById('monthlyMonth').value);
  var reports = getMonthlyReport(wid, y, m);
  var c = document.getElementById('monthlyReportContainer'); if (!c) return;
  if (!reports || reports.length === 0) {
    c.innerHTML = '<div class="empty-state"><p>No data found</p></div>';
    return;
  }
  var html = '';
  for (var i=0; i<reports.length; i++) {
    var r = reports[i];
    html += '<div class="card monthly-report-card"><div class="card-header"><span class="material-symbols-outlined">person</span><h3>' + r.worker.name + '</h3><span class="text-muted">' + r.worker.wid + '</span></div><div class="card-body">';
    html += '<div class="monthly-stats-row"><div class="mstat"><span class="mstat-num">' + r.totalDays + '</span><span>Days</span></div>';
    html += '<div class="mstat"><span class="mstat-num">' + r.totalHrs + 'h</span><span>Hours</span></div>';
    html += '<div class="mstat"><span class="mstat-num">' + r.totalOT + 'h</span><span>OT</span></div>';
    html += '<div class="mstat"><span class="mstat-num">' + r.dayShift + '</span><span>Day</span></div>';
    html += '<div class="mstat"><span class="mstat-num">' + r.nightShift + '</span><span>Night</span></div></div>';
    if (r.records.length > 0) {
      html += '<div class="table-responsive"><table class="data-table"><thead><tr><th>Date</th><th>Shift</th><th>In</th><th>Out</th><th>Hours</th><th>OT</th></tr></thead><tbody>';
      for (var j=0; j<r.records.length; j++) {
        var rec = r.records[j];
        html += '<tr><td>' + fmtDate(rec.date+'T00:00:00') + '</td>';
        html += '<td><span class="shift-badge shift-' + (rec.shift||'day').toLowerCase() + '">' + (rec.shift||'Day') + '</span></td>';
        html += '<td>' + fmtTime(rec.checkinTime) + '</td><td>' + fmtTime(rec.checkoutTime) + '</td>';
        html += '<td>' + (rec.total||0) + 'h</td><td>' + (rec.ot||0) + 'h</td></tr>';
      }
      html += '</tbody></table></div>';
    }
    html += '</div></div>';
  }
  c.innerHTML = html;
}

function exportMonthlyPDF() {
  var wid = document.getElementById('monthlyWorker').value;
  var y = parseInt(document.getElementById('monthlyYear').value);
  var m = parseInt(document.getElementById('monthlyMonth').value);
  var reports = getMonthlyReport(wid, y, m);
  if (!reports || reports.length === 0) { showToast('No data', 'warn'); return; }
  loadLogoForPDF().then(function() {
    var mn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var doc = new jspdf.jsPDF();
    var startY = addPDFHeader(doc, 'Monthly Report - ' + mn[m-1] + ' ' + y, 'Workers: ' + reports.length);
    for (var i=0; i<reports.length; i++) {
      var r = reports[i];
      if (i > 0) { doc.addPage(); startY = addPDFHeader(doc, 'Monthly - ' + mn[m-1] + ' ' + y, r.worker.name); }
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30,64,175);
      doc.text(r.worker.name + ' | ' + r.worker.wid, 14, startY + 8);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(71,85,105);
      doc.text('Days:'+r.totalDays+' | Hrs:'+r.totalHrs+'h | OT:'+r.totalOT+'h | Day:'+r.dayShift+' | Night:'+r.nightShift, 14, startY+16);
      if (r.records.length > 0) {
        var rows = [];
        for (var j=0; j<r.records.length; j++) {
          var rec = r.records[j];
          rows.push([fmtDate(rec.date+'T00:00:00'), rec.shift||'Day', fmtTime(rec.checkinTime), fmtTime(rec.checkoutTime), (rec.total||0)+'h', (rec.ot||0)+'h']);
        }
        doc.autoTable({
          startY: startY + 22,
          head: [['Date','Shift','In','Out','Total','OT']], body: rows,
          theme: 'grid', styles: { fontSize:8, cellPadding:2 },
          headStyles: { fillColor:[30,64,175], textColor:255 },
          alternateRowStyles: { fillColor:[240,245,255] }
        });
        startY = doc.lastAutoTable.finalY + 10;
      }
    }
    addPDFFooter(doc);
    doc.save('albowry_monthly_'+y+'_'+m+'.pdf');
    showToast('PDF downloaded!', 'success');
  });
}

function exportMonthlyCSV() {
  var wid = document.getElementById('monthlyWorker').value;
  var y = parseInt(document.getElementById('monthlyYear').value);
  var m = parseInt(document.getElementById('monthlyMonth').value);
  var reports = getMonthlyReport(wid, y, m);
  if (!reports || reports.length === 0) { showToast('No data', 'warn'); return; }
  var csv = COMPANY.full + '\nMonthly: ' + y + '-' + m + '\n\nWorker,ID,Section,Date,Shift,In,Out,Total,OT\n';
  for (var i=0; i<reports.length; i++) {
    var r = reports[i];
    for (var j=0; j<r.records.length; j++) {
      var rec = r.records[j];
      csv += '"'+r.worker.name+'",'+r.worker.wid+','+r.worker.sec+','+rec.date+','+(rec.shift||'Day')+','+fmtTime(rec.checkinTime)+','+fmtTime(rec.checkoutTime)+','+(rec.total||0)+','+(rec.ot||0)+'\n';
    }
  }
  var blob = new Blob([csv], { type:'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'albowry_monthly_'+y+'_'+m+'.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('CSV downloaded!', 'success');
}

// ====== EXPORT RANGE ======
function exportRangePDF() {
  var from = document.getElementById('expFrom').value;
  var to = document.getElementById('expTo').value;
  var filter = document.getElementById('expFilter').value;
  if (!from || !to) { showToast('Select dates', 'error'); return; }
  var data = getExportData(from, to, filter);
  if (data.length === 0) { showToast('No data', 'warn'); return; }
  loadLogoForPDF().then(function() {
    var doc = new jspdf.jsPDF('landscape');
    var startY = addPDFHeader(doc, 'Attendance Export: ' + from + ' to ' + to, filter + ' | ' + data.length + ' records');
    var rows = [];
    for (var i=0; i<data.length; i++) {
      var a = data[i];
      rows.push([a.date||'', a.name||'', a.wid||'', a.sec||'', a.shift||'Day', fmtTime(a.checkinTime), fmtTime(a.checkoutTime), (a.total||0)+'h', (a.ot||0)+'h']);
    }
    doc.autoTable({
      startY: startY,
      head: [['Date','Name','ID','Section','Shift','In','Out','Total','OT']], body: rows,
      theme: 'grid', styles: { fontSize:7, cellPadding:2 },
      headStyles: { fillColor:[30,64,175], textColor:255 },
      alternateRowStyles: { fillColor:[240,245,255] }
    });
    addPDFFooter(doc);
    doc.save('albowry_export_'+from+'_'+to+'.pdf');
    showToast('PDF exported!', 'success');
  });
}
function exportRangeExcel() {
  var from = document.getElementById('expFrom').value;
  var to = document.getElementById('expTo').value;
  var filter = document.getElementById('expFilter').value;
  if (!from || !to) { showToast('Select dates', 'error'); return; }
  var data = getExportData(from, to, filter);
  exportCSV(data, 'albowry_export_'+from+'_'+to+'.csv');
}
function exportRangeCSV() { exportRangeExcel(); }

// ====== SETTINGS ======
function doUpdateAdminName() {
  var name = document.getElementById('setAdminName').value.trim();
  updateAdmin('name', name).then(function(r) {
    if (r.ok) { var el = document.getElementById('adminDisplayName'); if (el) el.textContent = name; }
  });
}
function doUpdateAdminId() {
  var id = document.getElementById('setAdminId').value.trim();
  var pw = document.getElementById('setAdminIdPw').value;
  updateAdmin('id', id, pw).then(function(r) {
    if (r.ok) { document.getElementById('setAdminId').value = ''; document.getElementById('setAdminIdPw').value = ''; }
  });
}
function doUpdateAdminPw() {
  var o = document.getElementById('setOldPw').value;
  var n = document.getElementById('setNewPw').value;
  updateAdmin('pw', n, o).then(function(r) {
    if (r.ok) { document.getElementById('setOldPw').value = ''; document.getElementById('setNewPw').value = ''; }
  });
}
function doResetPasswords() { showConfirm('Reset ALL passwords to Worker@123?', function() { resetAllPasswords(); }); }
function doClearAttendance() {
  showConfirm('DANGER: Clear ALL attendance?', function() {
    showConfirm('Absolutely sure? Cannot undo!', function() { clearAllAttendance(); updateSettingsInfo(); });
  });
}
function updateSettingsInfo() {
  setEl('sysWorkerCount', gW().length);
  setEl('sysAttCount', gA().length);
  if (_lastSyncTime) setEl('sysLastSync', fmtDT(_lastSyncTime.toISOString()));
}

// ====== HELPERS ======
function setEl(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
function togglePw(id, btn) {
  var i = document.getElementById(id); if (!i) return;
  if (i.type === 'password') { i.type = 'text'; btn.innerHTML = '<span class="material-symbols-outlined">visibility_off</span>'; }
  else { i.type = 'password'; btn.innerHTML = '<span class="material-symbols-outlined">visibility</span>'; }
}
function toggleSidebar() {
  var s = document.getElementById('adminSidebar'), o = document.getElementById('sidebarOverlay');
  if (s) s.classList.toggle('open');
  if (o) o.classList.toggle('show');
}

// Override showSection to add auto-refresh + close sidebar on mobile
var _origShowSection = showSection;
showSection = function(id) {
  _origShowSection(id);
  if (window.innerWidth < 768) {
    var s = document.getElementById('adminSidebar'), o = document.getElementById('sidebarOverlay');
    if (s) s.classList.remove('open');
    if (o) o.classList.remove('show');
  }
  if (id === 'secDashboard') renderDashboard();
  if (id === 'secApprovals') renderApprovals();
  if (id === 'secLive') renderLiveStatus();
  if (id === 'secAttendance') renderAttendanceView();
  if (id === 'secWorkers') renderAdminWorkers();
  if (id === 'secManual') renderManualEntry();
  if (id === 'secHistory') { if (typeof initHistory === 'function') initHistory(); }
  if (id === 'secEndDay') updateEndDayStats();
  if (id === 'secSettings') updateSettingsInfo();
};

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    var wF = document.getElementById('workerLoginForm'), aF = document.getElementById('adminLoginForm');
    if (wF && wF.style.display !== 'none') doWorkerLogin();
    else if (aF && aF.style.display !== 'none') doAdminLogin();
  }
});

window.addEventListener('DOMContentLoaded', function() { bootstrap(); });

console.log('[ALB] ui.js v17 loaded');
