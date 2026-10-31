/* ==========================================================================
   AL BOWRY CARPENTRY LLC - LEAVE & SPECIAL STATUS (TAB + PDF)
   Rules Maintained: var only, function(){}, no arrow functions.
   ========================================================================== */

function initLeaveSection() {
  var monthInput = document.getElementById('leaveFilterMonth');
  if (monthInput && !monthInput.value) {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1);
    if (m.length < 2) m = '0' + m;
    monthInput.value = y + '-' + m;
  }
  populateLeaveWorkerDropdown();
  renderLeaveSection();
}

function populateLeaveWorkerDropdown() {
  var sel = document.getElementById('leaveFilterWorker');
  if (!sel) return;
  var current = sel.value || 'ALL';
  sel.innerHTML = '<option value="ALL">All Workers</option>';
  var list = typeof workers !== 'undefined' ? workers : [];
  for (var i = 0; i < list.length; i++) {
    var w = list[i];
    var id = w.id || w.wid || '';
    var name = w.name || id;
    var opt = document.createElement('option');
    opt.value = id;
    opt.textContent = name + ' (' + id + ')';
    sel.appendChild(opt);
  }
  sel.value = current;
}

function getLeaveRecords() {
  var all = [];
  if (typeof attendanceRecords !== 'undefined' && attendanceRecords) {
    all = attendanceRecords;
  }
  var valid = ['manual_present', 'absent', 'company_off', 'medical_leave'];
  var out = [];
  for (var i = 0; i < all.length; i++) {
    var r = all[i];
    if (r && r.status && valid.indexOf(r.status) !== -1) {
      out.push(r);
    }
  }
  return out;
}

function renderLeaveSection() {
  var monthEl = document.getElementById('leaveFilterMonth');
  var statusEl = document.getElementById('leaveFilterStatus');
  var workerEl = document.getElementById('leaveFilterWorker');
  var tbody = document.getElementById('leaveTableBody');
  if (!tbody) return;

  var monthVal = monthEl ? monthEl.value : '';
  var statusVal = statusEl ? statusEl.value : 'ALL';
  var workerVal = workerEl ? workerEl.value : 'ALL';

  var records = getLeaveRecords();
  var filtered = [];

  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    var ok = true;
    if (monthVal && r.date && r.date.indexOf(monthVal) !== 0) ok = false;
    if (statusVal !== 'ALL' && r.status !== statusVal) ok = false;
    if (workerVal !== 'ALL' && r.wid !== workerVal) ok = false;
    if (ok) filtered.push(r);
  }

  filtered.sort(function(a, b) {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  });

  // Calculate Stats
  var cMan = 0, cAbs = 0, cOff = 0, cMed = 0;
  for (var s = 0; s < filtered.length; s++) {
    if (filtered[s].status === 'manual_present') cMan++;
    else if (filtered[s].status === 'absent') cAbs++;
    else if (filtered[s].status === 'company_off') cOff++;
    else if (filtered[s].status === 'medical_leave') cMed++;
  }
  
  var elM = document.getElementById('statManualPresent');
  var elA = document.getElementById('statAbsent');
  var elO = document.getElementById('statCompanyOff');
  var elD = document.getElementById('statMedicalLeave');
  
  if (elM) elM.textContent = cMan;
  if (elA) elA.textContent = cAbs;
  if (elO) elO.textContent = cOff;
  if (elD) elD.textContent = cMed;

  // Render Table
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="padding:40px; text-align:center; color:#94a3b8;">No leave/special records found for selected filters</td></tr>';
    return;
  }

  var html = '';
  for (var j = 0; j < filtered.length; j++) {
    var rec = filtered[j];
    var bg = (j % 2 === 0) ? '#ffffff' : '#f8fafc';
    var badge = '';
    
    if (rec.status === 'manual_present') badge = '<span style="background:#dcfce7;color:#15803d;padding:3px 8px;border-radius:4px;font-weight:700;font-size:11px;">Manual Present</span>';
    else if (rec.status === 'absent') badge = '<span style="background:#fee2e2;color:#b91c1c;padding:3px 8px;border-radius:4px;font-weight:700;font-size:11px;">Absent</span>';
    else if (rec.status === 'company_off') badge = '<span style="background:#dbeafe;color:#1d4ed8;padding:3px 8px;border-radius:4px;font-weight:700;font-size:11px;">Company Off</span>';
    else if (rec.status === 'medical_leave') badge = '<span style="background:#fef3c7;color:#b45309;padding:3px 8px;border-radius:4px;font-weight:700;font-size:11px;">Medical Leave</span>';

    html += '<tr style="background:' + bg + ';border-bottom:1px solid #e2e8f0;">';
    html += '<td style="padding:10px 12px;color:#94a3b8;">' + (j + 1) + '</td>';
    html += '<td style="padding:10px 12px;font-weight:600;">' + (rec.date || '-') + '</td>';
    html += '<td style="padding:10px 12px;"><div style="font-weight:700;color:#0f172a;">' + (rec.name || '-') + '</div><div style="font-size:11px;color:#64748b;">' + (rec.wid || '') + '</div></td>';
    html += '<td style="padding:10px 12px;color:#475569;">' + (rec.sec || '-') + '</td>';
    html += '<td style="padding:10px 12px;">' + badge + '</td>';
    html += '<td style="padding:10px 12px;text-align:center;font-weight:800;">' + (rec.regular || 0) + 'h</td>';
    html += '<td style="padding:10px 12px;color:#334155;font-style:italic;">' + (rec.note || '-') + '</td>';
    html += '<td style="padding:10px 12px;color:#64748b;font-size:12px;">' + (rec.markedBy || 'Admin') + '</td>';
    html += '</tr>';
  }
  tbody.innerHTML = html;
}

/* ================== PDF GENERATOR ================== */
function downloadLeaveReportFromUI() {
  var monthEl = document.getElementById('leaveFilterMonth');
  var statusEl = document.getElementById('leaveFilterStatus');
  var workerEl = document.getElementById('leaveFilterWorker');
  
  var monthVal = monthEl && monthEl.value ? monthEl.value : '';
  var statusVal = statusEl ? statusEl.value : 'ALL';
  var workerVal = workerEl ? workerEl.value : 'ALL';
  
  generateLeavePDF(monthVal, workerVal, statusVal);
}

function generateLeavePDF(selectedMonth, targetWid, targetStatus) {
  var records = getLeaveRecords();
  var filtered = [];
  
  for (var i = 0; i < records.length; i++) {
    var r = records[i];
    var ok = true;
    if (selectedMonth && r.date && r.date.indexOf(selectedMonth) !== 0) ok = false;
    if (targetWid && targetWid !== 'ALL' && r.wid !== targetWid) ok = false;
    if (targetStatus && targetStatus !== 'ALL' && r.status !== targetStatus) ok = false;
    if (ok) filtered.push(r);
  }

  if (filtered.length === 0) {
    if (typeof showToast === 'function') showToast('No records found for PDF!', 'warning');
    else alert('No records found for PDF!');
    return;
  }

  filtered.sort(function(a, b) {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  });

  var logoSrc = '';
  try { logoSrc = localStorage.getItem('company_logo') || ''; } catch(e) {}

  var cMan = 0, cAbs = 0, cOff = 0, cMed = 0;
  for (var k = 0; k < filtered.length; k++) {
    if (filtered[k].status === 'manual_present') cMan++;
    else if (filtered[k].status === 'absent') cAbs++;
    else if (filtered[k].status === 'company_off') cOff++;
    else if (filtered[k].status === 'medical_leave') cMed++;
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
  html += '<h3 style="margin:0;font-size:16px;color:#fff;font-weight:600;">Leave & Special Attendance Report' + (selectedMonth ? ' — ' + selectedMonth : '') + '</h3>';
  html += '<span style="font-size:12px;color:#f59e0b;font-weight:bold;">Records: ' + filtered.length + '</span>';
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
  html += '<th style="padding:8px 10px;">Date</th><th style="padding:8px 10px;">Code</th><th style="padding:8px 10px;">Worker</th><th style="padding:8px 10px;">Section</th><th style="padding:8px 10px;">Status</th><th style="padding:8px 10px;text-align:center;">Pay Hrs</th><th style="padding:8px 10px;">Note / Reason</th><th style="padding:8px 10px;">Marked By</th>';
  html += '</tr></thead><tbody>';

  for (var j = 0; j < filtered.length; j++) {
    var rec = filtered[j];
    var bg = (j % 2 === 0) ? '#fff' : '#f8fafc';
    var txt = rec.status || '';
    if (txt === 'manual_present') txt = 'Manual Present';
    else if (txt === 'absent') txt = 'Absent (No Pay)';
    else if (txt === 'company_off') txt = 'Company Off';
    else if (txt === 'medical_leave') txt = 'Medical Leave';

    html += '<tr style="background:' + bg + ';border-bottom:1px solid #e2e8f0;">';
    html += '<td style="padding:8px 10px;font-weight:600;">' + (rec.date || '-') + '</td>';
    html += '<td style="padding:8px 10px;color:#475569;">' + (rec.wid || '-') + '</td>';
    html += '<td style="padding:8px 10px;font-weight:600;">' + (rec.name || '-') + '</td>';
    html += '<td style="padding:8px 10px;color:#64748b;">' + (rec.sec || '-') + '</td>';
    html += '<td style="padding:8px 10px;font-weight:700;">' + txt + '</td>';
    html += '<td style="padding:8px 10px;text-align:center;font-weight:bold;">' + (rec.regular || 0) + 'h</td>';
    html += '<td style="padding:8px 10px;font-style:italic;color:#334155;">' + (rec.note || '-') + '</td>';
    html += '<td style="padding:8px 10px;color:#64748b;">' + (rec.markedBy || 'Admin') + '</td>';
    html += '</tr>';
  }
  html += '</tbody></table>';

  html += '<div style="margin-top:28px;border-top:1px solid #cbd5e1;padding-top:10px;font-size:10px;color:#64748b;text-align:center;">';
  html += 'COP31 Attendance System • Confidential Report • AL BOWRY CARPENTRY LLC';
  html += '</div></div>';

  var win = window.open('', '_blank');
  if (!win) { alert('Allow popups to print PDF'); return; }
  win.document.write('<html><head><title>Leave_Report_' + (selectedMonth || 'All') + '</title>');
  win.document.write('<style>body{margin:0;padding:12px;background:#f1f5f9;}@media print{body{background:#fff;padding:0;}}</style></head><body>');
  win.document.write(html);
  win.document.write('<script>setTimeout(function(){window.print();},600);<\/script></body></html>');
  win.document.close();
}

/* Auto-run when the section is shown */
(function() {
  var originalShow = window.showSection;
  if (typeof originalShow === 'function') {
    window.showSection = function(secId) {
      originalShow(secId);
      if (secId === 'secLeave') {
        setTimeout(function() { initLeaveSection(); }, 100);
      }
    };
  }
})();
