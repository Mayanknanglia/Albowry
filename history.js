// AL BOWRY CARPENTRY LLC - History & Backdated Attendance
// history.js v23 - Extra OT in PDF + All existing features

var _historyDate = '';
var _historyShift = 'All';
var _historySection = 'All';
var _historyWorkerFilter = 'all';

function initHistory() {
  _historyDate = tD();
  loadHistoryWorkers();
  renderHistoryView();
  renderDayWiseView();
  updateHistBdTimes();
  updateHistBulkTimes();
}

function loadHistoryWorkers() {
  var selects = [
    document.getElementById('histWorkerSel'),
    document.getElementById('histBdWorker'),
    document.getElementById('histBulkFilter')
  ];
  var ws = gW();
  if (!ws || ws.length === 0) {
    FB.getAll('workers').then(function(docs) { _workers = docs; loadHistoryWorkers(); });
    return;
  }
  var sections = ['Indian', 'Pakistani'];
  for (var s = 0; s < selects.length; s++) {
    var sel = selects[s];
    if (!sel) continue;
    var prevVal = sel.value;
    sel.innerHTML = '';
    if (sel.id === 'histWorkerSel' || sel.id === 'histBulkFilter') {
      var allOpt = document.createElement('option');
      allOpt.value = 'all'; allOpt.text = '-- All Workers --';
      sel.appendChild(allOpt);
    } else {
      var defOpt = document.createElement('option');
      defOpt.value = ''; defOpt.text = '-- Select Worker --';
      sel.appendChild(defOpt);
    }
    for (var sc = 0; sc < sections.length; sc++) {
      var group = document.createElement('optgroup');
      group.label = '-- ' + sections[sc].toUpperCase() + ' --';
      var cnt = 0;
      for (var i = 0; i < ws.length; i++) {
        var w = ws[i];
        if (!w.on) continue;
        if (w.sec !== sections[sc]) continue;
        var opt = document.createElement('option');
        opt.value = w.wid; opt.text = w.wid + ' - ' + w.name + ' [' + w.shift + ']';
        group.appendChild(opt); cnt++;
      }
      if (cnt > 0) sel.appendChild(group);
    }
    if (prevVal) sel.value = prevVal;
  }
}

function updateHistBdTimes() {
  var shiftEl = document.getElementById('histBdShift');
  if (!shiftEl) return;
  var shift = shiftEl.value;
  var defaults = getShiftDefaults(shift);
  var inEl = document.getElementById('histBdIn');
  var outEl = document.getElementById('histBdOut');
  if (inEl) inEl.value = defaults.inTime;
  if (outEl) outEl.value = defaults.outTime;
}

function updateHistBulkTimes() {
  var shiftEl = document.getElementById('histBulkShift');
  if (!shiftEl) return;
  var shift = shiftEl.value;
  var defaults = getShiftDefaults(shift);
  var inEl = document.getElementById('histBulkIn');
  var outEl = document.getElementById('histBulkOut');
  if (inEl) inEl.value = defaults.inTime;
  if (outEl) outEl.value = defaults.outTime;
}

function updateHistBdShiftFromWorker() {
  var wid = document.getElementById('histBdWorker').value;
  if (!wid) return;
  var w = findWorker(wid);
  if (!w) return;
  document.getElementById('histBdShift').value = w.shift || 'Day';
  updateHistBdTimes();
}

function renderHistoryView() {
  var container = document.getElementById('historyViewContainer');
  if (!container) return;
  var date = _historyDate || tD();
  var shift = _historyShift || 'All';
  var section = _historySection || 'All';
  var workerFilter = _historyWorkerFilter || 'all';
  var allAtt = gA();
  var allWorkers = gW();
  if (!allAtt || !allWorkers) {
    container.innerHTML = '<div class="loading-msg">Loading data...</div>';
    return;
  }
  var dateAtt = [];
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    var attDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (attDate === date) dateAtt.push(a);
  }
  var presentWids = [];
  for (var j = 0; j < dateAtt.length; j++) {
    var att = dateAtt[j];
    if (att.status === 'checked_in' || att.status === 'pending_checkout' || att.status === 'completed') {
      if (shift !== 'All' && att.shift !== shift) continue;
      if (indexOf(presentWids, att.wid) === -1) presentWids.push(att.wid);
    }
  }
  var presentList = [];
  var processedPresent = [];
  for (var k = 0; k < dateAtt.length; k++) {
    var a2 = dateAtt[k];
    if (a2.status !== 'checked_in' && a2.status !== 'pending_checkout' && a2.status !== 'completed') continue;
    if (shift !== 'All' && a2.shift !== shift) continue;
    if (indexOf(processedPresent, a2.wid) !== -1) continue;
    var w2 = null;
    for (var wi = 0; wi < allWorkers.length; wi++) {
      if (allWorkers[wi].wid === a2.wid) { w2 = allWorkers[wi]; break; }
    }
    if (!w2) continue;
    if (section !== 'All' && w2.sec !== section) continue;
    if (workerFilter !== 'all' && a2.wid !== workerFilter) continue;
    presentList.push({ worker: w2, att: a2 });
    processedPresent.push(a2.wid);
  }
  var absentList = [];
  for (var m = 0; m < allWorkers.length; m++) {
    var w3 = allWorkers[m];
    if (!w3.on) continue;
    if (section !== 'All' && w3.sec !== section) continue;
    if (shift !== 'All' && w3.shift !== shift) continue;
    if (workerFilter !== 'all' && w3.wid !== workerFilter) continue;
    var isPresent = false;
    for (var pi = 0; pi < presentWids.length; pi++) {
      if (presentWids[pi] === w3.wid) { isPresent = true; break; }
    }
    if (!isPresent) absentList.push(w3);
  }
  var totalActive = 0;
  for (var ti = 0; ti < allWorkers.length; ti++) {
    if (!allWorkers[ti].on) continue;
    if (section !== 'All' && allWorkers[ti].sec !== section) continue;
    if (shift !== 'All' && allWorkers[ti].shift !== shift) continue;
    totalActive++;
  }
  var html = '<div class="hist-stats-row">' +
    '<div class="hist-stat-card hist-total"><span class="hist-stat-num">' + totalActive + '</span><span>Total</span></div>' +
    '<div class="hist-stat-card hist-present"><span class="hist-stat-num">' + presentList.length + '</span><span>Present</span></div>' +
    '<div class="hist-stat-card hist-absent"><span class="hist-stat-num">' + absentList.length + '</span><span>Absent</span></div>' +
    '</div>';
  html += '<div class="hist-section">';
  html += '<div class="hist-section-header hist-present-hdr"><span class="material-symbols-outlined">check_circle</span> Present (' + presentList.length + ')</div>';
  if (presentList.length === 0) {
    html += '<div class="hist-empty">No workers present on ' + fmtDate(date + 'T00:00:00') + '</div>';
  } else {
    html += '<div class="table-responsive"><table class="hist-table">' +
      '<thead><tr><th>#</th><th>Worker</th><th>Section</th><th>Shift</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>OT</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    for (var p = 0; p < presentList.length; p++) {
      var item = presentList[p];
      var w4 = item.worker;
      var a4 = item.att;
      var statusBadge = getStatusBadge(a4.status);
      var isManual = a4.backdated ? '<span class="tag-manual">Manual</span>' : '';
      html += '<tr>' +
        '<td>' + (p + 1) + '</td>' +
        '<td><strong>' + w4.name + '</strong><br><small style="color:#94a3b8">' + w4.wid + '</small>' + isManual + '</td>' +
        '<td>' + w4.sec + '</td>' +
        '<td><span class="shift-badge shift-' + (a4.shift || 'Day').toLowerCase() + '">' + (a4.shift || 'Day') + '</span></td>' +
        '<td>' + fmtTime(a4.checkinTime || a4.checkinReqTime) + '</td>' +
        '<td>' + fmtTime(a4.checkoutTime) + '</td>' +
        '<td>' + (a4.total ? a4.total + 'h' : '-') + '</td>' +
        '<td>' + (a4.ot ? a4.ot + 'h' : '-') + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td class="hist-actions">' +
          '<button class="btn-icon btn-edit" onclick="editHistRecord(\'' + a4.recId + '\')" title="Edit"><span class="material-symbols-outlined">edit</span></button>' +
          (a4.status === 'checked_in' ? '<button class="btn-icon btn-success" onclick="forceCheckout(\'' + a4.recId + '\')" title="Force Checkout"><span class="material-symbols-outlined">logout</span></button>' : '') +
          '<button class="btn-icon btn-delete" onclick="deleteHistRecord(\'' + a4.recId + '\')" title="Delete"><span class="material-symbols-outlined">delete</span></button>' +
        '</td></tr>';
    }
    html += '</tbody></table></div>';
  }
  html += '</div>';
  html += '<div class="hist-section" style="margin-top:20px">';
  html += '<div class="hist-section-header hist-absent-hdr"><span class="material-symbols-outlined">cancel</span> Absent (' + absentList.length + ')</div>';
  if (absentList.length === 0) {
    html += '<div class="hist-empty hist-empty-good">All workers are present!</div>';
  } else {
    html += '<div class="absent-grid">';
    for (var ab = 0; ab < absentList.length; ab++) {
      var abW = absentList[ab];
      html += '<div class="absent-card">' +
        '<div class="absent-initials">' + getInitials(abW.name) + '</div>' +
        '<div class="absent-info">' +
          '<div class="absent-name">' + abW.name + '</div>' +
          '<div class="absent-meta">' + abW.wid + ' | ' + abW.prof + '</div>' +
          '<div class="absent-meta">' + abW.sec + ' | ' + abW.shift + ' Shift</div>' +
        '</div>' +
        '<button class="btn-absent-in" onclick="quickAddAbsent(\'' + abW.wid + '\',\'' + date + '\')" title="Add attendance">' +
          '<span class="material-symbols-outlined">add_circle</span> Mark Present' +
        '</button></div>';
    }
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

function quickAddAbsent(wid, date) {
  var w = findWorker(wid);
  if (!w) return;
  var shift = w.shift;
  var defaults = getShiftDefaults(shift);
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label>Worker</label><input type="text" value="' + w.name + '" readonly class="form-control"></div>' +
    '<div class="form-group"><label>Date</label><input type="date" id="qaDate" value="' + date + '" class="form-control"></div>' +
    '<div class="form-group"><label>Shift</label><select id="qaShift" class="form-control" onchange="updateQATimes()">' +
      '<option value="Day"' + (shift === 'Day' ? ' selected' : '') + '>Day Shift (8AM-8PM)</option>' +
      '<option value="Night"' + (shift === 'Night' ? ' selected' : '') + '>Night Shift (8PM-8AM)</option>' +
    '</select></div>' +
    '<div class="form-group"><label>Check In Time</label><input type="time" id="qaIn" value="' + defaults.inTime + '" class="form-control"></div>' +
    '<div class="form-group"><label>Check Out Time</label><input type="time" id="qaOut" value="' + defaults.outTime + '" class="form-control"></div>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
      '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" onclick="submitQuickAbsent(\'' + wid + '\')">Add Attendance</button></div>';
  showModal(html, 'Add Attendance - ' + w.name);
}

function updateQATimes() {
  var shift = document.getElementById('qaShift').value;
  var defaults = getShiftDefaults(shift);
  document.getElementById('qaIn').value = defaults.inTime;
  document.getElementById('qaOut').value = defaults.outTime;
}

function submitQuickAbsent(wid) {
  var date = document.getElementById('qaDate').value;
  var shift = document.getElementById('qaShift').value;
  var inTime = document.getElementById('qaIn').value;
  var outTime = document.getElementById('qaOut').value;
  if (!date || !inTime || !outTime) { showToast('Please fill all fields', 'error'); return; }
  var w = findWorker(wid);
  if (!w) return;
  var checkinISO = buildISO(date, inTime, false, null);
  var checkoutISO = buildISO(date, outTime, shift === 'Night', checkinISO);
  var hrs = calcHours(checkinISO, checkoutISO);
  var recId = genRecId(wid, true);
  var rec = {
    recId: recId, wid: wid, name: w.name, prof: w.prof, sec: w.sec,
    shift: shift, date: date,
    checkinReqTime: checkinISO, checkinTime: checkinISO,
    checkoutReqTime: checkoutISO, checkoutTime: checkoutISO,
    total: hrs.total, regular: hrs.regular,
    compOT: hrs.compOT, extraOT: hrs.extraOT, ot: hrs.ot,
    status: 'completed', backdated: true
  };
  FB.save('attendance', recId, rec).then(function() {
    closeModal();
    showToast(w.name + ' attendance added! (' + hrs.total + 'h)', 'success');
    renderHistoryView();
  }).catch(function(e) { showToast('Error: ' + e.message, 'error'); });
}

function renderDayWiseView() {
  var container = document.getElementById('dayWiseContainer');
  if (!container) return;
  var date = document.getElementById('dwDate') ? document.getElementById('dwDate').value : tD();
  if (!date) date = tD();
  var allAtt = gA();
  var allWorkers = gW();
  var dateAtt = [];
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    var attDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (attDate === date) dateAtt.push(a);
  }
  var presentWids = [];
  for (var j = 0; j < dateAtt.length; j++) {
    var att = dateAtt[j];
    if (att.status === 'checked_in' || att.status === 'pending_checkout' || att.status === 'completed') {
      if (indexOf(presentWids, att.wid) === -1) presentWids.push(att.wid);
    }
  }
  var absentList = [];
  for (var m = 0; m < allWorkers.length; m++) {
    var w = allWorkers[m];
    if (!w.on) continue;
    var found = false;
    for (var pi = 0; pi < presentWids.length; pi++) {
      if (presentWids[pi] === w.wid) { found = true; break; }
    }
    if (!found) absentList.push(w);
  }
  var html = '<div class="dw-summary">' +
    '<span class="dw-badge dw-total">Total: ' + (allWorkers.filter(function(w2) { return w2.on; }).length) + '</span>' +
    '<span class="dw-badge dw-present">Present: ' + presentWids.length + '</span>' +
    '<span class="dw-badge dw-absent">Absent: ' + absentList.length + '</span></div>';
  html += '<h4 class="dw-title present-title">Present Workers</h4>';
  if (presentWids.length === 0) {
    html += '<div class="hist-empty">No attendance records for ' + date + '</div>';
  } else {
    html += '<table class="dw-table"><thead><tr><th>#</th><th>Name</th><th>ID</th><th>Section</th><th>Shift</th><th>In</th><th>Out</th><th>Hours</th><th>OT</th></tr></thead><tbody>';
    var num = 1;
    for (var k = 0; k < dateAtt.length; k++) {
      var a2 = dateAtt[k];
      if (a2.status !== 'checked_in' && a2.status !== 'pending_checkout' && a2.status !== 'completed') continue;
      html += '<tr><td>' + (num++) + '</td><td>' + a2.name + (a2.backdated ? ' <span class="tag-manual">M</span>' : '') + '</td>' +
        '<td>' + a2.wid + '</td><td>' + a2.sec + '</td><td>' + (a2.shift || 'Day') + '</td>' +
        '<td>' + fmtTime(a2.checkinTime || a2.checkinReqTime) + '</td><td>' + fmtTime(a2.checkoutTime) + '</td>' +
        '<td>' + (a2.total ? a2.total + 'h' : '-') + '</td><td>' + (a2.ot ? a2.ot + 'h' : '-') + '</td></tr>';
    }
    html += '</tbody></table>';
  }
  html += '<h4 class="dw-title absent-title" style="margin-top:20px">Absent Workers</h4>';
  if (absentList.length === 0) {
    html += '<div class="hist-empty hist-empty-good">All workers present!</div>';
  } else {
    html += '<div class="absent-names-list">';
    for (var ab = 0; ab < absentList.length; ab++) {
      var abW = absentList[ab];
      html += '<span class="absent-name-tag">' + abW.name + ' (' + abW.wid + ')</span>';
    }
    html += '</div>';
  }
  container.innerHTML = html;
}

function editHistRecord(recId) {
  var allAtt = gA();
  var rec = null;
  for (var i = 0; i < allAtt.length; i++) {
    if (allAtt[i].recId === recId) { rec = allAtt[i]; break; }
  }
  if (!rec) { showToast('Record not found', 'error'); return; }
  var cinDate = rec.date || getTurkeyDate(rec.checkinTime);
  var cinTime = rec.checkinTime ? new Date(rec.checkinTime).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }) : '08:00';
  var coutTime = rec.checkoutTime ? new Date(rec.checkoutTime).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }) : '';
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label>Worker</label><input type="text" value="' + rec.name + '" readonly class="form-control"></div>' +
    '<div class="form-group"><label>Date</label><input type="date" id="editDate" value="' + cinDate + '" class="form-control"></div>' +
    '<div class="form-group"><label>Shift</label><select id="editShift" class="form-control" onchange="updateEditTimes()">' +
      '<option value="Day"' + (rec.shift === 'Day' ? ' selected' : '') + '>Day Shift</option>' +
      '<option value="Night"' + (rec.shift === 'Night' ? ' selected' : '') + '>Night Shift</option>' +
    '</select></div>' +
    '<div class="form-group"><label>Check In Time</label><input type="time" id="editCin" value="' + cinTime + '" class="form-control"></div>' +
    '<div class="form-group"><label>Check Out Time</label><input type="time" id="editCout" value="' + coutTime + '" class="form-control"></div>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
      '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" onclick="saveHistEdit(\'' + recId + '\')">Save Changes</button></div>';
  showModal(html, 'Edit Record - ' + rec.name);
}

function updateEditTimes() {
  var shift = document.getElementById('editShift').value;
  var defaults = getShiftDefaults(shift);
  document.getElementById('editCin').value = defaults.inTime;
  document.getElementById('editCout').value = defaults.outTime;
}

function saveHistEdit(recId) {
  var date = document.getElementById('editDate').value;
  var shift = document.getElementById('editShift').value;
  var cinTime = document.getElementById('editCin').value;
  var coutTime = document.getElementById('editCout').value;
  if (!date || !cinTime) { showToast('Date and check-in time required', 'error'); return; }
  var checkinISO = buildISO(date, cinTime, false, null);
  var update = { date: date, shift: shift, checkinTime: checkinISO, checkinReqTime: checkinISO, backdated: true };
  if (coutTime) {
    var checkoutISO = buildISO(date, coutTime, shift === 'Night', checkinISO);
    if (shift === 'Night') {
      var cin = new Date(checkinISO);
      var cout = new Date(checkoutISO);
      if (cout <= cin) { cout.setUTCDate(cout.getUTCDate() + 1); checkoutISO = cout.toISOString(); }
    }
    var hrs = calcHours(checkinISO, checkoutISO);
    update.checkoutTime = checkoutISO; update.checkoutReqTime = checkoutISO;
    update.total = hrs.total; update.regular = hrs.regular;
    update.compOT = hrs.compOT; update.extraOT = hrs.extraOT; update.ot = hrs.ot;
    update.status = 'completed';
  } else {
    update.checkoutTime = null; update.checkoutReqTime = null;
    update.total = 0; update.regular = 0; update.compOT = 0; update.extraOT = 0; update.ot = 0;
    update.status = 'checked_in';
  }
  FB.update('attendance', recId, update).then(function() {
    closeModal(); showToast('Record updated!', 'success'); renderHistoryView();
  }).catch(function(e) { showToast('Error: ' + e.message, 'error'); });
}

function deleteHistRecord(recId) {
  showConfirm('Delete this attendance record? This cannot be undone.', function() {
    FB.delete('attendance', recId).then(function() {
      showToast('Record deleted', 'info'); renderHistoryView();
    }).catch(function(e) { showToast('Error: ' + e.message, 'error'); });
  });
}

function forceCheckout(recId) {
  var allAtt = gA(); var rec = null;
  for (var i = 0; i < allAtt.length; i++) { if (allAtt[i].recId === recId) { rec = allAtt[i]; break; } }
  if (!rec) return;
  var defaults = getShiftDefaults(rec.shift);
  var date = rec.date || getTurkeyDate(rec.checkinTime);
  var html = '<p>Force checkout <strong>' + rec.name + '</strong> (' + rec.shift + ' shift)</p>' +
    '<div class="form-group"><label>Checkout Time</label><input type="time" id="fcOut" value="' + defaults.outTime + '" class="form-control"></div>' +
    '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
      '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-warning" onclick="submitForceCheckout(\'' + recId + '\',\'' + date + '\')">Force Checkout</button></div>';
  showModal(html, 'Force Checkout');
}

function submitForceCheckout(recId, date) {
  var outTime = document.getElementById('fcOut').value;
  if (!outTime) { showToast('Enter checkout time', 'error'); return; }
  var allAtt = gA(); var rec = null;
  for (var i = 0; i < allAtt.length; i++) { if (allAtt[i].recId === recId) { rec = allAtt[i]; break; } }
  if (!rec) return;
  var isNight = rec.shift === 'Night';
  var checkoutISO = buildISO(date, outTime, isNight, rec.checkinTime);
  if (isNight && rec.checkinTime) {
    var cin = new Date(rec.checkinTime); var cout = new Date(checkoutISO);
    if (cout <= cin) { cout.setUTCDate(cout.getUTCDate() + 1); checkoutISO = cout.toISOString(); }
  }
  var hrs = calcHours(rec.checkinTime, checkoutISO);
  FB.update('attendance', recId, {
    checkoutTime: checkoutISO, checkoutReqTime: checkoutISO,
    total: hrs.total, regular: hrs.regular, compOT: hrs.compOT, extraOT: hrs.extraOT, ot: hrs.ot,
    status: 'completed'
  }).then(function() {
    closeModal(); showToast('Force checkout done! ' + hrs.total + 'h', 'success'); renderHistoryView();
  }).catch(function(e) { showToast('Error: ' + e.message, 'error'); });
}

function submitBackdatedEntry() {
  var wid = document.getElementById('histBdWorker') ? document.getElementById('histBdWorker').value : '';
  var date = document.getElementById('histBdDate') ? document.getElementById('histBdDate').value : '';
  var shift = document.getElementById('histBdShift') ? document.getElementById('histBdShift').value : 'Day';
  var inTime = document.getElementById('histBdIn') ? document.getElementById('histBdIn').value : '';
  var outTime = document.getElementById('histBdOut') ? document.getElementById('histBdOut').value : '';
  if (!wid || !date || !inTime || !outTime) { showToast('Please fill all fields', 'error'); return; }
  var w = findWorker(wid);
  if (!w) { showToast('Worker not found', 'error'); return; }
  var allAtt = gA();
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    var aDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (a.wid === wid && aDate === date) {
      showToast(w.name + ' already has a record for ' + date + '. Delete it first.', 'warn'); return;
    }
  }
  var checkinISO = buildISO(date, inTime, false, null);
  var checkoutISO = buildISO(date, outTime, shift === 'Night', checkinISO);
  if (shift === 'Night') {
    var cin = new Date(checkinISO); var cout = new Date(checkoutISO);
    if (cout <= cin) { cout.setUTCDate(cout.getUTCDate() + 1); checkoutISO = cout.toISOString(); }
  }
  var hrs = calcHours(checkinISO, checkoutISO);
  var recId = genRecId(wid, true);
  var rec = {
    recId: recId, wid: wid, name: w.name, prof: w.prof, sec: w.sec,
    shift: shift, date: date,
    checkinReqTime: checkinISO, checkinTime: checkinISO,
    checkoutReqTime: checkoutISO, checkoutTime: checkoutISO,
    total: hrs.total, regular: hrs.regular, compOT: hrs.compOT, extraOT: hrs.extraOT, ot: hrs.ot,
    status: 'completed', backdated: true
  };
  FB.save('attendance', recId, rec).then(function() {
    showToast(w.name + ' entry added (' + hrs.total + 'h)', 'success'); renderHistoryView();
  }).catch(function(e) { showToast('Error: ' + e.message, 'error'); });
}

function submitBulkBackdated() {
  var date = document.getElementById('histBulkDate') ? document.getElementById('histBulkDate').value : '';
  var shift = document.getElementById('histBulkShift') ? document.getElementById('histBulkShift').value : 'Day';
  var filter = document.getElementById('histBulkFilter') ? document.getElementById('histBulkFilter').value : 'all';
  var inTime = document.getElementById('histBulkIn') ? document.getElementById('histBulkIn').value : '';
  var outTime = document.getElementById('histBulkOut') ? document.getElementById('histBulkOut').value : '';
  if (!date || !inTime || !outTime) { showToast('Fill date, in-time, out-time', 'error'); return; }
  var ws = gW(); var targetWorkers = [];
  for (var i = 0; i < ws.length; i++) {
    var w = ws[i]; if (!w.on) continue;
    if (filter !== 'all' && w.wid !== filter && w.sec !== filter && w.shift !== filter) continue;
    targetWorkers.push(w);
  }
  if (targetWorkers.length === 0) { showToast('No workers match', 'warn'); return; }
  showConfirm('Add attendance for ' + targetWorkers.length + ' workers on ' + date + '?', function() {
    var allAtt = gA(); var existingOnDate = [];
    for (var j = 0; j < allAtt.length; j++) {
      var a = allAtt[j];
      var aDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
      if (aDate === date) existingOnDate.push(a.wid);
    }
    var promises = []; var skipped = 0;
    for (var k = 0; k < targetWorkers.length; k++) {
      var tw = targetWorkers[k];
      if (indexOf(existingOnDate, tw.wid) !== -1) { skipped++; continue; }
      var checkinISO = buildISO(date, inTime, false, null);
      var checkoutISO = buildISO(date, outTime, shift === 'Night', checkinISO);
      if (shift === 'Night') {
        var cin = new Date(checkinISO); var cout = new Date(checkoutISO);
        if (cout <= cin) { cout.setUTCDate(cout.getUTCDate() + 1); checkoutISO = cout.toISOString(); }
      }
      var hrs = calcHours(checkinISO, checkoutISO);
      var recId = genRecId(tw.wid, true);
      promises.push(FB.save('attendance', recId, {
        recId: recId, wid: tw.wid, name: tw.name, prof: tw.prof, sec: tw.sec,
        shift: shift, date: date,
        checkinReqTime: checkinISO, checkinTime: checkinISO,
        checkoutReqTime: checkoutISO, checkoutTime: checkoutISO,
        total: hrs.total, regular: hrs.regular, compOT: hrs.compOT, extraOT: hrs.extraOT, ot: hrs.ot,
        status: 'completed', backdated: true
      }));
    }
    Promise.all(promises).then(function() {
      showToast('Added ' + promises.length + '. Skipped ' + skipped + '.', 'success'); renderHistoryView();
    }).catch(function(e) { showToast('Error: ' + e.message, 'error'); });
  });
}

// ====== PDF WITH EXTRA OT ======
function exportHistoryPDF() {
  var date = _historyDate || tD();
  var allAtt = gA(); var allWorkers = gW();
  var presentRecs = []; var presentWids = [];
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    var attDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (attDate !== date) continue;
    if (a.status !== 'checked_in' && a.status !== 'pending_checkout' && a.status !== 'completed') continue;
    if (_historyShift !== 'All' && a.shift !== _historyShift) continue;
    if (_historySection !== 'All' && a.sec !== _historySection) continue;
    if (indexOf(presentWids, a.wid) === -1) { presentRecs.push(a); presentWids.push(a.wid); }
  }
  var absentList = [];
  for (var j = 0; j < allWorkers.length; j++) {
    var w = allWorkers[j]; if (!w.on) continue;
    if (_historySection !== 'All' && w.sec !== _historySection) continue;
    if (_historyShift !== 'All' && w.shift !== _historyShift) continue;
    if (indexOf(presentWids, w.wid) === -1) absentList.push(w);
  }

  var extraWorkers = [];
  var totalReg = 0, totalCompOT = 0, totalExtraOT = 0;
  for (var e = 0; e < presentRecs.length; e++) {
    totalReg += presentRecs[e].regular || 0;
    totalCompOT += presentRecs[e].compOT || 0;
    totalExtraOT += presentRecs[e].extraOT || 0;
    if ((presentRecs[e].extraOT || 0) > 0) extraWorkers.push(presentRecs[e]);
  }

  loadLogoForPDF().then(function() {
    var doc = new jspdf.jsPDF('landscape');
    var startY = addPDFHeader(doc, 'Attendance Report - ' + fmtDate(date + 'T00:00:00'), 'Present: ' + presentRecs.length + ' | Absent: ' + absentList.length);

    // Summary
    var pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(240, 245, 255);
    doc.rect(14, startY, pageW - 28, 16, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175);
    doc.text('SUMMARY:', 18, startY + 5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text('Present: ' + presentRecs.length + ' | Regular: ' + totalReg.toFixed(1) + 'h | Comp OT: ' + totalCompOT.toFixed(1) + 'h', 18, startY + 11);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(217, 119, 6);
    doc.text('Extra OT: ' + totalExtraOT.toFixed(1) + 'h | Extra Workers: ' + extraWorkers.length, 150, startY + 11);

    // Present table
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(16, 185, 129);
    doc.text('PRESENT WORKERS (' + presentRecs.length + ')', 14, startY + 24);

    if (presentRecs.length > 0) {
      var pRows = [];
      for (var p = 0; p < presentRecs.length; p++) {
        var r = presentRecs[p];
        pRows.push([p+1, r.name, r.wid, r.sec, r.shift||'Day',
          fmtTime(r.checkinTime||r.checkinReqTime), fmtTime(r.checkoutTime)||'-',
          (r.total||0)+'h', (r.regular||0)+'h', (r.compOT||0)+'h',
          (r.extraOT||0) > 0 ? (r.extraOT)+'h' : '-',
          r.status==='completed'?'Done':'Active']);
      }
      doc.autoTable({
        startY: startY + 28,
        head: [['#','Name','ID','Section','Shift','In','Out','Total','Regular','CompOT','ExtraOT','Status']],
        body: pRows, theme: 'grid',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [16,185,129], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240,255,250] },
        didParseCell: function(data) {
          if (data.section === 'body' && data.column.index === 10) {
            if (presentRecs[data.row.index] && (presentRecs[data.row.index].extraOT||0) > 0) {
              data.cell.styles.fillColor = [254,243,199];
              data.cell.styles.textColor = [217,119,6];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });
    }

    var finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : startY + 40;

    // Extra Work section
    if (extraWorkers.length > 0) {
      if (finalY + 40 > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); finalY = 20; }
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(217,119,6);
      doc.text('EXTRA WORK - Beyond 12 Hours (' + extraWorkers.length + ' workers)', 14, finalY);
      var eRows = [];
      for (var ex = 0; ex < extraWorkers.length; ex++) {
        var er = extraWorkers[ex];
        eRows.push([ex+1, er.name, er.wid, er.shift||'Day', fmtTime(er.checkinTime), fmtTime(er.checkoutTime),
          (er.total||0)+'h', '12h', (er.extraOT||0)+'h', '1.5x Rate']);
      }
      doc.autoTable({
        startY: finalY + 4,
        head: [['#','Name','ID','Shift','In','Out','Total','Standard','Extra','Pay Rate']],
        body: eRows, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, fillColor: [254,249,235] },
        headStyles: { fillColor: [217,119,6], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [254,243,199] }
      });
      finalY = doc.lastAutoTable.finalY + 8;
    }

    // Absent
    if (finalY + 40 > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); finalY = 20; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(239,68,68);
    doc.text('ABSENT WORKERS (' + absentList.length + ')', 14, finalY);
    if (absentList.length > 0) {
      var aRows = [];
      for (var ab = 0; ab < absentList.length; ab++) {
        var abW = absentList[ab];
        aRows.push([ab+1, abW.name, abW.wid, abW.sec, abW.prof, abW.shift]);
      }
      doc.autoTable({
        startY: finalY + 4,
        head: [['#','Name','ID','Section','Profession','Shift']],
        body: aRows, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [239,68,68], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255,245,245] }
      });
    }
    addPDFFooter(doc);
    doc.save('albowry_attendance_' + date + '.pdf');
    showToast('PDF downloaded with Extra Work!', 'success');
  });
}

// ====== CSV WITH EXTRA OT ======
function exportHistoryExcel() {
  var date = _historyDate || tD();
  var allAtt = gA(); var allWorkers = gW();
  var presentRecs = []; var presentWids = [];
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    var attDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (attDate !== date) continue;
    if (a.status !== 'checked_in' && a.status !== 'pending_checkout' && a.status !== 'completed') continue;
    if (_historyShift !== 'All' && a.shift !== _historyShift) continue;
    if (_historySection !== 'All' && a.sec !== _historySection) continue;
    if (indexOf(presentWids, a.wid) === -1) { presentRecs.push(a); presentWids.push(a.wid); }
  }
  var absentList = [];
  for (var j = 0; j < allWorkers.length; j++) {
    var w = allWorkers[j]; if (!w.on) continue;
    if (_historySection !== 'All' && w.sec !== _historySection) continue;
    if (_historyShift !== 'All' && w.shift !== _historyShift) continue;
    if (indexOf(presentWids, w.wid) === -1) absentList.push(w);
  }

  var totalReg = 0, totalCompOT = 0, totalExtraOT = 0;
  var extraWorkers = [];
  for (var t = 0; t < presentRecs.length; t++) {
    totalReg += presentRecs[t].regular || 0;
    totalCompOT += presentRecs[t].compOT || 0;
    totalExtraOT += presentRecs[t].extraOT || 0;
    if ((presentRecs[t].extraOT || 0) > 0) extraWorkers.push(presentRecs[t]);
  }

  var csv = COMPANY.full + '\nDate: ' + date + '\nPresent: ' + presentRecs.length + ' | Absent: ' + absentList.length + '\n';
  csv += 'Regular: ' + totalReg.toFixed(1) + 'h | Comp OT: ' + totalCompOT.toFixed(1) + 'h | Extra OT: ' + totalExtraOT.toFixed(1) + 'h\n\n';
  csv += 'PRESENT WORKERS\n';
  csv += '#,Name,ID,Section,Shift,In,Out,Total,Regular,CompOT,ExtraOT,Status\n';
  for (var p = 0; p < presentRecs.length; p++) {
    var r = presentRecs[p];
    csv += (p+1)+',"'+r.name+'",'+r.wid+','+r.sec+','+(r.shift||'Day')+','+
      fmtTime(r.checkinTime||r.checkinReqTime)+','+(fmtTime(r.checkoutTime)||'-')+','+
      (r.total||0)+','+(r.regular||0)+','+(r.compOT||0)+','+(r.extraOT||0)+','+r.status+'\n';
  }

  if (extraWorkers.length > 0) {
    csv += '\nEXTRA WORK (Beyond 12h) - ' + extraWorkers.length + ' workers\n';
    csv += '#,Name,ID,Shift,In,Out,Total,Standard,Extra,Rate\n';
    for (var e = 0; e < extraWorkers.length; e++) {
      var er = extraWorkers[e];
      csv += (e+1)+',"'+er.name+'",'+er.wid+','+(er.shift||'Day')+','+
        fmtTime(er.checkinTime)+','+fmtTime(er.checkoutTime)+','+
        (er.total||0)+'h,12h,'+(er.extraOT||0)+'h,1.5x\n';
    }
  }

  csv += '\nABSENT WORKERS\n#,Name,ID,Section,Profession,Shift\n';
  for (var ab = 0; ab < absentList.length; ab++) {
    var abW = absentList[ab];
    csv += (ab+1)+',"'+abW.name+'",'+abW.wid+','+abW.sec+',"'+abW.prof+'",'+abW.shift+'\n';
  }
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url; link.download = 'albowry_attendance_' + date + '.csv'; link.click();
  URL.revokeObjectURL(url);
  showToast('CSV downloaded with Extra Work!', 'success');
}

function getStatusBadge(status) {
  var badges = {
    'pending_checkin': '<span class="badge badge-warn">Pending In</span>',
    'checked_in': '<span class="badge badge-info">Working</span>',
    'pending_checkout': '<span class="badge badge-warn">Pending Out</span>',
    'completed': '<span class="badge badge-success">Completed</span>'
  };
  return badges[status] || '<span class="badge badge-muted">' + status + '</span>';
}

function getInitials(name) {
  if (!name) return '?';
  var parts = name.split(' ');
  if (parts.length >= 2) return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

document.addEventListener('DOMContentLoaded', function() {
  var histDateInput = document.getElementById('histDate');
  if (histDateInput) histDateInput.addEventListener('change', function() { _historyDate = this.value; renderHistoryView(); });
  var histShiftSel = document.getElementById('histShift');
  if (histShiftSel) histShiftSel.addEventListener('change', function() { _historyShift = this.value; renderHistoryView(); });
  var histSecSel = document.getElementById('histSection');
  if (histSecSel) histSecSel.addEventListener('change', function() { _historySection = this.value; renderHistoryView(); });
  var histWorkerSelEl = document.getElementById('histWorkerSel');
  if (histWorkerSelEl) histWorkerSelEl.addEventListener('change', function() { _historyWorkerFilter = this.value; renderHistoryView(); });
  var histBdWorkerEl = document.getElementById('histBdWorker');
  if (histBdWorkerEl) histBdWorkerEl.addEventListener('change', updateHistBdShiftFromWorker);
  var dwDateInput = document.getElementById('dwDate');
  if (dwDateInput) dwDateInput.addEventListener('change', function() { renderDayWiseView(); });
});

console.log('[ALB] history.js v23 loaded');
