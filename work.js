// AL BOWRY CARPENTRY LLC - Work & Panel Management
// work.js v25 - Professional Level - Firebase Persistent
// Panel Area Tracking + Date-wise Coverage + Tables + Workers

var _panelEntries = [];
var _tableAssignments = [];
var _workProgress = [];
var _workListeners = [];
var _workSyncStarted = false;
var _progressDateFilter = '';
var DEFAULT_TABLES = 15;

// ====== PANEL AREA CALCULATOR ======
function calculatePanelArea(lengthMM, breadthMM, thicknessMM, quantity) {
  var lM = (lengthMM || 0) / 1000;
  var bM = (breadthMM || 0) / 1000;
  var tM = (thicknessMM || 0) / 1000;
  var areaPer = Math.round(lM * bM * 10000) / 10000;
  var volPer = Math.round(lM * bM * tM * 10000) / 10000;
  var qty = quantity || 0;
  return {
    lengthM: lM,
    breadthM: bM,
    thicknessM: tM,
    areaPerPanel: Math.round(areaPer * 100) / 100,
    volumePerPanel: volPer,
    quantity: qty,
    totalArea: Math.round(areaPer * qty * 100) / 100,
    totalVolume: Math.round(volPer * qty * 100) / 100
  };
}

// ====== FIREBASE SYNC - Starts on admin login ======
function startWorkSync() {
  if (_workSyncStarted) return;
  _workSyncStarted = true;

  for (var i = 0; i < _workListeners.length; i++) {
    try { _workListeners[i](); } catch(e) {}
  }
  _workListeners = [];

  // Listen to panels collection
  _workListeners.push(FB.listen('panels', function(docs) {
    _panelEntries = docs || [];
    _panelEntries.sort(function(a, b) {
      return (a.name || '').toLowerCase() > (b.name || '').toLowerCase() ? 1 : -1;
    });
    if (document.getElementById('panelCalcContainer')) renderPanelCalculator();
  }));

  // Listen to tables collection
  _workListeners.push(FB.listen('tables', function(docs) {
    _tableAssignments = docs || [];
    _tableAssignments.sort(function(a, b) {
      return (a.tableNum || 0) - (b.tableNum || 0);
    });
    if (_tableAssignments.length === 0) initDefaultTables();
    if (document.getElementById('tableAssignContainer')) renderTableAssignments();
  }));

  // Listen to work progress collection
  _workListeners.push(FB.listen('workprogress', function(docs) {
    _workProgress = docs || [];
    _workProgress.sort(function(a, b) {
      if (a.date !== b.date) return (b.date || '') > (a.date || '') ? 1 : -1;
      return (a.tableName || '') > (b.tableName || '') ? 1 : -1;
    });
    if (document.getElementById('workProgressContainer')) renderWorkProgress();
    if (document.getElementById('areaCoverageContainer')) renderAreaCoverage();
  }));
}

function initDefaultTables() {
  var promises = [];
  for (var t = 0; t < DEFAULT_TABLES; t++) {
    var id = 'table_' + (t + 1);
    promises.push(FB.save('tables', id, {
      id: id, tableNum: t + 1, tableName: 'Table ' + (t + 1),
      workName: '', workers: [], panelsDone: 0, panelsTotal: 0, notes: ''
    }));
  }
  Promise.all(promises);
}

function renderWorkSection() {
  startWorkSync();
  _progressDateFilter = '';
  var dateEl = document.getElementById('progressDateFilter');
  if (dateEl) dateEl.value = '';
}

// ====== HELPER FUNCTIONS ======
function getWorkerNames(wids) {
  if (!wids || wids.length === 0) return '';
  var names = [];
  for (var i = 0; i < wids.length; i++) {
    var w = findWorker(wids[i]);
    if (w) names.push(w.name);
  }
  return names.join(', ');
}

function getWorkerNamesBadges(wids) {
  if (!wids || wids.length === 0) return '<span style="color:#94a3b8;font-size:11px">Not assigned</span>';
  var html = '';
  for (var i = 0; i < wids.length; i++) {
    var w = findWorker(wids[i]);
    if (w) {
      html += '<span style="display:inline-block;background:#eff6ff;color:#2563eb;padding:1px 6px;border-radius:8px;font-size:10px;font-weight:600;margin:1px">' + w.name + '</span>';
    }
  }
  return html || '<span style="color:#94a3b8;font-size:11px">Not assigned</span>';
}

function statCard(value, label, color, bgColor) {
  return '<div style="flex:1;min-width:110px;background:' + bgColor + ';padding:14px 12px;border-radius:12px;text-align:center;border:1px solid ' + color + '18;transition:transform 0.2s" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">' +
    '<div style="font-size:24px;font-weight:900;color:' + color + ';line-height:1">' + value + '</div>' +
    '<div style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px">' + label + '</div></div>';
}

function formField(label, id, type, value, placeholder, extraAttrs) {
  var attrs = extraAttrs || '';
  if (type === 'number' && attrs.indexOf('min=') === -1) attrs += ' min="0"';
  return '<div class="form-group"><label class="form-label">' + label + '</label>' +
    '<input type="' + type + '" id="' + id + '" class="form-control" value="' + (value !== undefined && value !== null ? value : '') + '"' +
    (placeholder ? ' placeholder="' + placeholder + '"' : '') +
    ' ' + attrs + '></div>';
}

function modalButtons(saveText, saveFn) {
  return '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="' + saveFn + '">' +
    '<span class="material-symbols-outlined" style="font-size:16px">save</span> ' + saveText + '</button></div>';
}

// ====== PANEL CALCULATOR ======
function renderPanelCalculator() {
  var container = document.getElementById('panelCalcContainer');
  if (!container) return;

  if (_panelEntries.length === 0) {
    container.innerHTML = '<div class="empty-state">' +
      '<span class="material-symbols-outlined" style="font-size:48px;color:#cbd5e1">view_in_ar</span>' +
      '<p style="margin-top:12px;font-size:15px;font-weight:600">No items added yet</p>' +
      '<p style="font-size:12px;color:#94a3b8">Click "Add Item" to add panels, boards, or any material</p></div>';
    return;
  }

  // Calculate totals
  var grandArea = 0, grandQty = 0, grandCost = 0, grandVolume = 0;
  for (var c = 0; c < _panelEntries.length; c++) {
    var pc = _panelEntries[c];
    var cc = calculatePanelArea(pc.length, pc.breadth, pc.thickness, pc.quantity);
    grandArea += cc.totalArea;
    grandQty += pc.quantity || 0;
    grandCost += cc.totalArea * (pc.rate || 0);
    grandVolume += cc.totalVolume;
  }

  var html = '<div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap">' +
    statCard(_panelEntries.length, 'Item Types', '#2563eb', '#eff6ff') +
    statCard(grandQty, 'Total Pieces', '#7c3aed', '#f5f3ff') +
    statCard(grandArea.toFixed(2) + ' m\u00B2', 'Total Area', '#059669', '#ecfdf5') +
    statCard(grandVolume.toFixed(3) + ' m\u00B3', 'Total Volume', '#0891b2', '#ecfeff');

  if (grandCost > 0) {
    html += statCard('AED ' + grandCost.toFixed(0), 'Estimated Cost', '#dc2626', '#fef2f2');
  }
  html += '</div>';

  // Table
  html += '<div class="table-responsive"><table class="data-table">' +
    '<thead><tr>' +
      '<th style="width:30px">#</th>' +
      '<th>Item Name</th>' +
      '<th>Dimensions (L x B x T)</th>' +
      '<th>Area/Piece</th>' +
      '<th>Volume/Piece</th>' +
      '<th>Quantity</th>' +
      '<th>Total Area</th>' +
      '<th>Rate/m\u00B2</th>' +
      '<th>Cost (AED)</th>' +
      '<th style="width:80px">Actions</th>' +
    '</tr></thead><tbody>';

  for (var i = 0; i < _panelEntries.length; i++) {
    var p = _panelEntries[i];
    var calc = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
    var cost = calc.totalArea * (p.rate || 0);
    var thicknessDisplay = (p.thickness || 0) > 0 ? ' x ' + p.thickness : '';

    html += '<tr>' +
      '<td style="font-weight:700;color:#64748b">' + (i + 1) + '</td>' +
      '<td>' +
        '<div style="font-weight:700;color:#0f172a;font-size:14px">' + (p.name || 'Item') + '</div>' +
      '</td>' +
      '<td>' +
        '<div style="font-family:monospace;font-size:13px;color:#475569">' +
          (p.length || 0) + ' x ' + (p.breadth || 0) + thicknessDisplay + ' mm' +
        '</div>' +
        '<div style="font-size:10px;color:#94a3b8">' +
          calc.lengthM + ' x ' + calc.breadthM + (calc.thicknessM > 0 ? ' x ' + calc.thicknessM : '') + ' m' +
        '</div>' +
      '</td>' +
      '<td><strong>' + calc.areaPerPanel + '</strong> m\u00B2</td>' +
      '<td>' + (calc.volumePerPanel > 0 ? calc.volumePerPanel + ' m\u00B3' : '-') + '</td>' +
      '<td>' +
        '<span style="display:inline-block;background:#eff6ff;color:#2563eb;padding:2px 10px;border-radius:12px;font-weight:800;font-size:14px">' + (p.quantity || 0) + '</span>' +
      '</td>' +
      '<td><strong style="color:#059669;font-size:15px">' + calc.totalArea + ' m\u00B2</strong></td>' +
      '<td>' + (p.rate ? '<span style="color:#475569">AED ' + p.rate + '</span>' : '<span style="color:#cbd5e1">-</span>') + '</td>' +
      '<td>' + (cost > 0 ? '<strong style="color:#dc2626">AED ' + cost.toFixed(2) + '</strong>' : '<span style="color:#cbd5e1">-</span>') + '</td>' +
      '<td class="action-cell">' +
        '<button class="btn-icon btn-edit" onclick="editPanelEntry(' + i + ')" title="Edit"><span class="material-symbols-outlined">edit</span></button>' +
        '<button class="btn-icon btn-delete" onclick="deletePanelEntry(' + i + ')" title="Delete"><span class="material-symbols-outlined">delete</span></button>' +
      '</td>' +
    '</tr>';
  }

  html += '</tbody>' +
    '<tfoot><tr style="background:linear-gradient(135deg,#f0f4f9,#e8eef7);font-weight:800">' +
      '<td colspan="5" style="font-size:13px;color:#0f172a">GRAND TOTAL</td>' +
      '<td><span style="background:#2563eb;color:white;padding:2px 10px;border-radius:12px;font-size:14px">' + grandQty + '</span></td>' +
      '<td style="color:#059669;font-size:15px">' + grandArea.toFixed(2) + ' m\u00B2</td>' +
      '<td></td>' +
      '<td>' + (grandCost > 0 ? '<strong style="color:#dc2626">AED ' + grandCost.toFixed(2) + '</strong>' : '') + '</td>' +
      '<td></td>' +
    '</tr></tfoot></table></div>';

  container.innerHTML = html;
}

function showAddPanelModal(editIndex) {
  var isEdit = editIndex !== undefined && editIndex !== null;
  var ex = isEdit ? _panelEntries[editIndex] : null;

  var html = '<div class="form-grid">' +
    formField('Item Name', 'pnlName', 'text', ex ? ex.name : '', 'e.g. Wall Panel 100mm, MDF Board') +
    formField('Length (mm)', 'pnlLength', 'number', ex ? ex.length : 6000, '6000', 'oninput="liveCalcPanel()"') +
    formField('Breadth (mm)', 'pnlBreadth', 'number', ex ? ex.breadth : 1200, '1200', 'oninput="liveCalcPanel()"') +
    formField('Thickness (mm)', 'pnlThickness', 'number', ex ? ex.thickness : 100, '100', 'oninput="liveCalcPanel()"') +
    formField('Quantity (No. of Pieces)', 'pnlQty', 'number', ex ? ex.quantity : 1, '10', 'min="1" oninput="liveCalcPanel()"') +
    formField('Rate per m\u00B2 (AED)', 'pnlRate', 'number', ex ? (ex.rate || '') : '', '50', 'step="0.5" oninput="liveCalcPanel()"') +
    '</div>';

  // Live calculation preview
  html += '<div id="pnlPreview" style="margin-top:14px;padding:16px;background:linear-gradient(135deg,#f0f4f9,#e8eef7);border-radius:12px;border:1px solid #e2e8f0">' +
    '<div style="font-weight:800;font-size:12px;color:#0f172a;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Live Calculation</div>' +
    '<div id="pnlPreviewContent" style="font-size:14px;color:#475569;line-height:1.8">Enter dimensions to see calculation...</div>' +
    '</div>';

  html += modalButtons(isEdit ? 'Update Item' : 'Add Item', 'savePanelEntry(' + (isEdit ? editIndex : -1) + ')');

  showModal(html, isEdit ? 'Edit Item' : 'Add New Item');
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

  if (l <= 0 || b <= 0 || q <= 0) {
    el.innerHTML = '<span style="color:#94a3b8">Enter valid length, breadth and quantity</span>';
    return;
  }

  var calc = calculatePanelArea(l, b, t, q);
  var cost = calc.totalArea * r;

  var lines = [];
  lines.push('<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">');
  lines.push('<div><span style="color:#64748b">Dimensions:</span> <strong>' + l + ' x ' + b + (t > 0 ? ' x ' + t : '') + ' mm</strong></div>');
  lines.push('<div><span style="color:#64748b">In Meters:</span> <strong>' + calc.lengthM + ' x ' + calc.breadthM + (calc.thicknessM > 0 ? ' x ' + calc.thicknessM : '') + ' m</strong></div>');
  lines.push('<div><span style="color:#64748b">Area/Piece:</span> <strong style="color:#2563eb">' + calc.areaPerPanel + ' m\u00B2</strong></div>');
  if (calc.volumePerPanel > 0) {
    lines.push('<div><span style="color:#64748b">Volume/Piece:</span> <strong>' + calc.volumePerPanel + ' m\u00B3</strong></div>');
  }
  lines.push('</div>');

  lines.push('<div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;gap:20px;flex-wrap:wrap">');
  lines.push('<div><span style="color:#64748b">Pieces:</span> <strong style="font-size:16px;color:#7c3aed">' + q + '</strong></div>');
  lines.push('<div><span style="color:#64748b">Total Area:</span> <strong style="font-size:18px;color:#059669">' + calc.totalArea + ' m\u00B2</strong></div>');
  if (calc.totalVolume > 0) {
    lines.push('<div><span style="color:#64748b">Total Volume:</span> <strong style="font-size:16px;color:#0891b2">' + calc.totalVolume + ' m\u00B3</strong></div>');
  }
  if (r > 0) {
    lines.push('<div><span style="color:#64748b">Cost:</span> <strong style="font-size:18px;color:#dc2626">AED ' + cost.toFixed(2) + '</strong></div>');
  }
  lines.push('</div>');

  el.innerHTML = lines.join('');
}

function savePanelEntry(editIndex) {
  var name = document.getElementById('pnlName').value.trim() || 'Item';
  var length = parseFloat(document.getElementById('pnlLength').value) || 0;
  var breadth = parseFloat(document.getElementById('pnlBreadth').value) || 0;
  var thickness = parseFloat(document.getElementById('pnlThickness').value) || 0;
  var quantity = parseInt(document.getElementById('pnlQty').value) || 0;
  var rate = parseFloat(document.getElementById('pnlRate').value) || 0;

  if (!length || !breadth || !quantity) {
    showToast('Enter length, breadth and quantity', 'error');
    return;
  }

  var docId;
  if (editIndex >= 0 && _panelEntries[editIndex]) {
    docId = _panelEntries[editIndex].id || ('panel_' + Date.now());
  } else {
    docId = 'panel_' + Date.now();
  }

  FB.save('panels', docId, {
    id: docId, name: name, length: length, breadth: breadth,
    thickness: thickness, quantity: quantity, rate: rate,
    createdAt: editIndex >= 0 ? (_panelEntries[editIndex].createdAt || tNow()) : tNow(),
    updatedAt: tNow()
  }).then(function() {
    closeModal();
    showToast(editIndex >= 0 ? 'Item updated!' : 'Item added!', 'success');
  }).catch(function(e) {
    showToast('Error: ' + e.message, 'error');
  });
}

function editPanelEntry(index) { showAddPanelModal(index); }

function deletePanelEntry(index) {
  var p = _panelEntries[index];
  if (!p) return;
  showConfirm('Delete "' + (p.name || 'Item') + '"? This cannot be undone.', function() {
    FB.delete('panels', p.id).then(function() {
      showToast('Item deleted', 'info');
    });
  });
}

// ====== TABLE ASSIGNMENTS ======
function renderTableAssignments() {
  var container = document.getElementById('tableAssignContainer');
  if (!container) return;

  if (_tableAssignments.length === 0) {
    container.innerHTML = '<div class="text-muted text-center" style="padding:20px">Initializing tables...</div>';
    return;
  }

  // Calculate totals
  var totalDone = 0, totalTarget = 0, tablesWithWork = 0;
  for (var x = 0; x < _tableAssignments.length; x++) {
    totalDone += _tableAssignments[x].panelsDone || 0;
    totalTarget += _tableAssignments[x].panelsTotal || 0;
    if (_tableAssignments[x].workName) tablesWithWork++;
  }
  var overallProgress = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0;
  var overallColor = overallProgress >= 80 ? '#059669' : overallProgress >= 40 ? '#d97706' : '#dc2626';

  var html = '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
    statCard(_tableAssignments.length, 'Total Tables', '#2563eb', '#eff6ff') +
    statCard(tablesWithWork, 'Active Tables', '#7c3aed', '#f5f3ff') +
    statCard(totalDone + '/' + totalTarget, 'Panels Done', '#059669', '#ecfdf5') +
    statCard(overallProgress + '%', 'Overall Progress', overallColor, overallProgress >= 80 ? '#ecfdf5' : overallProgress >= 40 ? '#fffbeb' : '#fef2f2') +
    '</div>';

  // Table
  html += '<div class="table-responsive"><table class="data-table">' +
    '<thead><tr>' +
      '<th style="width:30px">#</th>' +
      '<th>Table Name</th>' +
      '<th>Work Description</th>' +
      '<th>Assigned Workers</th>' +
      '<th style="width:60px">Done</th>' +
      '<th style="width:60px">Target</th>' +
      '<th style="width:130px">Progress</th>' +
      '<th>Notes</th>' +
      '<th style="width:50px">Edit</th>' +
    '</tr></thead><tbody>';

  for (var i = 0; i < _tableAssignments.length; i++) {
    var tb = _tableAssignments[i];
    var progress = (tb.panelsTotal || 0) > 0 ? Math.min(100, Math.round(((tb.panelsDone || 0) / tb.panelsTotal) * 100)) : 0;
    var pColor = progress >= 80 ? '#059669' : progress >= 40 ? '#d97706' : progress > 0 ? '#dc2626' : '#cbd5e1';
    var workersBadges = getWorkerNamesBadges(tb.workers);

    html += '<tr' + (progress >= 100 ? ' style="background:#ecfdf5"' : '') + '>' +
      '<td style="font-weight:700;color:#64748b">' + (tb.tableNum || i + 1) + '</td>' +
      '<td><strong style="font-size:14px;color:#0f172a">' + (tb.tableName || 'Table ' + (i + 1)) + '</strong></td>' +
      '<td>' + (tb.workName ? '<span style="color:#475569">' + tb.workName + '</span>' : '<span style="color:#cbd5e1">No work assigned</span>') + '</td>' +
      '<td>' + workersBadges + '</td>' +
      '<td><strong style="color:#059669;font-size:15px">' + (tb.panelsDone || 0) + '</strong></td>' +
      '<td style="color:#64748b">' + (tb.panelsTotal || 0) + '</td>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<div style="flex:1;background:#e2e8f0;border-radius:4px;height:10px;overflow:hidden;min-width:60px">' +
            '<div style="background:' + pColor + ';height:100%;width:' + progress + '%;border-radius:4px;transition:width 0.5s ease"></div>' +
          '</div>' +
          '<span style="font-size:12px;font-weight:800;color:' + pColor + ';min-width:36px;text-align:right">' + progress + '%</span>' +
        '</div>' +
      '</td>' +
      '<td style="font-size:11px;color:#64748b;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + (tb.notes || '') + '">' + (tb.notes || '-') + '</td>' +
      '<td>' +
        '<button class="btn-icon btn-edit" onclick="editTableAssignment(' + i + ')" title="Edit Table"><span class="material-symbols-outlined">edit</span></button>' +
      '</td>' +
    '</tr>';
  }

  html += '</tbody></table></div>';

  html += '<div style="margin-top:14px;text-align:center">' +
    '<button class="btn btn-primary btn-sm" onclick="addNewTable()">' +
      '<span class="material-symbols-outlined">add</span> Add More Table' +
    '</button></div>';

  container.innerHTML = html;
}

function editTableAssignment(index) {
  var tb = _tableAssignments[index];
  var ws = gW();

  var html = '<div class="form-grid">' +
    formField('Table Name', 'tblName', 'text', tb.tableName || '') +
    formField('Work Description', 'tblWork', 'text', tb.workName || '', 'e.g. Panel Installation, Cutting') +
    formField('Panels Completed', 'tblDone', 'number', tb.panelsDone || 0) +
    formField('Panels Target (Total)', 'tblTarget', 'number', tb.panelsTotal || 0) +
    formField('Notes', 'tblNotes', 'text', tb.notes || '', 'Any remarks...') +
    '</div>';

  // Worker assignment with checkboxes
  html += '<div style="margin-top:14px">' +
    '<label class="form-label">Assign Workers (select 2-3 per table)</label>' +
    '<div style="max-height:220px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;padding:6px">';

  var sections = ['Indian', 'Pakistani'];
  for (var s = 0; s < sections.length; s++) {
    html += '<div style="font-size:9px;font-weight:800;color:#94a3b8;padding:4px 8px;text-transform:uppercase;letter-spacing:1.5px;margin-top:' + (s > 0 ? '8px' : '0') + '">' + sections[s] + ' Workers</div>';
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (!w.on || w.sec !== sections[s]) continue;
      var checked = indexOf(tb.workers || [], w.wid) !== -1 ? ' checked' : '';
      html += '<label style="display:flex;align-items:center;gap:8px;padding:5px 8px;cursor:pointer;border-radius:6px;transition:background 0.15s;font-size:13px" ' +
        'onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'transparent\'">' +
        '<input type="checkbox" class="tblWorkerCb" value="' + w.wid + '"' + checked + ' style="width:16px;height:16px;accent-color:#2563eb">' +
        '<strong style="color:#0f172a">' + w.name + '</strong>' +
        '<span style="color:#94a3b8;margin-left:auto;font-size:10px;font-family:monospace">' + w.wid + '</span>' +
        '</label>';
    }
  }
  html += '</div></div>';

  html += modalButtons('Save Table', 'saveTableAssignment(' + index + ')');
  showModal(html, 'Edit ' + (tb.tableName || 'Table ' + (index + 1)));
}

function saveTableAssignment(index) {
  var tb = _tableAssignments[index];
  var docId = tb.id || ('table_' + (tb.tableNum || index + 1));

  var cbs = document.querySelectorAll('.tblWorkerCb:checked');
  var workers = [];
  for (var i = 0; i < cbs.length; i++) workers.push(cbs[i].value);

  FB.save('tables', docId, {
    id: docId,
    tableNum: tb.tableNum || index + 1,
    tableName: document.getElementById('tblName').value.trim() || 'Table ' + (index + 1),
    workName: document.getElementById('tblWork').value.trim(),
    workers: workers,
    panelsDone: parseInt(document.getElementById('tblDone').value) || 0,
    panelsTotal: parseInt(document.getElementById('tblTarget').value) || 0,
    notes: document.getElementById('tblNotes').value.trim()
  }).then(function() {
    closeModal();
    showToast('Table saved!', 'success');
  }).catch(function(e) {
    showToast('Error: ' + e.message, 'error');
  });
}

function addNewTable() {
  var num = _tableAssignments.length + 1;
  var id = 'table_' + num + '_' + Date.now();
  FB.save('tables', id, {
    id: id, tableNum: num, tableName: 'Table ' + num,
    workName: '', workers: [], panelsDone: 0, panelsTotal: 0, notes: ''
  }).then(function() {
    showToast('Table ' + num + ' added!', 'success');
  });
}

// ====== AREA COVERAGE - DATE WISE ======
function renderAreaCoverage() {
  var container = document.getElementById('areaCoverageContainer');
  if (!container) return;

  if (_workProgress.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined" style="font-size:40px;color:#cbd5e1">area_chart</span>' +
      '<p style="margin-top:10px;font-size:14px;font-weight:600">No area coverage data yet</p>' +
      '<p style="font-size:12px;color:#94a3b8">Add work progress entries to track area covered per day</p></div>';
    return;
  }

  // Group by date
  var dateMap = {};
  var totalPanelsAll = 0, totalAreaAll = 0;
  for (var i = 0; i < _workProgress.length; i++) {
    var p = _workProgress[i];
    var d = p.date || 'Unknown';
    if (!dateMap[d]) dateMap[d] = { panels: 0, area: 0, entries: 0 };
    dateMap[d].panels += p.panelsDone || 0;
    dateMap[d].area += p.areaCovered || 0;
    dateMap[d].entries++;
    totalPanelsAll += p.panelsDone || 0;
    totalAreaAll += p.areaCovered || 0;
  }

  var dates = Object.keys(dateMap).sort(function(a, b) { return b > a ? 1 : -1; });
  var avgPanels = dates.length > 0 ? Math.round(totalPanelsAll / dates.length) : 0;
  var avgArea = dates.length > 0 ? Math.round(totalAreaAll / dates.length * 100) / 100 : 0;

  var html = '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
    statCard(dates.length, 'Working Days', '#2563eb', '#eff6ff') +
    statCard(totalPanelsAll, 'Total Panels', '#059669', '#ecfdf5') +
    statCard(totalAreaAll.toFixed(2) + ' m\u00B2', 'Total Area', '#d97706', '#fffbeb') +
    statCard(avgPanels + ' / ' + avgArea + ' m\u00B2', 'Avg Per Day', '#7c3aed', '#f5f3ff') +
    '</div>';

  // Date-wise table
  html += '<div class="table-responsive"><table class="data-table">' +
    '<thead><tr>' +
      '<th>#</th><th>Date</th><th>Entries</th><th>Panels Done</th><th>Area Covered (m\u00B2)</th><th>Cumulative Area</th>' +
    '</tr></thead><tbody>';

  var cumArea = 0;
  // Reverse for chronological cumulative
  var chronoDates = dates.slice().reverse();
  var cumMap = {};
  for (var ci = 0; ci < chronoDates.length; ci++) {
    cumArea += dateMap[chronoDates[ci]].area;
    cumMap[chronoDates[ci]] = Math.round(cumArea * 100) / 100;
  }

  for (var di = 0; di < dates.length; di++) {
    var dk = dates[di];
    var dayData = dateMap[dk];
    var isToday = dk === tD();

    html += '<tr' + (isToday ? ' style="background:#fffbeb;border-left:3px solid #d97706"' : '') + '>' +
      '<td style="font-weight:700;color:#64748b">' + (di + 1) + '</td>' +
      '<td>' +
        '<strong style="font-size:14px;color:#0f172a">' + formatDateStr(dk) + '</strong>' +
        (isToday ? ' <span style="background:#d97706;color:white;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:700">TODAY</span>' : '') +
      '</td>' +
      '<td><span style="background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:8px;font-size:12px;font-weight:700">' + dayData.entries + '</span></td>' +
      '<td><strong style="color:#059669;font-size:16px">' + dayData.panels + '</strong></td>' +
      '<td><strong style="color:#d97706;font-size:16px">' + dayData.area.toFixed(2) + ' m\u00B2</strong></td>' +
      '<td><span style="color:#7c3aed;font-weight:700">' + (cumMap[dk] || 0) + ' m\u00B2</span></td>' +
    '</tr>';
  }

  html += '</tbody>' +
    '<tfoot><tr style="background:linear-gradient(135deg,#f0f4f9,#e8eef7);font-weight:800">' +
      '<td colspan="3" style="font-size:13px">GRAND TOTAL (' + dates.length + ' days)</td>' +
      '<td style="color:#059669;font-size:16px">' + totalPanelsAll + '</td>' +
      '<td style="color:#d97706;font-size:16px">' + totalAreaAll.toFixed(2) + ' m\u00B2</td>' +
      '<td></td>' +
    '</tr></tfoot></table></div>';

  container.innerHTML = html;
}

// ====== WORK PROGRESS ======
function renderWorkProgress() {
  var container = document.getElementById('workProgressContainer');
  if (!container) return;

  // Filter by date if set
  var filtered = _workProgress;
  if (_progressDateFilter) {
    filtered = [];
    for (var f = 0; f < _workProgress.length; f++) {
      if (_workProgress[f].date === _progressDateFilter) filtered.push(_workProgress[f]);
    }
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">' +
      '<span class="material-symbols-outlined" style="font-size:40px;color:#cbd5e1">trending_up</span>' +
      '<p style="margin-top:10px;font-size:14px;font-weight:600">' +
        (_progressDateFilter ? 'No entries for ' + formatDateStr(_progressDateFilter) : 'No progress entries yet') +
      '</p><p style="font-size:12px;color:#94a3b8">Click "Add Progress" to start tracking daily work</p></div>';
    return;
  }

  // Group by date
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

  var html = '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
    statCard(filtered.length, 'Entries', '#2563eb', '#eff6ff') +
    statCard(tP, 'Panels', '#059669', '#ecfdf5') +
    statCard(tA.toFixed(2) + ' m\u00B2', 'Area Covered', '#d97706', '#fffbeb') +
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

    html += '<div style="margin-bottom:20px">' +
      '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:linear-gradient(135deg,' + (isToday ? '#fffbeb,#fef3c7' : '#eff6ff,#f8fafc') + ');border-radius:12px;margin-bottom:10px;border:1px solid ' + (isToday ? 'rgba(217,119,6,0.2)' : 'rgba(37,99,235,0.1)') + '">' +
        '<span class="material-symbols-outlined" style="color:' + (isToday ? '#d97706' : '#2563eb') + ';font-size:22px">calendar_today</span>' +
        '<div>' +
          '<strong style="font-size:16px;color:#0f172a">' + formatDateStr(dk) + '</strong>' +
          (isToday ? ' <span style="background:#d97706;color:white;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;margin-left:6px">TODAY</span>' : '') +
        '</div>' +
        '<div style="margin-left:auto;display:flex;gap:16px">' +
          '<div style="text-align:center"><div style="font-size:18px;font-weight:900;color:#059669">' + dayP + '</div><div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase">Panels</div></div>' +
          '<div style="text-align:center"><div style="font-size:18px;font-weight:900;color:#d97706">' + dayA.toFixed(2) + '</div><div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase">m\u00B2 Area</div></div>' +
        '</div>' +
      '</div>';

    html += '<div class="table-responsive"><table class="data-table"><thead><tr>' +
      '<th>#</th><th>Table</th><th>Work</th><th>Workers</th><th>Panels</th><th>Area (m\u00B2)</th><th>Notes</th><th>Actions</th>' +
      '</tr></thead><tbody>';

    for (var ei = 0; ei < entries.length; ei++) {
      var entry = entries[ei];
      // Find original index in _workProgress
      var origIdx = -1;
      for (var oi = 0; oi < _workProgress.length; oi++) {
        if (_workProgress[oi].id === entry.id) { origIdx = oi; break; }
      }
      var wN = getWorkerNames(entry.workers);

      html += '<tr>' +
        '<td style="font-weight:700;color:#64748b">' + (ei + 1) + '</td>' +
        '<td><strong>' + (entry.tableName || '-') + '</strong></td>' +
        '<td>' + (entry.workName || '-') + '</td>' +
        '<td style="font-size:12px">' + (wN || '<span style="color:#94a3b8">-</span>') + '</td>' +
        '<td><strong style="color:#059669;font-size:15px">' + (entry.panelsDone || 0) + '</strong></td>' +
        '<td><strong style="color:#d97706">' + (entry.areaCovered || 0) + '</strong></td>' +
        '<td style="font-size:11px;color:#64748b">' + (entry.notes || '-') + '</td>' +
        '<td class="action-cell">' +
          '<button class="btn-icon btn-edit" onclick="editProgress(' + origIdx + ')" title="Edit"><span class="material-symbols-outlined">edit</span></button>' +
          '<button class="btn-icon btn-delete" onclick="deleteProgress(' + origIdx + ')" title="Delete"><span class="material-symbols-outlined">delete</span></button>' +
        '</td></tr>';
    }
    html += '</tbody></table></div></div>';
  }

  container.innerHTML = html;

  // Also update area coverage
  renderAreaCoverage();
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

function showAddProgressModal(editIndex) {
  var isEdit = editIndex !== undefined && editIndex !== null;
  var existing = isEdit ? _workProgress[editIndex] : null;

  var html = '<div class="form-grid">' +
    formField('Date', 'wpDate', 'date', existing ? existing.date : tD());

  html += '<div class="form-group"><label class="form-label">Table</label><select id="wpTable" class="form-control" onchange="autoFillProgressWork()">';
  for (var t = 0; t < _tableAssignments.length; t++) {
    var sel = (existing && existing.tableNum === _tableAssignments[t].tableNum) ? ' selected' : '';
    html += '<option value="' + t + '"' + sel + '>' + (_tableAssignments[t].tableName || 'Table ' + (t + 1)) + '</option>';
  }
  html += '</select></div>';

  html += formField('Work Name', 'wpWork', 'text', existing ? (existing.workName || '') : '', 'e.g. Panel Installation, Cutting') +
    formField('Panels Completed', 'wpPanels', 'number', existing ? (existing.panelsDone || '') : '', '5', 'min="0"') +
    formField('Area Covered (m\u00B2)', 'wpArea', 'number', existing ? (existing.areaCovered || '') : '', '36.0', 'min="0" step="0.01"') +
    formField('Notes / Remarks', 'wpNotes', 'text', existing ? (existing.notes || '') : '', 'Any details about today\'s work...') +
    '</div>';

  html += modalButtons(isEdit ? 'Update Progress' : 'Save Progress', 'saveProgress(' + (isEdit ? editIndex : -1) + ')');

  showModal(html, isEdit ? 'Edit Work Progress' : 'Add Work Progress');
}

function autoFillProgressWork() {
  var tidx = parseInt(document.getElementById('wpTable').value);
  var tb = _tableAssignments[tidx];
  if (tb && tb.workName) {
    var workEl = document.getElementById('wpWork');
    if (workEl && !workEl.value) workEl.value = tb.workName;
  }
}

function saveProgress(editIndex) {
  var tableIdx = parseInt(document.getElementById('wpTable').value);
  var table = _tableAssignments[tableIdx];

  var entry = {
    date: document.getElementById('wpDate').value,
    tableNum: table.tableNum || tableIdx + 1,
    tableName: table.tableName || 'Table',
    workName: document.getElementById('wpWork').value.trim() || table.workName || '',
    workers: (table.workers || []).slice(),
    panelsDone: parseInt(document.getElementById('wpPanels').value) || 0,
    areaCovered: parseFloat(document.getElementById('wpArea').value) || 0,
    notes: document.getElementById('wpNotes').value.trim(),
    createdAt: editIndex >= 0 ? (_workProgress[editIndex].createdAt || tNow()) : tNow(),
    updatedAt: tNow()
  };

  var docId;
  if (editIndex >= 0 && _workProgress[editIndex]) {
    docId = _workProgress[editIndex].id || ('wp_' + Date.now());
  } else {
    docId = 'wp_' + Date.now();
  }
  entry.id = docId;

  FB.save('workprogress', docId, entry).then(function() {
    closeModal();
    showToast(editIndex >= 0 ? 'Progress updated!' : 'Progress saved!', 'success');
  }).catch(function(e) {
    showToast('Error: ' + e.message, 'error');
  });
}

function editProgress(index) {
  if (index < 0 || index >= _workProgress.length) return;
  showAddProgressModal(index);
}

function deleteProgress(index) {
  if (index < 0 || index >= _workProgress.length) return;
  var p = _workProgress[index];
  showConfirm('Delete this progress entry from ' + formatDateStr(p.date) + '?', function() {
    FB.delete('workprogress', p.id).then(function() {
      showToast('Entry deleted', 'info');
    });
  });
}

// ====== PDF EXPORT ======
function exportWorkPDF() {
  loadLogoForPDF().then(function() {
    var doc = new jspdf.jsPDF('landscape');
    var y = addPDFHeader(doc, 'Work Area & Panel Report', 'COP31 Project - ' + formatDateStr(tD()));
    var pH = doc.internal.pageSize.getHeight();

    // Panels
    if (_panelEntries.length > 0) {
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175);
      doc.text('ITEMS & MATERIALS (' + _panelEntries.length + ' types)', 14, y + 8);

      var pRows = [], gA2 = 0, gQ = 0, gC = 0;
      for (var i = 0; i < _panelEntries.length; i++) {
        var p = _panelEntries[i];
        var cl = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
        var co = cl.totalArea * (p.rate || 0);
        gA2 += cl.totalArea; gQ += p.quantity || 0; gC += co;
        pRows.push([i + 1, p.name || 'Item',
          (p.length || 0) + ' x ' + (p.breadth || 0) + (p.thickness ? ' x ' + p.thickness : '') + ' mm',
          cl.areaPerPanel + ' m2', p.quantity || 0, cl.totalArea + ' m2',
          p.rate ? 'AED ' + p.rate : '-', co > 0 ? 'AED ' + co.toFixed(2) : '-']);
      }

      doc.autoTable({
        startY: y + 12,
        head: [['#', 'Item Name', 'Dimensions', 'Area/Pc', 'Qty', 'Total Area', 'Rate/m2', 'Cost']],
        body: pRows, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [240, 245, 255] },
        foot: [['', 'GRAND TOTAL', '', '', gQ, gA2.toFixed(2) + ' m2', '', gC > 0 ? 'AED ' + gC.toFixed(2) : '']],
        footStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 9 }
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // Tables
    if (_tableAssignments.length > 0) {
      if (y + 50 > pH - 20) { doc.addPage(); y = addPDFHeader(doc, 'Table Assignments', 'Work Distribution'); }
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(217, 119, 6);
      doc.text('TABLE ASSIGNMENTS (' + _tableAssignments.length + ' tables)', 14, y + 8);

      var tRows = [];
      for (var t = 0; t < _tableAssignments.length; t++) {
        var tb = _tableAssignments[t];
        var wn = getWorkerNames(tb.workers);
        var pr = (tb.panelsTotal || 0) > 0 ? Math.round(((tb.panelsDone || 0) / tb.panelsTotal) * 100) + '%' : '0%';
        tRows.push([tb.tableNum || t + 1, tb.tableName || 'Table', tb.workName || '-',
          wn || '-', (tb.panelsDone || 0) + '/' + (tb.panelsTotal || 0), pr, tb.notes || '-']);
      }

      doc.autoTable({
        startY: y + 12,
        head: [['#', 'Table', 'Work', 'Workers', 'Done/Target', 'Progress', 'Notes']],
        body: tRows, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [254, 249, 235] }
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // Area Coverage Summary (Date-wise)
    if (_workProgress.length > 0) {
      if (y + 50 > pH - 20) { doc.addPage(); y = addPDFHeader(doc, 'Area Coverage', 'Date-wise Summary'); }
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(124, 58, 237);
      doc.text('AREA COVERAGE - DATE WISE', 14, y + 8);

      var dateMap = {};
      var tPAll = 0, tAAll = 0;
      for (var dm = 0; dm < _workProgress.length; dm++) {
        var dp = _workProgress[dm];
        var dd = dp.date || 'Unknown';
        if (!dateMap[dd]) dateMap[dd] = { panels: 0, area: 0 };
        dateMap[dd].panels += dp.panelsDone || 0;
        dateMap[dd].area += dp.areaCovered || 0;
        tPAll += dp.panelsDone || 0;
        tAAll += dp.areaCovered || 0;
      }

      var dKeys = Object.keys(dateMap).sort();
      var dRows = [];
      var cumArea = 0;
      for (var dk = 0; dk < dKeys.length; dk++) {
        var key = dKeys[dk];
        cumArea += dateMap[key].area;
        dRows.push([dk + 1, formatDateStr(key), dateMap[key].panels, dateMap[key].area.toFixed(2) + ' m2', Math.round(cumArea * 100) / 100 + ' m2']);
      }

      doc.autoTable({
        startY: y + 12,
        head: [['#', 'Date', 'Panels Done', 'Area Covered', 'Cumulative Area']],
        body: dRows, theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        foot: [['', 'TOTAL (' + dKeys.length + ' days)', tPAll, tAAll.toFixed(2) + ' m2', '']],
        footStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 10 }
      });
      y = doc.lastAutoTable.finalY + 12;

      // Detailed Progress
      if (y + 50 > pH - 20) { doc.addPage(); y = addPDFHeader(doc, 'Progress Details', 'All Entries'); }
      doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(5, 150, 105);
      doc.text('DETAILED PROGRESS (' + _workProgress.length + ' entries)', 14, y + 8);

      var wRows = [];
      for (var wp = 0; wp < _workProgress.length; wp++) {
        var pr2 = _workProgress[wp];
        var pn = getWorkerNames(pr2.workers);
        wRows.push([wp + 1, formatDateStr(pr2.date), pr2.tableName || '-', pr2.workName || '-',
          pn || '-', pr2.panelsDone || 0, (pr2.areaCovered || 0) + ' m2', pr2.notes || '-']);
      }

      doc.autoTable({
        startY: y + 12,
        head: [['#', 'Date', 'Table', 'Work', 'Workers', 'Panels', 'Area', 'Notes']],
        body: wRows, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [240, 255, 250] },
        foot: [['', '', '', '', 'TOTAL', tPAll, tAAll.toFixed(2) + ' m2', '']],
        footStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' }
      });
    }

    addPDFFooter(doc);
    doc.save('albowry_work_report_' + tD() + '.pdf');
    showToast('Work Report PDF downloaded!', 'success');
  });
}

function exportWorkCSV() {
  var csv = COMPANY.full + '\nWork Area & Panel Report\nGenerated: ' + fmtDT(tNow()) + '\n\n';

  // Items
  csv += 'ITEMS & MATERIALS\n';
  csv += 'Item Name,Length(mm),Breadth(mm),Thickness(mm),Area/Piece(m2),Quantity,Total Area(m2),Rate(AED/m2),Cost(AED)\n';
  var gA3 = 0, gQ2 = 0;
  for (var i = 0; i < _panelEntries.length; i++) {
    var p = _panelEntries[i];
    var cl = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
    var co = cl.totalArea * (p.rate || 0);
    gA3 += cl.totalArea; gQ2 += p.quantity || 0;
    csv += '"' + (p.name || 'Item') + '",' + (p.length || 0) + ',' + (p.breadth || 0) + ',' + (p.thickness || 0) + ',' +
      cl.areaPerPanel + ',' + (p.quantity || 0) + ',' + cl.totalArea + ',' + (p.rate || 0) + ',' + co.toFixed(2) + '\n';
  }
  csv += ',,,,,TOTAL,' + gA3.toFixed(2) + ' m2\n\n';

  // Tables
  csv += 'TABLE ASSIGNMENTS\n';
  csv += 'Table,Work,Workers,Panels Done,Panels Target,Progress,Notes\n';
  for (var t = 0; t < _tableAssignments.length; t++) {
    var tb = _tableAssignments[t];
    var wn = getWorkerNames(tb.workers);
    var pr = (tb.panelsTotal || 0) > 0 ? Math.round(((tb.panelsDone || 0) / tb.panelsTotal) * 100) + '%' : '0%';
    csv += '"' + (tb.tableName || '') + '","' + (tb.workName || '') + '","' + (wn || '') + '",' +
      (tb.panelsDone || 0) + ',' + (tb.panelsTotal || 0) + ',' + pr + ',"' + (tb.notes || '') + '"\n';
  }
  csv += '\n';

  // Area Coverage Date-wise
  csv += 'AREA COVERAGE - DATE WISE\n';
  csv += 'Date,Panels Done,Area Covered(m2),Cumulative Area(m2)\n';
  var dateMap2 = {};
  for (var dm2 = 0; dm2 < _workProgress.length; dm2++) {
    var dp2 = _workProgress[dm2];
    var dd2 = dp2.date || 'Unknown';
    if (!dateMap2[dd2]) dateMap2[dd2] = { panels: 0, area: 0 };
    dateMap2[dd2].panels += dp2.panelsDone || 0;
    dateMap2[dd2].area += dp2.areaCovered || 0;
  }
  var dKeys2 = Object.keys(dateMap2).sort();
  var cumA2 = 0;
  for (var dk2 = 0; dk2 < dKeys2.length; dk2++) {
    var k2 = dKeys2[dk2];
    cumA2 += dateMap2[k2].area;
    csv += formatDateStr(k2) + ',' + dateMap2[k2].panels + ',' + dateMap2[k2].area.toFixed(2) + ',' + cumA2.toFixed(2) + '\n';
  }
  csv += '\n';

  // Detailed Progress
  csv += 'DETAILED PROGRESS\n';
  csv += 'Date,Table,Work,Workers,Panels,Area(m2),Notes\n';
  for (var wp = 0; wp < _workProgress.length; wp++) {
    var pr3 = _workProgress[wp];
    var pn2 = getWorkerNames(pr3.workers);
    csv += formatDateStr(pr3.date) + ',"' + (pr3.tableName || '') + '","' + (pr3.workName || '') + '","' +
      (pn2 || '') + '",' + (pr3.panelsDone || 0) + ',' + (pr3.areaCovered || 0) + ',"' + (pr3.notes || '') + '"\n';
  }

  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = 'albowry_work_report_' + tD() + '.csv';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Work Report CSV downloaded!', 'success');
}

console.log('[ALB] work.js v25 loaded - Professional Level');
