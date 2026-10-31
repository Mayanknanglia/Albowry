/* ==========================================================================
   AL BOWRY CARPENTRY LLC - LEAVE & SPECIAL MANAGER (SELF-HEALING CODE)
   Rules Maintained: var only, function(){}, NO let/const/arrow functions.
   ========================================================================== */

var currentManagerData = {}; // Attendance map for selected date
var allAppWorkers = [];      // Workers list (Auto-fetched)

function initLeaveManager() {
  // 1. Auto Set Date to Today if empty
  var dateInput = document.getElementById('leaveManagerDate');
  if (dateInput && !dateInput.value) {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1);
    var dd = String(d.getDate());
    if (mm.length < 2) mm = '0' + mm;
    if (dd.length < 2) dd = '0' + dd;
    dateInput.value = yyyy + '-' + mm + '-' + dd;
  }

  var tbody = document.getElementById('leaveManagerTableBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding:30px; text-align:center; color:#1b365d; font-weight:bold;">🔄 Loading Workers & Attendance Data...</td></tr>';
  }

  // 2. Fetch Workers first, then Attendance Data
  fetchWorkersMaster(function() {
    loadLeaveManagerData();
  });
}

// 1. Robust Worker Fetcher (Memory + Firestore Fallback)
function fetchWorkersMaster(callback) {
  var list = [];
  
  if (typeof workers !== 'undefined' && Array.isArray(workers) && workers.length > 0) list = workers;
  else if (typeof window.workers !== 'undefined' && Array.isArray(window.workers) && window.workers.length > 0) list = window.workers;
  else if (typeof allWorkers !== 'undefined' && Array.isArray(allWorkers) && allWorkers.length > 0) list = allWorkers;

  if (list.length > 0) {
    allAppWorkers = list;
    if (callback) callback();
    return;
  }

  // Firestore Direct Fallback if memory empty
  try {
    var dbRef = null;
    if (typeof db !== 'undefined' && db && db.collection) dbRef = db;
    else if (typeof firebase !== 'undefined' && firebase.firestore) dbRef = firebase.firestore();

    if (dbRef) {
      dbRef.collection('workers').get().then(function(snapshot) {
        var fetched = [];
        snapshot.forEach(function(doc) {
          var d = doc.data();
          if (d) {
            if (!d.id && doc.id) d.id = doc.id;
            fetched.push(d);
          }
        });
        if (fetched.length > 0) {
          allAppWorkers = fetched;
        }
        if (callback) callback();
      }).catch(function() {
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  } catch(e) {
    if (callback) callback();
  }
}

// 2. Fetch Attendance Data for selected date
function loadLeaveManagerData() {
  var dateEl = document.getElementById('leaveManagerDate');
  if (!dateEl || !dateEl.value) return;
  var dateVal = dateEl.value;

  currentManagerData = {};

  // Check local memory first
  var localSource = [];
  if (typeof attendanceRecords !== 'undefined' && Array.isArray(attendanceRecords)) localSource = attendanceRecords;
  else if (typeof window.attendanceRecords !== 'undefined' && Array.isArray(window.attendanceRecords)) localSource = window.attendanceRecords;
  else if (typeof attendanceData !== 'undefined' && Array.isArray(attendanceData)) localSource = attendanceData;

  for (var m = 0; m < localSource.length; m++) {
    var recLoc = localSource[m];
    if (recLoc && recLoc.date === dateVal && recLoc.wid) {
      currentManagerData[recLoc.wid] = recLoc;
    }
  }

  // Sync from Firestore for exact date
  try {
    var dbRef = null;
    if (typeof db !== 'undefined' && db && db.collection) dbRef = db;
    else if (typeof firebase !== 'undefined' && firebase.firestore) dbRef = firebase.firestore();

    if (dbRef) {
      dbRef.collection('attendance').where('date', '==', dateVal).get().then(function(snapshot) {
        snapshot.forEach(function(doc) {
          var data = doc.data();
          if (data && data.wid) {
            currentManagerData[data.wid] = data;
          }
        });
        renderLeaveManagerTable();
      }).catch(function(err) {
        console.error("Firestore sync error:", err);
        renderLeaveManagerTable();
      });
    } else {
      renderLeaveManagerTable();
    }
  } catch(e) {
    renderLeaveManagerTable();
  }
}

// 3. Render Table
function renderLeaveManagerTable() {
  var tbody = document.getElementById('leaveManagerTableBody');
  if (!tbody) return;

  var searchInput = document.getElementById('leaveManagerSearch');
  var searchQ = searchInput ? searchInput.value.toLowerCase().trim() : '';

  if (!allAppWorkers || allAppWorkers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding:30px; text-align:center; color:#e11d48; font-weight:bold;">No workers found in database. Click Sync Live.</td></tr>';
    return;
  }

  var html = '';
  var cMan = 0, cAbs = 0, cOff = 0, cMed = 0;

  for (var i = 0; i < allAppWorkers.length; i++) {
    var w = allAppWorkers[i];
    var wid = w.id || w.wid || ('WORKER_' + i);
    var wname = w.name || 'Worker ' + wid;
    var wsec = w.sec || w.section || 'Indian';

    // Search filter
    if (searchQ && wname.toLowerCase().indexOf(searchQ) === -1 && wid.toLowerCase().indexOf(searchQ) === -1) {
      continue;
    }

    var rec = currentManagerData[wid];
    var status = rec ? rec.status : 'none';
    var payHrs = rec ? (rec.regular || 0) : 0;
    var note = rec ? (rec.note || '-') : '-';

    // Counters
    if (status === 'manual_present') cMan++;
    else if (status === 'absent') cAbs++;
    else if (status === 'company_off') cOff++;
    else if (status === 'medical_leave') cMed++;

    var bg = (i % 2 === 0) ? '#ffffff' : '#f8fafc';
    var badge = '<span style="color:#94a3b8;font-size:11px;">No Record</span>';

    if (status === 'manual_present') badge = '<span style="background:#dcfce7;color:#15803d;padding:4px 8px;border-radius:4px;font-weight:700;font-size:11px;">Manual Present</span>';
    else if (status === 'absent') badge = '<span style="background:#fee2e2;color:#b91c1c;padding:4px 8px;border-radius:4px;font-weight:700;font-size:11px;">Absent</span>';
    else if (status === 'company_off') badge = '<span style="background:#dbeafe;color:#1d4ed8;padding:4px 8px;border-radius:4px;font-weight:700;font-size:11px;">Company Off</span>';
    else if (status === 'medical_leave') badge = '<span style="background:#fef3c7;color:#b45309;padding:4px 8px;border-radius:4px;font-weight:700;font-size:11px;">Medical Leave</span>';
    else if (status === 'completed' || status === 'pending_checkout' || status === 'pending_checkin') {
      badge = '<span style="background:#e2e8f0;color:#334155;padding:4px 8px;border-radius:4px;font-weight:700;font-size:11px;">Regular Attendance</span>';
    }

    var actionUI = '';
    if (status === 'completed' || status === 'pending_checkout' || status === 'pending_checkin') {
      actionUI = '<span style="font-size:11px;color:#94a3b8;">App Check-in Active</span>';
    } else {
      actionUI = '<select onchange="handleQuickAction(this, \''+wid+'\')" style="padding:6px; border-radius:4px; border:1px solid #cbd5e1; font-size:11px; font-weight:bold; cursor:pointer; width:100%;">';
      actionUI += '<option value="">-- Set Action --</option>';
      actionUI += '<option value="manual_present">✅ Manual Present</option>';
      actionUI += '<option value="absent">❌ Absent</option>';
      actionUI += '<option value="company_off">🏢 Company Off</option>';
      actionUI += '<option value="medical_leave">🏥 Medical Leave</option>';
      if (status !== 'none') {
        actionUI += '<option value="delete_record">🗑️ Clear Record</option>';
      }
      actionUI += '</select>';
    }

    html += '<tr style="background:'+bg+';border-bottom:1px solid #e2e8f0;">';
    html += '<td style="padding:10px 12px;color:#94a3b8;">'+(i+1)+'</td>';
    html += '<td style="padding:10px 12px;"><div style="font-weight:800;color:#0f172a;">'+wname+'</div><div style="font-size:11px;color:#64748b;">'+wid+'</div></td>';
    html += '<td style="padding:10px 12px;color:#475569;font-size:12px;">'+wsec+'</td>';
    html += '<td style="padding:10px 12px;">'+badge+'</td>';
    html += '<td style="padding:10px 12px;text-align:center;font-weight:800;color:#0f172a;">'+payHrs+'h</td>';
    html += '<td style="padding:10px 12px;font-style:italic;color:#64748b;font-size:11px;max-width:150px;overflow:hidden;text-overflow:ellipsis;">'+note+'</td>';
    html += '<td style="padding:10px 12px;text-align:center;">'+actionUI+'</td>';
    html += '</tr>';
  }

  tbody.innerHTML = html;

  // Stats UI update
  if(document.getElementById('lmStatMan')) document.getElementById('lmStatMan').textContent = cMan;
  if(document.getElementById('lmStatAbs')) document.getElementById('lmStatAbs').textContent = cAbs;
  if(document.getElementById('lmStatOff')) document.getElementById('lmStatOff').textContent = cOff;
  if(document.getElementById('lmStatMed')) document.getElementById('lmStatMed').textContent = cMed;
}

// 4. Handle Action Change & Direct Firestore Save
function handleQuickAction(selectEl, wid) {
  var action = selectEl.value;
  selectEl.value = '';
  if (!action) return;

  var dateVal = document.getElementById('leaveManagerDate').value;
  if (!dateVal) { alert("Please select a date first!"); return; }

  var w = null;
  for (var i = 0; i < allAppWorkers.length; i++) {
    var curId = allAppWorkers[i].id || allAppWorkers[i].wid;
    if (curId === wid) { w = allAppWorkers[i]; break; }
  }
  if (!w) { alert("Worker details not found!"); return; }

  var recId = wid + '_' + dateVal;
  var dbRef = null;
  if (typeof db !== 'undefined' && db && db.collection) dbRef = db;
  else if (typeof firebase !== 'undefined' && firebase.firestore) dbRef = firebase.firestore();

  if (!dbRef) { alert("Database connection not ready!"); return; }

  if (action === 'delete_record') {
    if(confirm("Are you sure you want to clear this record for " + w.name + "?")) {
      dbRef.collection('attendance').doc(recId).delete().then(function() {
        delete currentManagerData[wid];
        renderLeaveManagerTable();
        if(typeof showToast === 'function') showToast('Record cleared successfully', 'success');
      });
    }
    return;
  }

  var payHrs = 0;
  var noteStr = '';

  if (action === 'manual_present') {
    payHrs = 9;
  } else if (action === 'absent') {
    payHrs = 0;
  } else if (action === 'company_off' || action === 'medical_leave') {
    var p = prompt("Enter Pay Hours (e.g., 9 for Full Pay, 4.5 for Half Pay, 0 for No Pay):", "9");
    if (p === null) return;
    payHrs = parseFloat(p) || 0;
    
    var n = prompt("Enter Reason/Note (Optional):", "");
    if (n !== null) noteStr = n;
  }

  var session = typeof getSession === 'function' ? getSession() : null;
  var adminName = session ? (session.name || session.id || 'Admin') : 'Admin';

  var payload = {
    recId: recId,
    wid: wid,
    name: w.name || '',
    sec: w.sec || w.section || 'Indian',
    shift: w.shift || 'Day',
    prof: w.prof || 'Worker',
    date: dateVal,
    status: action,
    regular: payHrs,
    compOT: 0,
    extraOT: 0,
    total: payHrs,
    ot: 0,
    checkinTime: action === 'manual_present' ? '08:00 AM' : null,
    checkoutTime: action === 'manual_present' ? '08:00 PM' : null,
    markedBy: adminName,
    markedAt: new Date().toISOString(),
    note: noteStr
  };

  dbRef.collection('attendance').doc(recId).set(payload, {merge: true}).then(function() {
    currentManagerData[wid] = payload; // Local state instant update
    renderLeaveManagerTable();        // Re-render table instantly
    if(typeof showToast === 'function') showToast(w.name + ' updated successfully!', 'success');
  }).catch(function(err) {
    alert("Save error: " + err.message);
  });
}

// 5. PDF Generator
function downloadLeaveReportFromUI() {
  var dateVal = document.getElementById('leaveManagerDate').value;
  if (!dateVal) { alert("Please select a date!"); return; }

  var reportData = [];
  for (var wid in currentManagerData) {
    if (currentManagerData.hasOwnProperty(wid)) {
      var r = currentManagerData[wid];
      var validStatus = ['manual_present', 'absent', 'company_off', 'medical_leave'];
      if (validStatus.indexOf(r.status) !== -1) {
        reportData.push(r);
      }
    }
  }

  if (reportData.length === 0) {
    alert('No Leave, Absent or Special records marked for ' + dateVal + ' to generate PDF!');
    return;
  }

  var logoSrc = '';
  try { logoSrc = localStorage.getItem('company_logo') || ''; } catch(e) {}

  var cMan = 0, cAbs = 0, cOff = 0, cMed = 0;
  for (var k = 0; k < reportData.length; k++) {
    if (reportData[k].status === 'manual_present') cMan++;
    else if (reportData[k].status === 'absent') cAbs++;
    else if (reportData[k].status === 'company_off') cOff++;
    else if (reportData[k].status === 'medical_leave') cMed++;
  }

  var html = '<div style="font-family:Arial,sans-serif;color:#1e293b;background:#fff;padding:20px;max-width:920px;margin:0 auto;">';

  // HEADER (Navy Blue)
  html += '<div style="background:#1b365d;color:#fff;padding:20px;border-radius:6px 6px 0 0;">';
  html += '<table style="width:100%;border-collapse:collapse;"><tr>';
  html += '<td style="width:130px;vertical-align:middle;">';
  html += '<div style="background:#fff;padding:8px;border-radius:4px;display:inline-block;">';
  if (logoSrc) {
    html += '<img src="' + logoSrc + '" style="max-width:110px;height:auto;display:block;" />';
  } else {
    html += '<div style="width:110px;height:50px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#1b365d;font-size:14px;">AL BOWRY</div>';
  }
  html += '</div></td>';
  html += '<td style="vertical-align:middle;padding-left:15px;">';
  html += '<h2 style="margin:0;font-size:22px;font-weight:bold;color:#fff;">AL BOWRY CARPENTRY LLC</h2>';
  html += '<p style="margin:4px 0 0 0;font-size:11px;color:#cbd5e1;">PROJECT COP31 at Antalya, Turkey | Registered: Sharjah, UAE</p>';
  html += '</td>';
  html += '<td style="text-align:right;vertical-align:top;font-size:10px;color:#94a3b8;">';
  html += '<div>www.albowry.com</div>';
  html += '<div style="margin-top:4px;">Generated: ' + new Date().toLocaleDateString('en-GB') + '</div>';
  html += '</td></tr></table>';

  html += '<div style="height:4px;background:#d97706;margin-top:15px;border-radius:2px;"></div>';
  html += '<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">';
  html += '<h3 style="margin:0;font-size:16px;color:#fff;font-weight:600;">Daily Leave & Special Attendance Report (' + dateVal + ')</h3>';
  html += '<span style="font-size:12px;color:#f59e0b;font-weight:bold;">Records: ' + reportData.length + '</span>';
  html += '</div></div>';

  // STATS
  html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;padding:12px 20px;font-size:12px;font-weight:600;">';
  html += '<span style="margin-right:18px;color:#16a34a;">● Manual Present: ' + cMan + '</span>';
  html += '<span style="margin-right:18px;color:#dc2626;">● Absent: ' + cAbs + '</span>';
  html += '<span style="margin-right:18px;color:#2563eb;">● Company Off: ' + cOff + '</span>';
  html += '<span style="margin-right:18px;color:#d97706;">● Medical Leave: ' + cMed + '</span>';
  html += '</div>';

  // TABLE
  html += '<table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:11px;">';
  html += '<thead><tr style="background:#1b365d;color:#fff;text-align:left;">';
  html += '<th style="padding:8px 10px;">Date</th><th style="padding:8px 10px;">Code</th><th style="padding:8px 10px;">Worker Name</th><th style="padding:8px 10px;">Section</th><th style="padding:8px 10px;">Status</th><th style="padding:8px 10px;text-align:center;">Pay Hrs</th><th style="padding:8px 10px;">Note</th><th style="padding:8px 10px;">Marked By</th>';
  html += '</tr></thead><tbody>';

  for (var j = 0; j < reportData.length; j++) {
    var rec = reportData[j];
    var bg = (j % 2 === 0) ? '#fff' : '#f8fafc';
    var txt = rec.status || '';
    if (txt === 'manual_present') txt = 'Manual Present';
    else if (txt === 'absent') txt = 'Absent (No Pay)';
    else if (txt === 'company_off') txt = 'Company Off';
    else if (txt === 'medical_leave') txt = 'Medical Leave';

    html += '<tr style="background:' + bg + ';border-bottom:1px solid #e2e8f0;">';
    html += '<td style="padding:8px 10px;font-weight:600;">' + (rec.date || '-') + '</td>';
    html += '<td style="padding:8px 10px;color:#475569;">' + (rec.wid || '-') + '</td>';
    html += '<td style="padding:8px 10px;font-weight:600;color:#0f172a;">' + (rec.name || '-') + '</td>';
    html += '<td style="padding:8px 10px;color:#64748b;">' + (rec.sec || '-') + '</td>';
    html += '<td style="padding:8px 10px;font-weight:700;">' + txt + '</td>';
    html += '<td style="padding:8px 10px;text-align:center;font-weight:bold;color:#0f172a;">' + (rec.regular || 0) + 'h</td>';
    html += '<td style="padding:8px 10px;font-style:italic;color:#475569;">' + (rec.note || '-') + '</td>';
    html += '<td style="padding:8px 10px;color:#64748b;">' + (rec.markedBy || 'Admin') + '</td>';
    html += '</tr>';
  }
  html += '</tbody></table>';

  html += '<div style="margin-top:28px;border-top:1px solid #cbd5e1;padding-top:10px;font-size:10px;color:#64748b;text-align:center;">';
  html += 'COP31 Attendance System • Confidential Report • AL BOWRY CARPENTRY LLC';
  html += '</div></div>';

  var win = window.open('', '_blank');
  if (!win) { alert('Allow popups in browser to print PDF'); return; }
  win.document.open();
  win.document.write('<html><head><title>Leave_Report_' + dateVal + '</title>');
  win.document.write('<style>body{margin:0;padding:12px;background:#f1f5f9;}@media print{body{background:#fff;padding:0;}}</style></head><body>');
  win.document.write(html);
  win.document.write('<script>window.onload = function() { setTimeout(function(){ window.print(); }, 500); };<\/script></body></html>');
  win.document.close();
}
