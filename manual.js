// AL BOWRY - Manual Entry v17

var _bulkSelected = [];

function renderManualEntry() {
  renderManualOverview();
  renderBulkWorkerList();
}

function renderManualOverview() {
  var c = document.getElementById('manualOverview');
  if (!c) return;
  var today = tD(); var all = gA(); var ws = gW();
  var notIn = [], working = [], pending = [], done = [];
  var todayByWid = {};
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (d === today) {
      if (!todayByWid[a.wid] || a.status === 'completed' || a.status === 'checked_in') todayByWid[a.wid] = a;
    }
  }
  for (var j=0; j<ws.length; j++) {
    var w = ws[j]; if (!w.on) continue;
    var att = todayByWid[w.wid];
    if (!att) notIn.push(w);
    else if (att.status === 'pending_checkin') pending.push({ worker:w, att:att });
    else if (att.status === 'checked_in' || att.status === 'pending_checkout') working.push({ worker:w, att:att });
    else if (att.status === 'completed') done.push({ worker:w, att:att });
  }

  var html = '<div class="manual-overview-grid">' +
    '<div class="ov-card ov-notin"><div class="ov-num">' + notIn.length + '</div><div class="ov-label">Not Checked In</div></div>' +
    '<div class="ov-card ov-working"><div class="ov-num">' + working.length + '</div><div class="ov-label">Currently Working</div></div>' +
    '<div class="ov-card ov-pending"><div class="ov-num">' + pending.length + '</div><div class="ov-label">Pending Approval</div></div>' +
    '<div class="ov-card ov-done"><div class="ov-num">' + done.length + '</div><div class="ov-label">Completed</div></div>' +
    '</div>';

  if (notIn.length > 0) {
    html += '<div class="ov-section"><div class="ov-section-title ov-notin-title"><span class="material-symbols-outlined">person_off</span> Not Checked In (' + notIn.length + ')</div><div class="ov-worker-list">';
    for (var n=0; n<notIn.length; n++) {
      var nw = notIn[n];
      html += '<div class="ov-worker-item"><div class="ov-worker-name">' + nw.name + '<small>' + nw.wid + '</small></div>' +
        '<div class="ov-worker-meta">' + nw.sec + ' · ' + nw.shift + '</div>' +
        '<button class="btn-ov-in" onclick="quickManualCheckin(\''+nw.wid+'\')">Check In</button></div>';
    }
    html += '</div></div>';
  }

  if (working.length > 0) {
    html += '<div class="ov-section"><div class="ov-section-title ov-working-title"><span class="material-symbols-outlined">engineering</span> Currently Working (' + working.length + ')</div><div class="ov-worker-list">';
    for (var wk=0; wk<working.length; wk++) {
      var wi = working[wk];
      html += '<div class="ov-worker-item"><div class="ov-worker-name">' + wi.worker.name + '<small>' + wi.worker.wid + '</small></div>' +
        '<div class="ov-worker-meta">In: ' + fmtTime(wi.att.checkinTime) + '</div>' +
        '<button class="btn-ov-out" onclick="quickManualCheckout(\''+wi.worker.wid+'\')">Check Out</button></div>';
    }
    html += '</div></div>';
  }

  c.innerHTML = html;
}

function quickManualCheckin(wid) {
  var w = findWorker(wid); if (!w) return;
  var now = new Date().toLocaleTimeString('en-GB', { timeZone:TZ, hour:'2-digit', minute:'2-digit' });
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Worker</label><input type="text" value="' + w.name + ' (' + w.wid + ')" readonly class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Shift</label><select id="qmShift" class="form-control"><option value="Day"'+(w.shift==='Day'?' selected':'')+'>Day (8AM-8PM)</option><option value="Night"'+(w.shift==='Night'?' selected':'')+'>Night (8PM-8AM)</option></select></div>' +
    '<div class="form-group"><label class="form-label">Check In Time</label><input type="time" id="qmTime" value="'+now+'" class="form-control"></div>' +
    '</div><div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-success" onclick="submitQuickCheckin(\''+wid+'\')">Check In Now</button></div>';
  showModal(html, 'Quick Check In - ' + w.name);
}
function submitQuickCheckin(wid) {
  var shift = document.getElementById('qmShift').value;
  var time = document.getElementById('qmTime').value;
  manualCheckin(wid, shift, tD(), time).then(function(r) {
    closeModal();
    if (r.ok) showToast(r.msg, 'success'); else showToast(r.msg, 'error');
    renderManualEntry();
  });
}

function quickManualCheckout(wid) {
  var w = findWorker(wid); if (!w) return;
  var today = tD(); var all = gA(); var att = null;
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (a.wid === wid && d === today && (a.status === 'checked_in' || a.status === 'pending_checkout')) { att = a; break; }
  }
  if (!att) { showToast('No active check-in', 'error'); return; }
  var now = new Date().toLocaleTimeString('en-GB', { timeZone:TZ, hour:'2-digit', minute:'2-digit' });
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Worker</label><input type="text" value="' + w.name + '" readonly class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Check In Was</label><input type="text" value="' + fmtTime(att.checkinTime) + '" readonly class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Check Out Time</label><input type="time" id="qmoTime" value="'+now+'" class="form-control"></div>' +
    '</div><div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-danger" onclick="submitQuickCheckout(\''+wid+'\')">Check Out Now</button></div>';
  showModal(html, 'Quick Check Out - ' + w.name);
}
function submitQuickCheckout(wid) {
  var time = document.getElementById('qmoTime').value;
  manualCheckout(wid, null, tD(), time).then(function(r) {
    closeModal();
    if (r.ok) showToast(r.msg, 'success'); else showToast(r.msg, 'error');
    renderManualEntry();
  });
}

function submitCustomEntry() {
  var wid = document.getElementById('customWorker').value;
  var shift = document.getElementById('customShift').value;
  var date = document.getElementById('customDate').value;
  var inT = document.getElementById('customIn').value;
  var outT = document.getElementById('customOut').value;
  var type = document.getElementById('customType').value;
  if (!wid || !date) { showToast('Select worker and date', 'error'); return; }
  if (type === 'in' || type === 'both') {
    if (!inT) { showToast('Enter check-in time', 'error'); return; }
    manualCheckin(wid, shift, date, inT).then(function(r) {
      if (!r.ok) { showToast(r.msg, 'error'); return; }
      showToast(r.msg, 'success');
      if (type === 'both' && outT) {
        setTimeout(function() {
          manualCheckout(wid, shift, date, outT).then(function(r2) {
            if (r2.ok) showToast(r2.msg, 'success'); else showToast(r2.msg, 'error');
            renderManualEntry();
          });
        }, 500);
      } else renderManualEntry();
    });
  } else if (type === 'out') {
    if (!outT) { showToast('Enter check-out time', 'error'); return; }
    manualCheckout(wid, shift, date, outT).then(function(r) {
      if (r.ok) showToast(r.msg, 'success'); else showToast(r.msg, 'error');
      renderManualEntry();
    });
  }
}

function renderBulkWorkerList() {
  var c = document.getElementById('bulkWorkerList');
  if (!c) return;
  var shift = document.getElementById('bulkShift') ? document.getElementById('bulkShift').value : 'All';
  var sec = document.getElementById('bulkSection') ? document.getElementById('bulkSection').value : 'All';
  var ws = gW(); var filtered = [];
  for (var i=0; i<ws.length; i++) {
    var w = ws[i]; if (!w.on) continue;
    if (shift !== 'All' && w.shift !== shift) continue;
    if (sec !== 'All' && w.sec !== sec) continue;
    filtered.push(w);
  }
  _bulkSelected = [];
  var html = '<div class="bulk-controls">' +
    '<button class="btn btn-sm btn-secondary" onclick="selectAllBulk()">Select All</button>' +
    '<button class="btn btn-sm btn-secondary" onclick="deselectAllBulk()">Deselect All</button>' +
    '<span class="bulk-count" id="bulkCount">0 selected</span></div><div class="bulk-list">';
  for (var j=0; j<filtered.length; j++) {
    var fw = filtered[j];
    html += '<div><label class="bulk-label"><input type="checkbox" class="bulk-cb" value="'+fw.wid+'" onchange="updateBulkSelection()">' +
      '<div><div class="bulk-name">' + fw.name + '</div><div class="bulk-meta">' + fw.wid + ' · ' + fw.sec + ' · ' + fw.shift + '</div></div></label></div>';
  }
  html += '</div>';
  c.innerHTML = html;
}
function updateBulkSelection() {
  var cbs = document.querySelectorAll('.bulk-cb:checked');
  _bulkSelected = [];
  for (var i=0; i<cbs.length; i++) _bulkSelected.push(cbs[i].value);
  var el = document.getElementById('bulkCount');
  if (el) el.textContent = _bulkSelected.length + ' selected';
}
function selectAllBulk() { var cbs = document.querySelectorAll('.bulk-cb'); for (var i=0; i<cbs.length; i++) cbs[i].checked = true; updateBulkSelection(); }
function deselectAllBulk() { var cbs = document.querySelectorAll('.bulk-cb'); for (var i=0; i<cbs.length; i++) cbs[i].checked = false; updateBulkSelection(); }

function submitBulkAction(type) {
  if (_bulkSelected.length === 0) { showToast('Select at least one worker', 'warn'); return; }
  var date = document.getElementById('bulkDate').value || tD();
  var shift = document.getElementById('bulkShift').value;
  var time = type === 'in' ? document.getElementById('bulkInTime').value : document.getElementById('bulkOutTime').value;
  if (!date || !time) { showToast('Enter date and time', 'error'); return; }
  showConfirm('Bulk ' + (type === 'in' ? 'check in' : 'check out') + ' for ' + _bulkSelected.length + ' workers?', function() {
    var fn = type === 'in' ? bulkCheckin : bulkCheckout;
    fn(_bulkSelected, shift, date, time).then(function(r) {
      showToast(r.success + ' succeeded, ' + r.failed + ' failed.', 'success');
      renderManualEntry();
    });
  });
}

console.log('[ALB] manual.js v17 loaded');
