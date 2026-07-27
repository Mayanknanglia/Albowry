function loadHistorySection(){
  populateHistoryWorkerDD();
  const dateInput=document.getElementById('historyDate');
  if(dateInput&&!dateInput.value)dateInput.value=tD();
  loadHistoryForDate();
}

function populateHistoryWorkerDD(){
  const sel=document.getElementById('historyWorker');if(!sel)return;
  const w=gW().filter(x=>x.on).sort((a,b)=>a.name.localeCompare(b.name));
  let h='<option value="">— Select Worker for Backdated Entry —</option>';
  const ind=w.filter(x=>x.sec==='Indian');
  const pak=w.filter(x=>x.sec==='Pakistani');
  if(ind.length){h+='<optgroup label="🇮🇳 Indian Workers">';ind.forEach(x=>h+=`<option value="${x.wid}">${x.name} (${x.prof||'-'})</option>`);h+='</optgroup>';}
  if(pak.length){h+='<optgroup label="🇵🇰 Pakistani Workers">';pak.forEach(x=>h+=`<option value="${x.wid}">${x.name}</option>`);h+='</optgroup>';}
  sel.innerHTML=h;
}

async function addBackdatedEntry(){
  const wid=document.getElementById('historyWorker').value;
  const date=document.getElementById('historyEntryDate').value;
  const shift=document.getElementById('historyShift').value;
  const checkinTime=document.getElementById('historyCheckIn').value;
  const checkoutTime=document.getElementById('historyCheckOut').value;
  
  if(!wid)return toast('Select worker','err');
  if(!date)return toast('Select date','err');
  if(!shift)return toast('Select shift','err');
  if(!checkinTime)return toast('Enter check-in','err');
  if(!checkoutTime)return toast('Enter check-out','err');
  
  const worker=gW().find(x=>x.wid===wid);
  const existing=gA().find(a=>a.wid===wid&&a.date===date);
  if(existing){
    if(!confirm(`⚠️ ${worker.name} already has entry for ${date}. Replace it?`))return;
    await FB.del(COL.A,existing.id);
  }
  
  const checkinISO=new Date(date+'T'+checkinTime+':00').toISOString();
  const checkoutISO=new Date(date+'T'+checkoutTime+':00').toISOString();
  
  let finalCheckoutISO=checkoutISO;
  if(new Date(checkoutISO)<=new Date(checkinISO)){
    const cd=new Date(checkoutISO);cd.setDate(cd.getDate()+1);
    finalCheckoutISO=cd.toISOString();
  }
  
  const c=calcHours(checkinISO,finalCheckoutISO);
  const recId='att_'+Date.now()+'_'+wid+'_bd';
  
  await FB.save(COL.A,recId,{
    recId,wid,name:worker.name,prof:worker.prof,sec:worker.sec,shift,date,
    checkinReqTime:checkinISO,checkinTime:checkinISO,
    checkoutReqTime:finalCheckoutISO,checkoutTime:finalCheckoutISO,
    total:c.total,regular:c.regular,compOT:c.compOT,extraOT:c.extraOT,ot:c.ot,
    status:'completed',backdated:true
  });
  
  toast('✅ Entry added: '+worker.name+' | '+c.total.toFixed(2)+'h');
  document.getElementById('historyWorker').value='';
  document.getElementById('historyCheckIn').value='08:00';
  document.getElementById('historyCheckOut').value='20:00';
  const viewDate=document.getElementById('historyDate').value;
  if(viewDate===date)loadHistoryForDate();
}

function loadHistoryForDate(){
  const date=document.getElementById('historyDate').value;
  const filter=document.getElementById('historyFilter').value;
  if(!date)return;
  
  let att=gA().filter(a=>a.date===date);
  const allWorkers=gW().filter(w=>w.on);
  const el=document.getElementById('historyContent');
  if(!el)return;
  
  // Absent only view
  if(filter==='Absent'){
    const attWids=att.map(a=>a.wid);
    const absentWorkers=allWorkers.filter(w=>!attWids.includes(w.wid));
    if(!absentWorkers.length){
      el.innerHTML='<div class="empty"><div class="em-icon">✅</div><h3>All workers were present on '+date+'!</h3></div>';
      return;
    }
    el.innerHTML=`
      <div style="background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:20px;border-radius:12px;margin-bottom:20px">
        <h3 style="font-size:20px;margin-bottom:8px">❌ Absent Workers - ${date}</h3>
        <p style="opacity:.9;font-size:14px">${absentWorkers.length} out of ${allWorkers.length} workers were absent</p>
      </div>
      <div class="t-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Default Shift</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${absentWorkers.map((w,i)=>`
              <tr>
                <td>${i+1}</td>
                <td><b>${w.name}</b></td>
                <td>${w.prof||'-'}</td>
                <td><span class="tag tag-${w.sec==='Indian'?'ind':'pak'}">${w.sec==='Indian'?'🇮🇳':'🇵🇰'} ${w.sec}</span></td>
                <td><span class="tag ${w.shift==='Night'?'tag-o':'tag-b'}">${w.shift==='Night'?'🌙 Night':'☀️ Day'}</span></td>
                <td><span class="tag tag-r">❌ Absent</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    return;
  }
  
  // Apply filters
  if(filter==='Day')att=att.filter(a=>a.shift==='Day'||!a.shift);
  else if(filter==='Night')att=att.filter(a=>a.shift==='Night');
  else if(filter==='Indian')att=att.filter(a=>a.sec==='Indian');
  else if(filter==='Pakistani')att=att.filter(a=>a.sec==='Pakistani');
  else if(filter==='Present')att=att.filter(a=>a.status==='completed'||a.status==='checked_in');
  
  // Get absent workers
  const attWids=att.map(a=>a.wid);
  let absentWorkers=allWorkers.filter(w=>!attWids.includes(w.wid));
  if(filter==='Indian')absentWorkers=absentWorkers.filter(w=>w.sec==='Indian');
  else if(filter==='Pakistani')absentWorkers=absentWorkers.filter(w=>w.sec==='Pakistani');
  else if(filter==='Day')absentWorkers=absentWorkers.filter(w=>w.shift==='Day'||!w.shift);
  else if(filter==='Night')absentWorkers=absentWorkers.filter(w=>w.shift==='Night');
  else if(filter==='Present')absentWorkers=[];
  
  // Calculate stats
  const present=att.filter(a=>a.status==='completed'||a.status==='checked_in').length;
  const totalHours=att.reduce((s,a)=>s+(a.total||0),0);
  const totalOT=att.reduce((s,a)=>s+(a.ot||0),0);
  const dayShift=att.filter(a=>a.shift==='Day'||!a.shift).length;
  const nightShift=att.filter(a=>a.shift==='Night').length;
  
  // Beautiful stats header
  const statsHTML=`
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:24px;border-radius:14px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div>
          <h3 style="font-size:22px;margin-bottom:4px">📅 ${date}</h3>
          <p style="opacity:.9;font-size:13px">${new Date(date).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-success btn-sm" onclick="downloadHistoryPDF()">📕 PDF</button>
          <button class="btn btn-outline btn-sm" onclick="downloadHistoryExcel()" style="background:#fff;color:#1e40af">📥 Excel</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px">
        <div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center">
          <div style="font-size:26px;font-weight:800;margin-bottom:4px">${att.length}</div>
          <div style="font-size:11px;opacity:.9;font-weight:600">✅ PRESENT</div>
        </div>
        <div style="background:rgba(220,38,38,.3);padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(255,255,255,.2)">
          <div style="font-size:26px;font-weight:800;margin-bottom:4px">${absentWorkers.length}</div>
          <div style="font-size:11px;opacity:.9;font-weight:600">❌ ABSENT</div>
        </div>
        <div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center">
          <div style="font-size:26px;font-weight:800;margin-bottom:4px">☀️ ${dayShift}</div>
          <div style="font-size:11px;opacity:.9;font-weight:600">DAY SHIFT</div>
        </div>
        <div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center">
          <div style="font-size:26px;font-weight:800;margin-bottom:4px">🌙 ${nightShift}</div>
          <div style="font-size:11px;opacity:.9;font-weight:600">NIGHT SHIFT</div>
        </div>
        <div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center">
          <div style="font-size:26px;font-weight:800;margin-bottom:4px">${totalHours.toFixed(1)}h</div>
          <div style="font-size:11px;opacity:.9;font-weight:600">TOTAL HOURS</div>
        </div>
        <div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center">
          <div style="font-size:26px;font-weight:800;margin-bottom:4px">${totalOT.toFixed(1)}h</div>
          <div style="font-size:11px;opacity:.9;font-weight:600">TOTAL OT</div>
        </div>
      </div>
    </div>
  `;
  
  let html=statsHTML;
  
  // Present workers table
  if(att.length){
    const stg=s=>({completed:'<span class="tag tag-g">✓ Done</span>',checked_in:'<span class="tag tag-b">🟢 Working</span>',pending_checkin:'<span class="tag tag-o">⏳ IN</span>',pending_checkout:'<span class="tag tag-o">⏳ OUT</span>'}[s]||s);
    
    html+=`
      <div style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:14px 20px;border-radius:12px 12px 0 0;margin-top:20px">
        <h3 style="font-size:16px;margin:0">✅ Present Workers (${att.length})</h3>
      </div>
      <div class="t-wrap" style="border-top-left-radius:0;border-top-right-radius:0;margin-bottom:24px">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th>
              <th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th>
              <th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${att.map((a,i)=>`
              <tr>
                <td>${i+1}</td>
                <td><b>${a.name}</b>${a.backdated?' <span class="tag tag-o" style="font-size:9px">📝 Manual</span>':''}</td>
                <td>${a.prof||'-'}</td>
                <td><span class="tag tag-${a.sec==='Indian'?'ind':'pak'}">${a.sec==='Indian'?'🇮🇳':'🇵🇰'}</span></td>
                <td><span class="tag ${a.shift==='Night'?'tag-o':'tag-b'}">${a.shift==='Night'?'🌙':'☀️'}</span></td>
                <td style="color:#059669">${fT(a.checkinTime)}</td>
                <td style="color:#dc2626">${fT(a.checkoutTime)}</td>
                <td style="color:var(--p);font-weight:700">${(a.total||0).toFixed(2)}h</td>
                <td>${(a.regular||0).toFixed(2)}h</td>
                <td style="color:#d97706">${(a.compOT||0).toFixed(2)}h</td>
                <td style="color:#dc2626;font-weight:700">${(a.extraOT||0)>0?(a.extraOT).toFixed(2)+'h':'-'}</td>
                <td>${stg(a.status)}</td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="editHistoryEntry('${a.id}')">✏️</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteHistoryEntry('${a.id}')">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  // Absent workers table (with names!)
  if(absentWorkers.length&&filter!=='Present'){
    html+=`
      <div style="background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:14px 20px;border-radius:12px 12px 0 0;margin-top:20px">
        <h3 style="font-size:16px;margin:0">❌ Absent Workers (${absentWorkers.length})</h3>
      </div>
      <div class="t-wrap" style="border-top-left-radius:0;border-top-right-radius:0">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Default Shift</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${absentWorkers.map((w,i)=>`
              <tr style="background:#fef2f2">
                <td>${i+1}</td>
                <td><b style="color:#dc2626">${w.name}</b></td>
                <td>${w.prof||'-'}</td>
                <td><span class="tag tag-${w.sec==='Indian'?'ind':'pak'}">${w.sec==='Indian'?'🇮🇳':'🇵🇰'} ${w.sec}</span></td>
                <td><span class="tag ${w.shift==='Night'?'tag-o':'tag-b'}">${w.shift==='Night'?'🌙 Night':'☀️ Day'}</span></td>
                <td><span class="tag tag-r">❌ Absent</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  if(!att.length&&!absentWorkers.length){
    html=statsHTML+'<div class="empty"><div class="em-icon">📋</div><h3>No records for '+date+'</h3><p>Use "Add Backdated Entry" above</p></div>';
  }
  
  el.innerHTML=html;
}

function editHistoryEntry(id){
  const rec=gA().find(a=>a.id===id);if(!rec)return;
  document.getElementById('historyWorker').value=rec.wid;
  document.getElementById('historyEntryDate').value=rec.date;
  document.getElementById('historyShift').value=rec.shift||'Day';
  const inTime=new Date(rec.checkinTime).toLocaleTimeString('en-GB',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit'});
  const outTime=new Date(rec.checkoutTime).toLocaleTimeString('en-GB',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit'});
  document.getElementById('historyCheckIn').value=inTime;
  document.getElementById('historyCheckOut').value=outTime;
  window.scrollTo({top:0,behavior:'smooth'});
  toast('✏️ Edit form filled','info');
}

function deleteHistoryEntry(id){
  const rec=gA().find(a=>a.id===id);if(!rec)return;
  confirmDlg('Delete?',`Delete ${rec.name}'s entry for ${rec.date}?`,async()=>{
    await FB.del(COL.A,id);toast('🗑️ Deleted','info');loadHistoryForDate();
  });
}

// ============ PDF DOWNLOAD (FIXED - No weird characters) ============
function downloadHistoryPDF(){
  const date=document.getElementById('historyDate').value;
  const filter=document.getElementById('historyFilter').value;
  if(!date)return toast('Select date','err');
  if(!window.jspdf)return toast('Loading...','err');
  
  let att=gA().filter(a=>a.date===date);
  const allWorkers=gW().filter(w=>w.on);
  if(filter==='Day')att=att.filter(a=>a.shift==='Day'||!a.shift);
  else if(filter==='Night')att=att.filter(a=>a.shift==='Night');
  else if(filter==='Indian')att=att.filter(a=>a.sec==='Indian');
  else if(filter==='Pakistani')att=att.filter(a=>a.sec==='Pakistani');
  
  const attWids=att.map(a=>a.wid);
  let absentWorkers=allWorkers.filter(w=>!attWids.includes(w.wid));
  if(filter==='Indian')absentWorkers=absentWorkers.filter(w=>w.sec==='Indian');
  else if(filter==='Pakistani')absentWorkers=absentWorkers.filter(w=>w.sec==='Pakistani');
  else if(filter==='Day')absentWorkers=absentWorkers.filter(w=>w.shift==='Day'||!w.shift);
  else if(filter==='Night')absentWorkers=absentWorkers.filter(w=>w.shift==='Night');
  else if(filter==='Present')absentWorkers=[];
  
  if(!att.length&&!absentWorkers.length)return toast('No data','err');
  
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF('l','mm','a4');
  
  // ============ HEADER WITH LOGO ============
  doc.setFillColor(30,64,175);
  doc.rect(0,0,297,45,'F');
  
  // Logo
  if(LOGO_BASE64){
    try{doc.addImage(LOGO_BASE64,'PNG',12,8,28,28);}catch(e){}
  }
  
  // Title
  doc.setTextColor(255,255,255);
  doc.setFontSize(24);
  doc.setFont('helvetica','bold');
  doc.text('AL BOWRY CARPENTRY',148.5,18,{align:'center'});
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica','normal');
  doc.text('Daily Attendance Report - '+date,148.5,27,{align:'center'});
  
  // Filter info
  doc.setFontSize(10);
  doc.text((filter||'All Workers')+' | Regular: 9h + Compulsory OT: 3h',148.5,34,{align:'center'});
  
  // Location
  doc.setFontSize(9);
  doc.text('Antalya, Turkey | www.albowry.com',148.5,41,{align:'center'});
  
  // ============ STATS BAR (Clean) ============
  const totalHours=att.reduce((s,a)=>s+(a.total||0),0);
  const totalOT=att.reduce((s,a)=>s+(a.ot||0),0);
  const dayShift=att.filter(a=>a.shift==='Day'||!a.shift).length;
  const nightShift=att.filter(a=>a.shift==='Night').length;
  
  // Stats box
  doc.setFillColor(240,249,255);
  doc.rect(10,52,277,18,'F');
  doc.setDrawColor(30,64,175);
  doc.setLineWidth(0.5);
  doc.rect(10,52,277,18,'S');
  
  doc.setTextColor(30,64,175);
  doc.setFontSize(10);
  doc.setFont('helvetica','bold');
  
  const statsText = `Present: ${att.length}   |   Absent: ${absentWorkers.length}   |   Day Shift: ${dayShift}   |   Night Shift: ${nightShift}   |   Total Hours: ${totalHours.toFixed(2)}h   |   Total OT: ${totalOT.toFixed(2)}h`;
  doc.text(statsText,148.5,63,{align:'center'});
  
  doc.setTextColor(0,0,0);
  
  let currentY=78;
  
  // ============ PRESENT WORKERS TABLE ============
  if(att.length){
    // Section header
    doc.setFillColor(5,150,105);
    doc.rect(10,currentY,277,8,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(11);
    doc.setFont('helvetica','bold');
    doc.text('PRESENT WORKERS ('+att.length+')',15,currentY+5.5);
    
    currentY+=10;
    
    const rows=att.map((a,i)=>[
      i+1,
      a.name,
      a.prof||'-',
      a.sec,
      a.shift||'Day',
      fT(a.checkinTime),
      fT(a.checkoutTime),
      (a.total||0).toFixed(2)+'h',
      (a.regular||0).toFixed(2)+'h',
      (a.compOT||0).toFixed(2)+'h',
      (a.extraOT||0).toFixed(2)+'h'
    ]);
    
    // Add totals row
    rows.push([
      '',
      '',
      'TOTALS',
      '',
      '',
      '',
      '',
      totalHours.toFixed(2)+'h',
      att.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)+'h',
      att.reduce((s,a)=>s+(a.compOT||0),0).toFixed(2)+'h',
      att.reduce((s,a)=>s+(a.extraOT||0),0).toFixed(2)+'h'
    ]);
    
    doc.autoTable({
      startY:currentY,
      head:[['#','Name','Work','Country','Shift','Check-In','Check-Out','Total','Reg 9h','OT 3h','Extra']],
      body:rows,
      theme:'grid',
      headStyles:{
        fillColor:[5,150,105],
        textColor:[255,255,255],
        fontSize:9,
        fontStyle:'bold',
        halign:'center'
      },
      bodyStyles:{
        fontSize:8,
        cellPadding:3
      },
      alternateRowStyles:{fillColor:[240,253,244]},
      columnStyles:{
        0:{halign:'center',cellWidth:10},
        1:{halign:'left',fontStyle:'bold'},
        2:{halign:'left'},
        3:{halign:'center'},
        4:{halign:'center'},
        5:{halign:'center'},
        6:{halign:'center'},
        7:{halign:'right',fontStyle:'bold'},
        8:{halign:'right'},
        9:{halign:'right'},
        10:{halign:'right'}
      },
      didParseCell:function(data){
        // Bold totals row
        if(data.row.index===rows.length-1){
          data.cell.styles.fontStyle='bold';
          data.cell.styles.fillColor=[209,250,229];
          data.cell.styles.textColor=[5,95,70];
        }
      }
    });
    
    currentY=doc.lastAutoTable.finalY+8;
  }
  
  // ============ ABSENT WORKERS TABLE ============
  if(absentWorkers.length){
    // Check if we need a new page
    if(currentY>170){
      doc.addPage();
      currentY=15;
    }
    
    // Section header
    doc.setFillColor(220,38,38);
    doc.rect(10,currentY,277,8,'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(11);
    doc.setFont('helvetica','bold');
    doc.text('ABSENT WORKERS ('+absentWorkers.length+')',15,currentY+5.5);
    
    currentY+=10;
    
    const absentRows=absentWorkers.map((w,i)=>[
      i+1,
      w.name,
      w.prof||'-',
      w.sec,
      w.shift||'Day',
      'ABSENT'
    ]);
    
    doc.autoTable({
      startY:currentY,
      head:[['#','Name','Work','Country','Default Shift','Status']],
      body:absentRows,
      theme:'grid',
      headStyles:{
        fillColor:[220,38,38],
        textColor:[255,255,255],
        fontSize:9,
        fontStyle:'bold',
        halign:'center'
      },
      bodyStyles:{
        fontSize:8,
        cellPadding:3
      },
      alternateRowStyles:{fillColor:[254,242,242]},
      columnStyles:{
        0:{halign:'center',cellWidth:15},
        1:{halign:'left',fontStyle:'bold',textColor:[220,38,38]},
        2:{halign:'left'},
        3:{halign:'center'},
        4:{halign:'center'},
        5:{halign:'center',fontStyle:'bold',textColor:[220,38,38]}
      }
    });
  }
  
  // ============ FOOTER ON ALL PAGES ============
  const pc=doc.internal.getNumberOfPages();
  for(let i=1;i<=pc;i++){
    doc.setPage(i);
    doc.setDrawColor(200,200,200);
    doc.setLineWidth(0.3);
    doc.line(10,200,287,200);
    doc.setFontSize(8);
    doc.setTextColor(120,120,120);
    doc.setFont('helvetica','normal');
    doc.text('AL BOWRY Carpentry - Antalya, Turkey - Generated: '+new Date().toLocaleString(),148.5,205,{align:'center'});
    doc.text('Page '+i+' of '+pc,148.5,209,{align:'center'});
  }
  
  doc.save(`AlBowry_${date}_${filter||'All'}.pdf`);
  toast('✅ PDF downloaded!');
}

// ============ EXCEL DOWNLOAD (FIXED - Clean format) ============
function downloadHistoryExcel(){
  const date=document.getElementById('historyDate').value;
  const filter=document.getElementById('historyFilter').value;
  if(!date)return toast('Select date','err');
  
  let att=gA().filter(a=>a.date===date);
  const allWorkers=gW().filter(w=>w.on);
  if(filter==='Day')att=att.filter(a=>a.shift==='Day'||!a.shift);
  else if(filter==='Night')att=att.filter(a=>a.shift==='Night');
  else if(filter==='Indian')att=att.filter(a=>a.sec==='Indian');
  else if(filter==='Pakistani')att=att.filter(a=>a.sec==='Pakistani');
  
  const attWids=att.map(a=>a.wid);
  let absentWorkers=allWorkers.filter(w=>!attWids.includes(w.wid));
  if(filter==='Indian')absentWorkers=absentWorkers.filter(w=>w.sec==='Indian');
  else if(filter==='Pakistani')absentWorkers=absentWorkers.filter(w=>w.sec==='Pakistani');
  else if(filter==='Day')absentWorkers=absentWorkers.filter(w=>w.shift==='Day'||!w.shift);
  else if(filter==='Night')absentWorkers=absentWorkers.filter(w=>w.shift==='Night');
  else if(filter==='Present')absentWorkers=[];
  
  if(!att.length&&!absentWorkers.length)return toast('No data','err');
  
  const logoHTML=LOGO_BASE64?`<img src="${LOGO_BASE64}" width="60" height="60" style="border-radius:8px">`:'<div style="width:60px;height:60px;background:#fff;color:#1e40af;font-size:36px;font-weight:bold;display:flex;align-items:center;justify-content:center;border-radius:8px">A</div>';
  const totalHours=att.reduce((s,a)=>s+(a.total||0),0);
  const totalOT=att.reduce((s,a)=>s+(a.ot||0),0);
  const dayShift=att.filter(a=>a.shift==='Day'||!a.shift).length;
  const nightShift=att.filter(a=>a.shift==='Night').length;
  
  let html=`<html>
<head>
<meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif}
  table{border-collapse:collapse;width:100%}
  .header-row{background:#1e40af;color:#fff;padding:20px}
  .title{font-size:26px;font-weight:bold;margin-bottom:6px}
  .subtitle{font-size:13px;opacity:.9}
  .info-bar{background:#dbeafe;text-align:center;padding:12px;font-weight:bold;font-size:14px;border:1px solid #1e40af}
  .stats-bar{background:#eff6ff;text-align:center;padding:10px;font-size:12px;border-left:1px solid #1e40af;border-right:1px solid #1e40af}
  .section-header{padding:12px;font-weight:bold;text-align:center;font-size:14px;color:#fff}
  .section-present{background:#059669}
  .section-absent{background:#dc2626}
  th{background:#1e40af;color:#fff;padding:10px 8px;border:1px solid #1e3a8a;font-size:11px;text-align:center;font-weight:bold}
  th.absent-th{background:#dc2626;border-color:#991b1b}
  td{padding:8px;border:1px solid #ccc;font-size:11px;text-align:center}
  td.name-cell{text-align:left;font-weight:bold}
  .even{background:#f0f9ff}
  .absent-row{background:#fef2f2}
  .absent-row td{border-color:#fca5a5}
  .absent-name{color:#dc2626;font-weight:bold}
  .totals-row{background:#dbeafe;font-weight:bold}
  .footer{background:#1e40af;color:#fff;text-align:center;padding:12px;font-size:11px}
</style>
</head>
<body>
<table border="1">
  <tr><td colspan="12" class="header-row">
    <table style="border:none;width:100%">
      <tr>
        <td style="border:none;width:80px">${logoHTML}</td>
        <td style="border:none;text-align:center">
          <div class="title">AL BOWRY CARPENTRY</div>
          <div class="subtitle">Antalya, Turkey | www.albowry.com</div>
        </td>
      </tr>
    </table>
  </td></tr>
  <tr><td colspan="12" class="info-bar">Daily Attendance Report - ${date} | ${filter||'All Workers'}</td></tr>
  <tr><td colspan="12" class="stats-bar">Present: ${att.length} | Absent: ${absentWorkers.length} | Day Shift: ${dayShift} | Night Shift: ${nightShift} | Total Hours: ${totalHours.toFixed(2)}h | Total OT: ${totalOT.toFixed(2)}h</td></tr>
  <tr><td colspan="12" style="padding:5px"></td></tr>`;
  
  if(att.length){
    html+=`
  <tr><td colspan="12" class="section-header section-present">✅ PRESENT WORKERS (${att.length})</td></tr>
  <tr>
    <th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th>
    <th>Check-In</th><th>Check-Out</th><th>Total</th><th>Reg 9h</th><th>OT 3h</th><th>Extra OT</th><th>Status</th>
  </tr>`;
    
    att.forEach((a,i)=>{
      html+=`<tr class="${i%2===0?'even':''}">
        <td>${i+1}</td>
        <td class="name-cell">${a.name}${a.backdated?' (Manual)':''}</td>
        <td>${a.prof||'-'}</td>
        <td>${a.sec}</td>
        <td>${a.shift||'Day'}</td>
        <td>${fT(a.checkinTime)}</td>
        <td>${fT(a.checkoutTime)}</td>
        <td><b>${(a.total||0).toFixed(2)}</b></td>
        <td>${(a.regular||0).toFixed(2)}</td>
        <td>${(a.compOT||0).toFixed(2)}</td>
        <td>${(a.extraOT||0).toFixed(2)}</td>
        <td>${a.status}</td>
      </tr>`;
    });
    
    html+=`
  <tr class="totals-row">
    <td colspan="7" style="text-align:right">TOTALS:</td>
    <td>${totalHours.toFixed(2)}</td>
    <td>${att.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)}</td>
    <td>${att.reduce((s,a)=>s+(a.compOT||0),0).toFixed(2)}</td>
    <td>${att.reduce((s,a)=>s+(a.extraOT||0),0).toFixed(2)}</td>
    <td></td>
  </tr>`;
  }
  
  if(absentWorkers.length){
    html+=`
  <tr><td colspan="12" style="padding:5px"></td></tr>
  <tr><td colspan="12" class="section-header section-absent">❌ ABSENT WORKERS (${absentWorkers.length})</td></tr>
  <tr>
    <th class="absent-th">#</th>
    <th class="absent-th">Name</th>
    <th class="absent-th">Work</th>
    <th class="absent-th">Country</th>
    <th class="absent-th">Default Shift</th>
    <th class="absent-th" colspan="7">Status</th>
  </tr>`;
    
    absentWorkers.forEach((w,i)=>{
      html+=`<tr class="absent-row">
        <td>${i+1}</td>
        <td class="name-cell absent-name">${w.name}</td>
        <td>${w.prof||'-'}</td>
        <td>${w.sec}</td>
        <td>${w.shift||'Day'}</td>
        <td colspan="7" class="absent-name">❌ ABSENT</td>
      </tr>`;
    });
  }
  
  html+=`
  <tr><td colspan="12" style="padding:5px"></td></tr>
  <tr><td colspan="12" class="footer">© ${CURRENT_YEAR} AL BOWRY Carpentry | Antalya, Turkey | Generated: ${new Date().toLocaleString()}</td></tr>
</table>
</body>
</html>`;
  
  const b=new Blob([html],{type:'application/vnd.ms-excel'});
  const l=document.createElement('a');
  l.href=URL.createObjectURL(b);
  l.download=`AlBowry_${date}_${filter||'All'}.xls`;
  l.click();
  toast('✅ Excel downloaded!');
}

async function bulkBackdatedEntry(){
  const date=document.getElementById('bulkBackdateDate').value;
  const shift=document.getElementById('bulkBackdateShift').value;
  const checkinTime=document.getElementById('bulkBackdateIn').value;
  const checkoutTime=document.getElementById('bulkBackdateOut').value;
  const filter=document.getElementById('bulkBackdateFilter').value;
  
  if(!date)return toast('Select date','err');
  if(!shift)return toast('Select shift','err');
  if(!checkinTime||!checkoutTime)return toast('Enter times','err');
  
  let workers=gW().filter(w=>w.on);
  if(filter==='Indian')workers=workers.filter(w=>w.sec==='Indian');
  else if(filter==='Pakistani')workers=workers.filter(w=>w.sec==='Pakistani');
  
  const existingWids=gA().filter(a=>a.date===date).map(a=>a.wid);
  const toAdd=workers.filter(w=>!existingWids.includes(w.wid));
  
  if(!toAdd.length)return toast('All have entries','info');
  
  confirmDlg('Bulk Add?',`Add ${toAdd.length} entries for ${date}?`,async()=>{
    const checkinISO=new Date(date+'T'+checkinTime+':00').toISOString();
    const checkoutISO=new Date(date+'T'+checkoutTime+':00').toISOString();
    let finalCheckoutISO=checkoutISO;
    if(new Date(checkoutISO)<=new Date(checkinISO)){
      const cd=new Date(checkoutISO);cd.setDate(cd.getDate()+1);
      finalCheckoutISO=cd.toISOString();
    }
    const c=calcHours(checkinISO,finalCheckoutISO);
    
    for(const w of toAdd){
      const recId='att_'+Date.now()+'_'+w.wid+'_bulk'+Math.random();
      await FB.save(COL.A,recId,{
        recId,wid:w.wid,name:w.name,prof:w.prof,sec:w.sec,shift,date,
        checkinReqTime:checkinISO,checkinTime:checkinISO,
        checkoutReqTime:finalCheckoutISO,checkoutTime:finalCheckoutISO,
        total:c.total,regular:c.regular,compOT:c.compOT,extraOT:c.extraOT,ot:c.ot,
        status:'completed',backdated:true
      });
    }
    
    toast(`✅ Added ${toAdd.length} entries!`);loadHistoryForDate();
  });
}

console.log('📅 History Module Loaded!');
