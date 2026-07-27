// AL BOWRY CARPENTRY LLC - Manual Attendance
// manual.js v17

var _manualShift = 'Day';
var _manualSection = 'All';
var _bulkSelected = [];

function renderManualEntry() {
  renderManualOverview();
  renderBulkWorkerList();
}

function renderManualOverview() {
  var container = document.getElementById('manualOverview');
  if (!container) return;
  var today = tD();
  var allAtt = gA();
  var allWorkers = gW();
  var notIn = [], working = [], pendingList = [], done = [];
  var todayAttByWid = {};
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    var attDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (attDate === today) {
      if (!todayAttByWid[a.wid] || a.status === 'completed' || a.status === 'checked_in') {
        todayAttByWid[a.wid] = a;
      }
    }
  }
  for (var j = 0; j < allWorkers.length; j++) {
    var w = allWorkers[j];
    if (!w.on) continue;
    var att = todayAttByWid[w.wid];
    if (!att) notIn.push(w);
    else if (att.status === 'pending_checkin') pendingList.push({ worker: w, att: att });
    else if (att.status === 'checked_in' || att.status === 'pending_checkout') working.push({ worker: w, att: att });
    else if (att.status === 'completed') done.push({ worker: w, att: att });
  }
  var html = '<div class="manual-overview-grid">' +
    '<div class="ov-card ov-notin"><div class="ov-num">' + notIn.length + '</div><div class="ov-label">Not Checked In</div></div>' +
    '<div class="ov-card ov-working"><div class="ov-num">' + working.length + '</div><div class="ov-label">Currently Working</div></div>' +
    '<div class="ov-card ov-pending"><div class="ov-num">' + pendingList.length + '</div><div class="ov-label">Pending Approval</div></div>' +
    '<div class="ov-card ov-done"><div class="ov-num">' + done.length + '</div><div class="ov-label">Completed</div></div>' +
    '</div>';
  if (notIn.length > 0) {
    html += '<div class="ov-section"><div class="ov-section-title ov-notin-title">Not Checked In (' + notIn.length + ')</div><div class="ov-worker-list">';
    for (var n = 0; n < notIn.length; n++) {
      var nw = notIn[n];
      html += '<div class="ov-worker-item">' +
        '<div class="ov-worker-name">' + nw.name + '<small>' + nw.wid + '</small></div>' +
        '<div class="ov-worker-meta">' + nw.sec + ' | ' + nw.shift + '</div>' +
        '<button class="btn-ov-in" onclick="quickManualCheckin(\'' + nw.wid + '\')">Check In</button>' +
        '</div>';
    }
    html += '</div></div>';
  }
  if (working.length > 0) {
    html += '<div class="ov-section"><div class="ov-section-title ov-working-title">Currently Working (' + working.length + ')</div><div class="ov-worker-list">';
    for (var wk = 0; wk < working.length; wk++) {
      var wkItem = working[wk];
      html += '<div class="ov-worker-item">' +
        '<div class="ov-worker-name">' + wkItem.worker.name + '<small>' + wkItem.worker.wid + '</small></div>' +
        '<div class="ov-worker-meta">In: ' + fmtTime(wkItem.att.checkinTime) + '</div>' +
        '<button class="btn-ov-out" onclick="quickManualCheckout(\'' + wkItem.worker.wid + '\')">Check Out</button>' +
        '</div>';
    }
    html += '</div></div>';
  }
  container.innerHTML = html;
}

function quickManualCheckin(wid) {
  var w = findWorker(wid);
  if (!w) return;
  var now = new Date().toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label>Worker</label><input type="text" value="' + w.name + ' (' + w.wid + ')" readonly class="form-control"></div>' +
    '<div class="form-group"><label>Shift</label><select id="qmShift" class="form-control">' +
      '<option value="Day"' + (w.shift === 'Day' ? ' selected' : '') + '>Day Shift (8AM-8PM)</option>' +
      '<option value="Night"' + (w.shift === 'Night' ? ' selected' : '') + '>Night Shift (8PM-8AM)</option>' +
    '</select></div>' +
    '<div class="form-group"><label>Check In Time</label><input type="time" id="qmTime" value="' + now + '" class="form-control"></div>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
      '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-success" onclick="submitQuickCheckin(\'' + wid + '\')">Check In Now</button>' +
    '</div>';
  showModal(html, 'Quick Check In - ' + w.name);
}

function submitQuickCheckin(wid) {
  var shift = document.getElementById('qmShift').value;
  var time = document.getElementById('qmTime').value;
  var date = tD();
  manualCheckin(wid, shift, date, time).then(function(res) {
    closeModal();
    if (res.ok) showToast(res.msg, 'success');
    else showToast(res.msg, 'error');
    renderManualEntry();
  });
}

function quickManualCheckout(wid) {
  var w = findWorker(wid);
  if (!w) return;
  var today = tD();
  var allAtt = gA();
  var att = null;
  for (var i = 0; i < allAtt.length; i++) {
    var a = allAtt[i];
    var aDate = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (a.wid === wid && aDate === today && (a.status === 'checked_in' || a.status === 'pending_checkout')) {
      att = a; break;
    }
  }
  if (!att) { showToast('No active check-in found', 'error'); return; }
  var defaultOut = att.shift === 'Night' ? '08:00' : '20:00';
  var now = new Date().toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label>Worker</label><input type="text" value="' + w.name + ' (' + w.wid + ')" readonly class="form-control"></div>' +
    '<div class="form-group"><label>Check In Was</label><input type="text" value="' + fmtTime(att.checkinTime) + '" readonly class="form-control"></div>' +
    '<div class="form-group"><label>Check Out Time</label><input type="time" id="qmoTime" value="' + now + '" class="form-control"></div>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
      '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-danger" onclick="submitQuickCheckout(\'' + wid + '\')">Check Out Now</button>' +
    '</div>';
  showModal(html, 'Quick Check Out - ' + w.name);
}

function submitQuickCheckout(wid) {
  var time = document.getElementById('qmoTime').value;
  var date = tD();
  manualCheckout(wid, null, date, time).then(function(res) {
    closeModal();
    if (res.ok) showToast(res.msg, 'success');
    else showToast(res.msg, 'error');
    renderManualEntry();
  });
}

function submitCustomEntry() {
  var wid = document.getElementById('customWorker') ? document.getElementById('customWorker').value : '';
  var shift = document.getElementById('customShift') ? document.getElementById('customShift').value : 'Day';
  var date = document.getElementById('customDate') ? document.getElementById('customDate').value : '';
  var inTime = document.getElementById('customIn') ? document.getElementById('customIn').value : '';
  var outTime = document.getElementById('customOut') ? document.getElementById('customOut').value : '';
  var type = document.getElementById('customType') ? document.getElementById('customType').value : 'both';
  if (!wid || !date) { showToast('Select worker and date', 'error'); return; }
  if (type === 'in' || type === 'both') {
    if (!inTime) { showToast('Enter check-in time', 'error'); return; }
    manualCheckin(wid, shift, date, inTime).then(function(res) {
      if (!res.ok) { showToast(res.msg, 'error'); return; }
      showToast(res.msg, 'success');
      if (type === 'both' && outTime) {
        setTimeout(function() {
          manualCheckout(wid, shift, date, outTime).then(function(r) {
            if (r.ok) showToast(r.msg, 'success');
            else showToast(r.msg, 'error');
            renderManualEntry();
          });
        }, 500);
      } else renderManualEntry();
    });
  } else if (type === 'out') {
    if (!outTime) { showToast('Enter check-out time', 'error'); return; }
    manualCheckout(wid, shift, date, outTime).then(function(res) {
      if (res.ok) showToast(res.msg, 'success');
      else showToast(res.msg, 'error');
      renderManualEntry();
    });
  }
}

function renderBulkWorkerList() {
  var container = document.getElementById('bulkWorkerList');
  if (!container) return;
  var shift = document.getElementById('bulkShift') ? document.getElementById('bulkShift').value : 'All';
  var section = document.getElementById('bulkSection') ? document.getElementById('bulkSection').value : 'All';
  var ws = gW();
  var filtered = [];
  for (var i = 0; i < ws.length; i++) {
    var w = ws[i];
    if (!w.on) continue;
    if (shift !== 'All' && w.shift !== shift) continue;
    if (section !== 'All' && w.sec !== section) continue;
    filtered.push(w);
  }
  _bulkSelected = [];
  var html = '<div class="bulk-controls">' +
    '<button class="btn btn-sm btn-secondary" onclick="selectAllBulk()">Select All</button>' +
    '<button class="btn btn-sm btn-secondary" onclick="deselectAllBulk()">Deselect All</button>' +
    '<span class="bulk-count" id="bulkCount">0 selected</span>' +
    '</div><div class="bulk-list">';
  for (var j = 0; j < filtered.length; j++) {
    var fw = filtered[j];
    html += '<div class="bulk-item">' +
      '<label class="bulk-label">' +
        '<input type="checkbox" class="bulk-cb" value="' + fw.wid + '" onchange="updateBulkSelection()">' +
        '<span class="bulk-name">' + fw.name + '</span>' +
        '<span class="bulk-meta">' + fw.wid + ' | ' + fw.sec + ' | ' + fw.shift + '</span>' +
      '</label>' +
      '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

function updateBulkSelection() {
  var cbs = document.querySelectorAll('.bulk-cb:checked');
  _bulkSelected = [];
  for (var i = 0; i < cbs.length; i++) _bulkSelected.push(cbs[i].value);
  var countEl = document.getElementById('bulkCount');
  if (countEl) countEl.textContent = _bulkSelected.length + ' selected';
}

function selectAllBulk() {
  var cbs = document.querySelectorAll('.bulk-cb');
  for (var i = 0; i < cbs.length; i++) cbs[i].checked = true;
  updateBulkSelection();
}

function deselectAllBulk() {
  var cbs = document.querySelectorAll('.bulk-cb');
  for (var i = 0; i < cbs.length; i++) cbs[i].checked = false;
  updateBulkSelection();
}

function submitBulkAction(type) {
  if (_bulkSelected.length === 0) { showToast('Select at least one worker', 'warn'); return; }
  var date = document.getElementById('bulkDate') ? document.getElementById('bulkDate').value : tD();
  var shift = document.getElementById('bulkShift') ? document.getElementById('bulkShift').value : 'Day';
  var time = type === 'in' ?
    (document.getElementById('bulkInTime') ? document.getElementById('bulkInTime').value : '') :
    (document.getElementById('bulkOutTime') ? document.getElementById('bulkOutTime').value : '');
  if (!date || !time) { showToast('Enter date and time', 'error'); return; }
  var action = type === 'in' ? 'check in' : 'check out';
  showConfirm('Bulk ' + action + ' for ' + _bulkSelected.length + ' workers at ' + time + '?', function() {
    var fn = type === 'in' ? bulkCheckin : bulkCheckout;
    fn(_bulkSelected, shift, date, time).then(function(res) {
      showToast('Done! ' + res.success + ' succeeded, ' + res.failed + ' failed.', 'success');
      renderManualEntry();
    });
  });
}

console.log('[ALB] manual.js v17 loaded');
