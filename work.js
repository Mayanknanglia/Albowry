// AL BOWRY CARPENTRY LLC - Work & Panel Management
// work.js v22 - Full featured, editable, professional

var _panelEntries = [];
var _tableAssignments = [];
var _workProgress = [];
var DEFAULT_TABLES = 15;

// ====== PANEL AREA CALCULATOR ======
function calculatePanelArea(lengthMM, breadthMM, thicknessMM, quantity) {
  var lengthM = lengthMM / 1000;
  var breadthM = breadthMM / 1000;
  var thicknessM = thicknessMM / 1000;
  var areaPerPanel = lengthM * breadthM;
  var totalArea = areaPerPanel * quantity;
  return {
    lengthM: Math.round(lengthM * 1000) / 1000,
    breadthM: Math.round(breadthM * 1000) / 1000,
    thicknessM: Math.round(thicknessM * 1000) / 1000,
    areaPerPanel: Math.round(areaPerPanel * 100) / 100,
    quantity: quantity,
    totalArea: Math.round(totalArea * 100) / 100
  };
}

// ====== RENDER ALL ======
function renderWorkSection() {
  renderPanelCalculator();
  renderTableAssignments();
  renderWorkProgress();
}

// ====== PANEL CALCULATOR ======
function renderPanelCalculator() {
  var container = document.getElementById('panelCalcContainer');
  if (!container) return;

  if (_panelEntries.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">view_in_ar</span><p>No items yet. Click "Add Item" to start.</p></div>';
    return;
  }

  var grandTotalArea = 0;
  var grandTotalQty = 0;
  var grandTotalCost = 0;

  var html = '<div style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap">';

  for (var c = 0; c < _panelEntries.length; c++) {
    var pc = _panelEntries[c];
    var cc = calculatePanelArea(pc.length, pc.breadth, pc.thickness, pc.quantity);
    grandTotalArea += cc.totalArea;
    grandTotalQty += pc.quantity;
    grandTotalCost += cc.totalArea * (pc.rate || 0);
  }

  html += '<div style="flex:1;min-width:130px;background:#eff6ff;padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(37,99,235,0.15)">' +
    '<div style="font-size:26px;font-weight:900;color:#2563eb">' + _panelEntries.length + '</div>' +
    '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Items</div></div>';
  html += '<div style="flex:1;min-width:130px;background:#ecfdf5;padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(5,150,105,0.15)">' +
    '<div style="font-size:26px;font-weight:900;color:#059669">' + grandTotalQty + '</div>' +
    '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Total Pieces</div></div>';
  html += '<div style="flex:1;min-width:130px;background:#fffbeb;padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(217,119,6,0.15)">' +
    '<div style="font-size:26px;font-weight:900;color:#d97706">' + grandTotalArea.toFixed(2) + '</div>' +
    '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Total Area (m2)</div></div>';
  if (grandTotalCost > 0) {
    html += '<div style="flex:1;min-width:130px;background:#fef2f2;padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(220,38,38,0.15)">' +
      '<div style="font-size:26px;font-weight:900;color:#dc2626">AED ' + grandTotalCost.toFixed(0) + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Total Cost</div></div>';
  }
  html += '</div>';

  // Table
  html += '<div class="table-responsive"><table class="data-table">' +
    '<thead><tr><th>#</th><th>Item Name</th><th>L (mm)</th><th>B (mm)</th><th>T (mm)</th>' +
    '<th>Area/Piece (m2)</th><th>Qty</th><th>Total Area (m2)</th><th>Rate/m2</th><th>Cost</th><th>Actions</th></tr></thead><tbody>';

  for (var i = 0; i < _panelEntries.length; i++) {
    var p = _panelEntries[i];
    var calc = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
    var cost = calc.totalArea * (p.rate || 0);

    html += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td><strong>' + (p.name || 'Item ' + (i+1)) + '</strong></td>' +
      '<td>' + p.length + '</td>' +
      '<td>' + p.breadth + '</td>' +
      '<td>' + p.thickness + '</td>' +
      '<td>' + calc.areaPerPanel + '</td>' +
      '<td><strong>' + p.quantity + '</strong></td>' +
      '<td><strong style="color:#059669">' + calc.totalArea + ' m2</strong></td>' +
      '<td>' + (p.rate ? 'AED ' + p.rate : '-') + '</td>' +
      '<td>' + (cost > 0 ? 'AED ' + cost.toFixed(2) : '-') + '</td>' +
      '<td class="action-cell">' +
        '<button class="btn-icon btn-edit" onclick="editPanelEntry(' + i + ')" title="Edit"><span class="material-symbols-outlined">edit</span></button>' +
        '<button class="btn-icon btn-delete" onclick="deletePanelEntry(' + i + ')" title="Delete"><span class="material-symbols-outlined">delete</span></button>' +
      '</td></tr>';
  }

  html += '</tbody>' +
    '<tfoot><tr style="background:#f0f4f9;font-weight:800">' +
      '<td colspan="6">GRAND TOTAL</td>' +
      '<td>' + grandTotalQty + '</td>' +
      '<td style="color:#059669">' + grandTotalArea.toFixed(2) + ' m2</td>' +
      '<td></td>' +
      '<td>' + (grandTotalCost > 0 ? 'AED ' + grandTotalCost.toFixed(2) : '') + '</td>' +
      '<td></td>' +
    '</tr></tfoot></table></div>';

  container.innerHTML = html;
}

function showAddPanelModal(editIndex) {
  var isEdit = editIndex !== undefined && editIndex !== null;
  var existing = isEdit ? _panelEntries[editIndex] : null;

  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Item Name</label>' +
      '<input type="text" id="pnlName" class="form-control" placeholder="e.g. Wall Panel A, Door Frame" value="' + (existing ? existing.name : '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Length (mm)</label>' +
      '<input type="number" id="pnlLength" class="form-control" placeholder="6000" value="' + (existing ? existing.length : '6000') + '" oninput="updatePanelPreview()"></div>' +
    '<div class="form-group"><label class="form-label">Breadth (mm)</label>' +
      '<input type="number" id="pnlBreadth" class="form-control" placeholder="1200" value="' + (existing ? existing.breadth : '1200') + '" oninput="updatePanelPreview()"></div>' +
    '<div class="form-group"><label class="form-label">Thickness (mm)</label>' +
      '<input type="number" id="pnlThickness" class="form-control" placeholder="100" value="' + (existing ? existing.thickness : '100') + '" oninput="updatePanelPreview()"></div>' +
    '<div class="form-group"><label class="form-label">Quantity (No. of Pieces)</label>' +
      '<input type="number" id="pnlQty" class="form-control" placeholder="10" value="' + (existing ? existing.quantity : '1') + '" min="1" oninput="updatePanelPreview()"></div>' +
    '<div class="form-group"><label class="form-label">Rate per m2 (AED) - Optional</label>' +
      '<input type="number" id="pnlRate" class="form-control" placeholder="50" value="' + (existing ? (existing.rate || '') : '') + '" min="0" step="0.5" oninput="updatePanelPreview()"></div>' +
    '</div>';

  html += '<div id="panelPreview" style="background:#f0f4f9;padding:14px;border-radius:10px;margin-top:14px">' +
    '<div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:6px">Live Calculation</div>' +
    '<div id="panelPreviewText" style="font-size:13px;color:#475569">Enter dimensions...</div></div>';

  html += '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="savePanelEntry(' + (isEdit ? editIndex : -1) + ')">' +
      '<span class="material-symbols-outlined">' + (isEdit ? 'save' : 'add') + '</span> ' + (isEdit ? 'Update Item' : 'Add Item') +
    '</button></div>';

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

  if (l <= 0 || b <= 0 || q <= 0) {
    preview.textContent = 'Enter valid dimensions';
    return;
  }
  var calc = calculatePanelArea(l, b, t, q);
  var cost = calc.totalArea * r;
  preview.innerHTML =
    '<strong>' + l + 'mm x ' + b + 'mm x ' + t + 'mm = ' + calc.areaPerPanel + ' m2 per piece</strong><br>' +
    calc.areaPerPanel + ' m2 x ' + q + ' pieces = <strong style="color:#059669">' + calc.totalArea + ' m2 total area</strong>' +
    (r > 0 ? '<br>Cost: ' + calc.totalArea + ' x AED ' + r + ' = <strong style="color:#2563eb">AED ' + cost.toFixed(2) + '</strong>' : '');
}

function savePanelEntry(editIndex) {
  var name = document.getElementById('pnlName').value.trim();
  var length = parseFloat(document.getElementById('pnlLength').value);
  var breadth = parseFloat(document.getElementById('pnlBreadth').value);
  var thickness = parseFloat(document.getElementById('pnlThickness').value);
  var quantity = parseInt(document.getElementById('pnlQty').value);
  var rate = parseFloat(document.getElementById('pnlRate').value) || 0;

  if (!length || !breadth || !quantity) {
    showToast('Enter length, breadth and quantity', 'error');
    return;
  }

  var entry = {
    name: name || 'Item',
    length: length,
    breadth: breadth,
    thickness: thickness || 0,
    quantity: quantity,
    rate: rate
  };

  if (editIndex >= 0) {
    _panelEntries[editIndex] = entry;
    showToast('Item updated!', 'success');
  } else {
    _panelEntries.push(entry);
    showToast('Item added!', 'success');
  }

  closeModal();
  renderPanelCalculator();
}

function editPanelEntry(index) { showAddPanelModal(index); }

function deletePanelEntry(index) {
  showConfirm('Delete this item?', function() {
    _panelEntries.splice(index, 1);
    showToast('Item deleted', 'info');
    renderPanelCalculator();
  });
}

// ====== TABLE ASSIGNMENTS ======
function renderTableAssignments() {
  var container = document.getElementById('tableAssignContainer');
  if (!container) return;

  if (_tableAssignments.length === 0) {
    for (var t = 0; t < DEFAULT_TABLES; t++) {
      _tableAssignments.push({
        tableNum: t + 1,
        tableName: 'Table ' + (t + 1),
        workName: '',
        workers: [],
        panelsDone: 0,
        panelsTotal: 0,
        notes: ''
      });
    }
  }

  // Calculate totals
  var totalPanelsDone = 0;
  var totalPanelsTarget = 0;
  for (var tt = 0; tt < _tableAssignments.length; tt++) {
    totalPanelsDone += _tableAssignments[tt].panelsDone || 0;
    totalPanelsTarget += _tableAssignments[tt].panelsTotal || 0;
  }

  var html = '<div style="display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:130px;background:#eff6ff;padding:14px;border-radius:10px;text-align:center">' +
      '<div style="font-size:26px;font-weight:900;color:#2563eb">' + _tableAssignments.length + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Total Tables</div></div>' +
    '<div style="flex:1;min-width:130px;background:#ecfdf5;padding:14px;border-radius:10px;text-align:center">' +
      '<div style="font-size:26px;font-weight:900;color:#059669">' + totalPanelsDone + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Panels Done</div></div>' +
    '<div style="flex:1;min-width:130px;background:#fffbeb;padding:14px;border-radius:10px;text-align:center">' +
      '<div style="font-size:26px;font-weight:900;color:#d97706">' + totalPanelsTarget + '</div>' +
      '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase">Target Panels</div></div>' +
    '</div>';

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">';

  for (var i = 0; i < _tableAssignments.length; i++) {
    var table = _tableAssignments[i];
    var workerNames = [];
    for (var w = 0; w < table.workers.length; w++) {
      var worker = findWorker(table.workers[w]);
      if (worker) workerNames.push(worker.name);
    }

    // Auto calculate progress
    var progress = 0;
    if (table.panelsTotal > 0) {
      progress = Math.min(100, Math.round((table.panelsDone / table.panelsTotal) * 100));
    }
    var progressColor = progress >= 80 ? '#059669' : progress >= 40 ? '#d97706' : '#dc2626';

    html += '<div class="card" style="overflow:hidden">' +
      '<div style="padding:14px 18px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;background:linear-gradient(180deg,white,#f8fafc)">' +
        '<span class="material-symbols-outlined" style="color:#2563eb;font-size:20px">table_restaurant</span>' +
        '<strong style="flex:1;font-size:14px;color:#0f172a">' + table.tableName + '</strong>' +
        '<span class="badge badge-info" style="font-size:10px">' + table.workers.length + ' workers</span>' +
      '</div>' +
      '<div style="padding:14px 18px">';

    if (table.workName) {
      html += '<div style="font-size:12px;color:#64748b;margin-bottom:8px">Work: <strong style="color:#0f172a">' + table.workName + '</strong></div>';
    }

    // Panels done / total
    html += '<div style="display:flex;gap:10px;margin-bottom:8px">' +
      '<div style="flex:1;background:#f0f4f9;padding:8px;border-radius:8px;text-align:center">' +
        '<div style="font-size:18px;font-weight:900;color:#059669">' + (table.panelsDone || 0) + '</div>' +
        '<div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Done</div></div>' +
      '<div style="flex:1;background:#f0f4f9;padding:8px;border-radius:8px;text-align:center">' +
        '<div style="font-size:18px;font-weight:900;color:#d97706">' + (table.panelsTotal || 0) + '</div>' +
        '<div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">Target</div></div>' +
      '</div>';

    // Progress bar (auto calculated)
    html += '<div style="margin-bottom:8px">' +
      '<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;margin-bottom:3px">' +
        '<span>Progress</span><span style="color:' + progressColor + '">' + progress + '%</span></div>' +
      '<div style="background:#e2e8f0;border-radius:6px;height:7px;overflow:hidden">' +
        '<div style="background:' + progressColor + ';height:100%;width:' + progress + '%;border-radius:6px;transition:width 0.3s"></div>' +
      '</div></div>';

    // Workers
    if (workerNames.length > 0) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px">';
      for (var wn = 0; wn < workerNames.length; wn++) {
        html += '<span style="background:#eff6ff;color:#2563eb;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:600">' + workerNames[wn] + '</span>';
      }
      html += '</div>';
    }

    if (table.notes) {
      html += '<div style="font-size:10px;color:#64748b;background:#f8fafc;padding:5px 8px;border-radius:5px;margin-bottom:8px">' + table.notes + '</div>';
    }

    html += '<button class="btn btn-sm btn-secondary" onclick="editTableAssignment(' + i + ')" style="width:100%;font-size:12px">' +
      '<span class="material-symbols-outlined" style="font-size:16px">edit</span> Edit Table</button>';

    html += '</div></div>';
  }

  html += '</div>';
  html += '<div style="margin-top:14px;text-align:center">' +
    '<button class="btn btn-primary btn-sm" onclick="addNewTable()">' +
      '<span class="material-symbols-outlined">add</span> Add More Table</button></div>';

  container.innerHTML = html;
}

function editTableAssignment(index) {
  var table = _tableAssignments[index];
  var ws = gW();

  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Table Name</label>' +
      '<input type="text" id="tblName" class="form-control" value="' + table.tableName + '"></div>' +
    '<div class="form-group"><label class="form-label">Work Name</label>' +
      '<input type="text" id="tblWork" class="form-control" placeholder="e.g. Panel Installation" value="' + (table.workName || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Panels Done</label>' +
      '<input type="number" id="tblDone" class="form-control" min="0" value="' + (table.panelsDone || 0) + '"></div>' +
    '<div class="form-group"><label class="form-label">Panels Target (Total)</label>' +
      '<input type="number" id="tblTarget" class="form-control" min="0" value="' + (table.panelsTotal || 0) + '"></div>' +
    '<div class="form-group"><label class="form-label">Notes</label>' +
      '<input type="text" id="tblNotes" class="form-control" placeholder="Any notes..." value="' + (table.notes || '') + '"></div>' +
    '</div>';

  // Worker checkboxes
  html += '<div style="margin-top:14px"><label class="form-label">Assign Workers</label>' +
    '<div style="max-height:220px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;padding:6px">';

  var sections = ['Indian', 'Pakistani'];
  for (var s = 0; s < sections.length; s++) {
    html += '<div style="font-size:9px;font-weight:800;color:#94a3b8;padding:4px 8px;text-transform:uppercase;letter-spacing:1px;margin-top:4px">' + sections[s] + '</div>';
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (!w.on || w.sec !== sections[s]) continue;
      var checked = indexOf(table.workers, w.wid) !== -1 ? ' checked' : '';
      html += '<label style="display:flex;align-items:center;gap:6px;padding:4px 8px;cursor:pointer;border-radius:4px;font-size:12px" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'transparent\'">' +
        '<input type="checkbox" class="tblWorkerCb" value="' + w.wid + '"' + checked + ' style="width:15px;height:15px;accent-color:#2563eb">' +
        '<strong style="color:#0f172a">' + w.name + '</strong>' +
        '<span style="color:#94a3b8;margin-left:auto;font-size:10px">' + w.wid + '</span></label>';
    }
  }
  html += '</div></div>';

  html += '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="saveTableAssignment(' + index + ')"><span class="material-symbols-outlined">save</span> Save Table</button></div>';

  showModal(html, 'Edit ' + table.tableName);
}

function saveTableAssignment(index) {
  var name = document.getElementById('tblName').value.trim();
  var work = document.getElementById('tblWork').value.trim();
  var done = parseInt(document.getElementById('tblDone').value) || 0;
  var target = parseInt(document.getElementById('tblTarget').value) || 0;
  var notes = document.getElementById('tblNotes').value.trim();

  var cbs = document.querySelectorAll('.tblWorkerCb:checked');
  var workers = [];
  for (var i = 0; i < cbs.length; i++) workers.push(cbs[i].value);

  _tableAssignments[index] = {
    tableNum: index + 1,
    tableName: name || 'Table ' + (index + 1),
    workName: work,
    workers: workers,
    panelsDone: done,
    panelsTotal: target,
    notes: notes
  };

  closeModal();
  showToast('Table updated!', 'success');
  renderTableAssignments();
}

function addNewTable() {
  var num = _tableAssignments.length + 1;
  _tableAssignments.push({
    tableNum: num,
    tableName: 'Table ' + num,
    workName: '',
    workers: [],
    panelsDone: 0,
    panelsTotal: 0,
    notes: ''
  });
  showToast('Table ' + num + ' added!', 'success');
  renderTableAssignments();
}

// ====== WORK PROGRESS ======
function renderWorkProgress() {
  var container = document.getElementById('workProgressContainer');
  if (!container) return;

  if (_workProgress.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">trending_up</span><p>No progress entries yet. Click "Add Progress" to start tracking.</p></div>';
    return;
  }

  var totalPanels = 0;
  var totalArea = 0;

  var html = '<div class="table-responsive"><table class="data-table">' +
    '<thead><tr><th>#</th><th>Date</th><th>Table</th><th>Work</th><th>Workers</th><th>Panels</th><th>Area (m2)</th><th>Notes</th><th>Actions</th></tr></thead><tbody>';

  for (var i = 0; i < _workProgress.length; i++) {
    var p = _workProgress[i];
    var workerNames = [];
    for (var w = 0; w < (p.workers || []).length; w++) {
      var worker = findWorker(p.workers[w]);
      if (worker) workerNames.push(worker.name);
    }
    totalPanels += p.panelsDone || 0;
    totalArea += p.areaCovered || 0;

    html += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + (p.date || '-') + '</td>' +
      '<td><strong>' + (p.tableName || '-') + '</strong></td>' +
      '<td>' + (p.workName || '-') + '</td>' +
      '<td>' + (workerNames.length > 0 ? workerNames.join(', ') : '-') + '</td>' +
      '<td><strong>' + (p.panelsDone || 0) + '</strong></td>' +
      '<td><strong style="color:#059669">' + (p.areaCovered || 0) + '</strong></td>' +
      '<td>' + (p.notes || '-') + '</td>' +
      '<td class="action-cell">' +
        '<button class="btn-icon btn-edit" onclick="editProgress(' + i + ')" title="Edit"><span class="material-symbols-outlined">edit</span></button>' +
        '<button class="btn-icon btn-delete" onclick="deleteProgress(' + i + ')" title="Delete"><span class="material-symbols-outlined">delete</span></button>' +
      '</td></tr>';
  }

  html += '</tbody>' +
    '<tfoot><tr style="background:#f0f4f9;font-weight:800">' +
      '<td colspan="5">TOTAL</td>' +
      '<td>' + totalPanels + '</td>' +
      '<td style="color:#059669">' + totalArea.toFixed(2) + ' m2</td>' +
      '<td colspan="2"></td>' +
    '</tr></tfoot></table></div>';

  container.innerHTML = html;
}

function showAddProgressModal(editIndex) {
  var isEdit = editIndex !== undefined && editIndex !== null;
  var existing = isEdit ? _workProgress[editIndex] : null;

  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Date</label>' +
      '<input type="date" id="wpDate" class="form-control" value="' + (existing ? existing.date : tD()) + '"></div>' +
    '<div class="form-group"><label class="form-label">Table</label>' +
      '<select id="wpTable" class="form-control">';

  for (var t = 0; t < _tableAssignments.length; t++) {
    var sel = (existing && existing.tableNum === _tableAssignments[t].tableNum) ? ' selected' : '';
    html += '<option value="' + t + '"' + sel + '>' + _tableAssignments[t].tableName + '</option>';
  }

  html += '</select></div>' +
    '<div class="form-group"><label class="form-label">Work Name</label>' +
      '<input type="text" id="wpWork" class="form-control" placeholder="e.g. Panel Cutting" value="' + (existing ? (existing.workName || '') : '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Panels Completed</label>' +
      '<input type="number" id="wpPanels" class="form-control" placeholder="5" min="0" value="' + (existing ? (existing.panelsDone || 0) : '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Area Covered (m2)</label>' +
      '<input type="number" id="wpArea" class="form-control" placeholder="36.0" min="0" step="0.1" value="' + (existing ? (existing.areaCovered || 0) : '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Notes</label>' +
      '<input type="text" id="wpNotes" class="form-control" placeholder="Any notes..." value="' + (existing ? (existing.notes || '') : '') + '"></div>' +
    '</div>';

  html += '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="saveProgress(' + (isEdit ? editIndex : -1) + ')">' +
      '<span class="material-symbols-outlined">' + (isEdit ? 'save' : 'add') + '</span> ' + (isEdit ? 'Update' : 'Save Progress') +
    '</button></div>';

  showModal(html, isEdit ? 'Edit Progress' : 'Add Work Progress');
}

function saveProgress(editIndex) {
  var date = document.getElementById('wpDate').value;
  var tableIdx = parseInt(document.getElementById('wpTable').value);
  var workName = document.getElementById('wpWork').value.trim();
  var panelsDone = parseInt(document.getElementById('wpPanels').value) || 0;
  var areaCovered = parseFloat(document.getElementById('wpArea').value) || 0;
  var notes = document.getElementById('wpNotes').value.trim();

  var table = _tableAssignments[tableIdx];

  var entry = {
    date: date,
    tableNum: table.tableNum,
    tableName: table.tableName,
    workName: workName || table.workName,
    workers: table.workers.slice(),
    panelsDone: panelsDone,
    areaCovered: areaCovered,
    notes: notes
  };

  if (editIndex >= 0) {
    _workProgress[editIndex] = entry;
    showToast('Progress updated!', 'success');
  } else {
    _workProgress.push(entry);
    showToast('Progress saved!', 'success');
  }

  closeModal();
  renderWorkProgress();
}

function editProgress(index) { showAddProgressModal(index); }

function deleteProgress(index) {
  showConfirm('Delete this progress entry?', function() {
    _workProgress.splice(index, 1);
    showToast('Deleted', 'info');
    renderWorkProgress();
  });
}

// ====== WORK PDF EXPORT ======
function exportWorkPDF() {
  loadLogoForPDF().then(function() {
    var doc = new jspdf.jsPDF('landscape');
    var startY = addPDFHeader(doc, 'Work Area & Panel Report', 'COP31 Project - Antalya, Turkey');

    // Panel Summary
    if (_panelEntries.length > 0) {
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175);
      doc.text('ITEMS & PANELS (' + _panelEntries.length + ' types)', 14, startY + 8);

      var pRows = [];
      var grandArea = 0, grandQty = 0, grandCost = 0;
      for (var i = 0; i < _panelEntries.length; i++) {
        var p = _panelEntries[i];
        var calc = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
        var cost = calc.totalArea * (p.rate || 0);
        grandArea += calc.totalArea;
        grandQty += p.quantity;
        grandCost += cost;
        pRows.push([i + 1, p.name || 'Item', p.length + ' x ' + p.breadth + ' x ' + p.thickness + ' mm', calc.areaPerPanel + ' m2', p.quantity, calc.totalArea + ' m2', p.rate ? 'AED ' + p.rate : '-', cost > 0 ? 'AED ' + cost.toFixed(2) : '-']);
      }
      doc.autoTable({
        startY: startY + 12,
        head: [['#', 'Item Name', 'Dimensions', 'Area/Piece', 'Qty', 'Total Area', 'Rate/m2', 'Cost']],
        body: pRows, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 245, 255] },
        foot: [['', '', 'TOTAL', '', grandQty, grandArea.toFixed(2) + ' m2', '', grandCost > 0 ? 'AED ' + grandCost.toFixed(2) : '']],
        footStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' }
      });
      startY = doc.lastAutoTable.finalY + 10;
    }

    // Tables
    if (_tableAssignments.length > 0) {
      if (startY + 40 > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage(); startY = addPDFHeader(doc, 'Table Assignments', 'Work Distribution');
      }
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(217, 119, 6);
      doc.text('TABLE ASSIGNMENTS (' + _tableAssignments.length + ' tables)', 14, startY + 8);

      var tRows = [];
      for (var t = 0; t < _tableAssignments.length; t++) {
        var table = _tableAssignments[t];
        var wNames = [];
        for (var w = 0; w < table.workers.length; w++) {
          var wr = findWorker(table.workers[w]);
          if (wr) wNames.push(wr.name);
        }
        var prog = table.panelsTotal > 0 ? Math.round((table.panelsDone / table.panelsTotal) * 100) + '%' : '0%';
        tRows.push([table.tableNum, table.tableName, table.workName || '-', wNames.join(', ') || '-', (table.panelsDone || 0) + '/' + (table.panelsTotal || 0), prog, table.notes || '-']);
      }
      doc.autoTable({
        startY: startY + 12,
        head: [['#', 'Table', 'Work', 'Workers', 'Panels (Done/Target)', 'Progress', 'Notes']],
        body: tRows, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [254, 249, 235] }
      });
      startY = doc.lastAutoTable.finalY + 10;
    }

    // Progress
    if (_workProgress.length > 0) {
      if (startY + 40 > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage(); startY = addPDFHeader(doc, 'Work Progress', 'Daily Tracking');
      }
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(5, 150, 105);
      doc.text('DAILY PROGRESS (' + _workProgress.length + ' entries)', 14, startY + 8);

      var wRows = [];
      var tPanels = 0, tArea = 0;
      for (var wp = 0; wp < _workProgress.length; wp++) {
        var prog2 = _workProgress[wp];
        var pNames = [];
        for (var pw = 0; pw < (prog2.workers || []).length; pw++) {
          var pwr = findWorker(prog2.workers[pw]);
          if (pwr) pNames.push(pwr.name);
        }
        tPanels += prog2.panelsDone || 0;
        tArea += prog2.areaCovered || 0;
        wRows.push([wp + 1, prog2.date || '-', prog2.tableName || '-', prog2.workName || '-', pNames.join(', ') || '-', prog2.panelsDone || 0, (prog2.areaCovered || 0) + ' m2', prog2.notes || '-']);
      }
      doc.autoTable({
        startY: startY + 12,
        head: [['#', 'Date', 'Table', 'Work', 'Workers', 'Panels', 'Area', 'Notes']],
        body: wRows, theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 255, 250] },
        foot: [['', '', '', '', 'TOTAL', tPanels, tArea.toFixed(2) + ' m2', '']],
        footStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' }
      });
    }

    addPDFFooter(doc);
    doc.save('albowry_work_report_' + tD() + '.pdf');
    showToast('Work PDF downloaded!', 'success');
  });
}

function exportWorkCSV() {
  var csv = COMPANY.full + '\nWork Area & Panel Report\nGenerated: ' + fmtDT(tNow()) + '\n\n';

  csv += 'ITEMS & PANELS\n';
  csv += 'Item Name,Length (mm),Breadth (mm),Thickness (mm),Area/Piece (m2),Quantity,Total Area (m2),Rate (AED/m2),Cost (AED)\n';
  var gArea = 0, gQty = 0;
  for (var i = 0; i < _panelEntries.length; i++) {
    var p = _panelEntries[i];
    var calc = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
    var cost = calc.totalArea * (p.rate || 0);
    gArea += calc.totalArea; gQty += p.quantity;
    csv += '"' + (p.name || 'Item') + '",' + p.length + ',' + p.breadth + ',' + p.thickness + ',' + calc.areaPerPanel + ',' + p.quantity + ',' + calc.totalArea + ',' + (p.rate || 0) + ',' + cost.toFixed(2) + '\n';
  }
  csv += ',,,,,TOTAL,' + gArea.toFixed(2) + ' m2\n\n';

  csv += 'TABLE ASSIGNMENTS\n';
  csv += 'Table,Work,Workers,Panels Done,Panels Target,Progress,Notes\n';
  for (var t = 0; t < _tableAssignments.length; t++) {
    var table = _tableAssignments[t];
    var wn = [];
    for (var w = 0; w < table.workers.length; w++) {
      var wr = findWorker(table.workers[w]); if (wr) wn.push(wr.name);
    }
    var prog = table.panelsTotal > 0 ? Math.round((table.panelsDone / table.panelsTotal) * 100) + '%' : '0%';
    csv += '"' + table.tableName + '","' + (table.workName || '') + '","' + wn.join('; ') + '",' + (table.panelsDone || 0) + ',' + (table.panelsTotal || 0) + ',' + prog + ',"' + (table.notes || '') + '"\n';
  }
  csv += '\n';

  csv += 'DAILY PROGRESS\n';
  csv += 'Date,Table,Work,Workers,Panels Done,Area (m2),Notes\n';
  for (var wp = 0; wp < _workProgress.length; wp++) {
    var pr = _workProgress[wp];
    var pn = [];
    for (var pw = 0; pw < (pr.workers || []).length; pw++) {
      var pwr = findWorker(pr.workers[pw]); if (pwr) pn.push(pwr.name);
    }
    csv += pr.date + ',"' + (pr.tableName || '') + '","' + (pr.workName || '') + '","' + pn.join('; ') + '",' + (pr.panelsDone || 0) + ',' + (pr.areaCovered || 0) + ',"' + (pr.notes || '') + '"\n';
  }

  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url; link.download = 'albowry_work_report_' + tD() + '.csv'; link.click();
  URL.revokeObjectURL(url);
  showToast('Work CSV downloaded!', 'success');
}

console.log('[ALB] work.js v22 loaded');
