/* ==========================================================================
   AL BOWRY CARPENTRY LLC — SPECIAL LEAVE & STATUS PDF REPORT GENERATOR
   Supports: Manual Present, Absent, Company Off, Medical Leave
   ========================================================================== */

function generateLeavePDF(selectedMonth, targetWid) {
  var allRecords = typeof attendanceRecords !== 'undefined' ? attendanceRecords : [];
  var allWorkers = typeof workers !== 'undefined' ? workers : [];
  
  if (!allRecords || allRecords.length === 0) {
    if (typeof showToast === 'function') showToast('No attendance records found to generate PDF!', 'error');
    else alert('No attendance records found!');
    return;
  }

  // Filter 4 special options
  var validStatuses = ['manual_present', 'absent', 'company_off', 'medical_leave'];
  
  var filtered = [];
  for (var i = 0; i < allRecords.length; i++) {
    var r = allRecords[i];
    var isStatusMatch = validStatuses.indexOf(r.status) !== -1;
    
    var isMonthMatch = true;
    if (selectedMonth && r.date) {
      isMonthMatch = r.date.indexOf(selectedMonth) === 0; // YYYY-MM
    }

    var isWorkerMatch = true;
    if (targetWid && targetWid !== 'ALL') {
      isWorkerMatch = r.wid === targetWid;
    }

    if (isStatusMatch && isMonthMatch && isWorkerMatch) {
      filtered.push(r);
    }
  }

  if (filtered.length === 0) {
    if (typeof showToast === 'function') showToast('No Leave/Special status records found for this period!', 'warning');
    else alert('No Leave/Special status records found!');
    return;
  }

  // Get Company Logo from localStorage or settings
  var logoSrc = localStorage.getItem('company_logo') || 'assets/logo.png';

  // Build HTML Content for PDF
  var html = '';
  html += '<div id="pdf-container" style="font-family: Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 20px; max-width: 900px; margin: 0 auto;">';

  // --- HEADER SECTION (Matching Image 4) ---
  html += '  <div style="background: #1b365d; color: #ffffff; padding: 20px; border-radius: 6px 6px 0 0; position: relative;">';
  html += '    <table style="width: 100%; border-collapse: collapse;">';
  html += '      <tr>';
  html += '        <td style="width: 140px; vertical-align: middle;">';
  html += '          <div style="background: #ffffff; padding: 8px; border-radius: 4px; display: inline-block; text-align: center;">';
  html += '            <img src="' + logoSrc + '" onerror="this.onerror=null; this.src=\'https://via.placeholder.com/100x60?text=ABC+LOGO\';" style="max-width: 110px; height: auto; display: block;" />';
  html += '          </div>';
  html += '        </td>';
  html += '        <td style="vertical-align: middle; padding-left: 15px;">';
  html += '          <h2 style="margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px; color: #ffffff;">AL BOWRY CARPENTRY LLC</h2>';
  html += '          <p style="margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1;">PROJECT COP31 at Antalya, Turkey | Registered: Sharjah, UAE</p>';
  html += '        </td>';
  html += '        <td style="text-align: right; vertical-align: top; font-size: 10px; color: #94a3b8;">';
  html += '          <div>www.albowry.com</div>';
  html += '          <div style="margin-top: 4px;">Generated: ' + new Date().toLocaleDateString('en-GB') + '</div>';
  html += '        </td>';
  html += '      </tr>';
  html += '    </table>';
  
  // Gold Divider Bar
  html += '    <div style="height: 4px; background: #d97706; margin-top: 15px; border-radius: 2px;"></div>';
  
  // Title Bar
  html += '    <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">';
  html += '      <h3 style="margin: 0; font-size: 16px; color: #ffffff; font-weight: 600;">Attendance & Leave Status Report</h3>';
  html += '      <span style="font-size: 12px; color: #f59e0b; font-weight: bold;">Total Records: ' + filtered.length + '</span>';
  html += '    </div>';
  html += '  </div>';

  // --- STATS SUMMARY BAR ---
  var countAbs = 0, countOff = 0, countMed = 0, countMan = 0;
  for (var k = 0; k < filtered.length; k++) {
    var st = filtered[k].status;
    if (st === 'absent') countAbs++;
    else if (st === 'company_off') countOff++;
    else if (st === 'medical_leave') countMed++;
    else if (st === 'manual_present') countMan++;
  }

  html += '  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; padding: 12px 20px; font-size: 12px; font-weight: 600;">';
  html += '    <span style="margin-right: 20px; color: #16a34a;">● Manual Present: ' + countMan + '</span>';
  html += '    <span style="margin-right: 20px; color: #dc2626;">● Absent: ' + countAbs + '</span>';
  html += '    <span style="margin-right: 20px; color: #2563eb;">● Company Off: ' + countOff + '</span>';
  html += '    <span style="margin-right: 20px; color: #d97706;">● Medical Leave: ' + countMed + '</span>';
  html += '  </div>';

  // --- DATA TABLE ---
  html += '  <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px;">';
  html += '    <thead>';
  html += '      <tr style="background: #1b365d; color: #ffffff; text-align: left;">';
  html += '        <th style="padding: 8px 10px;">Date</th>';
  html += '        <th style="padding: 8px 10px;">Worker Code</th>';
  html += '        <th style="padding: 8px 10px;">Worker Name</th>';
  html += '        <th style="padding: 8px 10px;">Section</th>';
  html += '        <th style="padding: 8px 10px;">Status Type</th>';
  html += '        <th style="padding: 8px 10px; text-align: center;">Pay Hrs</th>';
  html += '        <th style="padding: 8px 10px;">Reason / Note</th>';
  html += '      </tr>';
  html += '    </thead>';
  html += '    <tbody>';

  for (var j = 0; j < filtered.length; j++) {
    var rec = filtered[j];
    var bg = (j % 2 === 0) ? '#ffffff' : '#f8fafc';
    
    // Status Badge Formatting
    var statusBadge = '';
    if (rec.status === 'manual_present') {
      statusBadge = '<span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">Manual Present</span>';
    } else if (rec.status === 'absent') {
      statusBadge = '<span style="background: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">Absent (No Pay)</span>';
    } else if (rec.status === 'company_off') {
      statusBadge = '<span style="background: #dbeafe; color: #1d4ed8; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">Company Off</span>';
    } else if (rec.status === 'medical_leave') {
      statusBadge = '<span style="background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 10px;">Medical Leave</span>';
    }

    html += '      <tr style="background: ' + bg + '; border-bottom: 1px solid #e2e8f0;">';
    html += '        <td style="padding: 8px 10px; font-weight: 600;">' + (rec.date || '-') + '</td>';
    html += '        <td style="padding: 8px 10px; color: #475569;">' + (rec.wid || '-') + '</td>';
    html += '        <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">' + (rec.name || '-') + '</td>';
    html += '        <td style="padding: 8px 10px; color: #64748b;">' + (rec.sec || 'Indian') + '</td>';
    html += '        <td style="padding: 8px 10px;">' + statusBadge + '</td>';
    html += '        <td style="padding: 8px 10px; text-align: center; font-weight: bold;">' + (rec.regular || 0) + 'h</td>';
    html += '        <td style="padding: 8px 10px; color: #334155; font-style: italic;">' + (rec.note || '-') + '</td>';
    html += '      </tr>';
  }

  html += '    </tbody>';
  html += '  </table>';

  // --- FOOTER ---
  html += '  <div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; text-align: center;">';
  html += '    COP31 Attendance System • Confidential & Proprietary Report • AL BOWRY CARPENTRY LLC';
  html += '  </div>';

  html += '</div>';

  // Render Window Print / Download PDF Trigger
  var win = window.open('', '_blank');
  win.document.write('<html><head><title>Leave_Report_' + (selectedMonth || 'All') + '</title>');
  win.document.write('<style>body { margin: 0; padding: 10px; background: #f1f5f9; } @media print { body { background: #fff; padding: 0; } }</style>');
  win.document.write('</head><body>');
  win.document.write(html);
  win.document.write('<script>setTimeout(function(){ window.print(); }, 600);</script>');
  win.document.write('</body></html>');
  win.document.close();
}
