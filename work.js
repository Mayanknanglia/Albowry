// AL BOWRY CARPENTRY LLC - Work & Panel Management
// work.js v21 - Panel calculator + Table assignments + Progress tracking

// ====== PANEL CALCULATOR ======
// Formula: Length x Breadth x Thickness = Area per panel (in meters)
// Total Area = Area per panel x Number of panels

var _panelEntries = [];
var _tableAssignments = [];
var _workProgress = [];

// Default 15 tables
var DEFAULT_TABLES = 15;

// Panel thickness rates (AED per sqm) - manual entry by admin
var _panelRates = {};

function calculatePanelArea(lengthMM, breadthMM, thicknessMM, quantity) {
  // Convert mm to meters
  var lengthM = lengthMM / 1000;
  var breadthM = breadthMM / 1000;
  var thicknessM = thicknessMM / 1000;

  // Area per panel in square meters
  var areaPerPanel = lengthM * breadthM;

  // Volume per panel in cubic meters
  var volumePerPanel = lengthM * breadthM * thicknessM;

  // Total
  var totalArea = areaPerPanel * quantity;
  var totalVolume = volumePerPanel * quantity;

  return {
    lengthM: Math.round(lengthM * 1000) / 1000,
    breadthM: Math.round(breadthM * 1000) / 1000,
    thicknessM: Math.round(thicknessM * 1000) / 1000,
    areaPerPanel: Math.round(areaPerPanel * 100) / 100,
    volumePerPanel: Math.round(volumePerPanel * 1000) / 1000,
    quantity: quantity,
    totalArea: Math.round(totalArea * 100) / 100,
    totalVolume: Math.round(totalVolume * 1000) / 1000
  };
}

// ====== RENDER WORK SECTION ======
function renderWorkSection() {
  renderPanelCalculator();
  renderTableAssignments();
  renderWorkProgress();
}

// ====== PANEL CALCULATOR UI ======
function renderPanelCalculator() {
  var container = document.getElementById('panelCalcContainer');
  if (!container) return;

  var html = '';

  // Existing panel entries
  if (_panelEntries.length > 0) {
    var grandTotalArea = 0;
    var grandTotalPanels = 0;

    html += '<div class="table-responsive"><table class="data-table">' +
      '<thead><tr><th>#</th><th>Panel Name</th><th>Length (mm)</th><th>Breadth (mm)</th><th>Thickness (mm)</th>' +
      '<th>Area/Panel (m2)</th><th>Qty</th><th>Total Area (m2)</th><th>Rate (AED/m2)</th><th>Cost (AED)</th><th>Actions</th></tr></thead><tbody>';

    for (var i = 0; i < _panelEntries.length; i++) {
      var p = _panelEntries[i];
      var calc = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
      var cost = calc.totalArea * (p.rate || 0);
      grandTotalArea += calc.totalArea;
      grandTotalPanels += p.quantity;

      html += '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><strong>' + (p.name || 'Panel ' + (i+1)) + '</strong></td>' +
        '<td>' + p.length + '</td>' +
        '<td>' + p.breadth + '</td>' +
        '<td>' + p.thickness + '</td>' +
        '<td>' + calc.areaPerPanel + '</td>' +
        '<td><strong>' + p.quantity + '</strong></td>' +
        '<td><strong>' + calc.totalArea + ' m2</strong></td>' +
        '<td>' + (p.rate || '-') + '</td>' +
        '<td>' + (cost > 0 ? 'AED ' + cost.toFixed(2) : '-') + '</td>' +
        '<td>' +
          '<button class="btn-icon btn-edit" onclick="editPanelEntry(' + i + ')"><span class="material-symbols-outlined">edit</span></button>' +
          '<button class="btn-icon btn-delete" onclick="deletePanelEntry(' + i + ')"><span class="material-symbols-outlined">delete</span></button>' +
        '</td>' +
        '</tr>';
    }

    html += '</tbody>' +
      '<tfoot><tr style="background:#f0f4f9;font-weight:800">' +
        '<td colspan="6">GRAND TOTAL</td>' +
        '<td>' + grandTotalPanels + '</td>' +
        '<td>' + grandTotalArea.toFixed(2) + ' m2</td>' +
        '<td colspan="3"></td>' +
      '</tr></tfoot>' +
      '</table></div>';

    // Summary cards
    html = '<div style="display:flex;gap:14px;margin-bottom:20px;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:150px;background:#eff6ff;padding:16px;border-radius:12px;text-align:center;border:1px solid rgba(37,99,235,0.15)">' +
        '<div style="font-size:28px;font-weight:900;color:#2563eb">' + _panelEntries.length + '</div>' +
        '<div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Panel Types</div>' +
      '</div>' +
      '<div style="flex:1;min-width:150px;background:#ecfdf5;padding:16px;border-radius:12px;text-align:center;border:1px solid rgba(5,150,105,0.15)">' +
        '<div style="font-size:28px;font-weight:900;color:#059669">' + grandTotalPanels + '</div>' +
        '<div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Total Panels</div>' +
      '</div>' +
      '<div style="flex:1;min-width:150px;background:#fffbeb;padding:16px;border-radius:12px;text-align:center;border:1px solid rgba(217,119,6,0.15)">' +
        '<div style="font-size:28px;font-weight:900;color:#d97706">' + grandTotalArea.toFixed(2) + '</div>' +
        '<div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Total Area (m2)</div>' +
      '</div>' +
      '</div>' + html;
  } else {
    html += '<div class="empty-state"><span class="material-symbols-outlined">view_in_ar</span><p>No panel entries yet. Click "Add Panel" to start.</p></div>';
  }

  container.innerHTML = html;
}

function showAddPanelModal(editIndex) {
  var isEdit = editIndex !== undefined && editIndex !== null;
  var existing = isEdit ? _panelEntries[editIndex] : null;

  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Panel Name / Description</label>' +
      '<input type="text" id="pnlName" class="form-control" placeholder="e.g. Wall Panel A" value="' + (existing ? existing.name : '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Length (mm)</label>' +
      '<input type="number" id="pnlLength" class="form-control" placeholder="e.g. 6000" value="' + (existing ? existing.length : '6000') + '"></div>' +
    '<div class="form-group"><label class="form-label">Breadth (mm)</label>' +
      '<input type="number" id="pnlBreadth" class="form-control" placeholder="e.g. 1200" value="' + (existing ? existing.breadth : '1200') + '"></div>' +
    '<div class="form-group"><label class="form-label">Thickness (mm)</label>' +
      '<input type="number" id="pnlThickness" class="form-control" placeholder="e.g. 100" value="' + (existing ? existing.thickness : '100') + '"></div>' +
    '<div class="form-group"><label class="form-label">Number of Panels</label>' +
      '<input type="number" id="pnlQty" class="form-control" placeholder="e.g. 10" value="' + (existing ? existing.quantity : '1') + '" min="1"></div>' +
    '<div class="form-group"><label class="form-label">Rate per m2 (AED) - Optional</label>' +
      '<input type="number" id="pnlRate" class="form-control" placeholder="e.g. 50" value="' + (existing ? (existing.rate || '') : '') + '" min="0" step="0.5"></div>' +
    '</div>';

  // Live preview
  html += '<div id="panelPreview" style="background:#f0f4f9;padding:14px;border-radius:10px;margin-top:14px">' +
    '<div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:8px">Preview</div>' +
    '<div id="panelPreviewText" style="font-size:12px;color:#475569">Enter dimensions to see calculation</div>' +
    '</div>';

  html += '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="savePanelEntry(' + (isEdit ? editIndex : -1) + ')">' +
      (isEdit ? 'Update' : 'Add Panel') +
    '</button></div>';

  showModal(html, isEdit ? 'Edit Panel Entry' : 'Add Panel Entry');

  // Add live preview listeners
  setTimeout(function() {
    var fields = ['pnlLength', 'pnlBreadth', 'pnlThickness', 'pnlQty', 'pnlRate'];
    for (var i = 0; i < fields.length; i++) {
      var el = document.getElementById(fields[i]);
      if (el) el.addEventListener('input', updatePanelPreview);
    }
    updatePanelPreview();
  }, 100);
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
    '<strong>' + l + ' x ' + b + ' x ' + t + ' mm = ' + calc.areaPerPanel + ' m2 per panel</strong><br>' +
    calc.areaPerPanel + ' m2 x ' + q + ' panels = <strong style="color:#059669">' + calc.totalArea + ' m2 total area</strong>' +
    (r > 0 ? '<br>Cost: ' + calc.totalArea + ' m2 x AED ' + r + ' = <strong style="color:#2563eb">AED ' + cost.toFixed(2) + '</strong>' : '');
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
    name: name || 'Panel',
    length: length,
    breadth: breadth,
    thickness: thickness || 0,
    quantity: quantity,
    rate: rate
  };

  if (editIndex >= 0) {
    _panelEntries[editIndex] = entry;
    showToast('Panel updated!', 'success');
  } else {
    _panelEntries.push(entry);
    showToast('Panel added!', 'success');
  }

  closeModal();
  renderPanelCalculator();
}

function editPanelEntry(index) {
  showAddPanelModal(index);
}

function deletePanelEntry(index) {
  showConfirm('Delete this panel entry?', function() {
    _panelEntries.splice(index, 1);
    showToast('Panel deleted', 'info');
    renderPanelCalculator();
  });
}

// ====== TABLE ASSIGNMENTS ======
function renderTableAssignments() {
  var container = document.getElementById('tableAssignContainer');
  if (!container) return;

  if (_tableAssignments.length === 0) {
    // Initialize 15 tables with empty workers
    for (var t = 0; t < DEFAULT_TABLES; t++) {
      _tableAssignments.push({
        tableNum: t + 1,
        tableName: 'Table ' + (t + 1),
        workName: '',
        workers: [],
        progress: 0,
        notes: ''
      });
    }
  }

  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">';

  for (var i = 0; i < _tableAssignments.length; i++) {
    var table = _tableAssignments[i];
    var workerNames = [];
    for (var w = 0; w < table.workers.length; w++) {
      var worker = findWorker(table.workers[w]);
      if (worker) workerNames.push(worker.name);
    }

    var progressColor = table.progress >= 80 ? '#059669' : table.progress >= 40 ? '#d97706' : '#dc2626';

    html += '<div class="card" style="overflow:hidden">' +
      '<div class="card-header" style="padding:14px 18px">' +
        '<span class="material-symbols-outlined">table_restaurant</span>' +
        '<h3 style="font-size:14px">' + table.tableName + '</h3>' +
        '<span class="badge badge-info" style="font-size:10px">' + table.workers.length + ' workers</span>' +
      '</div>' +
      '<div class="card-body" style="padding:16px">';

    // Work name
    if (table.workName) {
      html += '<div style="font-size:12px;color:#64748b;margin-bottom:8px">Work: <strong style="color:#0f172a">' + table.workName + '</strong></div>';
    }

    // Progress bar
    html += '<div style="margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:4px">' +
        '<span>Progress</span><span style="color:' + progressColor + '">' + table.progress + '%</span>' +
      '</div>' +
      '<div style="background:#e2e8f0;border-radius:6px;height:8px;overflow:hidden">' +
        '<div style="background:' + progressColor + ';height:100%;width:' + table.progress + '%;border-radius:6px;transition:width 0.3s"></div>' +
      '</div>' +
      '</div>';

    // Workers
    if (workerNames.length > 0) {
      html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">';
      for (var wn = 0; wn < workerNames.length; wn++) {
        html += '<span style="background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">' + workerNames[wn] + '</span>';
      }
      html += '</div>';
    } else {
      html += '<div style="font-size:12px;color:#94a3b8;margin-bottom:10px">No workers assigned</div>';
    }

    // Notes
    if (table.notes) {
      html += '<div style="font-size:11px;color:#64748b;background:#f8fafc;padding:6px 10px;border-radius:6px;margin-bottom:10px">' + table.notes + '</div>';
    }

    // Edit button
    html += '<button class="btn btn-sm btn-secondary" onclick="editTableAssignment(' + i + ')" style="width:100%">' +
      '<span class="material-symbols-outlined">edit</span> Edit Table' +
      '</button>';

    html += '</div></div>';
  }

  html += '</div>';

  // Add more button
  html += '<div style="margin-top:16px;text-align:center">' +
    '<button class="btn btn-primary btn-sm" onclick="addNewTable()">' +
      '<span class="material-symbols-outlined">add</span> Add More Table' +
    '</button>' +
    '</div>';

  container.innerHTML = html;
}

function editTableAssignment(index) {
  var table = _tableAssignments[index];
  var ws = gW();

  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Table Name</label>' +
      '<input type="text" id="tblName" class="form-control" value="' + table.tableName + '"></div>' +
    '<div class="form-group"><label class="form-label">Work Name / Description</label>' +
      '<input type="text" id="tblWork" class="form-control" placeholder="e.g. Wall Panel Installation" value="' + (table.workName || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Progress (%)</label>' +
      '<input type="number" id="tblProgress" class="form-control" min="0" max="100" value="' + table.progress + '"></div>' +
    '<div class="form-group"><label class="form-label">Notes</label>' +
      '<input type="text" id="tblNotes" class="form-control" placeholder="Any notes..." value="' + (table.notes || '') + '"></div>' +
    '</div>';

  // Worker selection (checkboxes)
  html += '<div style="margin-top:14px"><label class="form-label">Assign Workers (select 2-3)</label>' +
    '<div style="max-height:250px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;padding:8px">';

  var sections = ['Indian', 'Pakistani'];
  for (var s = 0; s < sections.length; s++) {
    html += '<div style="font-size:10px;font-weight:800;color:#94a3b8;padding:6px 8px;text-transform:uppercase;letter-spacing:1px">' + sections[s] + '</div>';
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (!w.on || w.sec !== sections[s]) continue;
      var checked = indexOf(table.workers, w.wid) !== -1 ? ' checked' : '';
      html += '<label style="display:flex;align-items:center;gap:8px;padding:6px 10px;cursor:pointer;border-radius:6px;transition:background 0.15s" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'transparent\'">' +
        '<input type="checkbox" class="tblWorkerCb" value="' + w.wid + '"' + checked + ' style="width:16px;height:16px;accent-color:#2563eb">' +
        '<span style="font-size:13px;font-weight:600;color:#0f172a">' + w.name + '</span>' +
        '<span style="font-size:11px;color:#94a3b8;margin-left:auto">' + w.wid + '</span>' +
        '</label>';
    }
  }

  html += '</div></div>';

  html += '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="saveTableAssignment(' + index + ')">Save Table</button></div>';

  showModal(html, 'Edit ' + table.tableName);
}

function saveTableAssignment(index) {
  var name = document.getElementById('tblName').value.trim();
  var work = document.getElementById('tblWork').value.trim();
  var progress = parseInt(document.getElementById('tblProgress').value) || 0;
  var notes = document.getElementById('tblNotes').value.trim();

  // Get selected workers
  var cbs = document.querySelectorAll('.tblWorkerCb:checked');
  var workers = [];
  for (var i = 0; i < cbs.length; i++) {
    workers.push(cbs[i].value);
  }

  _tableAssignments[index] = {
    tableNum: index + 1,
    tableName: name || 'Table ' + (index + 1),
    workName: work,
    workers: workers,
    progress: Math.min(100, Math.max(0, progress)),
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
    progress: 0,
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
    container.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">construction</span><p>No work progress entries. Click "Add Progress" to start tracking.</p></div>';
    return;
  }

  var html = '<div class="table-responsive"><table class="data-table">' +
    '<thead><tr><th>#</th><th>Date</th><th>Table</th><th>Work</th><th>Workers</th><th>Panels Done</th><th>Area (m2)</th><th>Notes</th><th>Actions</th></tr></thead><tbody>';

  for (var i = 0; i < _workProgress.length; i++) {
    var p = _workProgress[i];
    var workerNames = [];
    for (var w = 0; w < (p.workers || []).length; w++) {
      var worker = findWorker(p.workers[w]);
      if (worker) workerNames.push(worker.name);
    }

    html += '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + (p.date || '-') + '</td>' +
      '<td>' + (p.tableName || '-') + '</td>' +
      '<td>' + (p.workName || '-') + '</td>' +
      '<td>' + (workerNames.length > 0 ? workerNames.join(', ') : '-') + '</td>' +
      '<td><strong>' + (p.panelsDone || 0) + '</strong></td>' +
      '<td><strong>' + (p.areaCovered || 0) + '</strong></td>' +
      '<td>' + (p.notes || '-') + '</td>' +
      '<td>' +
        '<button class="btn-icon btn-delete" onclick="deleteProgress(' + i + ')"><span class="material-symbols-outlined">delete</span></button>' +
      '</td>' +
      '</tr>';
  }

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function showAddProgressModal() {
  var html = '<div class="form-grid">' +
    '<div class="form-group"><label class="form-label">Date</label>' +
      '<input type="date" id="wpDate" class="form-control" value="' + tD() + '"></div>' +
    '<div class="form-group"><label class="form-label">Table</label>' +
      '<select id="wpTable" class="form-control">';

  for (var t = 0; t < _tableAssignments.length; t++) {
    html += '<option value="' + t + '">' + _tableAssignments[t].tableName + '</option>';
  }

  html += '</select></div>' +
    '<div class="form-group"><label class="form-label">Work Name</label>' +
      '<input type="text" id="wpWork" class="form-control" placeholder="e.g. Panel Installation"></div>' +
    '<div class="form-group"><label class="form-label">Panels Completed</label>' +
      '<input type="number" id="wpPanels" class="form-control" placeholder="e.g. 5" min="0"></div>' +
    '<div class="form-group"><label class="form-label">Area Covered (m2)</label>' +
      '<input type="number" id="wpArea" class="form-control" placeholder="e.g. 36.0" min="0" step="0.1"></div>' +
    '<div class="form-group"><label class="form-label">Notes</label>' +
      '<input type="text" id="wpNotes" class="form-control" placeholder="Any notes..."></div>' +
    '</div>';

  html += '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="saveProgress()">Save Progress</button></div>';

  showModal(html, 'Add Work Progress');
}

function saveProgress() {
  var date = document.getElementById('wpDate').value;
  var tableIdx = parseInt(document.getElementById('wpTable').value);
  var workName = document.getElementById('wpWork').value.trim();
  var panelsDone = parseInt(document.getElementById('wpPanels').value) || 0;
  var areaCovered = parseFloat(document.getElementById('wpArea').value) || 0;
  var notes = document.getElementById('wpNotes').value.trim();

  var table = _tableAssignments[tableIdx];

  _workProgress.push({
    date: date,
    tableNum: table.tableNum,
    tableName: table.tableName,
    workName: workName || table.workName,
    workers: table.workers.slice(),
    panelsDone: panelsDone,
    areaCovered: areaCovered,
    notes: notes
  });

  closeModal();
  showToast('Progress saved!', 'success');
  renderWorkProgress();
}

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
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('PANEL SUMMARY (' + _panelEntries.length + ' types)', 14, startY + 8);

      var pRows = [];
      var grandArea = 0, grandPanels = 0, grandCost = 0;
      for (var i = 0; i < _panelEntries.length; i++) {
        var p = _panelEntries[i];
        var calc = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
        var cost = calc.totalArea * (p.rate || 0);
        grandArea += calc.totalArea;
        grandPanels += p.quantity;
        grandCost += cost;
        pRows.push([
          i + 1,
          p.name || 'Panel',
          p.length + ' x ' + p.breadth + ' x ' + p.thickness + ' mm',
          calc.areaPerPanel + ' m2',
          p.quantity,
          calc.totalArea + ' m2',
          p.rate ? 'AED ' + p.rate : '-',
          cost > 0 ? 'AED ' + cost.toFixed(2) : '-'
        ]);
      }

      doc.autoTable({
        startY: startY + 12,
        head: [['#', 'Panel Name', 'Dimensions', 'Area/Panel', 'Qty', 'Total Area', 'Rate/m2', 'Cost']],
        body: pRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 245, 255] },
        foot: [['', '', 'GRAND TOTAL', '', grandPanels, grandArea.toFixed(2) + ' m2', '', grandCost > 0 ? 'AED ' + grandCost.toFixed(2) : '']],
        footStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' }
      });

      startY = doc.lastAutoTable.finalY + 10;
    }

    // Table Assignments
    if (_tableAssignments.length > 0) {
      if (startY + 40 > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage(); startY = addPDFHeader(doc, 'Table Assignments', 'Work Distribution');
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6);
      doc.text('TABLE ASSIGNMENTS (' + _tableAssignments.length + ' tables)', 14, startY + 8);

      var tRows = [];
      for (var t = 0; t < _tableAssignments.length; t++) {
        var table = _tableAssignments[t];
        var workerNames = [];
        for (var w = 0; w < table.workers.length; w++) {
          var worker = findWorker(table.workers[w]);
          if (worker) workerNames.push(worker.name);
        }
        tRows.push([
          table.tableNum,
          table.tableName,
          table.workName || '-',
          workerNames.join(', ') || 'Not assigned',
          table.progress + '%',
          table.notes || '-'
        ]);
      }

      doc.autoTable({
        startY: startY + 12,
        head: [['#', 'Table', 'Work', 'Workers', 'Progress', 'Notes']],
        body: tRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [254, 249, 235] }
      });

      startY = doc.lastAutoTable.finalY + 10;
    }

    // Work Progress
    if (_workProgress.length > 0) {
      if (startY + 40 > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage(); startY = addPDFHeader(doc, 'Work Progress', 'Daily Progress Tracking');
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text('WORK PROGRESS (' + _workProgress.length + ' entries)', 14, startY + 8);

      var wRows = [];
      var totalPanels = 0, totalArea = 0;
      for (var wp = 0; wp < _workProgress.length; wp++) {
        var prog = _workProgress[wp];
        var wNames = [];
        for (var pw = 0; pw < (prog.workers || []).length; pw++) {
          var wr = findWorker(prog.workers[pw]);
          if (wr) wNames.push(wr.name);
        }
        totalPanels += prog.panelsDone || 0;
        totalArea += prog.areaCovered || 0;
        wRows.push([
          wp + 1,
          prog.date || '-',
          prog.tableName || '-',
          prog.workName || '-',
          wNames.join(', ') || '-',
          prog.panelsDone || 0,
          (prog.areaCovered || 0) + ' m2',
          prog.notes || '-'
        ]);
      }

      doc.autoTable({
        startY: startY + 12,
        head: [['#', 'Date', 'Table', 'Work', 'Workers', 'Panels', 'Area', 'Notes']],
        body: wRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 255, 250] },
        foot: [['', '', '', '', 'TOTAL', totalPanels, totalArea.toFixed(2) + ' m2', '']],
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

  // Panels
  csv += 'PANEL SUMMARY\n';
  csv += 'Panel Name,Length (mm),Breadth (mm),Thickness (mm),Area/Panel (m2),Quantity,Total Area (m2),Rate (AED/m2),Cost (AED)\n';
  var grandArea = 0, grandPanels = 0;
  for (var i = 0; i < _panelEntries.length; i++) {
    var p = _panelEntries[i];
    var calc = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
    var cost = calc.totalArea * (p.rate || 0);
    grandArea += calc.totalArea;
    grandPanels += p.quantity;
    csv += '"' + (p.name || 'Panel') + '",' + p.length + ',' + p.breadth + ',' + p.thickness + ',' +
      calc.areaPerPanel + ',' + p.quantity + ',' + calc.totalArea + ',' + (p.rate || 0) + ',' + cost.toFixed(2) + '\n';
  }
  csv += ',,,,,TOTAL,' + grandArea.toFixed(2) + ' m2\n\n';

  // Tables
  csv += 'TABLE ASSIGNMENTS\n';
  csv += 'Table,Work,Workers,Progress,Notes\n';
  for (var t = 0; t < _tableAssignments.length; t++) {
    var table = _tableAssignments[t];
    var wNames = [];
    for (var w = 0; w < table.workers.length; w++) {
      var wr = findWorker(table.workers[w]);
      if (wr) wNames.push(wr.name);
    }
    csv += '"' + table.tableName + '","' + (table.workName || '') + '","' + wNames.join('; ') + '",' + table.progress + '%,"' + (table.notes || '') + '"\n';
  }
  csv += '\n';

  // Progress
  csv += 'WORK PROGRESS\n';
  csv += 'Date,Table,Work,Workers,Panels Done,Area (m2),Notes\n';
  for (var wp = 0; wp < _workProgress.length; wp++) {
    var prog = _workProgress[wp];
    var pNames = [];
    for (var pw = 0; pw < (prog.workers || []).length; pw++) {
      var pwr = findWorker(prog.workers[pw]);
      if (pwr) pNames.push(pwr.name);
    }
    csv += prog.date + ',"' + (prog.tableName || '') + '","' + (prog.workName || '') + '","' + pNames.join('; ') + '",' + (prog.panelsDone || 0) + ',' + (prog.areaCovered || 0) + ',"' + (prog.notes || '') + '"\n';
  }

  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url; link.download = 'albowry_work_report_' + tD() + '.csv'; link.click();
  URL.revokeObjectURL(url);
  showToast('Work CSV downloaded!', 'success');
}

console.log('[ALB] work.js v21 loaded');
