// ========== MANUAL ATTENDANCE MODULE ==========
function loadManualSection() {
  populateManualWorkerDD();
  populateManualCustomDD();
  loadManualToday();
  setDefaultManualDate();
}

function populateManualWorkerDD() {
  const sel = document.getElementById('manualWorker');
  if (!sel) return;
  const cv = sel.value;
  const w = gW().filter(x => x.on).sort((a, b) => a.name.localeCompare(b.name));
  let h = '<option value="">— Select Worker —</option>';
  const ind = w.filter(x => x.sec === 'Indian');
  const pak = w.filter(x => x.sec === 'Pakistani');
  if (ind.length) {
    h += '<optgroup label="🇮🇳 Indian Workers">';
    ind.forEach(x => h += `<option value="${x.wid}">${x.name} — ${x.prof}</option>`);
    h += '</optgroup>';
  }
  if (pak.length) {
    h += '<optgroup label="🇵🇰 Pakistani Workers">';
    pak.forEach(x => h += `<option value="${x.wid}">${x.name} — ${x.prof}</option>`);
    h += '</optgroup>';
  }
  sel.innerHTML = h;
  if (cv) sel.value = cv;
}

function populateManualCustomDD() {
  const sel = document.getElementById('manualCustomWorker');
  if (!sel) return;
  const main = document.getElementById('manualWorker');
  if (main) sel.innerHTML = main.innerHTML;
}

async function manualQuickCheckIn() {
  const wid = document.getElementById('manualWorker').value;
  if (!wid) return toast('Select worker first', 'err');
  const worker = gW().find(x => x.wid === wid);
  const today = tD();
  const existing = gA().find(a => a.wid === wid && a.date === today);
  
  if (existing) {
    if (existing.status === 'checked_in') return toast(worker.name + ' already checked in!', 'err');
    if (existing.status === 'completed') return toast(worker.name + ' already completed today', 'err');
    if (existing.status === 'pending_checkin') {
      const updated = { ...existing };
      updated.checkinTime = existing.checkinReqTime;
      updated.status = 'checked_in';
      await FB.save(COL.A, existing.id, updated);
      toast('✅ ' + worker.name + ' check-in approved!');
      return;
    }
  }
  
  const now = new Date().toISOString();
  const recId = 'att_' + Date.now() + '_' + wid;
  
  await FB.save(COL.A, recId, {
    recId: recId, wid: wid, name: worker.name, prof: worker.prof, sec: worker.sec,
    date: today, checkinReqTime: now, checkinTime: now,
    checkoutReqTime: null, checkoutTime: null,
    total: 0, regular: 0, ot: 0, status: 'checked_in'
  });
  
  toast('✅ ' + worker.name + ' checked in!');
  document.getElementById('manualWorker').value = '';
}

async function manualQuickCheckOut() {
  const wid = document.getElementById('manualWorker').value;
  if (!wid) return toast('Select worker first', 'err');
  const worker = gW().find(x => x.wid === wid);
  const today = tD();
  const rec = gA().find(a => a.wid === wid && a.date === today);
  
  if (!rec) return toast(worker.name + ' has not checked in today', 'err');
  if (rec.status === 'completed') return toast(worker.name + ' already checked out', 'err');
  if (rec.status === 'pending_checkin') return toast('Check-in first!', 'err');
  
  if (rec.status === 'pending_checkout') {
    const updated = { ...rec };
    updated.checkoutTime = rec.checkoutReqTime;
    const hrs = (new Date(updated.checkoutTime) - new Date(updated.checkinTime)) / 36e5;
    updated.total = Math.round(hrs * 100) / 100;
    updated.regular = Math.round(Math.min(hrs, REG_HOURS) * 100) / 100;
    updated.ot = Math.max(0, Math.round((hrs - REG_HOURS) * 100) / 100);
    updated.status = 'completed';
    await FB.save(COL.A, rec.id, updated);
    toast('✅ ' + worker.name + ' checkout approved! ' + updated.total.toFixed(2) + 'h');
    return;
  }
  
  const now = new Date().toISOString();
  const updated = { ...rec };
  updated.checkoutReqTime = now;
  updated.checkoutTime = now;
  const hrs = (new Date(now) - new Date(rec.checkinTime)) / 36e5;
  updated.total = Math.round(hrs * 100) / 100;
  updated.regular = Math.round(Math.min(hrs, REG_HOURS) * 100) / 100;
  updated.ot = Math.max(0, Math.round((hrs - REG_HOURS) * 100) / 100);
  updated.status = 'completed';
  
  await FB.save(COL.A, rec.id, updated);
  toast('✅ ' + worker.name + ' checked out! Total: ' + updated.total.toFixed(2) + 'h');
  document.getElementById('manualWorker').value = '';
}

async function manualCustomCheckIn() {
  const wid = document.getElementById('manualCustomWorker').value;
  const date = document.getElementById('manualDate').value;
  const time = document.getElementById('manualCheckInTime').value;
  
  if (!wid) return toast('Select worker', 'err');
  if (!date) return toast('Select date', 'err');
  if (!time) return toast('Select check-in time', 'err');
  
  const worker = gW().find(x => x.wid === wid);
  const existing = gA().find(a => a.wid === wid && a.date === date);
  
  if (existing && (existing.status === 'checked_in' || existing.status === 'completed')) {
    return toast(worker.name + ' already has record for ' + date, 'err');
  }
  
  const checkinDate = new Date(date + 'T' + time + ':00');
  const now = checkinDate.toISOString();
  const recId = 'att_' + Date.now() + '_' + wid;
  
  await FB.save(COL.A, recId, {
    recId: recId, wid: wid, name: worker.name, prof: worker.prof, sec: worker.sec,
    date: date, checkinReqTime: now, checkinTime: now,
    checkoutReqTime: null, checkoutTime: null,
    total: 0, regular: 0, ot: 0, status: 'checked_in'
  });
  
  toast('✅ ' + worker.name + ' checked in for ' + date + ' at ' + time);
}

async function manualCustomCheckOut() {
  const wid = document.getElementById('manualCustomWorker').value;
  const date = document.getElementById('manualDate').value;
  const time = document.getElementById('manualCheckOutTime').value;
  
  if (!wid) return toast('Select worker', 'err');
  if (!date) return toast('Select date', 'err');
  if (!time) return toast('Select check-out time', 'err');
  
  const worker = gW().find(x => x.wid === wid);
  const rec = gA().find(a => a.wid === wid && a.date === date);
  
  if (!rec) return toast(worker.name + ' has no check-in for ' + date, 'err');
  if (rec.status === 'completed') return toast('Already completed for ' + date, 'err');
  if (rec.status !== 'checked_in' && rec.status !== 'pending_checkout') return toast('Check-in first!', 'err');
  
  const checkoutDate = new Date(date + 'T' + time + ':00');
  const checkoutISO = checkoutDate.toISOString();
  
  const updated = { ...rec };
  updated.checkoutReqTime = checkoutISO;
  updated.checkoutTime = checkoutISO;
  const hrs = (new Date(checkoutISO) - new Date(rec.checkinTime)) / 36e5;
  updated.total = Math.round(hrs * 100) / 100;
  updated.regular = Math.round(Math.min(hrs, REG_HOURS) * 100) / 100;
  updated.ot = Math.max(0, Math.round((hrs - REG_HOURS) * 100) / 100);
  updated.status = 'completed';
  
  await FB.save(COL.A, rec.id, updated);
  toast('✅ ' + worker.name + ' checked out. Total: ' + updated.total.toFixed(2) + 'h');
}

async function bulkCheckInAll() {
  const sec = document.getElementById('bulkSection').value;
  let workers = gW().filter(w => w.on);
  if (sec) workers = workers.filter(w => w.sec === sec);
  
  const today = tD();
  const todayAtt = gA().filter(a => a.date === today);
  const notCheckedIn = workers.filter(w => !todayAtt.find(a => a.wid === w.wid));
  
  if (!notCheckedIn.length) return toast('All workers already checked in!', 'info');
  
  confirmDlg('Bulk Check-In?', `Check in ${notCheckedIn.length} workers now? (${sec || 'All'})`, async () => {
    const now = new Date().toISOString();
    for (const w of notCheckedIn) {
      const recId = 'att_' + Date.now() + '_' + w.wid + Math.random();
      await FB.save(COL.A, recId, {
        recId: recId, wid: w.wid, name: w.name, prof: w.prof, sec: w.sec,
        date: today, checkinReqTime: now, checkinTime: now,
        checkoutReqTime: null, checkoutTime: null,
        total: 0, regular: 0, ot: 0, status: 'checked_in'
      });
    }
    toast('✅ ' + notCheckedIn.length + ' workers checked in!');
  });
}

async function bulkCheckOutAll() {
  const sec = document.getElementById('bulkSection').value;
  const today = tD();
  let active = gA().filter(a => a.date === today && (a.status === 'checked_in' || a.status === 'pending_checkout'));
  if (sec) active = active.filter(a => a.sec === sec);
  
  if (!active.length) return toast('No active workers', 'info');
  
  confirmDlg('Bulk Check-Out?', `Check out ${active.length} workers? (${sec || 'All'})`, async () => {
    const now = new Date().toISOString();
    for (const r of active) {
      const updated = { ...r };
      updated.checkoutReqTime = now;
      updated.checkoutTime = now;
      const hrs = (new Date(now) - new Date(r.checkinTime)) / 36e5;
      updated.total = Math.round(hrs * 100) / 100;
      updated.regular = Math.round(Math.min(hrs, REG_HOURS) * 100) / 100;
      updated.ot = Math.max(0, Math.round((hrs - REG_HOURS) * 100) / 100);
      updated.status = 'completed';
      await FB.save(COL.A, r.id, updated);
    }
    toast('✅ ' + active.length + ' workers checked out!');
  });
}

function loadManualToday() {
  const today = tD();
  const att = gA().filter(a => a.date === today);
  const ws = gW().filter(w => w.on);
  const el = document.getElementById('manualTodayList');
  if (!el) return;
  
  const notCheckedIn = ws.filter(w => !att.find(a => a.wid === w.wid));
  const working = att.filter(a => a.status === 'checked_in');
  const pending = att.filter(a => a.status === 'pending_checkin' || a.status === 'pending_checkout');
  const completed = att.filter(a => a.status === 'completed');
  
  const countEl = document.getElementById('manualStatusCount');
  if (countEl) {
    countEl.innerHTML = `<span class="tag tag-r" style="margin-right:6px">❌ ${notCheckedIn.length}</span><span class="tag tag-o" style="margin-right:6px">⏰ ${pending.length}</span><span class="tag tag-b" style="margin-right:6px">🟢 ${working.length}</span><span class="tag tag-g">✅ ${completed.length}</span>`;
  }
  
  let html = '';
  
  if (notCheckedIn.length) {
    html += `<h4 style="margin:16px 0 10px;color:var(--r);font-weight:700">❌ Not Checked In (${notCheckedIn.length})</h4>`;
    html += `<div class="t-wrap" style="margin-bottom:20px"><table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Section</th><th>Action</th></tr></thead><tbody>${notCheckedIn.map((w, i) => `<tr><td>${i + 1}</td><td><code>${w.wid}</code></td><td><b>${w.name}</b></td><td><span class="tag tag-${w.sec === 'Indian' ? 'ind' : 'pak'}">${w.sec === 'Indian' ? '🇮🇳' : '🇵🇰'}</span></td><td><button class="btn btn-success btn-sm" onclick="manualSingleCheckIn('${w.wid}')">🔓 Check In</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  
  if (working.length) {
    html += `<h4 style="margin:16px 0 10px;color:var(--p);font-weight:700">🟢 Currently Working (${working.length})</h4>`;
    html += `<div class="t-wrap" style="margin-bottom:20px"><table><thead><tr><th>#</th><th>Name</th><th>Section</th><th>In</th><th>Action</th></tr></thead><tbody>${working.map((a, i) => `<tr><td>${i + 1}</td><td><b>${a.name}</b></td><td><span class="tag tag-${a.sec === 'Indian' ? 'ind' : 'pak'}">${a.sec === 'Indian' ? '🇮🇳' : '🇵🇰'}</span></td><td style="color:#059669;font-weight:600">${fT(a.checkinTime)}</td><td><button class="btn btn-danger btn-sm" onclick="manualSingleCheckOut('${a.id}')">🔒 Check Out</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  
  if (pending.length) {
    html += `<h4 style="margin:16px 0 10px;color:var(--o);font-weight:700">⏰ Pending (${pending.length})</h4>`;
    html += `<div class="t-wrap" style="margin-bottom:20px"><table><thead><tr><th>#</th><th>Name</th><th>Type</th><th>Time</th><th>Action</th></tr></thead><tbody>${pending.map((a, i) => {
      const isIn = a.status === 'pending_checkin';
      return `<tr><td>${i + 1}</td><td><b>${a.name}</b></td><td><span class="tag ${isIn ? 'tag-g' : 'tag-r'}">${isIn ? '🔓 IN' : '🔒 OUT'}</span></td><td>${fT(isIn ? a.checkinReqTime : a.checkoutReqTime)}</td><td><button class="btn btn-success btn-sm" onclick="doApprove('${a.id}')">✅</button> <button class="btn btn-danger btn-sm" onclick="doReject('${a.id}')">❌</button></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  
  if (completed.length) {
    html += `<h4 style="margin:16px 0 10px;color:var(--g);font-weight:700">✅ Completed (${completed.length})</h4>`;
    html += `<div class="t-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Sec</th><th>In</th><th>Out</th><th>Total</th><th>Action</th></tr></thead><tbody>${completed.map((a, i) => `<tr><td>${i + 1}</td><td><b>${a.name}</b></td><td><span class="tag tag-${a.sec === 'Indian' ? 'ind' : 'pak'}">${a.sec === 'Indian' ? '🇮🇳' : '🇵🇰'}</span></td><td style="color:#059669">${fT(a.checkinTime)}</td><td style="color:#dc2626">${fT(a.checkoutTime)}</td><td style="color:var(--p);font-weight:700">${a.total.toFixed(2)}h</td><td><button class="btn btn-outline btn-sm" onclick="undoCO('${a.id}')">↩️</button> <button class="btn btn-danger btn-sm" onclick="undoCI('${a.id}')">🗑️</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  
  if (!html) html = '<div class="empty"><div class="em-icon">📋</div><h3>No records for today</h3></div>';
  el.innerHTML = html;
}

async function manualSingleCheckIn(wid) {
  const worker = gW().find(x => x.wid === wid);
  const today = tD();
  const now = new Date().toISOString();
  const recId = 'att_' + Date.now() + '_' + wid;
  
  await FB.save(COL.A, recId, {
    recId: recId, wid: wid, name: worker.name, prof: worker.prof, sec: worker.sec,
    date: today, checkinReqTime: now, checkinTime: now,
    checkoutReqTime: null, checkoutTime: null,
    total: 0, regular: 0, ot: 0, status: 'checked_in'
  });
  toast('✅ ' + worker.name + ' checked in!');
}

async function manualSingleCheckOut(attId) {
  const rec = gA().find(a => a.id === attId);
  if (!rec) return;
  const now = new Date().toISOString();
  const updated = { ...rec };
  updated.checkoutReqTime = now;
  updated.checkoutTime = now;
  const hrs = (new Date(now) - new Date(rec.checkinTime)) / 36e5;
  updated.total = Math.round(hrs * 100) / 100;
  updated.regular = Math.round(Math.min(hrs, REG_HOURS) * 100) / 100;
  updated.ot = Math.max(0, Math.round((hrs - REG_HOURS) * 100) / 100);
  updated.status = 'completed';
  await FB.save(COL.A, rec.id, updated);
  toast('✅ ' + rec.name + ' checked out! ' + updated.total.toFixed(2) + 'h');
}

console.log('📋 Manual Attendance Loaded!');
