// ========== HISTORY & BACKDATED ENTRY MODULE ==========

// Load History Section
function loadHistorySection() {
  populateHistoryWorkerDD();
  const dateInput = document.getElementById('historyDate');
  if (dateInput && !dateInput.value) dateInput.value = tD();
  loadHistoryForDate();
}

// Populate worker dropdown for history
function populateHistoryWorkerDD() {
  const sel = document.getElementById('historyWorker');
  if (!sel) return;
  const w = gW().filter(x => x.on).sort((a, b) => a.name.localeCompare(b.name));
  let h = '<option value="">— Select Worker for Backdated Entry —</option>';
  const ind = w.filter(x => x.sec === 'Indian');
  const pak = w.filter(x => x.sec === 'Pakistani');
  if (ind.length) {
    h += '<optgroup label="🇮🇳 Indian Workers">';
    ind.forEach(x => h += `<option value="${x.wid}">${x.name} (${x.prof || '-'})</option>`);
    h += '</optgroup>';
  }
  if (pak.length) {
    h += '<optgroup label="🇵🇰 Pakistani Workers">';
    pak.forEach(x => h += `<option value="${x.wid}">${x.name}</option>`);
    h += '</optgroup>';
  }
  sel.innerHTML = h;
}

// Add Backdated Entry (Complete - Check-in + Check-out together)
async function addBackdatedEntry() {
  const wid = document.getElementById('historyWorker').value;
  const date = document.getElementById('historyEntryDate').value;
  const shift = document.getElementById('historyShift').value;
  const checkinTime = document.getElementById('historyCheckIn').value;
  const checkoutTime = document.getElementById('historyCheckOut').value;
  
  if (!wid) return toast('Select worker', 'err');
  if (!date) return toast('Select date', 'err');
  if (!shift) return toast('Select shift', 'err');
  if (!checkinTime) return toast('Enter check-in time', 'err');
  if (!checkoutTime) return toast('Enter check-out time', 'err');
  
  const worker = gW().find(x => x.wid === wid);
  
  // Check if entry already exists
  const existing = gA().find(a => a.wid === wid && a.date === date);
  if (existing) {
    if (!confirm(`⚠️ ${worker.name} already has an entry for ${date}. Replace it?`)) return;
    await FB.del(COL.A, existing.id);
  }
  
  const checkinISO = new Date(date + 'T' + checkinTime + ':00').toISOString();
  const checkoutISO = new Date(date + 'T' + checkoutTime + ':00').toISOString();
  
  // Handle night shift (if checkout is next day)
  let finalCheckoutISO = checkoutISO;
  if (new Date(checkoutISO) <= new Date(checkinISO)) {
    // If checkout time is earlier than check-in, add 1 day (night shift crossover)
    const cd = new Date(checkoutISO);
    cd.setDate(cd.getDate() + 1);
    finalCheckoutISO = cd.toISOString();
  }
  
  const c = calcHours(checkinISO, finalCheckoutISO);
  const recId = 'att_' + Date.now() + '_' + wid + '_backdated';
  
  await FB.save(COL.A, recId, {
    recId: recId,
    wid: wid,
    name: worker.name,
    prof: worker.prof,
    sec: worker.sec,
    shift: shift,
    date: date,
    checkinReqTime: checkinISO,
    checkinTime: checkinISO,
    checkoutReqTime: finalCheckoutISO,
    checkoutTime: finalCheckoutISO,
    total: c.total,
    regular: c.regular,
    compOT: c.compOT,
    extraOT: c.extraOT,
    ot: c.ot,
    status: 'completed',
    backdated: true
  });
  
  toast('✅ Backdated entry added: ' + worker.name + ' | ' + c.total.toFixed(2) + 'h');
  
  // Reset form
  document.getElementById('historyWorker').value = '';
  document.getElementById('historyCheckIn').value = '08:00';
  document.getElementById('historyCheckOut').value = '20:00';
  
  // Refresh view if same date is selected
  const viewDate = document.getElementById('historyDate').value;
  if (viewDate === date) loadHistoryForDate();
}

// Load history for selected date
function loadHistoryForDate() {
  const date = document.getElementById('historyDate').value;
  const filter = document.getElementById('historyFilter').value;
  
  if (!date) return;
  
  let att = gA().filter(a => a.date === date);
  const allWorkers = gW().filter(w => w.on);
  
  // Apply filter
  if (filter === 'Day') att = att.filter(a => a.shift === 'Day' || !a.shift);
  else if (filter === 'Night') att = att.filter(a => a.shift === 'Night');
  else if (filter === 'Indian') att = att.filter(a => a.sec === 'Indian');
  else if (filter === 'Pakistani') att = att.filter(a => a.sec === 'Pakistani');
  else if (filter === 'Present') att = att.filter(a => a.status === 'completed' || a.status === 'checked_in');
  else if (filter === 'Absent') {
    // Show absent workers
    const attWids = att.map(a => a.wid);
    const absentWorkers = allWorkers.filter(w => !attWids.includes(w.wid));
    
    const el = document.getElementById('historyContent');
    if (!absentWorkers.length) {
      el.innerHTML = '<div class="empty"><div class="em-icon">✅</div><h3>All workers were present!</h3></div>';
      return;
    }
    
    // Header stats
    const statsHTML = `
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:20px;border-radius:12px;margin-bottom:20px">
        <h3 style="font-size:20px;margin-bottom:8px">📅 ${date}</h3>
        <p style="opacity:.9">Absent Workers: ${absentWorkers.length} / ${allWorkers.length}</p>
      </div>
    `;
    
    el.innerHTML = statsHTML + `<div class="t-wrap"><table>
      <thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Default Shift</th><th>Status</th></tr></thead>
      <tbody>${absentWorkers.map((w, i) => `<tr>
        <td>${i + 1}</td>
        <td><b>${w.name}</b></td>
        <td>${w.prof || '-'}</td>
        <td><span class="tag tag-${w.sec === 'Indian' ? 'ind' : 'pak'}">${w.sec === 'Indian' ? '🇮🇳' : '🇵🇰'} ${w.sec}</span></td>
        <td><span class="tag ${w.shift === 'Night' ? 'tag-o' : 'tag-b'}">${w.shift === 'Night' ? '🌙 Night' : '☀️ Day'}</span></td>
        <td><span class="tag tag-r">❌ Absent</span></td>
      </tr>`).join('')}</tbody>
    </table></div>`;
    return;
  }
  
  const el = document.getElementById('historyContent');
  if (!el) return;
  
  // Calculate stats
  const totalWorkers = allWorkers.length;
  const present = att.filter(a => a.status === 'completed' || a.status === 'checked_in').length;
  const absent = totalWorkers - att.length;
  const totalHours = att.reduce((s, a) => s + (a.total || 0), 0);
  const totalOT = att.reduce((s, a) => s + (a.ot || 0), 0);
  const dayShift = att.filter(a => a.shift === 'Day' || !a.shift).length;
  const nightShift = att.filter(a => a.shift === 'Night').length;
  
  // Header with stats
  const statsHTML = `
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:24px;border-radius:14px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px">
        <div>
          <h3 style="font-size:22px;margin-bottom:4px">📅 ${date}</h3>
          <p style="opacity:.9;font-size:13px">${new Date(date).toLocaleDateString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-success btn-sm" onclick="downloadHistoryPDF()">📕 PDF</button>
          <button class="btn btn-outline btn-sm" onclick="downloadHistoryExcel()" style="background:#fff;color:#1e40af">📥 Excel</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">
        <div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center">
          <div style="font-size:24px;font-weight:800">${att.length}</div>
          <div style="font-size:11px;opacity:.9">Total Records</div>
        </div>
        <div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center">
          <div style="font-size:24px;font-weight:800">${present}</div>
          <div style="font-size:11px;opacity:.9">Present</div>
        </div>
        <div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center">
          <div style="font-size:24px;font-weight:800">${absent}</div>
          <div style="font-size:11px;opacity:.9">Absent</div>
        </div>
        <div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center">
          <div style="font-size:24px;font-weight:800">☀️ ${dayShift}</div>
          <div style="font-size:11px;opacity:.9">Day Shift</div>
        </div>
        <div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center">
          <div style="font-size:24px;font-weight:800">🌙 ${nightShift}</div>
          <div style="font-size:11px;opacity:.9">Night Shift</div>
        </div>
        <div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center">
          <div style="font-size:24px;font-weight:800">${totalHours.toFixed(1)}h</div>
          <div style="font-size:11px;opacity:.9">Total Hours</div>
        </div>
        <div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center">
          <div style="font-size:24px;font-weight:800">${totalOT.toFixed(1)}h</div>
          <div style="font-size:11px;opacity:.9">Total OT</div>
        </div>
      </div>
    </div>
  `;
  
  if (!att.length) {
    el.innerHTML = statsHTML + '<div class="empty"><div class="em-icon">📋</div><h3>No records for ' + date + '</h3><p>Use "Add Backdated Entry" above to add missing data</p></div>';
    return;
  }
  
  const stg = s => ({
    completed: '<span class="tag tag-g">✓ Completed</span>',
    checked_in: '<span class="tag tag-b">🟢 Working</span>',
    pending_checkin: '<span class="tag tag-o">⏳ Pending IN</span>',
    pending_checkout: '<span class="tag tag-o">⏳ Pending OUT</span>'
  }[s] || s);
  
  el.innerHTML = statsHTML + `<div class="t-wrap"><table>
    <thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${att.map((a, i) => `<tr>
      <td>${i + 1}</td>
      <td><b>${a.name}</b>${a.backdated ? ' <span class="tag tag-o" style="font-size:9px">📝 Manual</span>' : ''}</td>
      <td>${a.prof || '-'}</td>
      <td><span class="tag tag-${a.sec === 'Indian' ? 'ind' : 'pak'}">${a.sec === 'Indian' ? '🇮🇳' : '🇵🇰'}</span></td>
      <td><span class="tag ${a.shift === 'Night' ? 'tag-o' : 'tag-b'}">${a.shift === 'Night' ? '🌙 Night' : '☀️ Day'}</span></td>
      <td style="color:#059669">${fT(a.checkinTime)}</td>
      <td style="color:#dc2626">${fT(a.checkoutTime)}</td>
      <td style="color:var(--p);font-weight:700">${(a.total || 0).toFixed(2)}h</td>
      <td>${(a.regular || 0).toFixed(2)}h</td>
      <td style="color:#d97706">${(a.compOT || 0).toFixed(2)}h</td>
      <td style="color:#dc2626;font-weight:700">${(a.extraOT || 0) > 0 ? (a.extraOT).toFixed(2) + 'h' : '-'}</td>
      <td>${stg(a.status)}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editHistoryEntry('${a.id}')" title="Edit">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteHistoryEntry('${a.id}')" title="Delete">🗑️</button>
      </td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// Edit history entry
function editHistoryEntry(id) {
  const rec = gA().find(a => a.id === id);
  if (!rec) return;
  
  // Fill the form
  document.getElementById('historyWorker').value = rec.wid;
  document.getElementById('historyEntryDate').value = rec.date;
  document.getElementById('historyShift').value = rec.shift || 'Day';
  
  const inTime = new Date(rec.checkinTime).toLocaleTimeString('en-GB', {timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit'});
  const outTime = new Date(rec.checkoutTime).toLocaleTimeString('en-GB', {timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit'});
  
  document.getElementById('historyCheckIn').value = inTime;
  document.getElementById('historyCheckOut').value = outTime;
  
  // Scroll to top
  window.scrollTo({top: 0, behavior: 'smooth'});
  toast('✏️ Edit form filled - Update times and click "Add/Update Entry"', 'info');
}

// Delete history entry
function deleteHistoryEntry(id) {
  const rec = gA().find(a => a.id === id);
  if (!rec) return;
  confirmDlg('Delete Entry?', `Delete ${rec.name}'s entry for ${rec.date}?`, async () => {
    await FB.del(COL.A, id);
    toast('🗑️ Entry deleted', 'info');
    loadHistoryForDate();
  });
}

// Download History as PDF for selected date
function downloadHistoryPDF() {
  const date = document.getElementById('historyDate').value;
  const filter = document.getElementById('historyFilter').value;
  if (!date) return toast('Select date', 'err');
  if (!window.jspdf) return toast('Loading...', 'err');
  
  let att = gA().filter(a => a.date === date);
  if (filter === 'Day') att = att.filter(a => a.shift === 'Day' || !a.shift);
  else if (filter === 'Night') att = att.filter(a => a.shift === 'Night');
  else if (filter === 'Indian') att = att.filter(a => a.sec === 'Indian');
  else if (filter === 'Pakistani') att = att.filter(a => a.sec === 'Pakistani');
  
  if (!att.length) return toast('No data for this date', 'err');
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l');
  
  // Header with logo
  addPDFHeader(doc, `Daily Attendance - ${date}`, `${filter || 'All Workers'} | Reg: 9h + Comp OT: 3h`, 297);
  
  // Stats summary
  const totalWorkers = gW().filter(w => w.on).length;
  const present = att.filter(a => a.status === 'completed' || a.status === 'checked_in').length;
  const totalHours = att.reduce((s, a) => s + (a.total || 0), 0);
  const totalOT = att.reduce((s, a) => s + (a.ot || 0), 0);
  const dayShift = att.filter(a => a.shift === 'Day' || !a.shift).length;
  const nightShift = att.filter(a => a.shift === 'Night').length;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Total: ${att.length} | Present: ${present} | Absent: ${totalWorkers - att.length} | ☀️ Day: ${dayShift} | 🌙 Night: ${nightShift} | Hours: ${totalHours.toFixed(2)}h | OT: ${totalOT.toFixed(2)}h`, 148.5, 48, {align: 'center'});
  
  const rows = att.map((a, i) => [
    i + 1,
    a.name,
    a.prof || '-',
    a.sec,
    a.shift || 'Day',
    fT(a.checkinTime),
    fT(a.checkoutTime),
    (a.total || 0).toFixed(2),
    (a.regular || 0).toFixed(2),
    (a.compOT || 0).toFixed(2),
    (a.extraOT || 0).toFixed(2)
  ]);
  
  // Add totals row
  rows.push([
    '', '', 'TOTALS', '', '', '', '',
    totalHours.toFixed(2),
    att.reduce((s, a) => s + (a.regular || 0), 0).toFixed(2),
    att.reduce((s, a) => s + (a.compOT || 0), 0).toFixed(2),
    att.reduce((s, a) => s + (a.extraOT || 0), 0).toFixed(2)
  ]);
  
  doc.autoTable({
    startY: 55,
    head: [['#', 'Name', 'Work', 'Country', 'Shift', 'In', 'Out', 'Total', 'Reg 9h', 'OT 3h', 'Extra']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175] },
    alternateRowStyles: { fillColor: [240, 249, 255] },
    styles: { fontSize: 8 }
  });
  
  // Footer on each page
  const pc = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pc; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`© ${CURRENT_YEAR} AL BOWRY Carpentry | Antalya, Turkey | Page ${i}/${pc}`, 148.5, 200, {align: 'center'});
  }
  
  doc.save(`AlBowry_${date}_${filter || 'All'}.pdf`);
  toast('✅ PDF downloaded!');
}

// Download History as Excel
function downloadHistoryExcel() {
  const date = document.getElementById('historyDate').value;
  const filter = document.getElementById('historyFilter').value;
  if (!date) return toast('Select date', 'err');
  
  let att = gA().filter(a => a.date === date);
  if (filter === 'Day') att = att.filter(a => a.shift === 'Day' || !a.shift);
  else if (filter === 'Night') att = att.filter(a => a.shift === 'Night');
  else if (filter === 'Indian') att = att.filter(a => a.sec === 'Indian');
  else if (filter === 'Pakistani') att = att.filter(a => a.sec === 'Pakistani');
  
  if (!att.length) return toast('No data', 'err');
  
  const totalHours = att.reduce((s, a) => s + (a.total || 0), 0);
  const totalOT = att.reduce((s, a) => s + (a.ot || 0), 0);
  const dayShift = att.filter(a => a.shift === 'Day' || !a.shift).length;
  const nightShift = att.filter(a => a.shift === 'Night').length;
  
  const logoHTML = LOGO_BASE64 ? `<img src="${LOGO_BASE64}" width="50" height="50">` : '<b style="font-size:30px;color:#1e40af">A</b>';
  
  let html = `<html><head><meta charset="UTF-8"><style>
    table{border-collapse:collapse;font-family:Arial}
    th{background:#1e40af;color:#fff;padding:10px;border:1px solid #1e3a8a;font-size:11px}
    td{padding:8px;border:1px solid #ccc;font-size:11px}
    .e{background:#f0f9ff}
  </style></head><body>
  <table border="1">
    <tr><td colspan="12" style="background:#1e40af;color:#fff;padding:16px">
      <table style="border:none;width:100%">
        <tr>
          <td style="border:none;width:60px">${logoHTML}</td>
          <td style="border:none;text-align:center">
            <div style="font-size:24px;font-weight:bold">AL BOWRY CARPENTRY</div>
            <div style="font-size:11px">Antalya, Turkey | albowry.com</div>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td colspan="12" style="background:#dbeafe;text-align:center;padding:10px;font-weight:bold;font-size:14px">
      Daily Attendance Report - ${date} | ${filter || 'All Workers'}
    </td></tr>
    <tr><td colspan="12" style="background:#eff6ff;text-align:center;padding:8px;font-size:11px">
      Records: ${att.length} | ☀️ Day: ${dayShift} | 🌙 Night: ${nightShift} | Hours: ${totalHours.toFixed(2)}h | OT: ${totalOT.toFixed(2)}h
    </td></tr>
    <tr><td colspan="12"></td></tr>
    <tr>
      <th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th>
      <th>Check-In</th><th>Check-Out</th><th>Total</th><th>Reg 9h</th><th>OT 3h</th><th>Extra OT</th><th>Status</th>
    </tr>
    ${att.map((a, i) => `<tr class="${i % 2 === 0 ? 'e' : ''}">
      <td>${i + 1}</td>
      <td><b>${a.name}</b>${a.backdated ? ' (Manual)' : ''}</td>
      <td>${a.prof || '-'}</td>
      <td>${a.sec}</td>
      <td>${a.shift || 'Day'}</td>
      <td>${fT(a.checkinTime)}</td>
      <td>${fT(a.checkoutTime)}</td>
      <td><b>${(a.total || 0).toFixed(2)}</b></td>
      <td>${(a.regular || 0).toFixed(2)}</td>
      <td>${(a.compOT || 0).toFixed(2)}</td>
      <td>${(a.extraOT || 0).toFixed(2)}</td>
      <td>${a.status}</td>
    </tr>`).join('')}
    <tr style="background:#dbeafe;font-weight:bold">
      <td colspan="7" style="text-align:right">TOTALS:</td>
      <td>${totalHours.toFixed(2)}</td>
      <td>${att.reduce((s, a) => s + (a.regular || 0), 0).toFixed(2)}</td>
      <td>${att.reduce((s, a) => s + (a.compOT || 0), 0).toFixed(2)}</td>
      <td>${att.reduce((s, a) => s + (a.extraOT || 0), 0).toFixed(2)}</td>
      <td></td>
    </tr>
    <tr><td colspan="12"></td></tr>
    <tr><td colspan="12" style="background:#1e40af;color:#fff;text-align:center;padding:10px">
      © ${CURRENT_YEAR} AL BOWRY Carpentry | Antalya, Turkey
    </td></tr>
  </table>
  </body></html>`;
  
  const b = new Blob([html], { type: 'application/vnd.ms-excel' });
  const l = document.createElement('a');
  l.href = URL.createObjectURL(b);
  l.download = `AlBowry_${date}_${filter || 'All'}.xls`;
  l.click();
  toast('✅ Excel downloaded!');
}

// Bulk backdated entry for multiple workers at same date
async function bulkBackdatedEntry() {
  const date = document.getElementById('bulkBackdateDate').value;
  const shift = document.getElementById('bulkBackdateShift').value;
  const checkinTime = document.getElementById('bulkBackdateIn').value;
  const checkoutTime = document.getElementById('bulkBackdateOut').value;
  const filter = document.getElementById('bulkBackdateFilter').value;
  
  if (!date) return toast('Select date', 'err');
  if (!shift) return toast('Select shift', 'err');
  if (!checkinTime || !checkoutTime) return toast('Enter times', 'err');
  
  let workers = gW().filter(w => w.on);
  if (filter === 'Indian') workers = workers.filter(w => w.sec === 'Indian');
  else if (filter === 'Pakistani') workers = workers.filter(w => w.sec === 'Pakistani');
  
  // Filter out workers who already have entry for this date
  const existingWids = gA().filter(a => a.date === date).map(a => a.wid);
  const toAdd = workers.filter(w => !existingWids.includes(w.wid));
  
  if (!toAdd.length) return toast('All workers already have entries for this date', 'info');
  
  confirmDlg(
    'Bulk Add Backdated Entries?',
    `Add ${toAdd.length} entries for ${date} in ${shift} shift?`,
    async () => {
      const checkinISO = new Date(date + 'T' + checkinTime + ':00').toISOString();
      const checkoutISO = new Date(date + 'T' + checkoutTime + ':00').toISOString();
      
      let finalCheckoutISO = checkoutISO;
      if (new Date(checkoutISO) <= new Date(checkinISO)) {
        const cd = new Date(checkoutISO);
        cd.setDate(cd.getDate() + 1);
        finalCheckoutISO = cd.toISOString();
      }
      
      const c = calcHours(checkinISO, finalCheckoutISO);
      
      for (const w of toAdd) {
        const recId = 'att_' + Date.now() + '_' + w.wid + '_bulk' + Math.random();
        await FB.save(COL.A, recId, {
          recId: recId,
          wid: w.wid,
          name: w.name,
          prof: w.prof,
          sec: w.sec,
          shift: shift,
          date: date,
          checkinReqTime: checkinISO,
          checkinTime: checkinISO,
          checkoutReqTime: finalCheckoutISO,
          checkoutTime: finalCheckoutISO,
          total: c.total,
          regular: c.regular,
          compOT: c.compOT,
          extraOT: c.extraOT,
          ot: c.ot,
          status: 'completed',
          backdated: true
        });
      }
      
      toast(`✅ Added ${toAdd.length} entries for ${date}!`);
      loadHistoryForDate();
    }
  );
}

console.log('📅 History Module Loaded!');
