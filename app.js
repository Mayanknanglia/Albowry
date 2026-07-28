// AL BOWRY CARPENTRY LLC - ATTENDANCE MANAGEMENT SYSTEM
// app.js v18 - PDF logo + Salary calculation + OT fix

var APP_VERSION = 'v18';
var CACHE_KEY = 'alb_v18';

var COMPANY = {
  name: 'AL BOWRY CARPENTRY LLC',
  project: 'PROJECT COP31',
  site: 'Antalya, Turkey',
  office: 'Sharjah, UAE',
  web: 'www.albowry.com',
  full: 'AL BOWRY CARPENTRY LLC | Registered: Sharjah, UAE | Project: COP31, Antalya, Turkey'
};

var REG_HOURS = 9;
var COMP_OT = 3;
var TOTAL_SHIFT = 12;
var STANDARD_HOURS_PER_MONTH = 270; // 9 hrs × 30 days
var TZ = 'Europe/Istanbul';
var SESSION_KEY = 'alb_session';
var ADMIN_DOC = 'main';

var _workers = [];
var _attendance = [];
var _adminData = {};
var _listeners = [];
var _syncStatus = { workers: false, attendance: false, admin: false };
var _pendingInstall = null;
var _lastSyncTime = null;
var _cachedLogoDataUrl = null;

var FB = {
  db: null,
  init: function(db) { FB.db = db; },
  col: function(name) { return window.firestoreCol(FB.db, name); },
  doc: function(col, id) { return window.firestoreDoc(FB.db, col, id); },
  save: function(col, id, data) { return window.firestoreSet(FB.db, col, id, data); },
  update: function(col, id, data) { return window.firestoreUpdate(FB.db, col, id, data); },
  delete: function(col, id) { return window.firestoreDelete(FB.db, col, id); },
  getAll: function(col) { return window.firestoreGetAll(FB.db, col); },
  getDoc: function(col, id) { return window.firestoreGetDoc(FB.db, col, id); },
  listen: function(col, cb) { return window.firestoreListen(FB.db, col, cb); },
  listenDoc: function(col, id, cb) { return window.firestoreListenDoc(FB.db, col, id, cb); }
};

function gW() { return _workers || []; }
function gA() { return _attendance || []; }
function gAd() { return _adminData || {}; }

function tD() { return new Date().toLocaleDateString('en-CA', { timeZone: TZ }); }
function tNow() { return new Date().toISOString(); }

function fmtDT(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch(e) { return iso; }
}

function fmtDate(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch(e) { return iso; }
}

function fmtTime(iso) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleTimeString('en-GB', {
      timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch(e) { return iso; }
}

function getTurkeyDate(iso) {
  if (!iso) return tD();
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
}

function buildISO(dateStr, timeStr, isNightCheckout, checkinISO) {
  var dt = new Date(dateStr + 'T' + timeStr + ':00');
  if (isNightCheckout && checkinISO) {
    var cin = new Date(checkinISO);
    if (dt <= cin) { dt.setDate(dt.getDate() + 1); }
  }
  return dt.toISOString();
}

// ====== HOURS CALCULATION - FIXED (12hrs = 9 Regular + 3 CompOT) ======
function calcHours(checkinISO, checkoutISO) {
  if (!checkinISO || !checkoutISO) return { total: 0, regular: 0, compOT: 0, extraOT: 0, ot: 0 };
  var cin = new Date(checkinISO).getTime();
  var cout = new Date(checkoutISO).getTime();
  var totalMs = cout - cin;
  if (totalMs <= 0) return { total: 0, regular: 0, compOT: 0, extraOT: 0, ot: 0 };
  var total = Math.round((totalMs / 3600000) * 100) / 100;
  var regular = Math.min(total, REG_HOURS);
  var remaining = Math.max(0, total - REG_HOURS);
  var compOT = Math.min(remaining, COMP_OT);
  var extraOT = Math.max(0, remaining - COMP_OT);
  var ot = compOT + extraOT;
  return {
    total: Math.round(total * 100) / 100,
    regular: Math.round(regular * 100) / 100,
    compOT: Math.round(compOT * 100) / 100,
    extraOT: Math.round(extraOT * 100) / 100,
    ot: Math.round(ot * 100) / 100
  };
}

function getPresentWorkerIds(date, attendanceList, shift) {
  var presentIds = [];
  var filtered = attendanceList || gA();
  for (var i = 0; i < filtered.length; i++) {
    var att = filtered[i];
    var attDate = att.date || getTurkeyDate(att.checkinTime || att.checkinReqTime);
    if (attDate !== date) continue;
    if (shift && shift !== 'All' && att.shift !== shift) continue;
    if (att.status === 'checked_in' || att.status === 'pending_checkout' || att.status === 'completed') {
      if (indexOf(presentIds, att.wid) === -1) presentIds.push(att.wid);
    }
  }
  return presentIds;
}

function getAbsentWorkers(date, attendanceList, workers, shift, section) {
  var present = getPresentWorkerIds(date, attendanceList, shift);
  var absentWorkers = [];
  var allWorkers = workers || gW();
  for (var i = 0; i < allWorkers.length; i++) {
    var w = allWorkers[i];
    if (!w.on) continue;
    if (section && section !== 'All' && w.sec !== section) continue;
    if (shift && shift !== 'All' && w.shift !== shift) continue;
    if (indexOf(present, w.wid) === -1) absentWorkers.push(w);
  }
  return absentWorkers;
}

function getPresentWorkers(date, attendanceList, workers, shift, section) {
  var present = getPresentWorkerIds(date, attendanceList, shift);
  var presentWorkers = [];
  var allWorkers = workers || gW();
  for (var i = 0; i < allWorkers.length; i++) {
    var w = allWorkers[i];
    if (!w.on) continue;
    if (section && section !== 'All' && w.sec !== section) continue;
    if (indexOf(present, w.wid) === -1) continue;
    var attRec = null;
    var allAtt = attendanceList || gA();
    for (var j = 0; j < allAtt.length; j++) {
      var a = allAtt[j];
      var aDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
      if (a.wid === w.wid && aDate === date) {
        if (a.status === 'checked_in' || a.status === 'pending_checkout' || a.status === 'completed') {
          attRec = a; break;
        }
      }
    }
    if (attRec) presentWorkers.push({ worker: w, att: attRec });
  }
  return presentWorkers;
}

function indexOf(arr, val) {
  if (!arr) return -1;
  for (var i = 0; i < arr.length; i++) if (arr[i] === val) return i;
  return -1;
}

function getSession() {
  try { var s = localStorage.getItem(SESSION_KEY); return s ? JSON.parse(s) : null; }
  catch(e) { return null; }
}
function setSession(data) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch(e) {} }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch(e) {} }

function updateSyncUI() {
  var el = document.getElementById('syncStatus');
  if (!el) return;
  var allOk = _syncStatus.workers && _syncStatus.attendance && _syncStatus.admin;
  if (allOk) {
    el.innerHTML = '<span class="sync-dot sync-ok"></span> Synced';
    el.className = 'sync-badge sync-good';
    _lastSyncTime = new Date();
  } else {
    el.innerHTML = '<span class="sync-dot sync-warn"></span> Syncing...';
    el.className = 'sync-badge sync-warn';
  }
}

function startRealtimeSync() {
  for (var i = 0; i < _listeners.length; i++) { try { _listeners[i](); } catch(e) {} }
  _listeners = [];
  _listeners.push(FB.listen('workers', function(docs) {
    _workers = docs; _syncStatus.workers = true;
    updateSyncUI(); onWorkersUpdated();
  }));
  _listeners.push(FB.listen('attendance', function(docs) {
    _attendance = docs; _syncStatus.attendance = true;
    updateSyncUI(); onAttendanceUpdated();
  }));
  _listeners.push(FB.listenDoc('admin', ADMIN_DOC, function(doc) {
    if (doc) {
      _adminData = doc; _syncStatus.admin = true;
      updateSyncUI(); onAdminUpdated();
    }
  }));
}

function onWorkersUpdated() {
  var session = getSession();
  if (!session) return;
  if (session.role === 'admin') {
    refreshAdminWorkers(); refreshDashboard(); renderWorkerDropdowns();
  } else if (session.role === 'worker') {
    var w = findWorker(session.wid);
    if (w) {
      setSession({ role: 'worker', wid: w.wid, name: w.name, prof: w.prof, sec: w.sec, shift: w.shift });
      renderWorkerDashboard();
    } else {
      clearSession(); location.reload();
    }
  }
}

function onAttendanceUpdated() {
  var session = getSession();
  if (!session) return;
  if (session.role === 'admin') {
    refreshDashboard(); refreshApprovals(); refreshLiveStatus();
    refreshAttendanceView(); refreshManualEntry();
    if (typeof renderHistoryView === 'function') renderHistoryView();
  } else if (session.role === 'worker') {
    renderWorkerDashboard();
  }
}

function onAdminUpdated() {
  var session = getSession();
  if (!session || session.role !== 'admin') return;
  var nameEl = document.getElementById('adminDisplayName');
  if (nameEl && _adminData.name) nameEl.textContent = _adminData.name;
}

function findWorker(wid) {
  var ws = gW();
  for (var i = 0; i < ws.length; i++) if (ws[i].wid === wid) return ws[i];
  return null;
}

function findWorkerByName(name) {
  var ws = gW();
  for (var i = 0; i < ws.length; i++) if (ws[i].name === name) return ws[i];
  return null;
}

function getTodayAtt(wid) {
  var today = tD(); var att = gA();
  for (var i = 0; i < att.length; i++) {
    if (att[i].wid === wid && att[i].date === today) return att[i];
  }
  return null;
}

function getWorkerAtt(wid) {
  var result = []; var att = gA();
  for (var i = 0; i < att.length; i++) if (att[i].wid === wid) result.push(att[i]);
  result.sort(function(a, b) { return (b.date || '') > (a.date || '') ? 1 : -1; });
  return result;
}

function getDateAtt(date) {
  var result = []; var att = gA();
  for (var i = 0; i < att.length; i++) {
    var attDate = att[i].date || getTurkeyDate(att[i].checkinTime || att[i].checkinReqTime);
    if (attDate === date) result.push(att[i]);
  }
  return result;
}

function genRecId(wid, backdated) {
  var prefix = backdated ? 'att_bd_' : 'att_';
  return prefix + Date.now() + '_' + wid;
}

function workerLogin(wid, pw, shift) {
  var w = findWorker(wid);
  if (!w) return { ok: false, msg: 'Worker not found' };
  if (!w.on) return { ok: false, msg: 'Account deactivated. Contact admin.' };
  if (w.pw !== pw) return { ok: false, msg: 'Wrong password' };
  var session = { role: 'worker', wid: w.wid, name: w.name, prof: w.prof, sec: w.sec, shift: shift || w.shift };
  setSession(session);
  return { ok: true, worker: w, session: session };
}

function adminLogin(id, pw) {
  var ad = gAd();
  if (id === ad.adminId && pw === ad.pw) {
    setSession({ role: 'admin', name: ad.name || 'Admin' });
    return { ok: true };
  }
  if (id === 'ADMIN001' && pw === 'Admin@2026') {
    setSession({ role: 'admin', name: 'Pradeep Jangir' });
    return { ok: true };
  }
  return { ok: false, msg: 'Wrong Admin ID or Password' };
}

function workerCheckinReq(wid, shift) {
  var today = tD();
  var existing = getTodayAtt(wid);
  if (existing) {
    if (existing.status === 'pending_checkin') return Promise.resolve({ ok: false, msg: 'Check-in already pending approval' });
    if (existing.status === 'checked_in') return Promise.resolve({ ok: false, msg: 'Already checked in' });
    if (existing.status === 'pending_checkout') return Promise.resolve({ ok: false, msg: 'Checkout pending approval' });
    if (existing.status === 'completed') return Promise.resolve({ ok: false, msg: 'Today\'s attendance already completed' });
  }
  var w = findWorker(wid);
  if (!w) return Promise.resolve({ ok: false, msg: 'Worker not found' });
  var nowISO = tNow();
  var recId = genRecId(wid, false);
  var rec = {
    recId: recId, wid: wid, name: w.name, prof: w.prof, sec: w.sec,
    shift: shift || w.shift, date: today,
    checkinReqTime: nowISO, checkinTime: nowISO,
    checkoutReqTime: null, checkoutTime: null,
    total: 0, regular: 0, compOT: 0, extraOT: 0, ot: 0,
    status: 'pending_checkin', backdated: false
  };
  return FB.save('attendance', recId, rec).then(function() {
    return { ok: true, msg: 'Check-in requested at ' + fmtTime(nowISO) + '. Waiting for admin approval.' };
  }).catch(function(e) { return { ok: false, msg: 'Error: ' + e.message }; });
}

function workerCheckoutReq(wid) {
  var today = tD();
  var att = null;
  var allAtt = gA();
  for (var i = 0; i < allAtt.length; i++) {
    if (allAtt[i].wid === wid && allAtt[i].date === today && allAtt[i].status === 'checked_in') {
      att = allAtt[i]; break;
    }
  }
  if (!att) return Promise.resolve({ ok: false, msg: 'No active check-in found for today' });
  var nowISO = tNow();
  return FB.update('attendance', att.recId, {
    checkoutReqTime: nowISO, status: 'pending_checkout'
  }).then(function() {
    return { ok: true, msg: 'Checkout requested at ' + fmtTime(nowISO) + '. Waiting for admin approval.' };
  }).catch(function(e) { return { ok: false, msg: 'Error: ' + e.message }; });
}

function adminApproveCheckin(recId) {
  var att = null; var allAtt = gA();
  for (var i = 0; i < allAtt.length; i++) if (allAtt[i].recId === recId) { att = allAtt[i]; break; }
  if (!att) return Promise.resolve({ ok: false });
  var checkinTime = att.checkinReqTime || att.checkinTime || tNow();
  return FB.update('attendance', recId, {
    checkinTime: checkinTime, status: 'checked_in'
  }).then(function() {
    showToast((att.name || 'Worker') + ' check-in approved!', 'success');
    return { ok: true };
  }).catch(function(e) { showToast('Error: ' + e.message, 'error'); return { ok: false }; });
}

function adminApproveCheckout(recId) {
  var att = null; var allAtt = gA();
  for (var i = 0; i < allAtt.length; i++) if (allAtt[i].recId === recId) { att = allAtt[i]; break; }
  if (!att) return Promise.resolve({ ok: false, msg: 'Record not found' });
  var checkoutTime = att.checkoutReqTime || tNow();
  if (att.shift === 'Night' && att.checkinTime) {
    var cin = new Date(att.checkinTime);
    var cout = new Date(checkoutTime);
    if (cout <= cin) { cout.setDate(cout.getDate() + 1); checkoutTime = cout.toISOString(); }
  }
  var hrs = calcHours(att.checkinTime, checkoutTime);
  return FB.update('attendance', recId, {
    checkoutTime: checkoutTime,
    total: hrs.total, regular: hrs.regular,
    compOT: hrs.compOT, extraOT: hrs.extraOT, ot: hrs.ot,
    status: 'completed'
  }).then(function() {
    showToast((att.name || 'Worker') + ' checkout approved! ' + hrs.total + 'h worked', 'success');
    return { ok: true };
  }).catch(function(e) { showToast('Error: ' + e.message, 'error'); return { ok: false }; });
}

function adminReject(recId, reason) {
  var att = null; var allAtt = gA();
  for (var i = 0; i < allAtt.length; i++) if (allAtt[i].recId === recId) { att = allAtt[i]; break; }
  if (!att) return Promise.resolve({ ok: false });
  if (att.status === 'pending_checkin') {
    return FB.delete('attendance', recId).then(function() {
      showToast('Check-in rejected and removed', 'info');
      return { ok: true };
    });
  } else if (att.status === 'pending_checkout') {
    return FB.update('attendance', recId, {
      checkoutReqTime: null, status: 'checked_in'
    }).then(function() {
      showToast('Checkout request rejected', 'info');
      return { ok: true };
    });
  }
  return Promise.resolve({ ok: false });
}

function adminApproveAll(type) {
  var allAtt = gA(); var promises = [];
  var statusFilter = type === 'checkin' ? 'pending_checkin' : 'pending_checkout';
  for (var i = 0; i < allAtt.length; i++) {
    var att = allAtt[i];
    if (att.status === statusFilter) {
      if (type === 'checkin') promises.push(adminApproveCheckin(att.recId));
      else promises.push(adminApproveCheckout(att.recId));
    }
  }
  return Promise.all(promises).then(function() {
    showToast('All ' + type + ' approved!', 'success');
    return { ok: true, count: promises.length };
  });
}

function undoApproval(recId) {
  var att = null; var allAtt = gA();
  for (var i = 0; i < allAtt.length; i++) if (allAtt[i].recId === recId) { att = allAtt[i]; break; }
  if (!att) return Promise.resolve({ ok: false, msg: 'Record not found' });
  if (att.status === 'checked_in' && !att.checkoutTime) {
    return FB.delete('attendance', recId).then(function() {
      showToast('Check-in undone', 'info');
      return { ok: true };
    });
  } else if (att.status === 'completed' && att.checkoutTime) {
    return FB.update('attendance', recId, {
      checkoutTime: null, checkoutReqTime: null,
      total: 0, regular: 0, compOT: 0, extraOT: 0, ot: 0,
      status: 'checked_in'
    }).then(function() {
      showToast('Checkout undone', 'info');
      return { ok: true };
    });
  }
  return Promise.resolve({ ok: false, msg: 'Cannot undo this record' });
}

function manualCheckin(wid, shift, dateStr, timeStr) {
  var w = findWorker(wid);
  if (!w) return Promise.resolve({ ok: false, msg: 'Worker not found' });
  var date = dateStr || tD();
  var time = timeStr || new Date().toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  var checkinISO = buildISO(date, time, false, null);
  var allAtt = gA();
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    var aDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (a.wid === wid && aDate === date) {
      if (a.status !== 'completed') {
        return Promise.resolve({ ok: false, msg: w.name + ' already has an active record for ' + date });
      }
    }
  }
  var recId = genRecId(wid, dateStr ? true : false);
  var rec = {
    recId: recId, wid: wid, name: w.name, prof: w.prof, sec: w.sec,
    shift: shift || w.shift, date: date,
    checkinReqTime: checkinISO, checkinTime: checkinISO,
    checkoutReqTime: null, checkoutTime: null,
    total: 0, regular: 0, compOT: 0, extraOT: 0, ot: 0,
    status: 'checked_in', backdated: dateStr ? true : false
  };
  return FB.save('attendance', recId, rec).then(function() {
    return { ok: true, msg: w.name + ' checked in at ' + fmtTime(checkinISO) };
  }).catch(function(e) { return { ok: false, msg: 'Error: ' + e.message }; });
}

function manualCheckout(wid, shift, dateStr, timeStr) {
  var w = findWorker(wid);
  if (!w) return Promise.resolve({ ok: false, msg: 'Worker not found' });
  var date = dateStr || tD();
  var allAtt = gA(); var att = null;
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    var aDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (a.wid === wid && aDate === date && (a.status === 'checked_in' || a.status === 'pending_checkout')) {
      att = a; break;
    }
  }
  if (!att) return Promise.resolve({ ok: false, msg: w.name + ' has no active check-in for ' + date });
  var time = timeStr || new Date().toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  var checkoutISO = buildISO(date, time, att.shift === 'Night', att.checkinTime);
  var hrs = calcHours(att.checkinTime, checkoutISO);
  return FB.update('attendance', att.recId, {
    checkoutTime: checkoutISO, checkoutReqTime: checkoutISO,
    total: hrs.total, regular: hrs.regular,
    compOT: hrs.compOT, extraOT: hrs.extraOT, ot: hrs.ot,
    status: 'completed'
  }).then(function() {
    return { ok: true, msg: w.name + ' checked out at ' + fmtTime(checkoutISO) + ' | ' + hrs.total + 'h worked' };
  }).catch(function(e) { return { ok: false, msg: 'Error: ' + e.message }; });
}

function bulkCheckin(wids, shift, dateStr, timeStr) {
  var promises = [];
  for (var i = 0; i < wids.length; i++) promises.push(manualCheckin(wids[i], shift, dateStr, timeStr));
  return Promise.all(promises).then(function(results) {
    var ok = 0, fail = 0;
    for (var i = 0; i < results.length; i++) { if (results[i].ok) ok++; else fail++; }
    return { ok: true, success: ok, failed: fail };
  });
}

function bulkCheckout(wids, shift, dateStr, timeStr) {
  var promises = [];
  for (var i = 0; i < wids.length; i++) promises.push(manualCheckout(wids[i], shift, dateStr, timeStr));
  return Promise.all(promises).then(function(results) {
    var ok = 0, fail = 0;
    for (var i = 0; i < results.length; i++) { if (results[i].ok) ok++; else fail++; }
    return { ok: true, success: ok, failed: fail };
  });
}

function endDay(timeStr) {
  var today = tD(); var allAtt = gA(); var activeWids = [];
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    var aDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (aDate === today && (a.status === 'checked_in' || a.status === 'pending_checkout')) {
      activeWids.push(a.wid);
    }
  }
  if (activeWids.length === 0) return Promise.resolve({ ok: true, msg: 'No active workers to checkout', count: 0 });
  return bulkCheckout(activeWids, null, today, timeStr).then(function(res) {
    return { ok: true, msg: 'Checked out ' + res.success + ' workers', count: res.success };
  });
}

function changeWorkerPassword(wid, oldPw, newPw) {
  var w = findWorker(wid);
  if (!w) return Promise.resolve({ ok: false, msg: 'Worker not found' });
  if (w.pw !== oldPw) return Promise.resolve({ ok: false, msg: 'Current password is wrong' });
  if (newPw.length < 6) return Promise.resolve({ ok: false, msg: 'New password must be at least 6 characters' });
  return FB.update('workers', wid, { pw: newPw }).then(function() {
    return { ok: true, msg: 'Password changed successfully' };
  }).catch(function(e) { return { ok: false, msg: 'Error: ' + e.message }; });
}

function updateAdmin(field, value, confirmPw) {
  var ad = gAd(); var update = {};
  if (field === 'name') {
    if (!value) return Promise.resolve({ ok: false, msg: 'Name cannot be empty' });
    update.name = value;
  } else if (field === 'id') {
    if (!value) return Promise.resolve({ ok: false, msg: 'Admin ID cannot be empty' });
    if (ad.pw !== confirmPw) return Promise.resolve({ ok: false, msg: 'Current password wrong' });
    update.adminId = value;
  } else if (field === 'pw') {
    if (ad.pw !== confirmPw) return Promise.resolve({ ok: false, msg: 'Current password wrong' });
    if (!value || value.length < 6) return Promise.resolve({ ok: false, msg: 'New password min 6 chars' });
    update.pw = value;
  }
  return FB.update('admin', ADMIN_DOC, update).then(function() {
    Object.assign(_adminData, update);
    showToast(field + ' updated!', 'success');
    return { ok: true };
  }).catch(function(e) { return { ok: false, msg: e.message }; });
}

function addWorker(wid, name, prof, sec, shift) {
  if (!wid || !name) return Promise.resolve({ ok: false, msg: 'ID and Name required' });
  if (findWorker(wid)) return Promise.resolve({ ok: false, msg: 'Worker ID already exists' });
  var w = {
    wid: wid, name: name.trim(), prof: prof || 'Worker',
    sec: sec || 'Indian', shift: shift || 'Day',
    pw: 'Worker@123', on: true
  };
  return FB.save('workers', wid, w).then(function() {
    showToast(name + ' added!', 'success');
    return { ok: true };
  }).catch(function(e) { return { ok: false, msg: e.message }; });
}

function editWorker(wid, updates) {
  return FB.update('workers', wid, updates).then(function() {
    showToast('Worker updated!', 'success');
    return { ok: true };
  }).catch(function(e) { return { ok: false, msg: e.message }; });
}

function deleteWorker(wid) {
  return FB.delete('workers', wid).then(function() {
    showToast('Worker deleted', 'info');
    return { ok: true };
  }).catch(function(e) { return { ok: false, msg: e.message }; });
}

function toggleWorkerActive(wid) {
  var w = findWorker(wid);
  if (!w) return Promise.resolve({ ok: false });
  return FB.update('workers', wid, { on: !w.on }).then(function() {
    showToast(w.name + (w.on ? ' deactivated' : ' activated'), 'info');
    return { ok: true };
  });
}

function toggleWorkerShift(wid) {
  var w = findWorker(wid);
  if (!w) return Promise.resolve({ ok: false });
  var newShift = w.shift === 'Day' ? 'Night' : 'Day';
  return FB.update('workers', wid, { shift: newShift }).then(function() {
    showToast(w.name + ' shift changed to ' + newShift, 'info');
    return { ok: true };
  });
}

function resetAllPasswords() {
  var ws = gW(); var promises = [];
  for (var i = 0; i < ws.length; i++) promises.push(FB.update('workers', ws[i].wid, { pw: 'Worker@123' }));
  return Promise.all(promises).then(function() {
    showToast('All passwords reset to Worker@123', 'success');
    return { ok: true };
  });
}

function clearAllAttendance() {
  var allAtt = gA(); var promises = [];
  for (var i = 0; i < allAtt.length; i++) promises.push(FB.delete('attendance', allAtt[i].recId));
  return Promise.all(promises).then(function() {
    showToast('All attendance cleared', 'info');
    return { ok: true };
  });
}

function backupData() {
  var data = {
    exportedAt: new Date().toISOString(),
    company: COMPANY,
    workers: gW(), attendance: gA(),
    admin: { adminId: gAd().adminId, name: gAd().name }
  };
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'albowry_backup_' + tD() + '.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('Backup downloaded!', 'success');
}

function getMonthlyReport(wid, year, month) {
  var allAtt = gA(); var result = [];
  var monthStr = year + '-' + (month < 10 ? '0' + month : '' + month);
  var workers = wid === 'all' ? gW() : [findWorker(wid)];
  for (var i = 0; i < workers.length; i++) {
    var w = workers[i];
    if (!w || !w.on) continue;
    var workerAtt = [];
    var totalDays = 0, totalHrs = 0, totalOT = 0, dayShift = 0, nightShift = 0;
    for (var j = 0; j < allAtt.length; j++) {
      var a = allAtt[j];
      if (a.wid !== w.wid) continue;
      var attDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
      if (attDate.indexOf(monthStr) !== 0) continue;
      if (a.status !== 'completed') continue;
      workerAtt.push(a);
      totalDays++;
      totalHrs += a.total || 0;
      totalOT += a.ot || 0;
      if (a.shift === 'Night') nightShift++; else dayShift++;
    }
    workerAtt.sort(function(a, b) { return a.date > b.date ? 1 : -1; });
    result.push({
      worker: w, records: workerAtt,
      totalDays: totalDays,
      totalHrs: Math.round(totalHrs * 100) / 100,
      totalOT: Math.round(totalOT * 100) / 100,
      dayShift: dayShift, nightShift: nightShift
    });
  }
  return result;
}

function getExportData(fromDate, toDate, filter) {
  var allAtt = gA(); var result = [];
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    if (a.status !== 'completed') continue;
    var attDate = a.date || getTurkeyDate(a.checkinTime);
    if (attDate < fromDate || attDate > toDate) continue;
    if (filter && filter !== 'All') {
      if (filter === 'Day' && a.shift !== 'Day') continue;
      if (filter === 'Night' && a.shift !== 'Night') continue;
      if (filter === 'Indian' && a.sec !== 'Indian') continue;
      if (filter === 'Pakistani' && a.sec !== 'Pakistani') continue;
    }
    result.push(a);
  }
  result.sort(function(a, b) {
    if (a.date !== b.date) return a.date > b.date ? 1 : -1;
    return a.name > b.name ? 1 : -1;
  });
  return result;
}

// ====== SALARY CALCULATION ======
function calculateSalary(wid, year, month, monthlySalaryAED) {
  var w = findWorker(wid);
  if (!w) return null;
  var allAtt = gA();
  var monthStr = year + '-' + (month < 10 ? '0' + month : '' + month);
  var totalDays = 0;
  var totalRegular = 0, totalCompOT = 0, totalExtraOT = 0, totalHrs = 0;
  var dayShift = 0, nightShift = 0;
  var records = [];

  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    if (a.wid !== wid) continue;
    if (a.status !== 'completed') continue;
    var attDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (attDate.indexOf(monthStr) !== 0) continue;
    records.push(a);
    totalDays++;
    totalRegular += a.regular || 0;
    totalCompOT += a.compOT || 0;
    totalExtraOT += a.extraOT || 0;
    totalHrs += a.total || 0;
    if (a.shift === 'Night') nightShift++; else dayShift++;
  }
  records.sort(function(a, b) { return a.date > b.date ? 1 : -1; });

  var perHourRate = monthlySalaryAED / STANDARD_HOURS_PER_MONTH;
  var regularSalary = totalRegular * perHourRate;
  var compOTSalary = totalCompOT * perHourRate;
  var extraOTSalary = totalExtraOT * perHourRate * 1.5;
  var totalSalary = regularSalary + compOTSalary + extraOTSalary;

  return {
    worker: w, records: records,
    year: year, month: month,
    monthlySalary: monthlySalaryAED,
    perHourRate: Math.round(perHourRate * 100) / 100,
    totalDays: totalDays,
    totalHrs: Math.round(totalHrs * 100) / 100,
    totalRegular: Math.round(totalRegular * 100) / 100,
    totalCompOT: Math.round(totalCompOT * 100) / 100,
    totalExtraOT: Math.round(totalExtraOT * 100) / 100,
    totalOT: Math.round((totalCompOT + totalExtraOT) * 100) / 100,
    dayShift: dayShift, nightShift: nightShift,
    regularSalary: Math.round(regularSalary * 100) / 100,
    compOTSalary: Math.round(compOTSalary * 100) / 100,
    extraOTSalary: Math.round(extraOTSalary * 100) / 100,
    totalSalary: Math.round(totalSalary * 100) / 100
  };
}

function getAllSalaries(year, month, monthlySalaryAED) {
  var ws = gW();
  var result = [];
  for (var i = 0; i < ws.length; i++) {
    if (!ws[i].on) continue;
    var salary = calculateSalary(ws[i].wid, year, month, monthlySalaryAED);
    if (salary) result.push(salary);
  }
  return result;
}

// ====== PDF LOGO LOADER ======
function loadLogoForPDF() {
  return new Promise(function(resolve) {
    if (_cachedLogoDataUrl) { resolve(_cachedLogoDataUrl); return; }
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      try {
        var canvas = document.createElement('canvas');
        var size = 200;
        canvas.width = size; canvas.height = size;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        var scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
        var w = img.naturalWidth * scale;
        var h = img.naturalHeight * scale;
        var x = (size - w) / 2;
        var y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        _cachedLogoDataUrl = canvas.toDataURL('image/png');
        resolve(_cachedLogoDataUrl);
      } catch(e) { resolve(null); }
    };
    img.onerror = function() { resolve(null); };
    img.src = 'logo.png?v=4';
  });
}

// ====== PDF HEADER WITH LOGO ======
function addPDFHeader(doc, title, subtitle) {
  var pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 30, 74);
  doc.rect(0, 0, pageW, 44, 'F');
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 22, pageW, 22, 'F');

  var logoAdded = false;
  if (_cachedLogoDataUrl) {
    try {
      doc.addImage(_cachedLogoDataUrl, 'PNG', 8, 6, 32, 32);
      logoAdded = true;
    } catch(e) { logoAdded = false; }
  }

  if (!logoAdded) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(8, 6, 32, 32, 4, 4, 'F');
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('A', 24, 27, { align: 'center' });
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('AL BOWRY CARPENTRY LLC', 46, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 240);
  doc.text('PROJECT COP31 at Antalya, Turkey | Registered: Sharjah, UAE', 46, 22);

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(1.5);
  doc.line(46, 26, 140, 26);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title || 'Attendance Report', 46, 35);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 240);
  doc.text('www.albowry.com', pageW - 10, 12, { align: 'right' });
  doc.setFontSize(7);
  doc.text('Generated: ' + fmtDate(tNow()), pageW - 10, 18, { align: 'right' });

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 158, 11);
    doc.text(subtitle, pageW - 10, 35, { align: 'right' });
  }

  return 52;
}

function addPDFFooter(doc) {
  var pageCount = doc.internal.getNumberOfPages();
  var pageW = doc.internal.pageSize.getWidth();
  var pageH = doc.internal.pageSize.getHeight();
  for (var i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 30, 74);
    doc.rect(0, pageH - 16, pageW, 16, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.8);
    doc.line(0, pageH - 16, pageW, pageH - 16);
    doc.setTextColor(200, 200, 220);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('AL BOWRY CARPENTRY LLC | Sharjah, UAE | COP31, Antalya, Turkey | www.albowry.com', pageW / 2, pageH - 9, { align: 'center' });
    doc.text('Generated: ' + fmtDT(tNow()), 10, pageH - 4);
    doc.text('Page ' + i + ' / ' + pageCount, pageW - 10, pageH - 4, { align: 'right' });
  }
}

function exportCSV(data, filename) {
  var header = ['# ' + COMPANY.full, '# Generated: ' + fmtDT(tNow()), ''];
  var cols = ['Date', 'Worker ID', 'Name', 'Profession', 'Section', 'Shift', 'Check In', 'Check Out', 'Total Hrs', 'Regular', 'CompOT', 'ExtraOT', 'OT', 'Status'];
  var rows = [header.join('\n'), cols.join(',')];
  for (var i = 0; i < data.length; i++) {
    var a = data[i];
    rows.push([
      a.date || '', a.wid || '', '"' + (a.name || '') + '"', '"' + (a.prof || '') + '"',
      a.sec || '', a.shift || '', fmtTime(a.checkinTime), fmtTime(a.checkoutTime),
      a.total || 0, a.regular || 0, a.compOT || 0, a.extraOT || 0, a.ot || 0, a.status || ''
    ].join(','));
  }
  var csv = rows.join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url; link.download = filename || ('albowry_' + tD() + '.csv'); link.click();
  URL.revokeObjectURL(url);
  showToast('CSV downloaded!', 'success');
}

function showToast(msg, type, duration) {
  var container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  var colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warn: '#f59e0b' };
  var icons = { success: 'check_circle', error: 'error', info: 'info', warn: 'warning' };
  var toast = document.createElement('div');
  toast.style.cssText = 'background:' + (colors[type] || colors.info) + ';color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:500;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);min-width:220px;max-width:380px;';
  toast.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px">' + (icons[type] || icons.info) + '</span>' + msg;
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, duration || 3500);
}

function showConfirm(msg, onYes, onNo) {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;';
  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:16px;padding:28px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
  box.innerHTML = '<div style="font-weight:700;font-size:18px;color:#0f172a;margin-bottom:12px">Confirm Action</div>' +
    '<div style="color:#475569;font-size:14px;margin-bottom:24px;line-height:1.6">' + msg + '</div>' +
    '<div style="display:flex;gap:12px;justify-content:flex-end">' +
    '<button id="cfmNo" style="padding:10px 20px;border:2px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer;font-weight:600;color:#475569">Cancel</button>' +
    '<button id="cfmYes" style="padding:10px 20px;background:#ef4444;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600">Confirm</button>' +
    '</div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.getElementById('cfmYes').onclick = function() { document.body.removeChild(overlay); if (onYes) onYes(); };
  document.getElementById('cfmNo').onclick = function() { document.body.removeChild(overlay); if (onNo) onNo(); };
  overlay.onclick = function(e) { if (e.target === overlay) { document.body.removeChild(overlay); if (onNo) onNo(); } };
}

function showModal(html, title) {
  var existing = document.getElementById('globalModal');
  if (existing) document.body.removeChild(existing);
  var overlay = document.createElement('div');
  overlay.id = 'globalModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;';
  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:16px;padding:28px;max-width:600px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
  if (title) {
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="margin:0;color:#0f172a;font-size:18px">' + title + '</h3><button onclick="closeModal()" style="background:none;border:none;cursor:pointer;font-size:22px;color:#94a3b8">&times;</button></div>' + html;
  } else box.innerHTML = html;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.onclick = function(e) { if (e.target === overlay) document.body.removeChild(overlay); };
}

function closeModal() { var m = document.getElementById('globalModal'); if (m) document.body.removeChild(m); }

function speakWelcome(name) {
  if (!window.speechSynthesis) return;
  var utter = new SpeechSynthesisUtterance('Welcome ' + (name || 'Admin'));
  utter.rate = 0.9; utter.pitch = 1;
  var voices = window.speechSynthesis.getVoices();
  for (var i = 0; i < voices.length; i++) {
    if (voices[i].lang.indexOf('en') === 0) { utter.voice = voices[i]; break; }
  }
  window.speechSynthesis.speak(utter);
}

function startClock(elementId) {
  function tick() {
    var el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = new Date().toLocaleString('en-GB', {
      timeZone: TZ, weekday: 'short',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }) + ' (Turkey Time)';
  }
  tick();
  return setInterval(tick, 1000);
}

function showSection(id) {
  var sections = document.querySelectorAll('.admin-section');
  for (var i = 0; i < sections.length; i++) sections[i].style.display = 'none';
  var target = document.getElementById(id);
  if (target) { target.style.display = 'block'; target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  var navLinks = document.querySelectorAll('.nav-link');
  for (var j = 0; j < navLinks.length; j++) {
    navLinks[j].classList.remove('active');
    if (navLinks[j].getAttribute('data-section') === id) navLinks[j].classList.add('active');
  }
}

function logout() {
  showConfirm('Are you sure you want to logout?', function() {
    clearSession();
    location.reload();
  });
}

function buildWorkerDropdown(selectEl, includeAll, filter) {
  if (!selectEl) return;
  var val = selectEl.value;
  selectEl.innerHTML = '';
  if (includeAll) {
    var allOpt = document.createElement('option');
    allOpt.value = 'all'; allOpt.text = '-- All Workers --';
    selectEl.appendChild(allOpt);
  } else {
    var defOpt = document.createElement('option');
    defOpt.value = ''; defOpt.text = '-- Select Worker --';
    selectEl.appendChild(defOpt);
  }
  var ws = gW();
  var sections = ['Indian', 'Pakistani'];
  for (var s = 0; s < sections.length; s++) {
    var sec = sections[s];
    var group = document.createElement('optgroup');
    group.label = '-- ' + sec.toUpperCase() + ' WORKERS --';
    var added = 0;
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (!w.on) continue;
      if (w.sec !== sec) continue;
      if (filter && filter !== 'All') {
        if (filter === 'Day' && w.shift !== 'Day') continue;
        if (filter === 'Night' && w.shift !== 'Night') continue;
      }
      var opt = document.createElement('option');
      opt.value = w.wid;
      opt.text = w.wid + ' - ' + w.name + ' (' + w.prof + ')';
      group.appendChild(opt);
      added++;
    }
    if (added > 0) selectEl.appendChild(group);
  }
  if (val) selectEl.value = val;
}

function renderWorkerDropdowns() {
  var dropdowns = document.querySelectorAll('[data-worker-dropdown]');
  for (var i = 0; i < dropdowns.length; i++) {
    var filter = dropdowns[i].getAttribute('data-filter') || 'All';
    var includeAll = dropdowns[i].getAttribute('data-include-all') === 'true';
    buildWorkerDropdown(dropdowns[i], includeAll, filter);
  }
}

function getWorkerStats(wid) {
  var att = getWorkerAtt(wid);
  var completed = [];
  for (var i = 0; i < att.length; i++) if (att[i].status === 'completed') completed.push(att[i]);
  var totalDays = completed.length;
  var totalHrs = 0, totalOT = 0;
  for (var j = 0; j < completed.length; j++) {
    totalHrs += completed[j].total || 0;
    totalOT += completed[j].ot || 0;
  }
  return {
    totalDays: totalDays,
    totalHrs: Math.round(totalHrs * 100) / 100,
    totalOT: Math.round(totalOT * 100) / 100,
    records: att.slice(0, 15)
  };
}

var ALL_WORKERS = [
  {wid:'IND0001',name:'Hajari Lal',prof:'Foreman',sec:'Indian'},
  {wid:'IND0002',name:'Rajeev Punia',prof:'Supervisor',sec:'Indian'},
  {wid:'IND0003',name:'Om Prakash',prof:'Supervisor',sec:'Indian'},
  {wid:'IND0004',name:'Nitesh Bugalia',prof:'Helper',sec:'Indian'},
  {wid:'IND0005',name:'Govind Jangir',prof:'Helper',sec:'Indian'},
  {wid:'IND0006',name:'Lokesh Kumar Verma',prof:'Helper',sec:'Indian'},
  {wid:'IND0007',name:'Rajendra Kumar',prof:'Helper',sec:'Indian'},
  {wid:'IND0008',name:'Surendra Budania',prof:'Helper',sec:'Indian'},
  {wid:'IND0009',name:'Majid Abdul',prof:'Helper',sec:'Indian'},
  {wid:'IND0010',name:'Pradeep Singh',prof:'Helper',sec:'Indian'},
  {wid:'IND0011',name:'Akram Khan',prof:'Helper',sec:'Indian'},
  {wid:'IND0012',name:'Manoj Kumar Jakhar',prof:'Helper',sec:'Indian'},
  {wid:'IND0013',name:'Puneet Sewda',prof:'Helper',sec:'Indian'},
  {wid:'IND0014',name:'Surendra Kumar Mahala',prof:'Helper',sec:'Indian'},
  {wid:'IND0015',name:'Deepak Kumar Jangir',prof:'Carpenter',sec:'Indian'},
  {wid:'IND0016',name:'Jeth Mal Jangir',prof:'Carpenter',sec:'Indian'},
  {wid:'IND0017',name:'Rahul',prof:'Carpenter',sec:'Indian'},
  {wid:'IND0018',name:'Vijendra Kumar',prof:'Carpenter',sec:'Indian'},
  {wid:'IND0019',name:'Rakesh Kumar Jangir',prof:'Carpenter',sec:'Indian'},
  {wid:'IND0020',name:'Jitendra Kumar Jangid',prof:'Carpenter',sec:'Indian'},
  {wid:'IND0021',name:'Dharmendra Khyaliya',prof:'Carpenter (Cutter Operator)',sec:'Indian'},
  {wid:'IND0022',name:'Jitendra Jangid',prof:'Carpenter',sec:'Indian'},
  {wid:'IND0023',name:'Rahul Verma',prof:'Carpenter',sec:'Indian'},
  {wid:'IND0024',name:'Raj Pal',prof:'Carpenter (Cutter Operator)',sec:'Indian'},
  {wid:'IND0025',name:'Mukesh Saini',prof:'Carpenter (Cutter Operator)',sec:'Indian'},
  {wid:'IND0026',name:'Suresh Kumar Jangir',prof:'Carpenter (Cutter Operator)',sec:'Indian'},
  {wid:'IND0027',name:'Pradip Kumar',prof:'Carpenter',sec:'Indian'},
  {wid:'IND0028',name:'Ajay Jangir',prof:'Carpenter (Cutter Operator)',sec:'Indian'},
  {wid:'IND0029',name:'Rajesh Khyalia',prof:'Carpenter (Cutter Operator)',sec:'Indian'},
  {wid:'IND0030',name:'Ratan Lal',prof:'Painter',sec:'Indian'},
  {wid:'IND0031',name:'Rakesh Kumar',prof:'Painter',sec:'Indian'},
  {wid:'IND0032',name:'Chetan Kumar',prof:'Painter',sec:'Indian'},
  {wid:'IND0033',name:'Wajid Khan',prof:'Painter',sec:'Indian'},
  {wid:'IND0034',name:'Mohammad Arif',prof:'Painter',sec:'Indian'},
  {wid:'IND0035',name:'Sajid',prof:'Painter',sec:'Indian'},
  {wid:'IND0036',name:'Fariyad Khan',prof:'Painter',sec:'Indian'},
  {wid:'IND0037',name:'Sayad',prof:'Painter',sec:'Indian'},
  {wid:'PAK0001',name:'Asad Raza',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0002',name:'Muhammad Ramzan',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0003',name:'Muhammad Rizwan',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0004',name:'Sharafat Hussain',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0005',name:'Ali Raza',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0006',name:'Muhammad Amjad',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0007',name:'Sher Bahadur',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0008',name:'Muhammad Arshad',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0009',name:'Taimoor Ahmad',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0010',name:'Muhammad Imtiaz',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0011',name:'Kashif Hussain',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0012',name:'Muhammad Saleem',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0013',name:'Mudasir Hussain',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0014',name:'Sami Ullah',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0015',name:'Muhammad Parvaiz',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0016',name:'Muhammad Awais',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0017',name:'Muhammad Naeem',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0018',name:'Muhammad Faheem',prof:'Worker',sec:'Pakistani'},
  {wid:'PAK0019',name:'Muhammad Mansoor',prof:'Worker',sec:'Pakistani'}
];

function initWorkers() {
  var existing = gW();
  if (existing.length >= 56) return Promise.resolve();
  var existingIds = [];
  for (var i = 0; i < existing.length; i++) existingIds.push(existing[i].wid);
  var promises = [];
  for (var j = 0; j < ALL_WORKERS.length; j++) {
    var aw = ALL_WORKERS[j];
    if (indexOf(existingIds, aw.wid) === -1) {
      promises.push(FB.save('workers', aw.wid, {
        wid: aw.wid, name: aw.name, prof: aw.prof, sec: aw.sec,
        shift: 'Day', pw: 'Worker@123', on: true
      }));
    }
  }
  return Promise.all(promises);
}

function refreshDashboard() { if (typeof renderDashboard === 'function') renderDashboard(); }
function refreshApprovals() { if (typeof renderApprovals === 'function') renderApprovals(); }
function refreshLiveStatus() { if (typeof renderLiveStatus === 'function') renderLiveStatus(); }
function refreshAttendanceView() { if (typeof renderAttendanceView === 'function') renderAttendanceView(); }
function refreshAdminWorkers() { if (typeof renderAdminWorkers === 'function') renderAdminWorkers(); }
function refreshManualEntry() { if (typeof renderManualEntry === 'function') renderManualEntry(); }
function renderWorkerDashboard() { if (typeof renderWorkerUI === 'function') renderWorkerUI(); }

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  _pendingInstall = e;
  var banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'flex';
});

function installApp() {
  if (!_pendingInstall) return;
  _pendingInstall.prompt();
  _pendingInstall.userChoice.then(function(r) {
    _pendingInstall = null;
    var banner = document.getElementById('installBanner');
    if (banner) banner.style.display = 'none';
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js').then(function() {
      console.log('[ALB] SW registered');
    }).catch(function(e) { console.log('[ALB] SW failed:', e); });
  });
}

if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = function() {
    window.speechSynthesis.getVoices();
  };
}

window.addEventListener('load', function() {
  setTimeout(function() { loadLogoForPDF(); }, 1000);
});

console.log('[ALB] app.js v18 loaded - ' + COMPANY.full);
