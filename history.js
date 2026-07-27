// ========== HISTORY MODULE - AL BOWRY CARPENTRY LLC ==========
// COP31 Project - Antalya, Turkey
// Features: Backdated entries, Day-wise history, Present/Absent,
// PDF/Excel download, Edit/Delete, Manual checkout, Bulk entries

function loadHistorySection() {
  console.log('Loading history section...');
  var d1 = document.getElementById('historyDate');
  var d2 = document.getElementById('historyEntryDate');
  var today = tD();
  if (d1 && !d1.value) d1.value = today;
  if (d2 && !d2.value) d2.value = today;
  loadHistoryWorkers();
  setTimeout(function() { loadHistoryForDate(); }, 300);
}

// ===== WORKER DROPDOWN - Direct Firebase Load =====
function loadHistoryWorkers() {
  var sel = document.getElementById('historyWorker');
  if (!sel) return;

  // Try cache first
  var workers = [];
  try { workers = gW(); } catch(e) {}
  var active = [];
  if (workers && workers.length) {
    for (var i = 0; i < workers.length; i++) {
      if (workers[i].on) active.push(workers[i]);
    }
  }

  if (active.length > 0) {
    buildWorkerDropdown(sel, active);
    return;
  }

  // Cache empty - load from Firebase directly
  sel.innerHTML = '<option value="">Loading from server...</option>';
  
  if (window.FB && window.FB.getAll) {
    window.FB.getAll('workers').then(function(data) {
      if (data && data.length) {
        var act = [];
        for (var i = 0; i < data.length; i++) {
          if (data[i].on) act.push(data[i]);
        }
        if (act.length) {
          buildWorkerDropdown(sel, act);
        } else {
          sel.innerHTML = '<option value="">No active workers</option>';
        }
      } else {
        sel.innerHTML = '<option value="">No workers found - refresh page</option>';
        setTimeout(loadHistoryWorkers, 3000);
      }
    }).catch(function() {
      setTimeout(loadHistoryWorkers, 3000);
    });
  } else {
    setTimeout(loadHistoryWorkers, 2000);
  }
}

function buildWorkerDropdown(sel, active) {
  active.sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
  
  var ind = [], pak = [];
  for (var i = 0; i < active.length; i++) {
    if (active[i].sec === 'Indian') ind.push(active[i]);
    else pak.push(active[i]);
  }

  var h = '<option value="">-- Select Worker (' + active.length + ') --</option>';
  
  if (ind.length) {
    h += '<optgroup label="Indian Workers (' + ind.length + ')">';
    for (var j = 0; j < ind.length; j++) {
      h += '<option value="' + ind[j].wid + '">' + ind[j].name + ' - ' + (ind[j].prof || 'Worker') + '</option>';
    }
    h += '</optgroup>';
  }

  if (pak.length) {
    h += '<optgroup label="Pakistani Workers (' + pak.length + ')">';
    for (var k = 0; k < pak.length; k++) {
      h += '<option value="' + pak[k].wid + '">' + pak[k].name + ' - ' + (pak[k].prof || 'Worker') + '</option>';
    }
    h += '</optgroup>';
  }

  sel.innerHTML = h;
  console.log('History dropdown: ' + active.length + ' workers loaded');
}

// ===== HELPER FUNCTIONS =====
function findWorker(wid) {
  var workers = [];
  try { workers = gW(); } catch(e) {}
  for (var i = 0; i < workers.length; i++) {
    if (workers[i].wid === wid) return workers[i];
  }
  return null;
}

function getActiveWorkers() {
  var workers = [];
  try { workers = gW(); } catch(e) {}
  var result = [];
  for (var i = 0; i < workers.length; i++) {
    if (workers[i].on) result.push(workers[i]);
  }
  return result;
}

function getDateAttendance(date) {
  var att = [];
  try { att = gA(); } catch(e) {}
  var result = [];
  for (var i = 0; i < att.length; i++) {
    if (att[i].date === date) result.push(att[i]);
  }
  return result;
}

function findRecord(id) {
  var att = [];
  try { att = gA(); } catch(e) {}
  for (var i = 0; i < att.length; i++) {
    if (att[i].id === id) return att[i];
  }
  return null;
}

// ===== ADD BACKDATED ENTRY =====
async function addBackdatedEntry() {
  var wid = document.getElementById('historyWorker').value;
  var date = document.getElementById('historyEntryDate').value;
  var shift = document.getElementById('historyShift').value;
  var inTime = document.getElementById('historyCheckIn').value;
  var outTime = document.getElementById('historyCheckOut').value;

  if (!wid) return toast('Select a worker', 'err');
  if (!date) return toast('Select a date', 'err');
  if (!shift) return toast('Select shift', 'err');
  if (!inTime) return toast('Enter check-in time', 'err');
  if (!outTime) return toast('Enter check-out time', 'err');

  var worker = findWorker(wid);
  if (!worker) {
    toast('Worker not found. Refreshing...', 'err');
    loadHistoryWorkers();
    return;
  }

  // Check existing
  var dateAtt = getDateAttendance(date);
  var existing = null;
  for (var i = 0; i < dateAtt.length; i++) {
    if (dateAtt[i].wid === wid) { existing = dateAtt[i]; break; }
  }

  if (existing) {
    if (!confirm(worker.name + ' already has entry for ' + date + '.\nReplace it?')) return;
    await FB.del(COL.A, existing.id);
  }

  // Create timestamps
  var ciISO = new Date(date + 'T' + inTime + ':00').toISOString();
  var coISO = new Date(date + 'T' + outTime + ':00').toISOString();

  // Night shift crossover
  if (new Date(coISO) <= new Date(ciISO)) {
    var d = new Date(coISO);
    d.setDate(d.getDate() + 1);
    coISO = d.toISOString();
  }

  var c = calcHours(ciISO, coISO);
  var rid = 'att_bd_' + Date.now() + '_' + wid;

  var ok = await FB.save(COL.A, rid, {
    recId: rid,
    wid: wid,
    name: worker.name,
    prof: worker.prof || 'Worker',
    sec: worker.sec || 'Indian',
    shift: shift,
    date: date,
    checkinReqTime: ciISO,
    checkinTime: ciISO,
    checkoutReqTime: coISO,
    checkoutTime: coISO,
    total: c.total,
    regular: c.regular,
    compOT: c.compOT,
    extraOT: c.extraOT,
    ot: c.ot,
    status: 'completed',
    backdated: true
  });

  if (ok) {
    toast(worker.name + ': ' + c.total.toFixed(2) + 'h added for ' + date);
    document.getElementById('historyWorker').value = '';
    var viewDate = document.getElementById('historyDate').value;
    if (viewDate === date) loadHistoryForDate();
  } else {
    toast('Save failed. Check internet.', 'err');
  }
}

// ===== LOAD HISTORY FOR DATE =====
function loadHistoryForDate() {
  var dateEl = document.getElementById('historyDate');
  var filterEl = document.getElementById('historyFilter');
  if (!dateEl) return;

  var date = dateEl.value;
  var filter = filterEl ? filterEl.value : '';
  if (!date) return;

  var allAtt = getDateAttendance(date);
  var allWorkers = getActiveWorkers();
  var el = document.getElementById('historyContent');
  if (!el) return;

  // Present worker IDs (from ALL attendance, not filtered)
  var presentWids = [];
  for (var i = 0; i < allAtt.length; i++) {
    presentWids.push(allAtt[i].wid);
  }

  // Truly absent workers
  var absentWorkers = [];
  for (var j = 0; j < allWorkers.length; j++) {
    if (presentWids.indexOf(allWorkers[j].wid) === -1) {
      absentWorkers.push(allWorkers[j]);
    }
  }

  // Absent only view
  if (filter === 'Absent') {
    if (!absentWorkers.length) {
      el.innerHTML = '<div class="empty"><div class="em-icon">✅</div><h3>All ' + allWorkers.length + ' workers present on ' + date + '!</h3></div>';
      return;
    }
    el.innerHTML = buildAbsentOnlyView(absentWorkers, date, allWorkers.length);
    return;
  }

  // Filter attendance
  var att = allAtt.slice();
  if (filter === 'Day') att = filterArr(att, function(a) { return a.shift === 'Day' || !a.shift; });
  else if (filter === 'Night') att = filterArr(att, function(a) { return a.shift === 'Night'; });
  else if (filter === 'Indian') att = filterArr(att, function(a) { return a.sec === 'Indian'; });
  else if (filter === 'Pakistani') att = filterArr(att, function(a) { return a.sec === 'Pakistani'; });
  else if (filter === 'Present') att = filterArr(att, function(a) { return a.status === 'completed' || a.status === 'checked_in'; });

  // Filter absent
  var filteredAbsent = absentWorkers.slice();
  if (filter === 'Indian') filteredAbsent = filterArr(filteredAbsent, function(w) { return w.sec === 'Indian'; });
  else if (filter === 'Pakistani') filteredAbsent = filterArr(filteredAbsent, function(w) { return w.sec === 'Pakistani'; });
  else if (filter === 'Present') filteredAbsent = [];

  // Stats
  var tH = 0, tOT = 0, dayS = 0, nightS = 0;
  for (var k = 0; k < att.length; k++) {
    tH += (att[k].total || 0);
    tOT += (att[k].ot || 0);
    if (att[k].shift === 'Night') nightS++; else dayS++;
  }

  var html = buildStatsHeader(date, att.length, filteredAbsent.length, dayS, nightS, tH, tOT);

  if (att.length) html += buildPresentTable(att);
  if (filteredAbsent.length && filter !== 'Present') html += buildAbsentTable(filteredAbsent);
  if (!att.length && !filteredAbsent.length) {
    html += '<div class="empty"><div class="em-icon">📋</div><h3>No data for ' + date + '</h3><p>Use backdated entry above</p></div>';
  }

  el.innerHTML = html;
}

function filterArr(arr, fn) {
  var result = [];
  for (var i = 0; i < arr.length; i++) { if (fn(arr[i])) result.push(arr[i]); }
  return result;
}

// ===== BUILD HTML =====
function buildStatsHeader(date, present, absent, dayS, nightS, tH, tOT) {
  var dateStr = date;
  try { dateStr = new Date(date).toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}); } catch(e) {}

  return '<div style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:24px;border-radius:14px;margin-bottom:20px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">' +
      '<div><h3 style="font-size:22px;margin-bottom:4px">' + date + '</h3><p style="opacity:.9;font-size:13px">' + dateStr + '</p></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn-success btn-sm" onclick="downloadHistoryPDF()">PDF</button>' +
        '<button class="btn btn-outline btn-sm" onclick="downloadHistoryExcel()" style="background:#fff;color:#1e40af">Excel</button>' +
        '<button class="btn btn-outline btn-sm" onclick="downloadHistoryCSV()" style="background:#fff;color:#1e40af">CSV</button>' +
      '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px">' +
      '<div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center"><div style="font-size:26px;font-weight:800">' + present + '</div><div style="font-size:11px;font-weight:600">PRESENT</div></div>' +
      '<div style="background:rgba(220,38,38,.3);padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(255,255,255,.2)"><div style="font-size:26px;font-weight:800">' + absent + '</div><div style="font-size:11px;font-weight:600">ABSENT</div></div>' +
      '<div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center"><div style="font-size:26px;font-weight:800">' + dayS + '</div><div style="font-size:11px;font-weight:600">DAY SHIFT</div></div>' +
      '<div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center"><div style="font-size:26px;font-weight:800">' + nightS + '</div><div style="font-size:11px;font-weight:600">NIGHT SHIFT</div></div>' +
      '<div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center"><div style="font-size:26px;font-weight:800">' + tH.toFixed(1) + 'h</div><div style="font-size:11px;font-weight:600">HOURS</div></div>' +
      '<div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center"><div style="font-size:26px;font-weight:800">' + tOT.toFixed(1) + 'h</div><div style="font-size:11px;font-weight:600">OVERTIME</div></div>' +
    '</div></div>';
}

function buildPresentTable(att) {
  function stg(s) {
    if (s === 'completed') return '<span class="tag tag-g">Done</span>';
    if (s === 'checked_in') return '<span class="tag tag-b">Working</span>';
    if (s === 'pending_checkin') return '<span class="tag tag-o">Pending IN</span>';
    if (s === 'pending_checkout') return '<span class="tag tag-o">Pending OUT</span>';
    return s || '-';
  }

  var html = '<div style="background:#059669;color:#fff;padding:14px 20px;border-radius:12px 12px 0 0;margin-top:20px">' +
    '<h3 style="font-size:16px;margin:0">Present Workers (' + att.length + ')</h3></div>' +
    '<div class="t-wrap" style="border-top-left-radius:0;border-top-right-radius:0;margin-bottom:24px"><table>' +
    '<thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th><th>Status</th><th>Actions</th></tr></thead><tbody>';

  for (var i = 0; i < att.length; i++) {
    var a = att[i];
    html += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><b>' + a.name + '</b>' + (a.backdated ? ' <span class="tag tag-o" style="font-size:9px">Manual</span>' : '') + '</td>' +
      '<td>' + (a.prof || '-') + '</td>' +
      '<td><span class="tag tag-' + (a.sec === 'Indian' ? 'ind' : 'pak') + '">' + (a.sec === 'Indian' ? 'IN' : 'PK') + '</span></td>' +
      '<td><span class="tag ' + (a.shift === 'Night' ? 'tag-o' : 'tag-b') + '">' + (a.shift === 'Night' ? 'Night' : 'Day') + '</span></td>' +
      '<td style="color:#059669">' + fT(a.checkinTime) + '</td>' +
      '<td style="color:#dc2626">' + fT(a.checkoutTime) + '</td>' +
      '<td style="color:var(--p);font-weight:700">' + (a.total || 0).toFixed(2) + 'h</td>' +
      '<td>' + (a.regular || 0).toFixed(2) + 'h</td>' +
      '<td style="color:#d97706">' + (a.compOT || 0).toFixed(2) + 'h</td>' +
      '<td style="color:#dc2626;font-weight:700">' + ((a.extraOT || 0) > 0 ? (a.extraOT).toFixed(2) + 'h' : '-') + '</td>' +
      '<td>' + stg(a.status) + '</td>' +
      '<td style="white-space:nowrap">' +
        '<button class="btn btn-outline btn-sm" onclick="editHistoryEntry(\'' + a.id + '\')" title="Edit">✏️</button>' +
        '<button class="btn btn-danger btn-sm" onclick="deleteHistoryEntry(\'' + a.id + '\')" title="Delete">🗑️</button>' +
        (a.status === 'checked_in' ? '<button class="btn btn-danger btn-sm" onclick="forceCheckout(\'' + a.id + '\')" title="Force checkout">🔒</button>' : '') +
      '</td></tr>';
  }

  html += '</tbody></table></div>';
  return html;
}

function buildAbsentTable(absent) {
  var html = '<div style="background:#dc2626;color:#fff;padding:14px 20px;border-radius:12px 12px 0 0;margin-top:20px">' +
    '<h3 style="font-size:16px;margin:0">Absent Workers (' + absent.length + ')</h3></div>' +
    '<div class="t-wrap" style="border-top-left-radius:0;border-top-right-radius:0"><table>' +
    '<thead><tr><th style="background:#dc2626">#</th><th style="background:#dc2626">Name</th><th style="background:#dc2626">Work</th><th style="background:#dc2626">Country</th><th style="background:#dc2626">Default Shift</th><th style="background:#dc2626">Status</th></tr></thead><tbody>';

  for (var i = 0; i < absent.length; i++) {
    var w = absent[i];
    html += '<tr style="background:#fef2f2">' +
      '<td>' + (i + 1) + '</td>' +
      '<td><b style="color:#dc2626">' + w.name + '</b></td>' +
      '<td>' + (w.prof || '-') + '</td>' +
      '<td><span class="tag tag-' + (w.sec === 'Indian' ? 'ind' : 'pak') + '">' + (w.sec === 'Indian' ? 'IN' : 'PK') + ' ' + w.sec + '</span></td>' +
      '<td><span class="tag ' + (w.shift === 'Night' ? 'tag-o' : 'tag-b') + '">' + (w.shift === 'Night' ? 'Night' : 'Day') + '</span></td>' +
      '<td><span class="tag tag-r">ABSENT</span></td></tr>';
  }

  html += '</tbody></table></div>';
  return html;
}

function buildAbsentOnlyView(absent, date, total) {
  return '<div style="background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:20px;border-radius:12px;margin-bottom:20px">' +
    '<h3 style="font-size:20px;margin-bottom:8px">Absent Workers - ' + date + '</h3>' +
    '<p style="opacity:.9;font-size:14px">' + absent.length + ' out of ' + total + ' workers absent</p></div>' +
    buildAbsentTable(absent);
}

// ===== FORCE CHECKOUT (for stuck checked_in) =====
async function forceCheckout(id) {
  var rec = findRecord(id);
  if (!rec) return toast('Record not found', 'err');
  if (rec.status !== 'checked_in') return toast('Not checked in', 'err');

  var outTime = prompt('Checkout time for ' + rec.name + ' (HH:MM):', '20:00');
  if (!outTime) return;

  var coISO = new Date(rec.date + 'T' + outTime + ':00').toISOString();
  if (new Date(coISO) <= new Date(rec.checkinTime)) {
    var d = new Date(coISO);
    d.setDate(d.getDate() + 1);
    coISO = d.toISOString();
  }

  var c = calcHours(rec.checkinTime, coISO);
  var updated = Object.assign({}, rec, {
    checkoutReqTime: coISO,
    checkoutTime: coISO,
    total: c.total,
    regular: c.regular,
    compOT: c.compOT,
    extraOT: c.extraOT,
    ot: c.ot,
    status: 'completed'
  });

  var ok = await FB.save(COL.A, id, updated);
  if (ok) {
    toast(rec.name + ' checked out: ' + c.total.toFixed(2) + 'h');
    loadHistoryForDate();
  }
}

// ===== EDIT & DELETE =====
function editHistoryEntry(id) {
  var r = findRecord(id);
  if (!r) return;

  document.getElementById('historyWorker').value = r.wid;
  document.getElementById('historyEntryDate').value = r.date;
  document.getElementById('historyShift').value = r.shift || 'Day';

  try {
    var it = new Date(r.checkinTime).toLocaleTimeString('en-GB', {timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit'});
    var ot = new Date(r.checkoutTime).toLocaleTimeString('en-GB', {timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit'});
    document.getElementById('historyCheckIn').value = it;
    document.getElementById('historyCheckOut').value = ot;
  } catch(e) {
    document.getElementById('historyCheckIn').value = '08:00';
    document.getElementById('historyCheckOut').value = '20:00';
  }

  window.scrollTo({top: 0, behavior: 'smooth'});
  toast('Editing ' + r.name + '. Update times and save.', 'info');
}

function deleteHistoryEntry(id) {
  var r = findRecord(id);
  if (!r) return;
  confirmDlg('Delete?', 'Delete ' + r.name + ' entry for ' + r.date + '?', async function() {
    await FB.del(COL.A, id);
    toast('Entry deleted', 'info');
    loadHistoryForDate();
  });
}

// ===== PDF DOWNLOAD =====
function downloadHistoryPDF() {
  var date = document.getElementById('historyDate').value;
  var filter = document.getElementById('historyFilter').value;
  if (!date) return toast('Select date', 'err');
  if (!window.jspdf) return toast('PDF loading...', 'err');

  var allAtt = getDateAttendance(date);
  var allW = getActiveWorkers();
  var att = allAtt.slice();

  if (filter === 'Day') att = filterArr(att, function(a) { return a.shift === 'Day' || !a.shift; });
  else if (filter === 'Night') att = filterArr(att, function(a) { return a.shift === 'Night'; });
  else if (filter === 'Indian') att = filterArr(att, function(a) { return a.sec === 'Indian'; });
  else if (filter === 'Pakistani') att = filterArr(att, function(a) { return a.sec === 'Pakistani'; });

  var presentWids = [];
  for (var i = 0; i < allAtt.length; i++) presentWids.push(allAtt[i].wid);
  var absent = filterArr(allW, function(w) { return presentWids.indexOf(w.wid) === -1; });

  if (filter === 'Indian') absent = filterArr(absent, function(w) { return w.sec === 'Indian'; });
  else if (filter === 'Pakistani') absent = filterArr(absent, function(w) { return w.sec === 'Pakistani'; });
  else if (filter === 'Present') absent = [];

  if (!att.length && !absent.length) return toast('No data', 'err');

  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF('l', 'mm', 'a4');

  addPDFHeader(doc, 'Daily Report - ' + date, (filter || 'All Workers') + ' | Reg: 9h + OT: 3h', 297);

  // Stats
  var tH = 0, tOT = 0, dayS = 0, nightS = 0;
  for (var j = 0; j < att.length; j++) {
    tH += (att[j].total || 0);
    tOT += (att[j].ot || 0);
    if (att[j].shift === 'Night') nightS++; else dayS++;
  }

  doc.setFillColor(240, 249, 255);
  doc.rect(10, 56, 277, 14, 'F');
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.rect(10, 56, 277, 14, 'S');
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Present: ' + att.length + '   |   Absent: ' + absent.length + '   |   Day: ' + dayS + '   |   Night: ' + nightS + '   |   Hours: ' + tH.toFixed(2) + 'h   |   OT: ' + tOT.toFixed(2) + 'h', 148.5, 65, {align: 'center'});
  doc.setTextColor(0);

  var curY = 76;

  // Present table
  if (att.length) {
    doc.setFillColor(5, 150, 105);
    doc.rect(10, curY, 277, 9, 'F');
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESENT WORKERS (' + att.length + ')', 15, curY + 6);
    curY += 11;

    var rows = [];
    for (var k = 0; k < att.length; k++) {
      var a = att[k];
      rows.push([k + 1, a.name + (a.backdated ? ' (M)' : ''), a.prof || '-', a.sec, a.shift || 'Day', fT(a.checkinTime), fT(a.checkoutTime), (a.total || 0).toFixed(2) + 'h', (a.regular || 0).toFixed(2) + 'h', (a.compOT || 0).toFixed(2) + 'h', (a.extraOT || 0).toFixed(2) + 'h']);
    }
    // Totals
    rows.push(['', '', 'TOTALS', '', '', '', '', tH.toFixed(2) + 'h',
      att.reduce(function(s, a) { return s + (a.regular || 0); }, 0).toFixed(2) + 'h',
      att.reduce(function(s, a) { return s + (a.compOT || 0); }, 0).toFixed(2) + 'h',
      att.reduce(function(s, a) { return s + (a.extraOT || 0); }, 0).toFixed(2) + 'h']);

    doc.autoTable({
      startY: curY,
      head: [['#', 'Name', 'Work', 'Country', 'Shift', 'In', 'Out', 'Total', 'Reg 9h', 'OT 3h', 'Extra']],
      body: rows,
      theme: 'grid',
      headStyles: {fillColor: [5, 150, 105], textColor: 255, fontSize: 9, fontStyle: 'bold', halign: 'center'},
      bodyStyles: {fontSize: 8, cellPadding: 3},
      alternateRowStyles: {fillColor: [240, 253, 244]},
      columnStyles: {0: {halign: 'center', cellWidth: 10}, 1: {halign: 'left', fontStyle: 'bold'}, 7: {halign: 'right', fontStyle: 'bold'}},
      didParseCell: function(data) {
        if (data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [209, 250, 229];
        }
      }
    });
    curY = doc.lastAutoTable.finalY + 8;
  }

  // Absent table
  if (absent.length) {
    if (curY > 170) { doc.addPage(); curY = 15; }

    doc.setFillColor(220, 38, 38);
    doc.rect(10, curY, 277, 9, 'F');
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ABSENT WORKERS (' + absent.length + ')', 15, curY + 6);
    curY += 11;

    var aRows = [];
    for (var m = 0; m < absent.length; m++) {
      aRows.push([m + 1, absent[m].name, absent[m].prof || '-', absent[m].sec, absent[m].shift || 'Day', 'ABSENT']);
    }

    doc.autoTable({
      startY: curY,
      head: [['#', 'Name', 'Work', 'Country', 'Shift', 'Status']],
      body: aRows,
      theme: 'grid',
      headStyles: {fillColor: [220, 38, 38], textColor: 255, fontSize: 9, fontStyle: 'bold', halign: 'center'},
      bodyStyles: {fontSize: 8, cellPadding: 3},
      alternateRowStyles: {fillColor: [254, 242, 242]},
      columnStyles: {0: {halign: 'center', cellWidth: 15}, 1: {halign: 'left', fontStyle: 'bold', textColor: [220, 38, 38]}, 5: {halign: 'center', fontStyle: 'bold', textColor: [220, 38, 38]}}
    });
  }

  addPDFFooter(doc);
  doc.save('AlBowry_COP31_' + date + '_' + (filter || 'All') + '.pdf');
  toast('PDF downloaded!');
}

// ===== EXCEL DOWNLOAD =====
function downloadHistoryExcel() {
  var date = document.getElementById('historyDate').value;
  var filter = document.getElementById('historyFilter').value;
  if (!date) return toast('Select date', 'err');

  var allAtt = getDateAttendance(date);
  var allW = getActiveWorkers();
  var att = allAtt.slice();

  if (filter === 'Day') att = filterArr(att, function(a) { return a.shift === 'Day' || !a.shift; });
  else if (filter === 'Night') att = filterArr(att, function(a) { return a.shift === 'Night'; });
  else if (filter === 'Indian') att = filterArr(att, function(a) { return a.sec === 'Indian'; });
  else if (filter === 'Pakistani') att = filterArr(att, function(a) { return a.sec === 'Pakistani'; });

  var presentWids = [];
  for (var i = 0; i < allAtt.length; i++) presentWids.push(allAtt[i].wid);
  var absent = filterArr(allW, function(w) { return presentWids.indexOf(w.wid) === -1; });
  if (filter === 'Indian') absent = filterArr(absent, function(w) { return w.sec === 'Indian'; });
  else if (filter === 'Pakistani') absent = filterArr(absent, function(w) { return w.sec === 'Pakistani'; });
  else if (filter === 'Present') absent = [];

  if (!att.length && !absent.length) return toast('No data', 'err');

  var logo = LOGO_BASE64 ? '<img src="' + LOGO_BASE64 + '" width="70" height="70" style="border-radius:8px">' : '<div style="width:70px;height:70px;background:#fff;color:#1e40af;font-size:40px;font-weight:bold;text-align:center;line-height:70px;border-radius:8px">A</div>';
  var tH = att.reduce(function(s, a) { return s + (a.total || 0); }, 0);
  var dayS = filterArr(att, function(a) { return a.shift === 'Day' || !a.shift; }).length;
  var nightS = filterArr(att, function(a) { return a.shift === 'Night'; }).length;

  var cn = COMPANY || {name: 'AL BOWRY CARPENTRY LLC', project: 'PROJECT COP31', site: 'Antalya, Turkey', office: 'Sharjah, UAE', web: 'www.albowry.com', full: 'AL BOWRY CARPENTRY LLC'};

  var h = '<html><head><meta charset="UTF-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%}th{background:#1e40af;color:#fff;padding:10px 8px;border:1px solid #1e3a8a;font-size:11px;text-align:center;font-weight:bold}td{padding:8px;border:1px solid #ccc;font-size:11px;text-align:center}.e{background:#f0f9ff}.ar{background:#fef2f2}th.ath{background:#dc2626;border-color:#991b1b}</style></head><body><table border="1">';

  // Header
  h += '<tr><td colspan="12" style="background:#1e40af;color:#fff;padding:20px"><table style="border:none;width:100%"><tr><td style="border:none;width:90px;vertical-align:middle">' + logo + '</td><td style="border:none;text-align:center;vertical-align:middle"><div style="font-size:28px;font-weight:bold;letter-spacing:1px">' + cn.name + '</div><div style="font-size:14px;font-weight:bold;margin-top:6px">Attendance Report</div><div style="font-size:13px;font-weight:bold;margin-top:4px">' + cn.project + ' at ' + cn.site + '</div><div style="font-size:11px;opacity:.9;margin-top:4px">Registered: ' + cn.office + ' | ' + cn.web + '</div></td></tr></table></td></tr>';
  h += '<tr><td colspan="12" style="background:#dbeafe;text-align:center;padding:12px;font-weight:bold;font-size:14px;color:#1e40af">Date: ' + date + ' | ' + (filter || 'All') + ' | Reg: 9h + OT: 3h</td></tr>';
  h += '<tr><td colspan="12" style="background:#eff6ff;text-align:center;padding:10px;font-size:12px">Present: ' + att.length + ' | Absent: ' + absent.length + ' | Day: ' + dayS + ' | Night: ' + nightS + ' | Hours: ' + tH.toFixed(2) + 'h</td></tr>';
  h += '<tr><td colspan="12" style="padding:5px"></td></tr>';

  // Present
  if (att.length) {
    h += '<tr><td colspan="12" style="background:#059669;color:#fff;padding:12px;font-weight:bold;text-align:center;font-size:14px">PRESENT WORKERS (' + att.length + ')</td></tr>';
    h += '<tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th><th>Status</th></tr>';
    for (var j = 0; j < att.length; j++) {
      var a = att[j];
      h += '<tr class="' + (j % 2 === 0 ? 'e' : '') + '"><td>' + (j + 1) + '</td><td style="text-align:left;font-weight:bold">' + a.name + (a.backdated ? ' (M)' : '') + '</td><td>' + (a.prof || '-') + '</td><td>' + a.sec + '</td><td>' + (a.shift || 'Day') + '</td><td>' + fT(a.checkinTime) + '</td><td>' + fT(a.checkoutTime) + '</td><td><b>' + (a.total || 0).toFixed(2) + '</b></td><td>' + (a.regular || 0).toFixed(2) + '</td><td>' + (a.compOT || 0).toFixed(2) + '</td><td>' + (a.extraOT || 0).toFixed(2) + '</td><td>' + a.status + '</td></tr>';
    }
    h += '<tr style="background:#dbeafe;font-weight:bold"><td colspan="7" style="text-align:right">TOTALS:</td><td>' + tH.toFixed(2) + '</td><td>' + att.reduce(function(s, a) { return s + (a.regular || 0); }, 0).toFixed(2) + '</td><td>' + att.reduce(function(s, a) { return s + (a.compOT || 0); }, 0).toFixed(2) + '</td><td>' + att.reduce(function(s, a) { return s + (a.extraOT || 0); }, 0).toFixed(2) + '</td><td></td></tr>';
  }

  // Absent
  if (absent.length) {
    h += '<tr><td colspan="12" style="padding:5px"></td></tr>';
    h += '<tr><td colspan="12" style="background:#dc2626;color:#fff;padding:12px;font-weight:bold;text-align:center;font-size:14px">ABSENT WORKERS (' + absent.length + ')</td></tr>';
    h += '<tr><th class="ath">#</th><th class="ath">Name</th><th class="ath">Work</th><th class="ath">Country</th><th class="ath">Shift</th><th class="ath" colspan="7">Status</th></tr>';
    for (var k = 0; k < absent.length; k++) {
      h += '<tr class="ar"><td>' + (k + 1) + '</td><td style="text-align:left;font-weight:bold;color:#dc2626">' + absent[k].name + '</td><td>' + (absent[k].prof || '-') + '</td><td>' + absent[k].sec + '</td><td>' + (absent[k].shift || 'Day') + '</td><td colspan="7" style="font-weight:bold;color:#dc2626">ABSENT</td></tr>';
    }
  }

  h += '<tr><td colspan="12" style="padding:5px"></td></tr>';
  h += '<tr><td colspan="12" style="background:#1e40af;color:#fff;text-align:center;padding:14px;font-size:11px">' + cn.full + ' | ' + new Date().toLocaleString() + '</td></tr>';
  h += '</table></body></html>';

  var b = new Blob([h], {type: 'application/vnd.ms-excel'});
  var l = document.createElement('a');
  l.href = URL.createObjectURL(b);
  l.download = 'AlBowry_COP31_' + date + '_' + (filter || 'All') + '.xls';
  l.click();
  toast('Excel downloaded!');
}

// ===== CSV DOWNLOAD =====
function downloadHistoryCSV() {
  var date = document.getElementById('historyDate').value;
  var filter = document.getElementById('historyFilter').value;
  if (!date) return toast('Select date', 'err');

  var allAtt = getDateAttendance(date);
  var att = allAtt.slice();

  if (filter === 'Day') att = filterArr(att, function(a) { return a.shift === 'Day' || !a.shift; });
  else if (filter === 'Night') att = filterArr(att, function(a) { return a.shift === 'Night'; });
  else if (filter === 'Indian') att = filterArr(att, function(a) { return a.sec === 'Indian'; });
  else if (filter === 'Pakistani') att = filterArr(att, function(a) { return a.sec === 'Pakistani'; });

  if (!att.length) return toast('No data', 'err');

  var cn = COMPANY || {name: 'AL BOWRY CARPENTRY LLC'};
  var csv = cn.name + '\nDaily Report - ' + date + '\n\n';
  csv += '#,Name,Work,Country,Shift,Date,In,Out,Total,Reg,OT,Extra,Status\n';

  for (var i = 0; i < att.length; i++) {
    var a = att[i];
    csv += (i + 1) + ',"' + a.name + '","' + (a.prof || '-') + '",' + a.sec + ',' + (a.shift || 'Day') + ',' + a.date + ',' + fT(a.checkinTime) + ',' + fT(a.checkoutTime) + ',' + (a.total || 0).toFixed(2) + ',' + (a.regular || 0).toFixed(2) + ',' + (a.compOT || 0).toFixed(2) + ',' + (a.extraOT || 0).toFixed(2) + ',' + a.status + '\n';
  }

  var b = new Blob([csv], {type: 'text/csv'});
  var l = document.createElement('a');
  l.href = URL.createObjectURL(b);
  l.download = 'AlBowry_COP31_' + date + '.csv';
  l.click();
  toast('CSV downloaded!');
}

// ===== BULK BACKDATED =====
async function bulkBackdatedEntry() {
  var date = document.getElementById('bulkBackdateDate').value;
  var shift = document.getElementById('bulkBackdateShift').value;
  var inTime = document.getElementById('bulkBackdateIn').value;
  var outTime = document.getElementById('bulkBackdateOut').value;
  var filter = document.getElementById('bulkBackdateFilter').value;

  if (!date) return toast('Select date', 'err');
  if (!shift) return toast('Select shift', 'err');
  if (!inTime || !outTime) return toast('Enter times', 'err');

  var workers = getActiveWorkers();
  if (filter === 'Indian') workers = filterArr(workers, function(w) { return w.sec === 'Indian'; });
  else if (filter === 'Pakistani') workers = filterArr(workers, function(w) { return w.sec === 'Pakistani'; });

  var existAtt = getDateAttendance(date);
  var existWids = [];
  for (var i = 0; i < existAtt.length; i++) existWids.push(existAtt[i].wid);

  var toAdd = filterArr(workers, function(w) { return existWids.indexOf(w.wid) === -1; });

  if (!toAdd.length) return toast('All have entries for ' + date, 'info');

  confirmDlg('Bulk Add?', toAdd.length + ' entries for ' + date + ' (' + shift + ')?', async function() {
    var ci = new Date(date + 'T' + inTime + ':00').toISOString();
    var co = new Date(date + 'T' + outTime + ':00').toISOString();
    if (new Date(co) <= new Date(ci)) {
      var d = new Date(co); d.setDate(d.getDate() + 1); co = d.toISOString();
    }
    var c = calcHours(ci, co);
    var count = 0;

    for (var j = 0; j < toAdd.length; j++) {
      var w = toAdd[j];
      var rid = 'att_bd_' + Date.now() + '_' + w.wid + '_' + Math.random().toString(36).substr(2, 5);
      await FB.save(COL.A, rid, {
        recId: rid, wid: w.wid, name: w.name, prof: w.prof || 'Worker', sec: w.sec || 'Indian',
        shift: shift, date: date,
        checkinReqTime: ci, checkinTime: ci, checkoutReqTime: co, checkoutTime: co,
        total: c.total, regular: c.regular, compOT: c.compOT, extraOT: c.extraOT, ot: c.ot,
        status: 'completed', backdated: true
      });
      count++;
    }

    toast(count + ' entries added for ' + date + '!');
    loadHistoryForDate();
  });
}

console.log('History Module Ready!');
