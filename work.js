// AL BOWRY CARPENTRY LLC - Work & Panel Management
// work.js v25 - Firebase persistent + Date-wise + Professional

var _panelEntries = [];
var _tableAssignments = [];
var _workProgress = [];
var _workListeners = [];
var _workSyncStarted = false;
var _workProgressDate = '';
var DEFAULT_TABLES = 15;

function calculatePanelArea(lengthMM, breadthMM, thicknessMM, quantity) {
  var lengthM = (lengthMM || 0) / 1000;
  var breadthM = (breadthMM || 0) / 1000;
  var areaPerPanel = Math.round(lengthM * breadthM * 100) / 100;
  var totalArea = Math.round(areaPerPanel * (quantity || 0) * 100) / 100;
  return { areaPerPanel: areaPerPanel, totalArea: totalArea };
}

function startWorkSync() {
  if (_workSyncStarted) return;
  _workSyncStarted = true;
  for (var i = 0; i < _workListeners.length; i++) { try { _workListeners[i](); } catch(e) {} }
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
  _workProgressDate = '';
  var dateEl = document.getElementById('workProgressDateFilter');
  if (dateEl) dateEl.value = '';
}

// ====== PANELS ======
function renderPanelCalculator() {
  var c = document.getElementById('panelCalcContainer');
  if (!c) return;
  if (_panelEntries.length === 0) {
    c.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">view_in_ar</span><p>No items yet. Click "Add Item".</p></div>';
    return;
  }

  var gA = 0, gQ = 0, gC = 0;
  for (var x = 0; x < _panelEntries.length; x++) {
    var px = _panelEntries[x];
    var cx = calculatePanelArea(px.length, px.breadth, px.thickness, px.quantity);
    gA += cx.totalArea; gQ += px.quantity || 0; gC += cx.totalArea * (px.rate || 0);
  }

  var h = '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
    mkStat(_panelEntries.length, 'Items', '#2563eb', '#eff6ff') +
    mkStat(gQ, 'Pieces', '#059669', '#ecfdf5') +
    mkStat(gA.toFixed(2), 'Area (m2)', '#d97706', '#fffbeb') +
    (gC > 0 ? mkStat('AED ' + gC.toFixed(0), 'Cost', '#dc2626', '#fef2f2') : '') +
    '</div>';

  h += '<div class="table-responsive"><table class="data-table"><thead><tr>' +
    '<th>#</th><th>Item</th><th>L(mm)</th><th>B(mm)</th><th>T(mm)</th>' +
    '<th>Area/Pc</th><th>Qty</th><th>Total Area</th><th>Rate</th><th>Cost</th><th>Actions</th>' +
    '</tr></thead><tbody>';

  for (var i = 0; i < _panelEntries.length; i++) {
    var p = _panelEntries[i];
    var calc = calculatePanelArea(p.length, p.breadth, p.thickness, p.quantity);
    var cost = calc.totalArea * (p.rate || 0);
    h += '<tr><td>' + (i+1) + '</td><td><strong>' + (p.name||'Item') + '</strong></td>' +
      '<td>' + (p.length||0) + '</td><td>' + (p.breadth||0) + '</td><td>' + (p.thickness||0) + '</td>' +
      '<td>' + calc.areaPerPanel + '</td><td><strong>' + (p.quantity||0) + '</strong></td>' +
      '<td><strong style="color:#059669">' + calc.totalArea + ' m2</strong></td>' +
      '<td>' + (p.rate ? 'AED '+p.rate : '-') + '</td>' +
      '<td>' + (cost>0 ? 'AED '+cost.toFixed(2) : '-') + '</td>' +
      '<td class="action-cell">' +
        '<button class="btn-icon btn-edit" onclick="editPanelEntry('+i+')"><span class="material-symbols-outlined">edit</span></button>' +
        '<button class="btn-icon btn-delete" onclick="deletePanelEntry('+i+')"><span class="material-symbols-outlined">delete</span></button>' +
      '</td></tr>';
  }

  h += '</tbody><tfoot><tr style="background:#f0f4f9;font-weight:800">' +
    '<td colspan="6">TOTAL</td><td>'+gQ+'</td><td style="color:#059669">'+gA.toFixed(2)+' m2</td>' +
    '<td></td><td>'+(gC>0?'AED '+gC.toFixed(2):'')+'</td><td></td></tr></tfoot></table></div>';
  c.innerHTML = h;
}

function showAddPanelModal(ei) {
  var isE = ei !== undefined && ei !== null;
  var ex = isE ? _panelEntries[ei] : null;
  var h = '<div class="form-grid">' +
    fg('Item Name', 'pnlName', 'text', ex ? ex.name : '', 'Wall Panel A') +
    fg('Length (mm)', 'pnlLength', 'number', ex ? ex.length : '6000', '', 'oninput="updatePanelPreview()"') +
    fg('Breadth (mm)', 'pnlBreadth', 'number', ex ? ex.breadth : '1200', '', 'oninput="updatePanelPreview()"') +
    fg('Thickness (mm)', 'pnlThickness', 'number', ex ? ex.thickness : '100', '', 'oninput="updatePanelPreview()"') +
    fg('Quantity', 'pnlQty', 'number', ex ? ex.quantity : '1', '', 'min="1" oninput="updatePanelPreview()"') +
    fg('Rate/m2 (AED)', 'pnlRate', 'number', ex ? (ex.rate||'') : '', '', 'min="0" step="0.5" oninput="updatePanelPreview()"') +
    '</div>' +
    '<div id="panelPreview" style="background:#f0f4f9;padding:12px;border-radius:8px;margin-top:12px">' +
      '<div id="panelPreviewText" style="font-size:13px;color:#475569">Enter dimensions...</div></div>' +
    modalBtns(isE ? 'Update' : 'Add Item', 'savePanelEntry(' + (isE ? ei : -1) + ')');
  showModal(h, isE ? 'Edit Item' : 'Add New Item');
  setTimeout(updatePanelPreview, 100);
}

function updatePanelPreview() {
  var el = document.getElementById('panelPreviewText');
  if (!el) return;
  var l = parseFloat(document.getElementById('pnlLength').value)||0;
  var b = parseFloat(document.getElementById('pnlBreadth').value)||0;
  var t = parseFloat(document.getElementById('pnlThickness').value)||0;
  var q = parseInt(document.getElementById('pnlQty').value)||0;
  var r = parseFloat(document.getElementById('pnlRate').value)||0;
  if (!l || !b || !q) { el.textContent = 'Enter valid dimensions'; return; }
  var calc = calculatePanelArea(l, b, t, q);
  var cost = calc.totalArea * r;
  el.innerHTML = '<strong>'+l+'x'+b+'x'+t+'mm = '+calc.areaPerPanel+' m2/pc</strong> x '+q+' = <strong style="color:#059669">'+calc.totalArea+' m2</strong>' +
    (r > 0 ? ' | <strong style="color:#2563eb">AED '+cost.toFixed(2)+'</strong>' : '');
}

function savePanelEntry(ei) {
  var name = document.getElementById('pnlName').value.trim()||'Item';
  var length = parseFloat(document.getElementById('pnlLength').value)||0;
  var breadth = parseFloat(document.getElementById('pnlBreadth').value)||0;
  var thickness = parseFloat(document.getElementById('pnlThickness').value)||0;
  var quantity = parseInt(document.getElementById('pnlQty').value)||0;
  var rate = parseFloat(document.getElementById('pnlRate').value)||0;
  if (!length || !breadth || !quantity) { showToast('Enter length, breadth, quantity', 'error'); return; }
  var docId = (ei >= 0 && _panelEntries[ei]) ? (_panelEntries[ei].id||'panel_'+Date.now()) : 'panel_'+Date.now();
  FB.save('panels', docId, {
    id: docId, name: name, length: length, breadth: breadth, thickness: thickness, quantity: quantity, rate: rate
  }).then(function() { closeModal(); showToast(ei >= 0 ? 'Updated!' : 'Added!', 'success'); });
}

function editPanelEntry(i) { showAddPanelModal(i); }

function deletePanelEntry(i) {
  var p = _panelEntries[i]; if (!p) return;
  showConfirm('Delete "'+(p.name||'Item')+'"?', function() {
    FB.delete('panels', p.id).then(function() { showToast('Deleted', 'info'); });
  });
}

// ====== TABLES ======
function renderTableAssignments() {
  var c = document.getElementById('tableAssignContainer');
  if (!c) return;
  if (_tableAssignments.length === 0) { c.innerHTML = '<div class="text-muted text-center">Loading...</div>'; return; }

  var tDone = 0, tTarget = 0;
  for (var x = 0; x < _tableAssignments.length; x++) {
    tDone += _tableAssignments[x].panelsDone||0;
    tTarget += _tableAssignments[x].panelsTotal||0;
  }
  var oP = tTarget > 0 ? Math.round((tDone/tTarget)*100) : 0;

  var h = '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
    mkStat(_tableAssignments.length, 'Tables', '#2563eb', '#eff6ff') +
    mkStat(tDone+'/'+tTarget, 'Panels', '#059669', '#ecfdf5') +
    mkStat(oP+'%', 'Overall', '#d97706', '#fffbeb') +
    '</div>';

  h += '<div class="table-responsive"><table class="data-table"><thead><tr>' +
    '<th>#</th><th>Table</th><th>Work</th><th>Workers</th><th>Done</th><th>Target</th><th>Progress</th><th>Notes</th><th>Edit</th>' +
    '</tr></thead><tbody>';

  for (var i = 0; i < _tableAssignments.length; i++) {
    var tb = _tableAssignments[i];
    var wN = getWorkerNames(tb.workers);
    var pr = (tb.panelsTotal||0) > 0 ? Math.min(100, Math.round(((tb.panelsDone||0)/tb.panelsTotal)*100)) : 0;
    var pC = pr >= 80 ? '#059669' : pr >= 40 ? '#d97706' : '#dc2626';

    h += '<tr><td>' + (tb.tableNum||i+1) + '</td>' +
      '<td><strong>' + (tb.tableName||'Table') + '</strong></td>' +
      '<td>' + (tb.workName||'-') + '</td>' +
      '<td style="font-size:12px">' + (wN||'<span style="color:#94a3b8">-</span>') + '</td>' +
      '<td><strong style="color:#059669">' + (tb.panelsDone||0) + '</strong></td>' +
      '<td>' + (tb.panelsTotal||0) + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:6px">' +
        '<div style="flex:1;background:#e2e8f0;border-radius:4px;height:8px;min-width:50px;overflow:hidden">' +
          '<div style="background:'+pC+';height:100%;width:'+pr+'%;border-radius:4px"></div></div>' +
        '<span style="font-size:11px;font-weight:700;color:'+pC+'">'+pr+'%</span></div></td>' +
      '<td style="font-size:11px;color:#64748b">' + (tb.notes||'-') + '</td>' +
      '<td><button class="btn-icon btn-edit" onclick="editTableAssignment('+i+')"><span class="material-symbols-outlined">edit</span></button></td></tr>';
  }

  h += '</tbody></table></div>';
  h += '<div style="margin-top:12px;text-align:center"><button class="btn btn-primary btn-sm" onclick="addNewTable()"><span class="material-symbols-outlined">add</span> Add Table</button></div>';
  c.innerHTML = h;
}

function editTableAssignment(idx) {
  var tb = _tableAssignments[idx];
  var ws = gW();
  var h = '<div class="form-grid">' +
    fg('Table Name', 'tblName', 'text', tb.tableName||'') +
    fg('Work Name', 'tblWork', 'text', tb.workName||'', 'Panel Installation') +
    fg('Panels Done', 'tblDone', 'number', tb.panelsDone||0) +
    fg('Panels Target', 'tblTarget', 'number', tb.panelsTotal||0) +
    fg('Notes', 'tblNotes', 'text', tb.notes||'') +
    '</div>';

  h += '<div style="margin-top:12px"><label class="form-label">Assign Workers</label>' +
    '<div style="max-height:200px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;padding:4px">';
  var secs = ['Indian', 'Pakistani'];
  for (var s = 0; s < secs.length; s++) {
    h += '<div style="font-size:9px;font-weight:800;color:#94a3b8;padding:3px 6px;text-transform:uppercase;letter-spacing:1px">'+secs[s]+'</div>';
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i]; if (!w.on || w.sec !== secs[s]) continue;
      var chk = indexOf(tb.workers||[], w.wid) !== -1 ? ' checked' : '';
      h += '<label style="display:flex;align-items:center;gap:6px;padding:3px 6px;cursor:pointer;font-size:12px">' +
        '<input type="checkbox" class="tblWCb" value="'+w.wid+'"'+chk+' style="accent-color:#2563eb">' +
        '<strong>'+w.name+'</strong><span style="color:#94a3b8;margin-left:auto;font-size:10px">'+w.wid+'</span></label>';
    }
  }
  h += '</div></div>';
  h += modalBtns('Save', 'saveTableAssignment('+idx+')');
  showModal(h, 'Edit ' + (tb.tableName||'Table'));
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
    panelsDone: parseInt(document.getElementById('tblDone').value)||0,
    panelsTotal: parseInt(document.getElementById('tblTarget').value)||0,
    notes: document.getElementById('tblNotes').value.trim()
  }).then(function() { closeModal(); showToast('Saved!', 'success'); });
}

function addNewTable() {
  var num = _tableAssignments.length + 1;
  var id = 'table_' + num + '_' + Date.now();
  FB.save('tables', id, {
    id: id, tableNum: num, tableName: 'Table '+num,
    workName: '', workers: [], panelsDone: 0, panelsTotal: 0, notes: ''
  }).then(function() { showToast('Table '+num+' added!', 'success'); });
}

// ====== PROGRESS - DATE WISE ======
function renderWorkProgress() {
  var c = document.getElementById('workProgressContainer');
  if (!c) return;

  var filtered = _workProgress;
  if (_workProgressDate) {
    filtered = [];
    for (var f = 0; f < _workProgress.length; f++) {
      if (_workProgress[f].date === _workProgressDate) filtered.push(_workProgress[f]);
    }
  }

  if (filtered.length === 0) {
    c.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">trending_up</span><p>' +
      (_workProgressDate ? 'No entries for '+formatDateStr(_workProgressDate) : 'No progress entries yet') +
      '. Click "Add Progress".</p></div>';
    return;
  }

  // Group by date
  var groups = {};
  var tP = 0, tAr = 0;
  for (var i = 0; i < filtered.length; i++) {
    var p = filtered[i];
    var d = p.date || 'Unknown';
    if (!groups[d]) groups[d] = [];
    groups[d].push(p);
    tP += p.panelsDone || 0;
    tAr += p.areaCovered || 0;
  }

  var h = '<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">' +
    mkStat(filtered.length, 'Entries', '#2563eb', '#eff6ff') +
    mkStat(tP, 'Panels Done', '#059669', '#ecfdf5') +
    mkStat(tAr.toFixed(2), 'Area (m2)', '#d97706', '#fffbeb') +
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

    h += '<div style="margin-bottom:18px">' +
      '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(135deg,#eff6ff,#f8fafc);border-radius:10px;margin-bottom:10px;border:1px solid rgba(37,99,235,0.1)">' +
        '<span class="material-symbols-outlined" style="color:#2563eb;font-size:20px">calendar_today</span>' +
        '<strong style="font-size:15px;color:#0f172a">' + formatDateStr(dk) + '</strong>' +
        '<div style="margin-left:auto;display:flex;gap:12px">' +
          '<span style="font-size:12px;font-weight:700;color:#059669">' + dayP + ' panels</span>' +
          '<span style="font-size:12px;font-weight:700;color:#d97706">' + dayA.toFixed(2) + ' m2</span>' +
        '</div>' +
      '</div>';

    h += '<div class="table-responsive"><table class="data-table"><thead><tr>' +
      '<th>#</th><th>Table</th><th>Work</th><th>Workers</th><th>Panels</th><th>Area (m2)</th><th>Notes</th><th>Actions</th>' +
      '</tr></thead><tbody>';

    for (var ei = 0; ei < entries.length; ei++) {
      var entry = entries[ei];
      var origIdx = -1;
      for (var oi = 0; oi < _workProgress.length; oi++) {
        if (_workProgress[oi].id === entry.id) { origIdx = oi; break; }
      }
      var wN = getWorkerNames(entry.workers);

      h += '<tr><td>' + (ei+1) + '</td>' +
        '<td><strong>' + (entry.tableName||'-') + '</strong></td>' +
        '<td>' + (entry.workName||'-') + '</td>' +
        '<td style="font-size:12px">' + (wN||'-') + '</td>' +
        '<td><strong style="color:#059669">' + (entry.panelsDone||0) + '</strong></td>' +
        '<td><strong>' + (entry.areaCovered||0) + '</strong></td>' +
        '<td style="font-size:11px;color:#64748b">' + (entry.notes||'-') + '</td>' +
        '<td class="action-cell">' +
          '<button class="btn-icon btn-edit" onclick="editProgress('+origIdx+')"><span class="material-symbols-outlined">edit</span></button>' +
          '<button class="btn-icon btn-delete" onclick="deleteProgress('+origIdx+')"><span class="material-symbols-outlined">delete</span></button>' +
        '</td></tr>';
    }
    h += '</tbody></table></div></div>';
  }
  c.innerHTML = h;
}

function filterWorkProgressByDate() {
  var el = document.getElementById('workProgressDateFilter');
  _workProgressDate = el ? el.value : '';
  renderWorkProgress();
}

function clearWorkProgressFilter() {
  _workProgressDate = '';
  var el = document.getElementById('workProgressDateFilter');
  if (el) el.value = '';
  renderWorkProgress();
}

function showAddProgressModal(ei) {
  var isE = ei !== undefined && ei !== null;
  var ex = isE ? _workProgress[ei] : null;
  var h = '<div class="form-grid">' +
    fg('Date', 'wpDate', 'date', ex ? ex.date : tD()) +
    '<div class="form-group"><label class="form-label">Table</label><select id="wpTable" class="form-control">';
  for (var t = 0; t < _tableAssignments.length; t++) {
    var sel = (ex && ex.tableNum === _tableAssignments[t].tableNum) ? ' selected' : '';
    h += '<option value="'+t+'"'+sel+'>'+(_tableAssignments[t].tableName||'Table')+'</option>';
  }
  h += '</select></div>' +
    fg('Work Name', 'wpWork', 'text', ex ? (ex.workName||'') : '', 'Panel Cutting') +
    fg('Panels Completed', 'wpPanels', 'number', ex ? (ex.panelsDone||0) : '') +
    fg('Area Covered (m2)', 'wpArea', 'number', ex ? (ex.areaCovered||0) : '', '', 'min="0" step="0.1"') +
    fg('Notes', 'wpNotes', 'text', ex ? (ex.notes||'') : '') +
    '</div>' +
    modalBtns(isE ? 'Update' : 'Save', 'saveProgress('+(isE?ei:-1)+')');
  showModal(h, isE ? 'Edit Progress' : 'Add Work Progress');
}

function saveProgress(ei) {
  var tidx = parseInt(document.getElementById('wpTable').value);
  var tb = _tableAssignments[tidx];
  var entry = {
    date: document.getElementById('wpDate').value,
    tableNum: tb.tableNum || tidx+1,
    tableName: tb.tableName || 'Table',
    workName: document.getElementById('wpWork').value.trim() || tb.workName,
    workers: (tb.workers||[]).slice(),
    panelsDone: parseInt(document.getElementById('wpPanels').value)||0,
    areaCovered: parseFloat(document.getElementById('wpArea').value)||0,
    notes: document.getElementById('wpNotes').value.trim()
  };
  var docId = (ei >= 0 && _workProgress[ei]) ? (_workProgress[ei].id||'wp_'+Date.now()) : 'wp_'+Date.now();
  entry.id = docId;
  FB.save('workprogress', docId, entry).then(function() {
    closeModal(); showToast(ei >= 0 ? 'Updated!' : 'Saved!', 'success');
  });
}

function editProgress(i) { showAddProgressModal(i); }

function deleteProgress(i) {
  var p = _workProgress[i]; if (!p) return;
  showConfirm('Delete this entry?', function() {
    FB.delete('workprogress', p.id).then(function() { showToast('Deleted', 'info'); });
  });
}

// ====== PDF ======
function exportWorkPDF() {
  loadLogoForPDF().then(function() {
    var doc = new jspdf.jsPDF('landscape');
    var y = addPDFHeader(doc, 'Work Area & Panel Report', 'COP31 - '+formatDateStr(tD()));

    if (_panelEntries.length > 0) {
      doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(30,64,175);
      doc.text('ITEMS ('+_panelEntries.length+')', 14, y+8);
      var pR=[],gA2=0,gQ=0,gC=0;
      for(var i=0;i<_panelEntries.length;i++){
        var p=_panelEntries[i];var cl=calculatePanelArea(p.length,p.breadth,p.thickness,p.quantity);
        var co=cl.totalArea*(p.rate||0);gA2+=cl.totalArea;gQ+=p.quantity||0;gC+=co;
        pR.push([i+1,p.name||'Item',(p.length||0)+'x'+(p.breadth||0)+'x'+(p.thickness||0),cl.areaPerPanel+' m2',p.quantity||0,cl.totalArea+' m2',p.rate?'AED '+p.rate:'-',co>0?'AED '+co.toFixed(2):'-']);
      }
      doc.autoTable({startY:y+12,head:[['#','Item','Dims(mm)','Area/Pc','Qty','Total','Rate','Cost']],body:pR,theme:'grid',styles:{fontSize:8,cellPadding:2},headStyles:{fillColor:[30,64,175],textColor:255},alternateRowStyles:{fillColor:[240,245,255]},foot:[['','TOTAL','','',gQ,gA2.toFixed(2)+' m2','',gC>0?'AED '+gC.toFixed(2):'']],footStyles:{fillColor:[5,150,105],textColor:255,fontStyle:'bold'}});
      y=doc.lastAutoTable.finalY+10;
    }

    if (_tableAssignments.length > 0) {
      if(y+40>doc.internal.pageSize.getHeight()-20){doc.addPage();y=20;}
      doc.setFontSize(12);doc.setFont('helvetica','bold');doc.setTextColor(217,119,6);
      doc.text('TABLES ('+_tableAssignments.length+')',14,y+8);
      var tR=[];
      for(var t=0;t<_tableAssignments.length;t++){
        var tb=_tableAssignments[t];var wn=getWorkerNames(tb.workers);
        var pr=(tb.panelsTotal||0)>0?Math.round(((tb.panelsDone||0)/tb.panelsTotal)*100)+'%':'0%';
        tR.push([tb.tableNum||t+1,tb.tableName||'Table',tb.workName||'-',wn||'-',(tb.panelsDone||0)+'/'+(tb.panelsTotal||0),pr,tb.notes||'-']);
      }
      doc.autoTable({startY:y+12,head:[['#','Table','Work','Workers','Done/Target','Progress','Notes']],body:tR,theme:'grid',styles:{fontSize:8,cellPadding:2},headStyles:{fillColor:[217,119,6],textColor:255},alternateRowStyles:{fillColor:[254,249,235]}});
      y=doc.lastAutoTable.finalY+10;
    }

    if (_workProgress.length > 0) {
      if(y+40>doc.internal.pageSize.getHeight()-20){doc.addPage();y=20;}
      doc.setFontSize(12);doc.setFont('helvetica','bold');doc.setTextColor(5,150,105);
      doc.text('PROGRESS ('+_workProgress.length+')',14,y+8);
      var wR=[],tP2=0,tA2=0;
      for(var w=0;w<_workProgress.length;w++){
        var pr2=_workProgress[w];var pn=getWorkerNames(pr2.workers);
        tP2+=pr2.panelsDone||0;tA2+=pr2.areaCovered||0;
        wR.push([w+1,formatDateStr(pr2.date),pr2.tableName||'-',pr2.workName||'-',pn||'-',pr2.panelsDone||0,(pr2.areaCovered||0)+' m2',pr2.notes||'-']);
      }
      doc.autoTable({startY:y+12,head:[['#','Date','Table','Work','Workers','Panels','Area','Notes']],body:wR,theme:'grid',styles:{fontSize:8,cellPadding:2},headStyles:{fillColor:[5,150,105],textColor:255},alternateRowStyles:{fillColor:[240,255,250]},foot:[['','','','','TOTAL',tP2,tA2.toFixed(2)+' m2','']],footStyles:{fillColor:[30,64,175],textColor:255,fontStyle:'bold'}});
    }

    addPDFFooter(doc);
    doc.save('albowry_work_'+tD()+'.pdf');
    showToast('PDF downloaded!','success');
  });
}

function exportWorkCSV() {
  var csv = COMPANY.full+'\nWork Report\n'+fmtDT(tNow())+'\n\nITEMS\nName,L,B,T,Area/Pc,Qty,Total,Rate,Cost\n';
  for(var i=0;i<_panelEntries.length;i++){
    var p=_panelEntries[i];var cl=calculatePanelArea(p.length,p.breadth,p.thickness,p.quantity);
    csv+='"'+(p.name||'')+'",'+p.length+','+p.breadth+','+p.thickness+','+cl.areaPerPanel+','+p.quantity+','+cl.totalArea+','+(p.rate||0)+','+(cl.totalArea*(p.rate||0)).toFixed(2)+'\n';
  }
  csv+='\nTABLES\nTable,Work,Workers,Done,Target,Progress,Notes\n';
  for(var t=0;t<_tableAssignments.length;t++){
    var tb=_tableAssignments[t];var wn=getWorkerNames(tb.workers);
    var pr=(tb.panelsTotal||0)>0?Math.round(((tb.panelsDone||0)/tb.panelsTotal)*100)+'%':'0%';
    csv+='"'+tb.tableName+'","'+(tb.workName||'')+'","'+(wn||'')+'",'+(tb.panelsDone||0)+','+(tb.panelsTotal||0)+','+pr+',"'+(tb.notes||'')+'"\n';
  }
  csv+='\nPROGRESS\nDate,Table,Work,Workers,Panels,Area,Notes\n';
  for(var w=0;w<_workProgress.length;w++){
    var pr2=_workProgress[w];var pn=getWorkerNames(pr2.workers);
    csv+=formatDateStr(pr2.date)+',"'+(pr2.tableName||'')+'","'+(pr2.workName||'')+'","'+(pn||'')+'",'+(pr2.panelsDone||0)+','+(pr2.areaCovered||0)+',"'+(pr2.notes||'')+'"\n';
  }
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);var link=document.createElement('a');
  link.href=url;link.download='albowry_work_'+tD()+'.csv';link.click();
  URL.revokeObjectURL(url);showToast('CSV downloaded!','success');
}

// ====== HELPERS ======
function getWorkerNames(wids) {
  if (!wids || wids.length === 0) return '';
  var names = [];
  for (var i = 0; i < wids.length; i++) {
    var w = findWorker(wids[i]);
    if (w) names.push(w.name);
  }
  return names.join(', ');
}

function mkStat(val, label, color, bg) {
  return '<div style="flex:1;min-width:110px;background:'+bg+';padding:12px;border-radius:10px;text-align:center;border:1px solid '+color+'22">' +
    '<div style="font-size:22px;font-weight:900;color:'+color+'">'+val+'</div>' +
    '<div style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase">'+label+'</div></div>';
}

function fg(label, id, type, value, placeholder, extra) {
  return '<div class="form-group"><label class="form-label">'+label+'</label>' +
    '<input type="'+type+'" id="'+id+'" class="form-control" value="'+(value||'')+'"' +
    (placeholder ? ' placeholder="'+placeholder+'"' : '') +
    (extra ? ' '+extra : '') + '></div>';
}

function modalBtns(text, onclick) {
  return '<div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end">' +
    '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
    '<button class="btn btn-primary" onclick="'+onclick+'">'+text+'</button></div>';
}

console.log('[ALB] work.js v25 loaded');
