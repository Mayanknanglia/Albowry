// AL BOWRY CARPENTRY LLC - Work & Panel Management
// work.js v25 - Firebase persistent + Date-wise progress + Real tables

var _panelEntries = [];
var _tableAssignments = [];
var _workProgress = [];
var _workListeners = [];
var _workSyncStarted = false;
var DEFAULT_TABLES = 15;

function calculatePanelArea(lengthMM, breadthMM, thicknessMM, quantity) {
  var lengthM = lengthMM / 1000;
  var breadthM = breadthMM / 1000;
  var areaPerPanel = lengthM * breadthM;
  var totalArea = areaPerPanel * quantity;
  return {
    areaPerPanel: Math.round(areaPerPanel * 100) / 100,
    quantity: quantity,
    totalArea: Math.round(totalArea * 100) / 100
  };
}

// ====== START SYNC ON APP LOAD ======
function startWorkSync() {
  if (_workSyncStarted) return;
  _workSyncStarted = true;

  for (var i = 0; i < _workListeners.length; i++) {
    try { _workListeners[i](); } catch(e) {}
  }
  _workListeners = [];

  _workListeners.push(FB.listen('panels', function(docs) {
    _panelEntries = docs || [];
    if (document.getElementById('panelCalcContainer')) renderPanelCalculator();
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
}

// ====== PANEL CALCULATOR ======
function renderPanelCalculator() {
  var container = document.getElementById('panelCalcContainer');
  if (!container) return;

  if (_panelEntries.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">view_in_ar</span><p>No items yet. Click "Add Item" to start.</p></div>';
    return;
  }

  var grandArea = 0, grandQty = 0, grandCost = 0;
  for (var c = 0; c < _panelEntries.length; c++) {
    var pc = _panelEntries[c];
    var cc = calculatePanelArea(pc.length || 0, pc.breadth || 0, pc.thickness || 0, pc.quantity || 0);
    grandArea += cc.totalArea;
    grandQty += pc.quantity || 0;
    grandCost += cc.totalArea * (pc.rate || 0);
  }

  var html = '<div style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:120px;background:#eff6ff;padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(37,99,235,0.15)">' +
      '<div style="font-size:24px;font-weight:900;color:#2563eb">' + _panelEntries.length + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Items</div></div>' +
    '<div style="flex:1;min-width:120px;background:#ecfdf5;padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(5,150,105,0.15)">' +
      '<div style="font-size:24px;font-weight:900;color:#059669">' + grandQty + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Total Pieces</div></div>' +
    '<div style="flex:1;min-width:120px;background:#fffbeb;padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(217,119,6,0.15)">' +
      '<div style="font-size:24px;font-weight:900;color:#d97706">' + grandArea.toFixed(2) + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Total Area (m2)</div></div>';
  if (grandCost > 0) {
    html += '<div style="flex:1;min-width:120px;background:#fef2f2;padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(220,38,38,0.15)">' +
      '<div style="font-size:24px;font-weight:900;color:#dc2626">AED ' + grandCost.toFixed(0) + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Total Cost</div></div>';
  }
  html += '</div>';

  html += '<div class="table-responsive"><table class="data-table">' +
    '<thead><tr><th>#</th><th>Item Name</th><th>L (mm)</th><th>B (mm)</th><th>T (mm)</th>' +
    '<th>Area/Pc</th><th>Qty</th><th>Total Area</th><th>Rate/m2</th><th>Cost</th><th>Actions</th></tr></thead><tbody>';

  for (var i = 0; i < _panelEntries.length; i++) {
    var p = _panelEntries[i];
    var calc = calculatePanelArea(p.length || 0, p.breadth || 0, p.thickness || 0, p.quantity || 0);
    var cost = calc.totalArea * (p.rate || 0);
    html += '<tr><td>' + (i+1) + '</td><td><strong>' + (p.name||'Item') + '</strong></td>' +
      '<td>' + (p.length||0) + '</td><td>' + (p.breadth||0) + '</td><td>' + (p.thickness||0) + '</td>' +
      '<td>' + calc.areaPerPanel + ' m2</td><td><strong>' + (p.quantity||0) + '</strong></td>' +
      '<td><strong style="color:#059669">' + calc.totalArea + ' m2</strong></td>' +
      '<td>' + (p.rate ? 'AED ' + p.rate : '-') + '</td>' +
      '<td>' + (cost > 0 ? 'AED ' + cost.toFixed(2) : '-') + '</td>' +
      '<td class="action-cell">' +
        '<button class="btn-icon btn-edit" onclick="editPanelEntry(' + i + ')"><span class="material-symbols-outlined">edit</span></button>' +
        '<button class="btn-icon btn-delete" onclick="deletePanelEntry(' + i + ')"><span class="material-symbols-outlined">delete</span></button>' +
      '</td></tr>';
  }

  html += '</tbody><tfoot><tr style="background:#f0f4f9;font-weight:800">' +
    '<td colspan="6">GRAND TOTAL</td><td>' + grandQty + '</td>' +
    '<td style="color:#059669">' + grandArea.toFixed(2) + ' m2</td>' +
    '<td></td><td>' + (grandCost > 0 ? 'AED ' + grandCost.toFixed(2) : '') + '</td><td></td>' +
    '</tr></tfoot></table></div>';

  container.innerHTML = html;
}

function showAddPanelModal(editIndex) {
  var isEdit = editIndex !== undefined && editIndex !== null;
  var existing = isEdit ? _panelEntries[editIndex] : null;

  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Item Name</label>' +
      '<input type="text" id="pnlName" class="form-control" placeholder="e.g. Wall Panel A" value="' + (existing ? existing.name : '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Length (mm)</label>' +
      '<input type="number" id="pnlLength" class="form-control" value="' + (existing ? existing.length : '6000') + '" oninput="updatePanelPreview()"></div>' +
    '<div class="form-group"><label class="form-label">Breadth (mm)</label>' +
      '<input type="number" id="pnlBreadth" class="form-control" value="' + (existing ? existing.breadth : '1200') + '" oninput="updatePanelPreview()"></div>' +
    '<div class="form-group"><label class="form-label">Thickness (mm)</label>' +
      '<input type="number" id="pnlThickness" class="form-control" value="' + (existing ? existing.thickness : '100') + '" oninput="updatePanelPreview()"></div>' +
    '<div class="form-group"><label class="form-label">Quantity</label>' +
      '<input type="number" id="pnlQty" class="form-control" value="' + (existing ? existing.quantity : '1') + '" min="1" oninput="updatePanelPreview()"></div>' +
    '<div class="form-group"><label class="form-label">Rate per m2 (AED)</label>' +
      '<input type="number" id="pnlRate" class="form-control" value="' + (existing ? (existing.rate||'') : '') + '" min="0" step="0.5" oninput="updatePanelPreview()"></div>' +
    '</div>' +
    '<div id="panelPreview" style="background:#f0f4f9;padding:12px;border-radius:8px;margin-top:12px">' +
      '<div id="panelPreviewText" style="font-size:13px;color:#475569">Enter dimensions...</div></div>' +
    '<div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end">' +
      '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" onclick="savePanelEntry(' + (isEdit ? editIndex : -1) + ')">' +
        (isEdit ? 'Update' : 'Add Item') + '</button></div>';

  showModal(html, isEdit ? 'Edit Item' : 'Add New Item');
  setTimeout(updatePanelPreview, 100);
}

function updatePanelPreview() {
  var preview = document.getElementById('panelPreviewText');
  if (!preview) return;
  var l = parseFloat(document.getElementById('pnlLength').value) || 0;
  var b = parseFloat(document.getElementById('pnlBreadth').value) || 0;
  var t = parseFloat(document.getElementById('pnlThickness').value) || 0;
  var q = parseInt(document.getElementById('pnlQty').value) || 0;
  var r = parseFloat(document.getElementById('pnlRate').value) || 0;
  if (l <= 0 || b <= 0 || q <= 0) { preview.textContent = 'Enter valid dimensions'; return; }
  var calc = calculatePanelArea(l, b, t, q);
  var cost = calc.totalArea * r;
  preview.innerHTML = '<strong>' + l + 'mm x ' + b + 'mm x ' + t + 'mm = ' + calc.areaPerPanel + ' m2/piece</strong><br>' +
    calc.areaPerPanel + ' x ' + q + ' = <strong style="color:#059669">' + calc.totalArea + ' m2</strong>' +
    (r > 0 ? ' | Cost: <strong style="color:#2563eb">AED ' + cost.toFixed(2) + '</strong>' : '');
}

function savePanelEntry(editIndex) {
  var name = document.getElementById('pnlName').value.trim() || 'Item';
  var length = parseFloat(document.getElementById('pnlLength').value) || 0;
  var breadth = parseFloat(document.getElementById('pnlBreadth').value) || 0;
  var thickness = parseFloat(document.getElementById('pnlThickness').value) || 0;
  var quantity = parseInt(document.getElementById('pnlQty').value) || 0;
  var rate = parseFloat(document.getElementById('pnlRate').value) || 0;
  if (!length || !breadth || !quantity) { showToast('Enter length, breadth and quantity', 'error'); return; }

  var docId;
  if (editIndex >= 0 && _panelEntries[editIndex]) {
    docId = _panelEntries[editIndex].id || ('panel_' + Date.now());
  } else {
    docId = 'panel_' + Date.now();
  }

  FB.save('panels', docId, {
    id: docId, name: name, length: length, breadth: breadth,
    thickness: thickness, quantity: quantity, rate: rate
  }).then(function() {
    closeModal();
    showToast(editIndex >= 0 ? 'Item updated!' : 'Item added!', 'success');
  });
}

function editPanelEntry(index) { showAddPanelModal(index); }

function deletePanelEntry(index) {
  var p = _panelEntries[index];
  if (!p) return;
  showConfirm('Delete "' + (p.name || 'Item') + '"?', function() {
    FB.delete('panels', p.id || ('panel_' + index)).then(function() {
      showToast('Deleted', 'info');
    });
  });
}

// ====== TABLE ASSIGNMENTS - REAL TABLE DESIGN ======
function renderTableAssignments() {
  var container = document.getElementById('tableAssignContainer');
  if (!container) return;

  if (_tableAssignments.length === 0) {
    container.innerHTML = '<div class="text-muted text-center">Initializing tables...</div>';
    return;
  }

  var totalDone = 0, totalTarget = 0;
  for (var tt = 0; tt < _tableAssignments.length; tt++) {
    totalDone += _tableAssignments[tt].panelsDone || 0;
    totalTarget += _tableAssignments[tt].panelsTotal || 0;
  }
  var overallProgress = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0;

  var html = '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:120px;background:#eff6ff;padding:12px;border-radius:10px;text-align:center">' +
      '<div style="font-size:24px;font-weight:900;color:#2563eb">' + _tableAssignments.length + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Tables</div></div>' +
    '<div style="flex:1;min-width:120px;background:#ecfdf5;padding:12px;border-radius:10px;text-align:center">' +
      '<div style="font-size:24px;font-weight:900;color:#059669">' + totalDone + '/' + totalTarget + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Panels Done</div></div>' +
    '<div style="flex:1;min-width:120px;background:#fffbeb;padding:12px;border-radius:10px;text-align:center">' +
      '<div style="font-size:24px;font-weight:900;color:#d97706">' + overallProgress + '%</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Overall Progress</div></div>' +
    '</div>';

  // Real table layout
  html += '<div class="table-responsive"><table class="data-table">' +
    '<thead><tr><th>#</th><th>Table Name</th><th>Work</th><th>Workers</th><th>Done</th><th>Target</th><th>Progress</th><th>Notes</th><th>Actions</th></tr></thead><tbody>';

  for (var i = 0; i < _tableAssignments.length; i++) {
    var table = _tableAssignments[i];
    var wNames = [];
    for (var w = 0; w < (table.workers || []).length; w++) {
      var worker = findWorker(table.workers[w]);
      if (worker) wNames.push(worker.name);
    }
    var progress = (table.panelsTotal || 0) > 0 ? Math.min(100, Math.round(((table.panelsDone || 0) / table.panelsTotal) * 100)) : 0;
    var pColor = progress >= 80 ? '#059669' : progress >= 40 ? '#d97706' : '#dc2626';

    html += '<tr>' +
      '<td>' + (table.tableNum || (i+1)) + '</td>' +
      '<td><strong>' + (table.tableName || 'Table') + '</strong></td>' +
      '<td>' + (table.workName || '-') + '</td>' +
      '<td>' + (wNames.length > 0 ? wNames.join(', ') : '<span style="color:#94a3b8">Not assigned</span>') + '</td>' +
      '<td><strong style="color:#059669">' + (table.panelsDone || 0) + '</strong></td>' +
      '<td>' + (table.panelsTotal || 0) + '</td>' +
      '<td>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<div style="flex:1;background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;min-width:60px">' +
            '<div style="background:' + pColor + ';height:100%;width:' + progress + '%;border-radius:4px"></div></div>' +
          '<span style="font-size:11px;font-weight:700;color:' + pColor + '">' + progress + '%</span>' +
        '</div>' +
      '</td>' +
      '<td style="font-size:11px;color:#64748b">' + (table.notes || '-') + '</td>' +
      '<td>' +
        '<button class="btn-icon btn-edit" onclick="editTableAssignment(' + i + ')"><span class="material-symbols-outlined">edit</span></button>' +
      '</td></tr>';
  }

  html += '</tbody></table></div>';

  html += '<div style="margin-top:14px;text-align:center">' +
    '<button class="btn btn-primary btn-sm" onclick="addNewTable()">' +
      '<span class="material-symbols-outlined">add</span> Add Table</button></div>';

  container.innerHTML = html;
}

function editTableAssignment(index) {
  var table = _tableAssignments[index];
  var ws = gW();

  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Table Name</label>' +
      '<input type="text" id="tblName" class="form-control" value="' + (table.tableName || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Work Name</label>' +
      '<input type="text" id="tblWork" class="form-control" value="' + (table.workName || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Panels Done</label>' +
      '<input type="number" id="tblDone" class="form-control" min="0" value="' + (table.panelsDone || 0) + '"></div>' +
    '<div class="form-group"><label class="form-label">Panels Target</label>' +
      '<input type="number" id="tblTarget" class="form-control" min="0" value="' + (table.panelsTotal || 0) + '"></div>' +
    '<div class="form-group"><label class="form-label">Notes</label>' +
      '<input type="text" id="tblNotes" class="form-control" value="' + (table.notes || '') + '"></div>' +
    '</div>';

  html += '<div style="margin-top:12px"><label class="form-label">Assign Workers</label>' +
    '<div style="max-height:200px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;padding:4px">';

  var sections = ['Indian', 'Pakistani'];
  for (var s = 0; s < sections.length; s++) {
    html += '<div style="font-size:9px;font-weight:800;color:#94a3b8;padding:3px 6px;text-transform:uppercase;letter-spacing:1px">' + sections[s] + '</div>';
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (!w.on || w.sec !== sections[s]) continue;
      var checked = indexOf(table.workers || [], w.wid) !== -1 ? ' checked' : '';
      html += '<label style="display:flex;align-items:center;gap:6px;padding:3px 6px;cursor:pointer;font-size:12px">' +
        '<input type="checkbox" class="tblWorkerCb" value="' + w.wid + '"' + checked + ' style="accent-color:#2563eb">' +
        '<strong>' + w.name + '</strong><span style="color:#94a3b8;margin-left:auto;font-size:10px">' + w.wid + '</span></label>';
    }
  }
  html += '</div></div>';

  html += '<div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="saveTableAssignment(' + index + ')">Save</button></div>';

  showModal(html, 'Edit ' + (table.tableName || 'Table'));
}

function saveTableAssignment(index) {
  var table = _tableAssignments[index];
  var docId = table.id || ('table_' + (table.tableNum || (index + 1)));

  var cbs = document.querySelectorAll('.tblWorkerCb:checked');
  var workers = [];
  for (var i = 0; i < cbs.length; i++) workers.push(cbs[i].value);

  FB.save('tables', docId, {
    id: docId,
    tableNum: table.tableNum || (index + 1),
    tableName: document.getElementById('tblName').value.trim() || 'Table ' + (index + 1),
    workName: document.getElementById('tblWork').value.trim(),
    workers: workers,
    panelsDone: parseInt(document.getElementById('tblDone').value) || 0,
    panelsTotal: parseInt(document.getElementById('tblTarget').value) || 0,
    notes: document.getElementById('tblNotes').value.trim()
  }).then(function() {
    closeModal();
    showToast('Table updated!', 'success');
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

// ====== WORK PROGRESS - DATE WISE ======
function renderWorkProgress() {
  var container = document.getElementById('workProgressContainer');
  if (!container) return;

  if (_workProgress.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">trending_up</span><p>No progress entries. Click "Add Progress" to start.</p></div>';
    return;
  }

  // Group by date
  var dateGroups = {};
  var totalPanels = 0, totalArea = 0;
  for (var i = 0; i < _workProgress.length; i++) {
    var p = _workProgress[i];
    var d = p.date || 'Unknown';
    if (!dateGroups[d]) dateGroups[d] = [];
    dateGroups[d].push(p);
    totalPanels += p.panelsDone || 0;
    totalArea += p.areaCovered || 0;
  }

  var html = '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:120px;background:#eff6ff;padding:12px;border-radius:10px;text-align:center">' +
      '<div style="font-size:24px;font-weight:900;color:#2563eb">' + _workProgress.length + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Total Entries</div></div>' +
    '<div style="flex:1;min-width:120px;background:#ecfdf5;padding:12px;border-radius:10px;text-align:center">' +
      '<div style="font-size:24px;font-weight:900;color:#059669">' + totalPanels + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Total Panels</div></div>' +
    '<div style="flex:1;min-width:120px;background:#fffbeb;padding:12px;border-radius:10px;text-align:center">' +
      '<div style="font-size:24px;font-weight:900;color:#d97706">' + totalArea.toFixed(2) + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Total Area (m2)</div></div>' +
    '</div>';

  // Date-wise sections
  var dates = Object.keys(dateGroups).sort(function(a, b) { return b > a ? 1 : -1; });

  for (var di = 0; di < dates.length; di++) {
    var dateKey = dates[di];
    var entries = dateGroups[dateKey];
    var dayPanels = 0, dayArea = 0;
    for (var dp = 0; dp < entries.length; dp++) {
      dayPanels += entries[dp].panelsDone || 0;
      dayArea += entries[dp].areaCovered || 0;
    }

    html += '<div style="margin-bottom:16px">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:8px 12px;background:#f0f4f9;border-radius:8px">' +
        '<span class="material-symbols-outlined" style="color:#2563eb;font-size:18px">calendar_today</span>' +
        '<strong style="font-size:14px;color:#0f172a">' + formatDateStr(dateKey) + '</strong>' +
        '<span style="margin-left:auto;font-size:12px;color:#059669;font-weight:700">' + dayPanels + ' panels | ' + dayArea.toFixed(2) + ' m2</span>' +
      '</div>';

    html += '<div class="table-responsive"><table class="data-table">' +
      '<thead><tr><th>#</th><th>Table</th><th>Work</th><th>Workers</th><th>Panels</th><th>Area (m2)</th><th>Notes</th><th>Actions</th></tr></thead><tbody>';

    for (var ei = 0; ei < entries.length; ei++) {
      var entry = entries[ei];
      var wNames = [];
      for (var w = 0; w < (entry.workers || []).length; w++) {
        var worker = findWorker(entry.workers[w]);
        if (worker) wNames.push(worker.name);
      }

      html += '<tr>' +
        '<td>' + (ei + 1) + '</td>' +
        '<td><strong>' + (entry.tableName || '-') + '</strong></td>' +
        '<td>' + (entry.workName || '-') + '</td>' +
        '<td>' + (wNames.length > 0 ? wNames.join(', ') : '-') + '</td>' +
        '<td><strong style="color:#059669">' + (entry.panelsDone || 0) + '</strong></td>' +
        '<td><strong>' + (entry.areaCovered || 0) + '</strong></td>' +
        '<td style="font-size:11px;color:#64748b">' + (entry.notes || '-') + '</td>' +
        '<td class="action-cell">' +
          '<button class="btn-icon btn-edit" onclick="editProgress(' + _workProgress.indexOf(entry) + ')"><span class="material-symbols-outlined">edit</span></button>' +
          '<button class="btn-icon btn-delete" onclick="deleteProgress(' + _workProgress.indexOf(entry) + ')"><span class="material-symbols-outlined">delete</span></button>' +
        '</td></tr>';
    }

    html += '</tbody></table></div></div>';
  }

  container.innerHTML = html;
}

function showAddProgressModal(editIndex) {
  var isEdit = editIndex !== undefined && editIndex !== null;
  var existing = isEdit ? _workProgress[editIndex] : null;

  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Date</label>' +
      '<input type="date" id="wpDate" class="form-control" value="' + (existing ? existing.date : tD()) + '"></div>' +
    '<div class="form-group"><label class="form-label">Table</label><select id="wpTable" class="form-control">';

  for (var t = 0; t < _tableAssignments.length; t++) {
    var sel = (existing && existing.tableNum === _tableAssignments[t].tableNum) ? ' selected' : '';
    html += '<option value="' + t + '"' + sel + '>' + (_tableAssignments[t].tableName || 'Table') + '</option>';
  }

  html += '</select></div>' +
    '<div class="form-group"><label class="form-label">Work Name</label>' +
      '<input type="text" id="wpWork" class="form-control" value="' + (existing ? (existing.workName || '') : '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Panels Completed</label>' +
      '<input type="number" id="wpPanels" class="form-control" min="0" value="' + (existing ? (existing.panelsDone || 0) : '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Area Covered (m2)</label>' +
      '<input type="number" id="wpArea" class="form-control" min="0" step="0.1" value="' + (existing ? (existing.areaCovered || 0) : '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Notes</label>' +
      '<input type="text" id="wpNotes" class="form-control" value="' + (existing ? (existing.notes || '') : '') + '"></div>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end">' +
      '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="btn btn-primary" onclick="saveProgress(' + (isEdit ? editIndex : -1) + ')">' +
        (isEdit ? 'Update' : 'Save') + '</button></div>';

  showModal(html, isEdit ? 'Edit Progress' : 'Add Work Progress');
}

function saveProgress(editIndex) {
  var tableIdx = parseInt(document.getElementById('wpTable').value);
  var table = _tableAssignments[tableIdx];
  var entry = {
    date: document.getElementById('wpDate').value,
    tableNum: table.tableNum || (tableIdx + 1),
    tableName: table.tableName || 'Table',
    workName: document.getElementById('wpWork').value.trim() || table.workName,
    workers: (table.workers || []).slice(),
    panelsDone: parseInt(document.getElementById('wpPanels').value) || 0,
    areaCovered: parseFloat(document.getElementById('wpArea').value) || 0,
    notes: document.getElementById('wpNotes').value.trim()
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
    showToast(editIndex >= 0 ? 'Updated!' : 'Saved!', 'success');
  });
}

function editProgress(index) { showAddProgressModal(index); }

function deleteProgress(index) {
  var p = _workProgress[index];
  if (!p) return;
  showConfirm('Delete this progress entry?', function() {
    FB.delete('workprogress', p.id || ('wp_' + index)).then(function() {
      showToast('Deleted', 'info');
    });
  });
}

// ====== PDF & CSV EXPORT ======
function exportWorkPDF() {
  loadLogoForPDF().then(function() {
    var doc = new jspdf.jsPDF('landscape');
    var startY = addPDFHeader(doc, 'Work Area & Panel Report', 'COP31 Project - Antalya, Turkey');

    if (_panelEntries.length > 0) {
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175);
      doc.text('ITEMS & PANELS (' + _panelEntries.length + ')', 14, startY + 8);
      var pRows = [];
      var gArea = 0, gQty = 0, gCost = 0;
      for (var i = 0; i < _panelEntries.length; i++) {
        var p = _panelEntries[i];
        var calc = calculatePanelArea(p.length||0, p.breadth||0, p.thickness||0, p.quantity||0);
        var cost = calc.totalArea * (p.rate||0);
        gArea += calc.totalArea; gQty += p.quantity||0; gCost += cost;
        pRows.push([i+1, p.name||'Item', (p.length||0)+'x'+(p.breadth||0)+'x'+(p.thickness||0)+' mm', calc.areaPerPanel+' m2', p.quantity||0, calc.totalArea+' m2', p.rate?'AED '+p.rate:'-', cost>0?'AED '+cost.toFixed(2):'-']);
      }
      doc.autoTable({ startY:startY+12, head:[['#','Item','Dimensions','Area/Pc','Qty','Total','Rate','Cost']], body:pRows, theme:'grid', styles:{fontSize:8,cellPadding:2}, headStyles:{fillColor:[30,64,175],textColor:255,fontStyle:'bold'}, alternateRowStyles:{fillColor:[240,245,255]}, foot:[['','','TOTAL','',gQty,gArea.toFixed(2)+' m2','',gCost>0?'AED '+gCost.toFixed(2):'']],footStyles:{fillColor:[5,150,105],textColor:255,fontStyle:'bold'} });
      startY = doc.lastAutoTable.finalY + 10;
    }

    if (_tableAssignments.length > 0) {
      if (startY+40 > doc.internal.pageSize.getHeight()-20) { doc.addPage(); startY=20; }
      doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(217,119,6);
      doc.text('TABLE ASSIGNMENTS (' + _tableAssignments.length + ')', 14, startY+8);
      var tRows = [];
      for (var t=0; t<_tableAssignments.length; t++) {
        var tb = _tableAssignments[t];
        var wn = [];
        for (var w=0; w<(tb.workers||[]).length; w++) { var wr=findWorker(tb.workers[w]); if(wr) wn.push(wr.name); }
        var prog = (tb.panelsTotal||0)>0 ? Math.round(((tb.panelsDone||0)/tb.panelsTotal)*100)+'%' : '0%';
        tRows.push([tb.tableNum||t+1, tb.tableName||'Table', tb.workName||'-', wn.join(', ')||'-', (tb.panelsDone||0)+'/'+(tb.panelsTotal||0), prog, tb.notes||'-']);
      }
      doc.autoTable({ startY:startY+12, head:[['#','Table','Work','Workers','Done/Target','Progress','Notes']], body:tRows, theme:'grid', styles:{fontSize:8,cellPadding:2}, headStyles:{fillColor:[217,119,6],textColor:255,fontStyle:'bold'}, alternateRowStyles:{fillColor:[254,249,235]} });
      startY = doc.lastAutoTable.finalY + 10;
    }

    if (_workProgress.length > 0) {
      if (startY+40 > doc.internal.pageSize.getHeight()-20) { doc.addPage(); startY=20; }
      doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(5,150,105);
      doc.text('DAILY PROGRESS (' + _workProgress.length + ')', 14, startY+8);
      var wRows = [];
      var tP=0, tA=0;
      for (var wp=0; wp<_workProgress.length; wp++) {
        var pr = _workProgress[wp];
        var pn = [];
        for (var pw=0; pw<(pr.workers||[]).length; pw++) { var pwr=findWorker(pr.workers[pw]); if(pwr) pn.push(pwr.name); }
        tP += pr.panelsDone||0; tA += pr.areaCovered||0;
        wRows.push([wp+1, formatDateStr(pr.date), pr.tableName||'-', pr.workName||'-', pn.join(', ')||'-', pr.panelsDone||0, (pr.areaCovered||0)+' m2', pr.notes||'-']);
      }
      doc.autoTable({ startY:startY+12, head:[['#','Date','Table','Work','Workers','Panels','Area','Notes']], body:wRows, theme:'grid', styles:{fontSize:8,cellPadding:2}, headStyles:{fillColor:[5,150,105],textColor:255,fontStyle:'bold'}, alternateRowStyles:{fillColor:[240,255,250]}, foot:[['','','','','TOTAL',tP,tA.toFixed(2)+' m2','']],footStyles:{fillColor:[30,64,175],textColor:255,fontStyle:'bold'} });
    }

    addPDFFooter(doc);
    doc.save('albowry_work_report_' + tD() + '.pdf');
    showToast('Work PDF downloaded!', 'success');
  });
}

function exportWorkCSV() {
  var csv = COMPANY.full + '\nWork Report\n' + fmtDT(tNow()) + '\n\n';
  csv += 'ITEMS\nName,L(mm),B(mm),T(mm),Area/Pc,Qty,Total Area,Rate,Cost\n';
  for (var i=0; i<_panelEntries.length; i++) {
    var p = _panelEntries[i];
    var calc = calculatePanelArea(p.length||0,p.breadth||0,p.thickness||0,p.quantity||0);
    csv += '"'+(p.name||'Item')+'",'+p.length+','+p.breadth+','+p.thickness+','+calc.areaPerPanel+','+p.quantity+','+calc.totalArea+','+(p.rate||0)+','+(calc.totalArea*(p.rate||0)).toFixed(2)+'\n';
  }
  csv += '\nTABLES\nTable,Work,Workers,Done,Target,Progress,Notes\n';
  for (var t=0; t<_tableAssignments.length; t++) {
    var tb = _tableAssignments[t];
    var wn = [];
    for (var w=0; w<(tb.workers||[]).length; w++) { var wr=findWorker(tb.workers[w]); if(wr) wn.push(wr.name); }
    var prog = (tb.panelsTotal||0)>0 ? Math.round(((tb.panelsDone||0)/tb.panelsTotal)*100)+'%' : '0%';
    csv += '"'+(tb.tableName||'')+'","'+(tb.workName||'')+'","'+wn.join('; ')+'",'+(tb.panelsDone||0)+','+(tb.panelsTotal||0)+','+prog+',"'+(tb.notes||'')+'"\n';
  }
  csv += '\nPROGRESS\nDate,Table,Work,Workers,Panels,Area,Notes\n';
  for (var wp=0; wp<_workProgress.length; wp++) {
    var pr = _workProgress[wp];
    var pn = [];
    for (var pw=0; pw<(pr.workers||[]).length; pw++) { var pwr=findWorker(pr.workers[pw]); if(pwr) pn.push(pwr.name); }
    csv += formatDateStr(pr.date)+','+(pr.tableName||'')+','+(pr.workName||'')+',"'+pn.join('; ')+'",'+(pr.panelsDone||0)+','+(pr.areaCovered||0)+',"'+(pr.notes||'')+'"\n';
  }
  var blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url; link.download = 'albowry_work_' + tD() + '.csv'; link.click();
  URL.revokeObjectURL(url);
  showToast('CSV downloaded!', 'success');
}

console.log('[ALB] work.js v25 loaded');
