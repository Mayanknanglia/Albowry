// AL BOWRY - History & Backdated v17

var _historyDate = '';
var _historyShift = 'All';
var _historySection = 'All';
var _historyWorkerFilter = 'all';

function initHistory() {
  _historyDate = tD();
  var d = document.getElementById('histDate'); if (d) d.value = _historyDate;
  loadHistoryWorkers();
  renderHistoryView();
  renderDayWiseView();
}

function loadHistoryWorkers() {
  var selects = [document.getElementById('histWorkerSel'), document.getElementById('histBdWorker'), document.getElementById('histBulkFilter')];
  var ws = gW();
  if (!ws || ws.length === 0) {
    FB.getAll('workers').then(function(docs) { _workers = docs; loadHistoryWorkers(); });
    return;
  }
  var sections = ['Indian', 'Pakistani'];
  for (var s=0; s<selects.length; s++) {
    var sel = selects[s]; if (!sel) continue;
    var prev = sel.value;
    sel.innerHTML = '';
    if (sel.id === 'histWorkerSel' || sel.id === 'histBulkFilter') {
      var o = document.createElement('option'); o.value = 'all'; o.text = '-- All Workers --'; sel.appendChild(o);
    } else {
      var o2 = document.createElement('option'); o2.value = ''; o2.text = '-- Select Worker --'; sel.appendChild(o2);
    }
    for (var sc=0; sc<sections.length; sc++) {
      var grp = document.createElement('optgroup');
      grp.label = '-- ' + sections[sc].toUpperCase() + ' --';
      var cnt = 0;
      for (var i=0; i<ws.length; i++) {
        var w = ws[i];
        if (!w.on || w.sec !== sections[sc]) continue;
        var opt = document.createElement('option');
        opt.value = w.wid; opt.text = w.wid + ' - ' + w.name;
        grp.appendChild(opt); cnt++;
      }
      if (cnt > 0) sel.appendChild(grp);
    }
    if (prev) sel.value = prev;
  }
}

function renderHistoryView() {
  var c = document.getElementById('historyViewContainer');
  if (!c) return;
  var date = _historyDate || tD();
  var shift = _historyShift || 'All';
  var section = _historySection || 'All';
  var workerF = _historyWorkerFilter || 'all';
  var all = gA(); var ws = gW();
  if (!all || !ws) { c.innerHTML = '<div class="text-muted text-center">Loading...</div>'; return; }

  var dateAtt = [];
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (d === date) dateAtt.push(a);
  }

  var presentWids = [];
  for (var j=0; j<dateAtt.length; j++) {
    var a2 = dateAtt[j];
    if (a2.status === 'checked_in' || a2.status === 'pending_checkout' || a2.status === 'completed') {
      if (shift !== 'All' && a2.shift !== shift) continue;
      if (indexOf(presentWids, a2.wid) === -1) presentWids.push(a2.wid);
    }
  }

  var presentList = []; var processed = [];
  for (var k=0; k<dateAtt.length; k++) {
    var a3 = dateAtt[k];
    if (a3.status !== 'checked_in' && a3.status !== 'pending_checkout' && a3.status !== 'completed') continue;
    if (shift !== 'All' && a3.shift !== shift) continue;
    if (indexOf(processed, a3.wid) !== -1) continue;
    var w3 = findWorker(a3.wid); if (!w3) continue;
    if (section !== 'All' && w3.sec !== section) continue;
    if (workerF !== 'all' && a3.wid !== workerF) continue;
    presentList.push({ worker:w3, att:a3 });
    processed.push(a3.wid);
  }

  var absentList = [];
  for (var m=0; m<ws.length; m++) {
    var w4 = ws[m];
    if (!w4.on) continue;
    if (section !== 'All' && w4.sec !== section) continue;
    if (shift !== 'All' && w4.shift !== shift) continue;
    if (workerF !== 'all' && w4.wid !== workerF) continue;
    if (indexOf(presentWids, w4.wid) === -1) absentList.push(w4);
  }

  var total = 0;
  for (var t=0; t<ws.length; t++) {
    if (!ws[t].on) continue;
    if (section !== 'All' && ws[t].sec !== section) continue;
    if (shift !== 'All' && ws[t].shift !== shift) continue;
    total++;
  }

  var html = '<div class="hist-stats-row">' +
    '<div class="hist-stat-card hist-total"><span class="hist-stat-num">' + total + '</span><span>Total</span></div>' +
    '<div class="hist-stat-card hist-present"><span class="hist-stat-num">' + presentList.length + '</span><span>Present</span></div>' +
    '<div class="hist-stat-card hist-absent"><span class="hist-stat-num">' + absentList.length + '</span><span>Absent</span></div>' +
    '</div>';

  html += '<div><div class="hist-section-header hist-present-hdr"><span class="material-symbols-outlined">check_circle</span> Present (' + presentList.length + ')</div>';
  if (presentList.length === 0) {
    html += '<div class="hist-empty">No workers present on ' + fmtDate(date+'T00:00:00') + '</div>';
  } else {
    html += '<div class="table-responsive"><table class="hist-table"><thead><tr><th>#</th><th>Worker</th><th>Section</th><th>Shift</th><th>In</th><th>Out</th><th>Hours</th><th>OT</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    for (var p=0; p<presentList.length; p++) {
      var it = presentList[p];
      var sb = getStatusBadge(it.att.status);
      var isM = it.att.backdated ? '<span class="tag-manual">M</span>' : '';
      html += '<tr><td>' + (p+1) + '</td><td><strong>' + it.worker.name + '</strong><br><small>' + it.worker.wid + '</small>' + isM + '</td>' +
        '<td>' + it.worker.sec + '</td>' +
        '<td><span class="shift-badge shift-' + (it.att.shift||'day').toLowerCase() + '">' + (it.att.shift||'Day') + '</span></td>' +
        '<td>' + fmtTime(it.att.checkinTime || it.att.checkinReqTime) + '</td>' +
        '<td>' + fmtTime(it.att.checkoutTime) + '</td>' +
        '<td>' + (it.att.total ? it.att.total+'h' : '-') + '</td>' +
        '<td>' + (it.att.ot ? it.att.ot+'h' : '-') + '</td>' +
        '<td>' + sb + '</td>' +
        '<td class="hist-actions">' +
          '<button class="btn-icon btn-edit" onclick="editHistRecord(\''+it.att.recId+'\')"><span class="material-symbols-outlined">edit</span></button>' +
          (it.att.status === 'checked_in' ? '<button class="btn-icon btn-success" onclick="forceCheckout(\''+it.att.recId+'\')"><span class="material-symbols-outlined">logout</span></button>' : '') +
          '<button class="btn-icon btn-delete" onclick="deleteHistRecord(\''+it.att.recId+'\')"><span class="material-symbols-outlined">delete</span></button>' +
        '</td></tr>';
    }
    html += '</tbody></table></div>';
  }
  html += '</div>';

  html += '<div style="margin-top:20px"><div class="hist-section-header hist-absent-hdr"><span class="material-symbols-outlined">cancel</span> Absent (' + absentList.length + ')</div>';
  if (absentList.length === 0) {
    html += '<div class="hist-empty hist-empty-good">All workers are present!</div>';
  } else {
    html += '<div class="absent-grid">';
    for (var ab=0; ab<absentList.length; ab++) {
      var abW = absentList[ab];
      html += '<div class="absent-card"><div class="absent-initials">' + getInitials(abW.name) + '</div>' +
        '<div class="absent-info"><div class="absent-name">' + abW.name + '</div>' +
        '<div class="absent-meta">' + abW.wid + ' · ' + abW.prof + '</div>' +
        '<div class="absent-meta">' + abW.sec + ' · ' + abW.shift + '</div></div>' +
        '<button class="btn-absent-in" onclick="quickAddAbsent(\''+abW.wid+'\',\''+date+'\')"><span class="material-symbols-outlined">add_circle</span> Mark Present</button></div>';
    }
    html += '</div>';
  }
  html += '</div>';
  c.innerHTML = html;
}

function quickAddAbsent(wid, date) {
  var w = findWorker(wid); if (!w) return;
  var shift = w.shift;
  var dIn = shift === 'Night' ? '20:00' : '08:00';
  var dOut = shift === 'Night' ? '08:00' : '20:00';
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Worker</label><input type="text" value="' + w.name + '" readonly class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Date</label><input type="date" id="qaDate" value="' + date + '" class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Shift</label><select id="qaShift" class="form-control"><option value="Day"'+(shift==='Day'?' selected':'')+'>Day</option><option value="Night"'+(shift==='Night'?' selected':'')+'>Night</option></select></div>' +
    '<div class="form-group"><label class="form-label">In Time</label><input type="time" id="qaIn" value="'+dIn+'" class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Out Time</label><input type="time" id="qaOut" value="'+dOut+'" class="form-control"></div>' +
    '</div><div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="submitQuickAbsent(\''+wid+'\')">Add Attendance</button></div>';
  showModal(html, 'Add Attendance - ' + w.name);
}
function submitQuickAbsent(wid) {
  var date = document.getElementById('qaDate').value;
  var shift = document.getElementById('qaShift').value;
  var inT = document.getElementById('qaIn').value;
  var outT = document.getElementById('qaOut').value;
  if (!date || !inT || !outT) { showToast('Fill all fields', 'error'); return; }
  var w = findWorker(wid); if (!w) return;
  var cin = buildISO(date, inT, false, null);
  var cout = buildISO(date, outT, shift === 'Night', cin);
  var hrs = calcHours(cin, cout);
  var recId = genRecId(wid, true);
  var rec = {
    recId:recId, wid:wid, name:w.name, prof:w.prof, sec:w.sec, shift:shift, date:date,
    checkinReqTime:cin, checkinTime:cin, checkoutReqTime:cout, checkoutTime:cout,
    total:hrs.total, regular:hrs.regular, compOT:hrs.compOT, extraOT:hrs.extraOT, ot:hrs.ot,
    status:'completed', backdated:true
  };
  FB.save('attendance', recId, rec).then(function() {
    closeModal();
    showToast(w.name + ' attendance added!', 'success');
    renderHistoryView();
  });
}

function renderDayWiseView() {
  var c = document.getElementById('dayWiseContainer');
  if (!c) return;
  var date = document.getElementById('dwDate') ? document.getElementById('dwDate').value : tD();
  if (!date) date = tD();
  var all = gA(); var ws = gW();
  var dateAtt = [];
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (d === date) dateAtt.push(a);
  }
  var presentWids = [];
  for (var j=0; j<dateAtt.length; j++) {
    var a2 = dateAtt[j];
    if (a2.status === 'checked_in' || a2.status === 'pending_checkout' || a2.status === 'completed') {
      if (indexOf(presentWids, a2.wid) === -1) presentWids.push(a2.wid);
    }
  }
  var absent = [];
  for (var m=0; m<ws.length; m++) {
    if (!ws[m].on) continue;
    if (indexOf(presentWids, ws[m].wid) === -1) absent.push(ws[m]);
  }
  var activeCount = 0;
  for (var t=0; t<ws.length; t++) if (ws[t].on) activeCount++;

  var html = '<div class="dw-summary">' +
    '<span class="dw-badge dw-total">Total: ' + activeCount + '</span>' +
    '<span class="dw-badge dw-present">Present: ' + presentWids.length + '</span>' +
    '<span class="dw-badge dw-absent">Absent: ' + absent.length + '</span></div>';

  html += '<h4 class="dw-title present-title">Present Workers</h4>';
  if (presentWids.length === 0) html += '<div class="hist-empty">No records for ' + date + '</div>';
  else {
    html += '<table class="dw-table"><thead><tr><th>#</th><th>Name</th><th>ID</th><th>Section</th><th>Shift</th><th>In</th><th>Out</th><th>Hours</th><th>OT</th></tr></thead><tbody>';
    var num = 1;
    for (var k=0; k<dateAtt.length; k++) {
      var a3 = dateAtt[k];
      if (a3.status !== 'checked_in' && a3.status !== 'pending_checkout' && a3.status !== 'completed') continue;
      html += '<tr><td>' + (num++) + '</td><td>' + a3.name + (a3.backdated ? ' <span class="tag-manual">M</span>' : '') + '</td>' +
        '<td>' + a3.wid + '</td><td>' + a3.sec + '</td><td>' + (a3.shift||'Day') + '</td>' +
        '<td>' + fmtTime(a3.checkinTime || a3.checkinReqTime) + '</td>' +
        '<td>' + fmtTime(a3.checkoutTime) + '</td>' +
        '<td>' + (a3.total ? a3.total+'h' : '-') + '</td>' +
        '<td>' + (a3.ot ? a3.ot+'h' : '-') + '</td></tr>';
    }
    html += '</tbody></table>';
  }

  html += '<h4 class="dw-title absent-title" style="margin-top:20px">Absent Workers</h4>';
  if (absent.length === 0) html += '<div class="hist-empty hist-empty-good">All workers present!</div>';
  else {
    html += '<div class="absent-names-list">';
    for (var ab=0; ab<absent.length; ab++) html += '<span class="absent-name-tag">' + absent[ab].name + ' (' + absent[ab].wid + ')</span>';
    html += '</div>';
  }
  c.innerHTML = html;
}

function editHistRecord(recId) {
  var all = gA(); var rec = null;
  for (var i=0; i<all.length; i++) if (all[i].recId === recId) { rec = all[i]; break; }
  if (!rec) { showToast('Not found', 'error'); return; }
  var cinDate = rec.date || getTurkeyDate(rec.checkinTime);
  var cinT = rec.checkinTime ? new Date(rec.checkinTime).toLocaleTimeString('en-GB', { timeZone:TZ, hour:'2-digit', minute:'2-digit' }) : '08:00';
  var coutT = rec.checkoutTime ? new Date(rec.checkoutTime).toLocaleTimeString('en-GB', { timeZone:TZ, hour:'2-digit', minute:'2-digit' }) : '';
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Worker</label><input type="text" value="' + rec.name + '" readonly class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Date</label><input type="date" id="editDate" value="' + cinDate + '" class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Shift</label><select id="editShift" class="form-control"><option value="Day"'+(rec.shift==='Day'?' selected':'')+'>Day</option><option value="Night"'+(rec.shift==='Night'?' selected':'')+'>Night</option></select></div>' +
    '<div class="form-group"><label class="form-label">In Time</label><input type="time" id="editCin" value="'+cinT+'" class="form-control"></div>' +
    '<div class="form-group"><label class="form-label">Out Time</label><input type="time" id="editCout" value="'+coutT+'" class="form-control"></div>' +
    '</div><div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="saveHistEdit(\''+recId+'\')">Save</button></div>';
  showModal(html, 'Edit Record - ' + rec.name);
}
function saveHistEdit(recId) {
  var date = document.getElementById('editDate').value;
  var shift = document.getElementById('editShift').value;
  var cinT = document.getElementById('editCin').value;
  var coutT = document.getElementById('editCout').value;
  if (!date || !cinT) { showToast('Date and in-time required', 'error'); return; }
  var cin = buildISO(date, cinT, false, null);
  var upd = { date:date, shift:shift, checkinTime:cin, checkinReqTime:cin, backdated:true };
  if (coutT) {
    var cout = buildISO(date, coutT, shift === 'Night', cin);
    var hrs = calcHours(cin, cout);
    upd.checkoutTime = cout; upd.checkoutReqTime = cout;
    upd.total = hrs.total; upd.regular = hrs.regular;
    upd.compOT = hrs.compOT; upd.extraOT = hrs.extraOT; upd.ot = hrs.ot;
    upd.status = 'completed';
  } else {
    upd.checkoutTime = null; upd.checkoutReqTime = null;
    upd.total=0; upd.regular=0; upd.compOT=0; upd.extraOT=0; upd.ot=0;
    upd.status = 'checked_in';
  }
  FB.update('attendance', recId, upd).then(function() {
    closeModal();
    showToast('Updated!', 'success');
    renderHistoryView();
  });
}

function deleteHistRecord(recId) {
  showConfirm('Delete this record?', function() {
    FB.delete('attendance', recId).then(function() {
      showToast('Deleted', 'info');
      renderHistoryView();
    });
  });
}

function forceCheckout(recId) {
  var all = gA(); var rec = null;
  for (var i=0; i<all.length; i++) if (all[i].recId === recId) { rec = all[i]; break; }
  if (!rec) return;
  var dOut = rec.shift === 'Night' ? '08:00' : '20:00';
  var date = rec.date || getTurkeyDate(rec.checkinTime);
  var html = '<p>Force checkout <strong>' + rec.name + '</strong></p>' +
    '<div class="form-group"><label class="form-label">Checkout Time</label><input type="time" id="fcOut" value="'+dOut+'" class="form-control"></div>' +
    '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-warning" onclick="submitForceCheckout(\''+recId+'\',\''+date+'\')">Force Checkout</button></div>';
  showModal(html, 'Force Checkout');
}
function submitForceCheckout(recId, date) {
  var t = document.getElementById('fcOut').value;
  if (!t) return;
  var all = gA(); var rec = null;
  for (var i=0; i<all.length; i++) if (all[i].recId === recId) { rec = all[i]; break; }
  if (!rec) return;
  var cout = buildISO(date, t, rec.shift === 'Night', rec.checkinTime);
  var hrs = calcHours(rec.checkinTime, cout);
  FB.update('attendance', recId, {
    checkoutTime:cout, checkoutReqTime:cout,
    total:hrs.total, regular:hrs.regular, compOT:hrs.compOT, extraOT:hrs.extraOT, ot:hrs.ot,
    status:'completed'
  }).then(function() {
    closeModal();
    showToast('Force checkout done!', 'success');
    renderHistoryView();
  });
}

function submitBackdatedEntry() {
  var wid = document.getElementById('histBdWorker').value;
  var date = document.getElementById('histBdDate').value;
  var shift = document.getElementById('histBdShift').value;
  var inT = document.getElementById('histBdIn').value;
  var outT = document.getElementById('histBdOut').value;
  if (!wid || !date || !inT || !outT) { showToast('Fill all fields', 'error'); return; }
  var w = findWorker(wid); if (!w) return;
  var all = gA();
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (a.wid === wid && d === date) {
      showToast(w.name + ' already has record for ' + date + '. Delete first.', 'warn');
      return;
    }
  }
  var cin = buildISO(date, inT, false, null);
  var cout = buildISO(date, outT, shift === 'Night', cin);
  var hrs = calcHours(cin, cout);
  var recId = genRecId(wid, true);
  var rec = {
    recId:recId, wid:wid, name:w.name, prof:w.prof, sec:w.sec, shift:shift, date:date,
    checkinReqTime:cin, checkinTime:cin, checkoutReqTime:cout, checkoutTime:cout,
    total:hrs.total, regular:hrs.regular, compOT:hrs.compOT, extraOT:hrs.extraOT, ot:hrs.ot,
    status:'completed', backdated:true
  };
  FB.save('attendance', recId, rec).then(function() {
    showToast(w.name + ' entry added for ' + date, 'success');
    renderHistoryView();
  });
}

function submitBulkBackdated() {
  var date = document.getElementById('histBulkDate').value;
  var shift = document.getElementById('histBulkShift').value;
  var filter = document.getElementById('histBulkFilter').value;
  var inT = document.getElementById('histBulkIn').value;
  var outT = document.getElementById('histBulkOut').value;
  if (!date || !inT || !outT) { showToast('Fill all', 'error'); return; }
  var ws = gW(); var targets = [];
  for (var i=0; i<ws.length; i++) {
    var w = ws[i]; if (!w.on) continue;
    if (filter !== 'all' && w.wid !== filter && w.sec !== filter && w.shift !== filter) continue;
    targets.push(w);
  }
  if (targets.length === 0) { showToast('No workers match', 'warn'); return; }
  showConfirm('Add attendance for ' + targets.length + ' workers on ' + date + '?', function() {
    var all = gA(); var existing = [];
    for (var j=0; j<all.length; j++) {
      var a = all[j];
      var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
      if (d === date) existing.push(a.wid);
    }
    var promises = []; var skipped = 0;
    for (var k=0; k<targets.length; k++) {
      var tw = targets[k];
      if (indexOf(existing, tw.wid) !== -1) { skipped++; continue; }
      var cin = buildISO(date, inT, false, null);
      var cout = buildISO(date, outT, shift === 'Night', cin);
      var hrs = calcHours(cin, cout);
      var recId = genRecId(tw.wid, true);
      promises.push(FB.save('attendance', recId, {
        recId:recId, wid:tw.wid, name:tw.name, prof:tw.prof, sec:tw.sec, shift:shift, date:date,
        checkinReqTime:cin, checkinTime:cin, checkoutReqTime:cout, checkoutTime:cout,
        total:hrs.total, regular:hrs.regular, compOT:hrs.compOT, extraOT:hrs.extraOT, ot:hrs.ot,
        status:'completed', backdated:true
      }));
    }
    Promise.all(promises).then(function() {
      showToast('Added ' + promises.length + '. Skipped ' + skipped + '.', 'success');
      renderHistoryView();
    });
  });
}

function exportHistoryPDF() {
  var date = _historyDate || tD();
  var all = gA(); var ws = gW();
  var pRecs = []; var pWids = [];
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (d !== date) continue;
    if (a.status !== 'checked_in' && a.status !== 'pending_checkout' && a.status !== 'completed') continue;
    if (_historyShift !== 'All' && a.shift !== _historyShift) continue;
    if (_historySection !== 'All' && a.sec !== _historySection) continue;
    if (indexOf(pWids, a.wid) === -1) { pRecs.push(a); pWids.push(a.wid); }
  }
  var absent = [];
  for (var j=0; j<ws.length; j++) {
    var w = ws[j]; if (!w.on) continue;
    if (_historySection !== 'All' && w.sec !== _historySection) continue;
    if (_historyShift !== 'All' && w.shift !== _historyShift) continue;
    if (indexOf(pWids, w.wid) === -1) absent.push(w);
  }
  loadLogoForPDF().then(function() {
    var doc = new jspdf.jsPDF();
    var startY = addPDFHeader(doc, 'Attendance - ' + fmtDate(date+'T00:00:00'), 'Present: ' + pRecs.length + ' | Absent: ' + absent.length);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(5,150,105);
    doc.text('PRESENT WORKERS (' + pRecs.length + ')', 14, startY + 8);
    if (pRecs.length > 0) {
      var rows = [];
      for (var p=0; p<pRecs.length; p++) {
        var r = pRecs[p];
        rows.push([p+1, r.name, r.wid, r.sec, r.shift||'Day', fmtTime(r.checkinTime||r.checkinReqTime), fmtTime(r.checkoutTime)||'-', (r.total||0)+'h', (r.ot||0)+'h', r.status==='completed'?'Done':'Active']);
      }
      doc.autoTable({ startY:startY+12, head:[['#','Name','ID','Section','Shift','In','Out','Hours','OT','Status']], body:rows,
        theme:'grid', styles:{fontSize:8, cellPadding:2}, headStyles:{fillColor:[5,150,105], textColor:255},
        alternateRowStyles:{fillColor:[240,255,250]} });
    }
    var finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : startY + 20;
    if (finalY + 40 > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); finalY = 20; }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(220,38,38);
    doc.text('ABSENT WORKERS (' + absent.length + ')', 14, finalY);
    if (absent.length > 0) {
      var aRows = [];
      for (var ab=0; ab<absent.length; ab++) {
        var abW = absent[ab];
        aRows.push([ab+1, abW.name, abW.wid, abW.sec, abW.prof, abW.shift]);
      }
      doc.autoTable({ startY:finalY+4, head:[['#','Name','ID','Section','Profession','Shift']], body:aRows,
        theme:'grid', styles:{fontSize:8, cellPadding:2}, headStyles:{fillColor:[220,38,38], textColor:255},
        alternateRowStyles:{fillColor:[255,245,245]} });
    }
    addPDFFooter(doc);
    doc.save('albowry_attendance_' + date + '.pdf');
    showToast('PDF downloaded!', 'success');
  });
}

function exportHistoryExcel() {
  var date = _historyDate || tD();
  var all = gA(); var ws = gW();
  var pRecs = []; var pWids = [];
  for (var i=0; i<all.length; i++) {
    var a = all[i];
    var d = a.date || getTurkeyDate(a.checkinTime || a.checkinReqTime);
    if (d !== date) continue;
    if (a.status !== 'checked_in' && a.status !== 'pending_checkout' && a.status !== 'completed') continue;
    if (indexOf(pWids, a.wid) === -1) { pRecs.push(a); pWids.push(a.wid); }
  }
  var absent = [];
  for (var j=0; j<ws.length; j++) {
    if (!ws[j].on) continue;
    if (indexOf(pWids, ws[j].wid) === -1) absent.push(ws[j]);
  }
  var csv = COMPANY.full + '\nDate: ' + date + '\n\nPRESENT WORKERS\n#,Name,ID,Section,Shift,In,Out,Total,OT,Status\n';
  for (var p=0; p<pRecs.length; p++) {
    var r = pRecs[p];
    csv += (p+1) + ',"' + r.name + '",' + r.wid + ',' + r.sec + ',' + (r.shift||'Day') + ',' + fmtTime(r.checkinTime||r.checkinReqTime) + ',' + (fmtTime(r.checkoutTime)||'-') + ',' + (r.total||0) + ',' + (r.ot||0) + ',' + r.status + '\n';
  }
  csv += '\nABSENT WORKERS\n#,Name,ID,Section,Profession,Shift\n';
  for (var ab=0; ab<absent.length; ab++) {
    var abW = absent[ab];
    csv += (ab+1) + ',"' + abW.name + '",' + abW.wid + ',' + abW.sec + ',"' + abW.prof + '",' + abW.shift + '\n';
  }
  var blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'albowry_attendance_' + date + '.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('Excel/CSV downloaded!', 'success');
}

document.addEventListener('DOMContentLoaded', function() {
  var d = document.getElementById('histDate');
  if (d) d.addEventListener('change', function() { _historyDate = this.value; renderHistoryView(); });
  var s = document.getElementById('histShift');
  if (s) s.addEventListener('change', function() { _historyShift = this.value; renderHistoryView(); });
  var se = document.getElementById('histSection');
  if (se) se.addEventListener('change', function() { _historySection = this.value; renderHistoryView(); });
  var w = document.getElementById('histWorkerSel');
  if (w) w.addEventListener('change', function() { _historyWorkerFilter = this.value; renderHistoryView(); });
  var dw = document.getElementById('dwDate');
  if (dw) dw.addEventListener('change', function() { renderDayWiseView(); });
});

console.log('[ALB] history.js v17 loaded');
