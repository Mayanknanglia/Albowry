// AL BOWRY CARPENTRY LLC - Work & Panel Management
// work.js v25 - Date-wise panel tracking + Firebase persistent

var _panelEntries = [];
var _tableAssignments = [];
var _workProgress = [];
var _workListeners = [];
var _workSyncStarted = false;
var _panelDateFilter = '';    // ← NEW: filter panels by date
var _progressDateFilter = '';
var DEFAULT_TABLES = 15;

function calculatePanelArea(lengthMM, breadthMM, thicknessMM, quantity) {
  var lM = (lengthMM || 0) / 1000;
  var bM = (breadthMM || 0) / 1000;
  var tM = (thicknessMM || 0) / 1000;
  var areaPer = Math.round(lM * bM * 10000) / 10000;
  var volPer = Math.round(lM * bM * tM * 10000) / 10000;
  var qty = quantity || 0;
  return {
    lengthM: lM, breadthM: bM, thicknessM: tM,
    areaPerPanel: Math.round(areaPer * 100) / 100,
    volumePerPanel: volPer,
    quantity: qty,
    totalArea: Math.round(areaPer * qty * 100) / 100,
    totalVolume: Math.round(volPer * qty * 100) / 100
  };
}

function startWorkSync() {
  if (_workSyncStarted) return;
  _workSyncStarted = true;
  for (var i = 0; i < _workListeners.length; i++) { try { _workListeners[i](); } catch(e) {} }
  _workListeners = [];

  _workListeners.push(FB.listen('panels', function(docs) {
    _panelEntries = docs || [];
    _panelEntries.sort(function(a, b) { return (b.date || '') > (a.date || '') ? 1 : -1; });
    if (document.getElementById('panelCalcContainer')) renderPanelCalculator();
    if (document.getElementById('panelDateSummary')) renderPanelDateSummary();
  }));

  _workListeners.push(FB.listen('tables', function(docs) {
    _tableAssignments = docs || [];
    _tableAssignments.sort(function(a, b) { return (a.tableNum || 0) - (b.tableNum || 0); });
    if (_tableAssignments.length === 0) initDefaultTables();
    if (document.getElementById('tableAssignContainer')) renderTableAssignments();
  }));

  _workListeners.push(FB.listen('workprogress', function(docs) {
    _workProgress = docs || [];
    _workProgress.sort(function(a, b) { return (b.date || '') > (a.date || '') ? 1 : -1; });
    if (document.getElementById('workProgressContainer')) renderWorkProgress();
  }));
}

function initDefaultTables() {
  for (var t = 0; t < DEFAULT_TABLES; t++) {
    var id = 'table_' + (t + 1);
    FB.save('tables', id, {
      id: id, tableNum: t + 1, tableName: 'Table ' + (t + 1),
      workName: '', workers: [], panelsDone: 0, panelsTotal: 0, notes: ''
    });
  }
}

function renderWorkSection() {
  startWorkSync();
  _panelDateFilter = '';
  _progressDateFilter = '';
}

// ====== HELPERS ======
function getWorkerNames(wids) {
  if (!wids || wids.length === 0) return '';
  var names = [];
  for (var i = 0; i < wids.length; i++) {
    var w = findWorker(wids[i]); if (w) names.push(w.name);
  }
  return names.join(', ');
}

function getWorkerBadges(wids) {
  if (!wids || wids.length === 0) return '<span style="color:#94a3b8;font-size:11px">-</span>';
  var h = '';
  for (var i = 0; i < wids.length; i++) {
    var w = findWorker(wids[i]);
    if (w) h += '<span style="display:inline-block;background:#eff6ff;color:#2563eb;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:600;margin:1px">' + w.name + '</span>';
  }
  return h || '<span style="color:#94a3b8;font-size:11px">-</span>';
}

function sc(val, label, color, bg) {
  return '<div style="flex:1;min-width:110px;background:'+bg+';padding:14px 12px;border-radius:12px;text-align:center;border:1px solid '+color+'18">' +
    '<div style="font-size:24px;font-weight:900;color:'+color+';line-height:1">'+val+'</div>' +
    '<div style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px">'+label+'</div></div>';
}

function ff(label, id, type, value, ph, extra) {
  return '<div class="form-group"><label class="form-label">'+label+'</label>' +
    '<input type="'+type+'" id="'+id+'" class="form-control" value="'+(value!==undefined&&value!==null?value:'')+'"' +
    (ph?' placeholder="'+ph+'"':'')+(extra?' '+extra:'')+'></div>';
}

function mb(text, fn) {
  return '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="'+fn+'">'+text+'</button></div>';
}

// ====== PANEL CALCULATOR - with DATE ======
function renderPanelCalculator() {
  var c = document.getElementById('panelCalcContainer');
  if (!c) return;

  // Filter by date
  var filtered = _panelEntries;
  if (_panelDateFilter) {
    filtered = [];
    for (var f = 0; f < _panelEntries.length; f++) {
      if (_panelEntries[f].date === _panelDateFilter) filtered.push(_panelEntries[f]);
    }
  }

  if (filtered.length === 0) {
    c.innerHTML = '<div class="empty-state" style="padding:30px">' +
      '<span class="material-symbols-outlined" style="font-size:48px;color:#cbd5e1">view_in_ar</span>' +
      '<p style="margin-top:12px;font-size:15px;font-weight:600">' +
        (_panelDateFilter ? 'No items for ' + formatDateStr(_panelDateFilter) : 'No items added yet') +
      '</p><p style="font-size:12px;color:#94a3b8">Click "Add Item" to add panels or materials</p></div>';
    return;
  }

  var gA = 0, gQ = 0, gC = 0, gV = 0;
  for (var x = 0; x < filtered.length; x++) {
    var px = filtered[x];
    var cx = calculatePanelArea(px.length, px.breadth, px.thickness, px.quantity);
    gA += cx.totalArea; gQ += px.quantity || 0; gC += cx.totalArea * (px.rate || 0); gV += cx.totalVolume;
  }

  var h = '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
    sc(filtered.length, 'Items', '#2563eb', '#eff6ff') +
    sc(gQ, 'Pieces', '#7c3aed', '#f5f3ff') +
    sc(gA.toFixed(2) + ' m\u00B2', 'Total Area', '#059669', '#ecfdf5') +
    sc(gV.toFixed(3) + ' m\u00B3', 'Volume', '#0891b2', '#ecfeff') +
    (gC > 0 ? sc('AED ' + gC.toFixed(0), 'Cost', '#dc2626', '#fef2f2') : '') +
    '</div>';

  h += '<div class="table-responsive"><table class="data-table"><thead><tr>' +
    '<th>#</th><th>Item</th><th>Date</th><th>Dimensions</th><th>Area/Pc</th><th>Vol/Pc</th><th>Qty</th><th>Total Area</th><th>Rate</th><th>Cost</th><th>Actions</th>' +
    '</tr></thead><tbody>';

  for (var i = 0; i < filtered.length; i++) {
    var p = filtered[i];
    var calc = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
    var cost = calc.totalArea * (p.rate || 0);
    var tDisp = (p.thickness || 0) > 0 ? ' x ' + p.thickness : '';
    var isToday = p.date === tD();

    h += '<tr' + (isToday ? ' style="background:#fffbeb"' : '') + '>' +
      '<td style="font-weight:700;color:#64748b">' + (i+1) + '</td>' +
      '<td><strong style="font-size:14px;color:#0f172a">' + (p.name || 'Item') + '</strong></td>' +
      '<td>' +
        '<span style="font-size:12px;color:#475569">' + formatDateStr(p.date || '') + '</span>' +
        (isToday ? ' <span style="background:#d97706;color:white;padding:0 5px;border-radius:6px;font-size:8px;font-weight:700">TODAY</span>' : '') +
      '</td>' +
      '<td><div style="font-family:monospace;font-size:12px;color:#475569">' + (p.length||0) + ' x ' + (p.breadth||0) + tDisp + ' mm</div>' +
        '<div style="font-size:10px;color:#94a3b8">' + calc.lengthM + ' x ' + calc.breadthM + (calc.thicknessM > 0 ? ' x ' + calc.thicknessM : '') + ' m</div></td>' +
      '<td><strong>' + calc.areaPerPanel + '</strong> m\u00B2</td>' +
      '<td>' + (calc.volumePerPanel > 0 ? calc.volumePerPanel + ' m\u00B3' : '-') + '</td>' +
      '<td><span style="background:#eff6ff;color:#2563eb;padding:2px 10px;border-radius:12px;font-weight:800;font-size:14px">' + (p.quantity||0) + '</span></td>' +
      '<td><strong style="color:#059669;font-size:15px">' + calc.totalArea + ' m\u00B2</strong></td>' +
      '<td>' + (p.rate ? 'AED ' + p.rate : '-') + '</td>' +
      '<td>' + (cost > 0 ? '<strong style="color:#dc2626">AED ' + cost.toFixed(2) + '</strong>' : '-') + '</td>' +
      '<td class="action-cell">' +
        '<button class="btn-icon btn-edit" onclick="editPanelEntry('+i+')"><span class="material-symbols-outlined">edit</span></button>' +
        '<button class="btn-icon btn-delete" onclick="deletePanelEntry('+i+')"><span class="material-symbols-outlined">delete</span></button>' +
      '</td></tr>';
  }

  h += '</tbody><tfoot><tr style="background:linear-gradient(135deg,#f0f4f9,#e8eef7);font-weight:800">' +
    '<td colspan="6">GRAND TOTAL' + (_panelDateFilter ? ' (' + formatDateStr(_panelDateFilter) + ')' : '') + '</td>' +
    '<td><span style="background:#2563eb;color:white;padding:2px 10px;border-radius:12px;font-size:14px">' + gQ + '</span></td>' +
    '<td style="color:#059669;font-size:15px">' + gA.toFixed(2) + ' m\u00B2</td>' +
    '<td></td><td>' + (gC > 0 ? '<strong style="color:#dc2626">AED ' + gC.toFixed(2) + '</strong>' : '') + '</td><td></td>' +
    '</tr></tfoot></table></div>';

  c.innerHTML = h;
}

// ====== DATE-WISE PANEL SUMMARY ======
function renderPanelDateSummary() {
  var c = document.getElementById('panelDateSummary');
  if (!c) return;

  if (_panelEntries.length === 0) {
    c.innerHTML = '<div class="empty-state" style="padding:20px"><span class="material-symbols-outlined" style="font-size:36px;color:#cbd5e1">calendar_today</span><p style="font-size:13px;color:#94a3b8;margin-top:8px">Add items with dates to see daily summary</p></div>';
    return;
  }

  // Group by date
  var dateMap = {};
  var totalPanels = 0, totalArea = 0;
  for (var i = 0; i < _panelEntries.length; i++) {
    var p = _panelEntries[i];
    var d = p.date || 'No Date';
    if (!dateMap[d]) dateMap[d] = { items: 0, panels: 0, area: 0 };
    var calc = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
    dateMap[d].items++;
    dateMap[d].panels += p.quantity || 0;
    dateMap[d].area += calc.totalArea;
    totalPanels += p.quantity || 0;
    totalArea += calc.totalArea;
  }

  var dates = Object.keys(dateMap).sort(function(a, b) { return b > a ? 1 : -1; });
  var avgArea = dates.length > 0 ? Math.round(totalArea / dates.length * 100) / 100 : 0;

  var h = '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
    sc(dates.length, 'Working Days', '#2563eb', '#eff6ff') +
    sc(totalPanels, 'Total Panels', '#059669', '#ecfdf5') +
    sc(totalArea.toFixed(2) + ' m\u00B2', 'Total Area', '#d97706', '#fffbeb') +
    sc(avgArea + ' m\u00B2', 'Avg/Day', '#7c3aed', '#f5f3ff') +
    '</div>';

  h += '<div class="table-responsive"><table class="data-table"><thead><tr>' +
    '<th>#</th><th>Date</th><th>Items Added</th><th>Panels</th><th>Area Covered</th><th>Cumulative Area</th><th>View</th>' +
    '</tr></thead><tbody>';

  // Calculate cumulative (chronological)
  var chronoDates = dates.slice().reverse();
  var cumMap = {};
  var cumA = 0;
  for (var ci = 0; ci < chronoDates.length; ci++) {
    cumA += dateMap[chronoDates[ci]].area;
    cumMap[chronoDates[ci]] = Math.round(cumA * 100) / 100;
  }

  for (var di = 0; di < dates.length; di++) {
    var dk = dates[di];
    var dd = dateMap[dk];
    var isToday = dk === tD();
    var isNoDate = dk === 'No Date';

    h += '<tr' + (isToday ? ' style="background:#fffbeb;border-left:3px solid #d97706"' : '') + '>' +
      '<td style="font-weight:700;color:#64748b">' + (di + 1) + '</td>' +
      '<td>' +
        '<strong style="font-size:14px;color:#0f172a">' + (isNoDate ? 'No Date Set' : formatDateStr(dk)) + '</strong>' +
        (isToday ? ' <span style="background:#d97706;color:white;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:700">TODAY</span>' : '') +
      '</td>' +
      '<td><span style="background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:8px;font-size:12px;font-weight:700">' + dd.items + '</span></td>' +
      '<td><strong style="color:#059669;font-size:16px">' + dd.panels + '</strong></td>' +
      '<td><strong style="color:#d97706;font-size:16px">' + dd.area.toFixed(2) + ' m\u00B2</strong></td>' +
      '<td><span style="color:#7c3aed;font-weight:700;font-size:14px">' + (cumMap[dk] || dd.area.toFixed(2)) + ' m\u00B2</span></td>' +
      '<td>' +
        (isNoDate ? '' : '<button class="btn btn-sm btn-info" onclick="filterPanelsByDate(\'' + dk + '\')" style="padding:4px 10px;font-size:11px"><span class="material-symbols-outlined" style="font-size:14px">visibility</span></button>') +
      '</td>' +
    '</tr>';
  }

  h += '</tbody><tfoot><tr style="background:linear-gradient(135deg,#f0f4f9,#e8eef7);font-weight:800">' +
    '<td colspan="3">TOTAL (' + dates.length + ' days)</td>' +
    '<td style="color:#059669;font-size:16px">' + totalPanels + '</td>' +
    '<td style="color:#d97706;font-size:16px">' + totalArea.toFixed(2) + ' m\u00B2</td>' +
    '<td colspan="2"></td></tr></tfoot></table></div>';

  c.innerHTML = h;
}

function filterPanelsByDate(date) {
  _panelDateFilter = date;
  var el = document.getElementById('panelDateFilterInput');
  if (el) el.value = date;
  renderPanelCalculator();
  showToast('Showing items for ' + formatDateStr(date), 'info');
}

function filterPanelsByDateInput() {
  var el = document.getElementById('panelDateFilterInput');
  _panelDateFilter = el ? el.value : '';
  renderPanelCalculator();
}

function clearPanelDateFilter() {
  _panelDateFilter = '';
  var el = document.getElementById('panelDateFilterInput');
  if (el) el.value = '';
  renderPanelCalculator();
  showToast('Showing all items', 'info');
}

function showAddPanelModal(editIndex) {
  var isEdit = editIndex !== undefined && editIndex !== null;
  var ex = isEdit ? _panelEntries[editIndex] : null;

  var h = '<div class="form-grid">' +
    ff('Item Name', 'pnlName', 'text', ex ? ex.name : '', 'Wall Panel, MDF Board, etc.') +
    ff('Date', 'pnlDate', 'date', ex ? (ex.date || tD()) : tD()) +
    ff('Length (mm)', 'pnlLength', 'number', ex ? ex.length : 6000, '6000', 'oninput="liveCalcPanel()"') +
    ff('Breadth (mm)', 'pnlBreadth', 'number', ex ? ex.breadth : 1200, '1200', 'oninput="liveCalcPanel()"') +
    ff('Thickness (mm)', 'pnlThickness', 'number', ex ? ex.thickness : 400, '400', 'oninput="liveCalcPanel()"') +
    ff('Quantity (Pieces)', 'pnlQty', 'number', ex ? ex.quantity : 1, '10', 'min="1" oninput="liveCalcPanel()"') +
    ff('Rate/m\u00B2 (AED)', 'pnlRate', 'number', ex ? (ex.rate || '') : '', '50', 'step="0.5" oninput="liveCalcPanel()"') +
    '</div>' +
    '<div id="pnlPreview" style="margin-top:14px;padding:16px;background:linear-gradient(135deg,#f0f4f9,#e8eef7);border-radius:12px;border:1px solid #e2e8f0">' +
      '<div style="font-weight:800;font-size:11px;color:#0f172a;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Live Calculation</div>' +
      '<div id="pnlPreviewContent" style="font-size:14px;color:#475569">Enter dimensions...</div></div>' +
    mb(isEdit ? 'Update Item' : 'Add Item', 'savePanelEntry(' + (isEdit ? editIndex : -1) + ')');

  showModal(h, isEdit ? 'Edit Item' : 'Add New Item');
  setTimeout(liveCalcPanel, 100);
}

function liveCalcPanel() {
  var el = document.getElementById('pnlPreviewContent');
  if (!el) return;
  var l = parseFloat(document.getElementById('pnlLength').value) || 0;
  var b = parseFloat(document.getElementById('pnlBreadth').value) || 0;
  var t = parseFloat(document.getElementById('pnlThickness').value) || 0;
  var q = parseInt(document.getElementById('pnlQty').value) || 0;
  var r = parseFloat(document.getElementById('pnlRate').value) || 0;
  if (!l || !b || !q) { el.innerHTML = '<span style="color:#94a3b8">Enter valid dimensions</span>'; return; }
  var calc = calculatePanelArea(l, b, t, q);
  var cost = calc.totalArea * r;
  el.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
    '<div><span style="color:#64748b">Dimensions:</span> <strong>' + l + ' x ' + b + (t > 0 ? ' x ' + t : '') + ' mm</strong></div>' +
    '<div><span style="color:#64748b">In Meters:</span> <strong>' + calc.lengthM + ' x ' + calc.breadthM + (calc.thicknessM > 0 ? ' x ' + calc.thicknessM : '') + ' m</strong></div>' +
    '<div><span style="color:#64748b">Area/Pc:</span> <strong style="color:#2563eb">' + calc.areaPerPanel + ' m\u00B2</strong></div>' +
    (calc.volumePerPanel > 0 ? '<div><span style="color:#64748b">Vol/Pc:</span> <strong>' + calc.volumePerPanel + ' m\u00B3</strong></div>' : '') +
    '</div><div style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;display:flex;gap:16px;flex-wrap:wrap">' +
    '<div><span style="color:#64748b">Qty:</span> <strong style="font-size:16px;color:#7c3aed">' + q + '</strong></div>' +
    '<div><span style="color:#64748b">Total Area:</span> <strong style="font-size:18px;color:#059669">' + calc.totalArea + ' m\u00B2</strong></div>' +
    (r > 0 ? '<div><span style="color:#64748b">Cost:</span> <strong style="font-size:18px;color:#dc2626">AED ' + cost.toFixed(2) + '</strong></div>' : '') +
    '</div>';
}

function savePanelEntry(editIndex) {
  var name = document.getElementById('pnlName').value.trim() || 'Item';
  var date = document.getElementById('pnlDate').value || tD();
  var length = parseFloat(document.getElementById('pnlLength').value) || 0;
  var breadth = parseFloat(document.getElementById('pnlBreadth').value) || 0;
  var thickness = parseFloat(document.getElementById('pnlThickness').value) || 0;
  var quantity = parseInt(document.getElementById('pnlQty').value) || 0;
  var rate = parseFloat(document.getElementById('pnlRate').value) || 0;
  if (!length || !breadth || !quantity) { showToast('Enter length, breadth, quantity', 'error'); return; }
  var docId = (editIndex >= 0 && _panelEntries[editIndex]) ? (_panelEntries[editIndex].id || 'panel_' + Date.now()) : 'panel_' + Date.now();
  FB.save('panels', docId, {
    id: docId, name: name, date: date, length: length, breadth: breadth,
    thickness: thickness, quantity: quantity, rate: rate,
    createdAt: editIndex >= 0 ? (_panelEntries[editIndex].createdAt || tNow()) : tNow(),
    updatedAt: tNow()
  }).then(function() {
    closeModal();
    showToast(editIndex >= 0 ? 'Updated!' : 'Added!', 'success');
  });
}

function editPanelEntry(i) {
  // Find original index in full list (not filtered)
  if (_panelDateFilter) {
    var filtered = [];
    for (var f = 0; f < _panelEntries.length; f++) {
      if (_panelEntries[f].date === _panelDateFilter) filtered.push(f);
    }
    if (filtered[i] !== undefined) {
      showAddPanelModal(filtered[i]);
      return;
    }
  }
  showAddPanelModal(i);
}

function deletePanelEntry(i) {
  var idx = i;
  if (_panelDateFilter) {
    var filtered = [];
    for (var f = 0; f < _panelEntries.length; f++) {
      if (_panelEntries[f].date === _panelDateFilter) filtered.push(f);
    }
    if (filtered[i] !== undefined) idx = filtered[i];
  }
  var p = _panelEntries[idx];
  if (!p) return;
  showConfirm('Delete "' + (p.name || 'Item') + '"?', function() {
    FB.delete('panels', p.id).then(function() { showToast('Deleted', 'info'); });
  });
}

// ====== TABLE ASSIGNMENTS ======
function renderTableAssignments() {
  var c = document.getElementById('tableAssignContainer');
  if (!c) return;
  if (_tableAssignments.length === 0) { c.innerHTML = '<div class="text-muted text-center" style="padding:20px">Loading...</div>'; return; }

  var tDone = 0, tTarget = 0, active = 0;
  for (var x = 0; x < _tableAssignments.length; x++) {
    tDone += _tableAssignments[x].panelsDone || 0;
    tTarget += _tableAssignments[x].panelsTotal || 0;
    if (_tableAssignments[x].workName) active++;
  }
  var oP = tTarget > 0 ? Math.round((tDone / tTarget) * 100) : 0;
  var oC = oP >= 80 ? '#059669' : oP >= 40 ? '#d97706' : '#dc2626';

  var h = '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
    sc(_tableAssignments.length, 'Tables', '#2563eb', '#eff6ff') +
    sc(active, 'Active', '#7c3aed', '#f5f3ff') +
    sc(tDone + '/' + tTarget, 'Panels', '#059669', '#ecfdf5') +
    sc(oP + '%', 'Progress', oC, oP >= 80 ? '#ecfdf5' : oP >= 40 ? '#fffbeb' : '#fef2f2') +
    '</div>';

  h += '<div class="table-responsive"><table class="data-table"><thead><tr>' +
    '<th>#</th><th>Table</th><th>Work</th><th>Workers</th><th>Done</th><th>Target</th><th>Progress</th><th>Notes</th><th>Edit</th>' +
    '</tr></thead><tbody>';

  for (var i = 0; i < _tableAssignments.length; i++) {
    var tb = _tableAssignments[i];
    var wB = getWorkerBadges(tb.workers);
    var pr = (tb.panelsTotal || 0) > 0 ? Math.min(100, Math.round(((tb.panelsDone || 0) / tb.panelsTotal) * 100)) : 0;
    var pC = pr >= 80 ? '#059669' : pr >= 40 ? '#d97706' : pr > 0 ? '#dc2626' : '#cbd5e1';

    h += '<tr' + (pr >= 100 ? ' style="background:#ecfdf5"' : '') + '>' +
      '<td style="font-weight:700;color:#64748b">' + (tb.tableNum || i+1) + '</td>' +
      '<td><strong>' + (tb.tableName || 'Table') + '</strong></td>' +
      '<td>' + (tb.workName || '<span style="color:#cbd5e1">-</span>') + '</td>' +
      '<td>' + wB + '</td>' +
      '<td><strong style="color:#059669;font-size:15px">' + (tb.panelsDone || 0) + '</strong></td>' +
      '<td>' + (tb.panelsTotal || 0) + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:6px">' +
        '<div style="flex:1;background:#e2e8f0;border-radius:4px;height:10px;min-width:60px;overflow:hidden">' +
          '<div style="background:'+pC+';height:100%;width:'+pr+'%;border-radius:4px;transition:width 0.5s"></div></div>' +
        '<span style="font-size:12px;font-weight:800;color:'+pC+'">'+pr+'%</span></div></td>' +
      '<td style="font-size:11px;color:#64748b;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (tb.notes || '-') + '</td>' +
      '<td><button class="btn-icon btn-edit" onclick="editTableAssignment('+i+')"><span class="material-symbols-outlined">edit</span></button></td>' +
    '</tr>';
  }

  h += '</tbody></table></div>';
  h += '<div style="margin-top:12px;text-align:center"><button class="btn btn-primary btn-sm" onclick="addNewTable()"><span class="material-symbols-outlined">add</span> Add Table</button></div>';
  c.innerHTML = h;
}

function editTableAssignment(idx) {
  var tb = _tableAssignments[idx];
  var ws = gW();
  var h = '<div class="form-grid">' +
    ff('Table Name', 'tblName', 'text', tb.tableName || '') +
    ff('Work Description', 'tblWork', 'text', tb.workName || '', 'Panel Installation') +
    ff('Panels Done', 'tblDone', 'number', tb.panelsDone || 0) +
    ff('Panels Target', 'tblTarget', 'number', tb.panelsTotal || 0) +
    ff('Notes', 'tblNotes', 'text', tb.notes || '') +
    '</div>';

  h += '<div style="margin-top:12px"><label class="form-label">Assign Workers</label>' +
    '<div style="max-height:200px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;padding:4px">';
  var secs = ['Indian', 'Pakistani'];
  for (var s = 0; s < secs.length; s++) {
    h += '<div style="font-size:9px;font-weight:800;color:#94a3b8;padding:3px 6px;text-transform:uppercase;letter-spacing:1px">' + secs[s] + '</div>';
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i]; if (!w.on || w.sec !== secs[s]) continue;
      var chk = indexOf(tb.workers || [], w.wid) !== -1 ? ' checked' : '';
      h += '<label style="display:flex;align-items:center;gap:6px;padding:3px 6px;cursor:pointer;font-size:12px">' +
        '<input type="checkbox" class="tblWCb" value="'+w.wid+'"'+chk+' style="accent-color:#2563eb">' +
        '<strong>'+w.name+'</strong><span style="color:#94a3b8;margin-left:auto;font-size:10px">'+w.wid+'</span></label>';
    }
  }
  h += '</div></div>';
  h += mb('Save', 'saveTableAssignment('+idx+')');
  showModal(h, 'Edit ' + (tb.tableName || 'Table'));
}

function saveTableAssignment(idx) {
  var tb = _tableAssignments[idx];
  var docId = tb.id || ('table_' + (tb.tableNum || idx+1));
  var cbs = document.querySelectorAll('.tblWCb:checked');
  var workers = []; for (var i = 0; i < cbs.length; i++) workers.push(cbs[i].value);
  FB.save('tables', docId, {
    id: docId, tableNum: tb.tableNum || idx+1,
    tableName: document.getElementById('tblName').value.trim() || 'Table '+(idx+1),
    workName: document.getElementById('tblWork').value.trim(),
    workers: workers,
    panelsDone: parseInt(document.getElementById('tblDone').value) || 0,
    panelsTotal: parseInt(document.getElementById('tblTarget').value) || 0,
    notes: document.getElementById('tblNotes').value.trim()
  }).then(function() { closeModal(); showToast('Saved!', 'success'); });
}

function addNewTable() {
  var num = _tableAssignments.length + 1;
  var id = 'table_' + num + '_' + Date.now();
  FB.save('tables', id, {
    id: id, tableNum: num, tableName: 'Table ' + num,
    workName: '', workers: [], panelsDone: 0, panelsTotal: 0, notes: ''
  }).then(function() { showToast('Table ' + num + ' added!', 'success'); });
}

// ====== WORK PROGRESS ======
function renderWorkProgress() {
  var c = document.getElementById('workProgressContainer');
  if (!c) return;

  var filtered = _workProgress;
  if (_progressDateFilter) {
    filtered = [];
    for (var f = 0; f < _workProgress.length; f++) {
      if (_workProgress[f].date === _progressDateFilter) filtered.push(_workProgress[f]);
    }
  }

  if (filtered.length === 0) {
    c.innerHTML = '<div class="empty-state" style="padding:24px">' +
      '<span class="material-symbols-outlined" style="font-size:40px;color:#cbd5e1">trending_up</span>' +
      '<p style="margin-top:10px;font-size:14px;font-weight:600">' +
        (_progressDateFilter ? 'No entries for ' + formatDateStr(_progressDateFilter) : 'No progress entries yet') +
      '</p></div>';
    return;
  }

  var groups = {};
  var tP = 0, tA = 0;
  for (var i = 0; i < filtered.length; i++) {
    var p = filtered[i];
    var d = p.date || 'Unknown';
    if (!groups[d]) groups[d] = [];
    groups[d].push(p);
    tP += p.panelsDone || 0;
    tA += p.areaCovered || 0;
  }

  var h = '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
    sc(filtered.length, 'Entries', '#2563eb', '#eff6ff') +
    sc(tP, 'Panels', '#059669', '#ecfdf5') +
    sc(tA.toFixed(2) + ' m\u00B2', 'Area', '#d97706', '#fffbeb') +
    '</div>';

  var dates = Object.keys(groups).sort(function(a, b) { return b > a ? 1 : -1; });

  for (var di = 0; di < dates.length; di++) {
    var dk = dates[di];
    var entries = groups[dk];
    var dayP = 0, dayA = 0;
    for (var dp = 0; dp < entries.length; dp++) {
      dayP += entries[dp].panelsDone || 0;
      dayA += entries[dp].areaCovered || 0;
    }
    var isToday = dk === tD();

    h += '<div style="margin-bottom:18px">' +
      '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(135deg,' + (isToday ? '#fffbeb,#fef3c7' : '#eff6ff,#f8fafc') + ');border-radius:10px;margin-bottom:8px;border:1px solid ' + (isToday ? 'rgba(217,119,6,0.2)' : 'rgba(37,99,235,0.1)') + '">' +
        '<span class="material-symbols-outlined" style="color:' + (isToday ? '#d97706' : '#2563eb') + ';font-size:20px">calendar_today</span>' +
        '<strong style="font-size:15px;color:#0f172a">' + formatDateStr(dk) + '</strong>' +
        (isToday ? ' <span style="background:#d97706;color:white;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:700">TODAY</span>' : '') +
        '<div style="margin-left:auto;display:flex;gap:14px">' +
          '<span style="font-size:13px;font-weight:800;color:#059669">' + dayP + ' panels</span>' +
          '<span style="font-size:13px;font-weight:800;color:#d97706">' + dayA.toFixed(2) + ' m\u00B2</span>' +
        '</div></div>';

    h += '<div class="table-responsive"><table class="data-table"><thead><tr>' +
      '<th>#</th><th>Table</th><th>Work</th><th>Workers</th><th>Panels</th><th>Area</th><th>Notes</th><th>Actions</th>' +
      '</tr></thead><tbody>';

    for (var ei = 0; ei < entries.length; ei++) {
      var entry = entries[ei];
      var origIdx = -1;
      for (var oi = 0; oi < _workProgress.length; oi++) {
        if (_workProgress[oi].id === entry.id) { origIdx = oi; break; }
      }

      h += '<tr><td>' + (ei+1) + '</td>' +
        '<td><strong>' + (entry.tableName || '-') + '</strong></td>' +
        '<td>' + (entry.workName || '-') + '</td>' +
        '<td style="font-size:12px">' + (getWorkerNames(entry.workers) || '-') + '</td>' +
        '<td><strong style="color:#059669;font-size:15px">' + (entry.panelsDone || 0) + '</strong></td>' +
        '<td><strong style="color:#d97706">' + (entry.areaCovered || 0) + ' m\u00B2</strong></td>' +
        '<td style="font-size:11px;color:#64748b">' + (entry.notes || '-') + '</td>' +
        '<td class="action-cell">' +
          '<button class="btn-icon btn-edit" onclick="editProgress('+origIdx+')"><span class="material-symbols-outlined">edit</span></button>' +
          '<button class="btn-icon btn-delete" onclick="deleteProgress('+origIdx+')"><span class="material-symbols-outlined">delete</span></button>' +
        '</td></tr>';
    }
    h += '</tbody></table></div></div>';
  }
  c.innerHTML = h;
}

function filterProgressByDate() {
  var el = document.getElementById('progressDateFilter');
  _progressDateFilter = el ? el.value : '';
  renderWorkProgress();
}

function clearProgressFilter() {
  _progressDateFilter = '';
  var el = document.getElementById('progressDateFilter');
  if (el) el.value = '';
  renderWorkProgress();
}

function showAddProgressModal(ei) {
  var isE = ei !== undefined && ei !== null;
  var ex = isE ? _workProgress[ei] : null;
  var h = '<div class="form-grid">' +
    ff('Date', 'wpDate', 'date', ex ? ex.date : tD());
  h += '<div class="form-group"><label class="form-label">Table</label><select id="wpTable" class="form-control" onchange="autoFillWork()">';
  for (var t = 0; t < _tableAssignments.length; t++) {
    var sel = (ex && ex.tableNum === _tableAssignments[t].tableNum) ? ' selected' : '';
    h += '<option value="'+t+'"'+sel+'>' + (_tableAssignments[t].tableName || 'Table') + '</option>';
  }
  h += '</select></div>' +
    ff('Work', 'wpWork', 'text', ex ? (ex.workName || '') : '', 'Panel Installation') +
    ff('Panels', 'wpPanels', 'number', ex ? (ex.panelsDone || '') : '', '5') +
    ff('Area (m\u00B2)', 'wpArea', 'number', ex ? (ex.areaCovered || '') : '', '36.0', 'step="0.01"') +
    ff('Notes', 'wpNotes', 'text', ex ? (ex.notes || '') : '') +
    '</div>' + mb(isE ? 'Update' : 'Save', 'saveProgress('+(isE?ei:-1)+')');
  showModal(h, isE ? 'Edit Progress' : 'Add Progress');
}

function autoFillWork() {
  var tidx = parseInt(document.getElementById('wpTable').value);
  var tb = _tableAssignments[tidx];
  if (tb && tb.workName) {
    var el = document.getElementById('wpWork');
    if (el && !el.value) el.value = tb.workName;
  }
}

function saveProgress(ei) {
  var tidx = parseInt(document.getElementById('wpTable').value);
  var tb = _tableAssignments[tidx];
  var entry = {
    date: document.getElementById('wpDate').value,
    tableNum: tb.tableNum || tidx+1,
    tableName: tb.tableName || 'Table',
    workName: document.getElementById('wpWork').value.trim() || tb.workName || '',
    workers: (tb.workers || []).slice(),
    panelsDone: parseInt(document.getElementById('wpPanels').value) || 0,
    areaCovered: parseFloat(document.getElementById('wpArea').value) || 0,
    notes: document.getElementById('wpNotes').value.trim(),
    updatedAt: tNow()
  };
  var docId = (ei >= 0 && _workProgress[ei]) ? (_workProgress[ei].id || 'wp_'+Date.now()) : 'wp_'+Date.now();
  entry.id = docId;
  entry.createdAt = (ei >= 0 && _workProgress[ei]) ? (_workProgress[ei].createdAt || tNow()) : tNow();
  FB.save('workprogress', docId, entry).then(function() {
    closeModal(); showToast(ei >= 0 ? 'Updated!' : 'Saved!', 'success');
  });
}

function editProgress(i) {
  if (i < 0 || i >= _workProgress.length) return;
  showAddProgressModal(i);
}

function deleteProgress(i) {
  if (i < 0 || i >= _workProgress.length) return;
  var p = _workProgress[i];
  showConfirm('Delete this entry?', function() {
    FB.delete('workprogress', p.id).then(function() { showToast('Deleted', 'info'); });
  });
}

// ====== PDF ======
function exportWorkPDF() {
  loadLogoForPDF().then(function() {
    var doc = new jspdf.jsPDF('landscape');
    var y = addPDFHeader(doc, 'Work Area & Panel Report', 'COP31 - ' + formatDateStr(tD()));
    var pH = doc.internal.pageSize.getHeight();

    // Panels
    if (_panelEntries.length > 0) {
      doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(30,64,175);
      doc.text('ITEMS & MATERIALS ('+_panelEntries.length+')', 14, y+8);
      var pR=[],gA2=0,gQ=0,gC=0;
      for(var i=0;i<_panelEntries.length;i++){
        var p=_panelEntries[i];var cl=calculatePanelArea(p.length,p.breadth,p.thickness,p.quantity);
        var co=cl.totalArea*(p.rate||0);gA2+=cl.totalArea;gQ+=p.quantity||0;gC+=co;
        pR.push([i+1,p.name||'Item',formatDateStr(p.date||''),(p.length||0)+'x'+(p.breadth||0)+(p.thickness?' x'+p.thickness:'')+' mm',cl.areaPerPanel+' m2',p.quantity||0,cl.totalArea+' m2',p.rate?'AED '+p.rate:'-',co>0?'AED '+co.toFixed(2):'-']);
      }
      doc.autoTable({startY:y+12,head:[['#','Item','Date','Dimensions','Area/Pc','Qty','Total','Rate','Cost']],body:pR,theme:'grid',styles:{fontSize:7,cellPadding:2},headStyles:{fillColor:[30,64,175],textColor:255,fontStyle:'bold'},alternateRowStyles:{fillColor:[240,245,255]},foot:[['','TOTAL','','','',gQ,gA2.toFixed(2)+' m2','',gC>0?'AED '+gC.toFixed(2):'']],footStyles:{fillColor:[5,150,105],textColor:255,fontStyle:'bold'}});
      y=doc.lastAutoTable.finalY+10;
    }

    // Date-wise area coverage
    if (_panelEntries.length > 0) {
      if(y+50>pH-20){doc.addPage();y=addPDFHeader(doc,'Area Coverage','Date Wise');}
      doc.setFontSize(13);doc.setFont('helvetica','bold');doc.setTextColor(124,58,237);
      doc.text('AREA COVERAGE - DATE WISE',14,y+8);
      var dm={},tPA=0,tAA=0;
      for(var d2=0;d2<_panelEntries.length;d2++){
        var p2=_panelEntries[d2];var d2k=p2.date||'No Date';
        if(!dm[d2k])dm[d2k]={items:0,panels:0,area:0};
        var c2=calculatePanelArea(p2.length,p2.breadth,p2.thickness,p2.quantity);
        dm[d2k].items++;dm[d2k].panels+=p2.quantity||0;dm[d2k].area+=c2.totalArea;
        tPA+=p2.quantity||0;tAA+=c2.totalArea;
      }
      var dks=Object.keys(dm).sort();var dR=[],cum=0;
      for(var dk=0;dk<dks.length;dk++){var k=dks[dk];cum+=dm[k].area;
        dR.push([dk+1,formatDateStr(k),dm[k].items,dm[k].panels,dm[k].area.toFixed(2)+' m2',cum.toFixed(2)+' m2']);}
      doc.autoTable({startY:y+12,head:[['#','Date','Items','Panels','Area','Cumulative']],body:dR,theme:'grid',styles:{fontSize:9,cellPadding:3},headStyles:{fillColor:[124,58,237],textColor:255},alternateRowStyles:{fillColor:[245,243,255]},foot:[['','TOTAL ('+dks.length+' days)','',tPA,tAA.toFixed(2)+' m2','']],footStyles:{fillColor:[30,64,175],textColor:255,fontStyle:'bold'}});
      y=doc.lastAutoTable.finalY+10;
    }

    // Tables
    if (_tableAssignments.length > 0) {
      if(y+50>pH-20){doc.addPage();y=addPDFHeader(doc,'Tables','Assignments');}
      doc.setFontSize(13);doc.setFont('helvetica','bold');doc.setTextColor(217,119,6);
      doc.text('TABLE ASSIGNMENTS ('+_tableAssignments.length+')',14,y+8);
      var tR=[];
      for(var t=0;t<_tableAssignments.length;t++){var tb=_tableAssignments[t];var wn=getWorkerNames(tb.workers);
        var pr=(tb.panelsTotal||0)>0?Math.round(((tb.panelsDone||0)/tb.panelsTotal)*100)+'%':'0%';
        tR.push([tb.tableNum||t+1,tb.tableName||'Table',tb.workName||'-',wn||'-',(tb.panelsDone||0)+'/'+(tb.panelsTotal||0),pr,tb.notes||'-']);}
      doc.autoTable({startY:y+12,head:[['#','Table','Work','Workers','Done/Target','Progress','Notes']],body:tR,theme:'grid',styles:{fontSize:8,cellPadding:3},headStyles:{fillColor:[217,119,6],textColor:255},alternateRowStyles:{fillColor:[254,249,235]}});
      y=doc.lastAutoTable.finalY+10;
    }

    // Progress
    if (_workProgress.length > 0) {
      if(y+50>pH-20){doc.addPage();y=addPDFHeader(doc,'Progress','Daily');}
      doc.setFontSize(13);doc.setFont('helvetica','bold');doc.setTextColor(5,150,105);
      doc.text('DAILY PROGRESS ('+_workProgress.length+')',14,y+8);
      var wR=[],tP2=0,tA2=0;
      for(var w=0;w<_workProgress.length;w++){var pr2=_workProgress[w];var pn=getWorkerNames(pr2.workers);
        tP2+=pr2.panelsDone||0;tA2+=pr2.areaCovered||0;
        wR.push([w+1,formatDateStr(pr2.date),pr2.tableName||'-',pr2.workName||'-',pn||'-',pr2.panelsDone||0,(pr2.areaCovered||0)+' m2',pr2.notes||'-']);}
      doc.autoTable({startY:y+12,head:[['#','Date','Table','Work','Workers','Panels','Area','Notes']],body:wR,theme:'grid',styles:{fontSize:8,cellPadding:3},headStyles:{fillColor:[5,150,105],textColor:255},alternateRowStyles:{fillColor:[240,255,250]},foot:[['','','','','TOTAL',tP2,tA2.toFixed(2)+' m2','']],footStyles:{fillColor:[30,64,175],textColor:255,fontStyle:'bold'}});
    }

    addPDFFooter(doc);
    doc.save('albowry_work_'+tD()+'.pdf');
    showToast('PDF downloaded!','success');
  });
}

function exportWorkCSV() {
  var csv = COMPANY.full+'\nWork Report - '+formatDateStr(tD())+'\n\n';
  csv += 'ITEMS\nName,Date,L(mm),B(mm),T(mm),Area/Pc,Qty,Total Area,Rate,Cost\n';
  for(var i=0;i<_panelEntries.length;i++){
    var p=_panelEntries[i];var cl=calculatePanelArea(p.length,p.breadth,p.thickness,p.quantity);
    csv+='"'+(p.name||'')+'",'+formatDateStr(p.date||'')+','+p.length+','+p.breadth+','+p.thickness+','+cl.areaPerPanel+','+p.quantity+','+cl.totalArea+','+(p.rate||0)+','+(cl.totalArea*(p.rate||0)).toFixed(2)+'\n';
  }
  csv+='\nDATE WISE COVERAGE\nDate,Items,Panels,Area(m2),Cumulative(m2)\n';
  var dm2={};
  for(var d3=0;d3<_panelEntries.length;d3++){var p3=_panelEntries[d3];var d3k=p3.date||'No Date';
    if(!dm2[d3k])dm2[d3k]={items:0,panels:0,area:0};
    var c3=calculatePanelArea(p3.length,p3.breadth,p3.thickness,p3.quantity);
    dm2[d3k].items++;dm2[d3k].panels+=p3.quantity||0;dm2[d3k].area+=c3.totalArea;}
  var dks2=Object.keys(dm2).sort();var cum2=0;
  for(var dk2=0;dk2<dks2.length;dk2++){var k2=dks2[dk2];cum2+=dm2[k2].area;
    csv+=formatDateStr(k2)+','+dm2[k2].items+','+dm2[k2].panels+','+dm2[k2].area.toFixed(2)+','+cum2.toFixed(2)+'\n';}
  csv+='\nTABLES\nTable,Work,Workers,Done,Target,Progress,Notes\n';
  for(var t=0;t<_tableAssignments.length;t++){var tb=_tableAssignments[t];var wn=getWorkerNames(tb.workers);
    csv+='"'+tb.tableName+'","'+(tb.workName||'')+'","'+(wn||'')+'",'+(tb.panelsDone||0)+','+(tb.panelsTotal||0)+','+(tb.panelsTotal>0?Math.round(((tb.panelsDone||0)/tb.panelsTotal)*100)+'%':'0%')+',"'+(tb.notes||'')+'"\n';}
  csv+='\nPROGRESS\nDate,Table,Work,Workers,Panels,Area,Notes\n';
  for(var w=0;w<_workProgress.length;w++){var pr=_workProgress[w];
    csv+=formatDateStr(pr.date)+',"'+(pr.tableName||'')+'","'+(pr.workName||'')+'","'+(getWorkerNames(pr.workers)||'')+'",'+(pr.panelsDone||0)+','+(pr.areaCovered||0)+',"'+(pr.notes||'')+'"\n';}
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});var url=URL.createObjectURL(blob);
  var link=document.createElement('a');link.href=url;link.download='albowry_work_'+tD()+'.csv';link.click();
  URL.revokeObjectURL(url);showToast('CSV downloaded!','success');
}

console.log('[ALB] work.js v25 loaded');
