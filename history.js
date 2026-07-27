// ========== HISTORY & BACKDATED ENTRY MODULE ==========
// AL BOWRY CARPENTRY LLC - COP31 Project, Antalya, Turkey

function loadHistorySection(){
  populateHistoryWorkerDD();
  const d1=document.getElementById('historyDate');
  const d2=document.getElementById('historyEntryDate');
  if(d1&&!d1.value)d1.value=tD();
  if(d2&&!d2.value)d2.value=tD();
  loadHistoryForDate();
}

function populateHistoryWorkerDD(){
  const sel=document.getElementById('historyWorker');
  if(!sel){console.log('❌ historyWorker not found');return;}
  const w=gW().filter(x=>x.on).sort((a,b)=>a.name.localeCompare(b.name));
  if(!w.length){
    sel.innerHTML='<option value="">Loading workers...</option>';
    console.log('⏳ Workers not loaded yet, retrying...');
    setTimeout(populateHistoryWorkerDD,2000);
    return;
  }
  let h='<option value="">— Select Worker —</option>';
  const ind=w.filter(x=>x.sec==='Indian');
  const pak=w.filter(x=>x.sec==='Pakistani');
  if(ind.length){
    h+='<optgroup label="Indian Workers ('+ind.length+')">';
    ind.forEach(x=>h+=`<option value="${x.wid}">${x.name} - ${x.prof||'Worker'}</option>`);
    h+='</optgroup>';
  }
  if(pak.length){
    h+='<optgroup label="Pakistani Workers ('+pak.length+')">';
    pak.forEach(x=>h+=`<option value="${x.wid}">${x.name} - ${x.prof||'Worker'}</option>`);
    h+='</optgroup>';
  }
  sel.innerHTML=h;
  console.log('✅ History dropdown: '+w.length+' workers loaded');
}

async function addBackdatedEntry(){
  const wid=document.getElementById('historyWorker').value;
  const date=document.getElementById('historyEntryDate').value;
  const shift=document.getElementById('historyShift').value;
  const inTime=document.getElementById('historyCheckIn').value;
  const outTime=document.getElementById('historyCheckOut').value;
  
  if(!wid)return toast('Select worker','err');
  if(!date)return toast('Select date','err');
  if(!shift)return toast('Select shift','err');
  if(!inTime)return toast('Enter check-in time','err');
  if(!outTime)return toast('Enter check-out time','err');
  
  const worker=gW().find(x=>x.wid===wid);
  if(!worker){toast('Worker not found','err');return;}
  
  const existing=gA().find(a=>a.wid===wid&&a.date===date);
  if(existing){
    if(!confirm(worker.name+' already has entry for '+date+'. Replace?'))return;
    await FB.del(COL.A,existing.id);
  }
  
  const ciISO=new Date(date+'T'+inTime+':00').toISOString();
  let coISO=new Date(date+'T'+outTime+':00').toISOString();
  if(new Date(coISO)<=new Date(ciISO)){
    const d=new Date(coISO);d.setDate(d.getDate()+1);coISO=d.toISOString();
  }
  
  const c=calcHours(ciISO,coISO);
  const rid='att_'+Date.now()+'_'+wid+'_bd';
  
  await FB.save(COL.A,rid,{
    recId:rid,wid,name:worker.name,prof:worker.prof,sec:worker.sec,shift,date,
    checkinReqTime:ciISO,checkinTime:ciISO,
    checkoutReqTime:coISO,checkoutTime:coISO,
    total:c.total,regular:c.regular,compOT:c.compOT,extraOT:c.extraOT,ot:c.ot,
    status:'completed',backdated:true
  });
  
  toast('✅ '+worker.name+': '+c.total.toFixed(2)+'h added for '+date);
  document.getElementById('historyWorker').value='';
  const vd=document.getElementById('historyDate').value;
  if(vd===date)loadHistoryForDate();
}

function getFilteredData(date,filter){
  let att=gA().filter(a=>a.date===date);
  const all=gW().filter(w=>w.on);
  
  if(filter==='Day')att=att.filter(a=>a.shift==='Day'||!a.shift);
  else if(filter==='Night')att=att.filter(a=>a.shift==='Night');
  else if(filter==='Indian')att=att.filter(a=>a.sec==='Indian');
  else if(filter==='Pakistani')att=att.filter(a=>a.sec==='Pakistani');
  else if(filter==='Present')att=att.filter(a=>a.status==='completed'||a.status==='checked_in');
  
  const attWids=att.map(a=>a.wid);
  let absent=all.filter(w=>!gA().filter(a=>a.date===date).map(a=>a.wid).includes(w.wid));
  
  if(filter==='Indian')absent=absent.filter(w=>w.sec==='Indian');
  else if(filter==='Pakistani')absent=absent.filter(w=>w.sec==='Pakistani');
  else if(filter==='Present'||filter==='Absent'){}
  
  return{att,absent,all};
}

function loadHistoryForDate(){
  const date=document.getElementById('historyDate')?.value;
  const filter=document.getElementById('historyFilter')?.value||'';
  if(!date)return;
  
  const allAtt=gA().filter(a=>a.date===date);
  const allWorkers=gW().filter(w=>w.on);
  const el=document.getElementById('historyContent');
  if(!el)return;
  
  // Absent only
  if(filter==='Absent'){
    const attWids=allAtt.map(a=>a.wid);
    const absent=allWorkers.filter(w=>!attWids.includes(w.wid));
    if(!absent.length){el.innerHTML='<div class="empty"><div class="em-icon">✅</div><h3>All workers present on '+date+'!</h3></div>';return;}
    el.innerHTML=renderAbsentSection(absent,date,allWorkers.length);
    return;
  }
  
  let att=allAtt;
  if(filter==='Day')att=att.filter(a=>a.shift==='Day'||!a.shift);
  else if(filter==='Night')att=att.filter(a=>a.shift==='Night');
  else if(filter==='Indian')att=att.filter(a=>a.sec==='Indian');
  else if(filter==='Pakistani')att=att.filter(a=>a.sec==='Pakistani');
  else if(filter==='Present')att=att.filter(a=>a.status==='completed'||a.status==='checked_in');
  
  const attWids=allAtt.map(a=>a.wid);
  let absent=allWorkers.filter(w=>!attWids.includes(w.wid));
  if(filter==='Indian')absent=absent.filter(w=>w.sec==='Indian');
  else if(filter==='Pakistani')absent=absent.filter(w=>w.sec==='Pakistani');
  else if(filter==='Present')absent=[];
  
  const tH=att.reduce((s,a)=>s+(a.total||0),0);
  const tOT=att.reduce((s,a)=>s+(a.ot||0),0);
  const dayS=att.filter(a=>a.shift==='Day'||!a.shift).length;
  const nightS=att.filter(a=>a.shift==='Night').length;
  
  let html=renderStatsHeader(date,att.length,absent.length,dayS,nightS,tH,tOT);
  
  if(att.length){
    html+=renderPresentTable(att);
  }
  
  if(absent.length&&filter!=='Present'){
    html+=renderAbsentTable(absent);
  }
  
  if(!att.length&&!absent.length){
    html+='<div class="empty"><div class="em-icon">📋</div><h3>No records for '+date+'</h3><p>Use backdated entry above</p></div>';
  }
  
  el.innerHTML=html;
}

function renderStatsHeader(date,present,absent,dayS,nightS,tH,tOT){
  const dateStr=new Date(date).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  return `<div style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:24px;border-radius:14px;margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div>
        <h3 style="font-size:22px;margin-bottom:4px">${date}</h3>
        <p style="opacity:.9;font-size:13px">${dateStr}</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-success btn-sm" onclick="downloadHistoryPDF()">PDF</button>
        <button class="btn btn-outline btn-sm" onclick="downloadHistoryExcel()" style="background:#fff;color:#1e40af">Excel</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px">
      <div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center"><div style="font-size:26px;font-weight:800">${present}</div><div style="font-size:11px;font-weight:600">PRESENT</div></div>
      <div style="background:rgba(220,38,38,.3);padding:14px;border-radius:10px;text-align:center;border:1px solid rgba(255,255,255,.2)"><div style="font-size:26px;font-weight:800">${absent}</div><div style="font-size:11px;font-weight:600">ABSENT</div></div>
      <div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center"><div style="font-size:26px;font-weight:800">${dayS}</div><div style="font-size:11px;font-weight:600">DAY SHIFT</div></div>
      <div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center"><div style="font-size:26px;font-weight:800">${nightS}</div><div style="font-size:11px;font-weight:600">NIGHT SHIFT</div></div>
      <div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center"><div style="font-size:26px;font-weight:800">${tH.toFixed(1)}h</div><div style="font-size:11px;font-weight:600">HOURS</div></div>
      <div style="background:rgba(255,255,255,.15);padding:14px;border-radius:10px;text-align:center"><div style="font-size:26px;font-weight:800">${tOT.toFixed(1)}h</div><div style="font-size:11px;font-weight:600">OVERTIME</div></div>
    </div>
  </div>`;
}

function renderPresentTable(att){
  const stg=s=>({completed:'<span class="tag tag-g">Done</span>',checked_in:'<span class="tag tag-b">Working</span>',pending_checkin:'<span class="tag tag-o">Pending IN</span>',pending_checkout:'<span class="tag tag-o">Pending OUT</span>'}[s]||s);
  return `<div style="background:#059669;color:#fff;padding:14px 20px;border-radius:12px 12px 0 0"><h3 style="font-size:16px;margin:0">Present Workers (${att.length})</h3></div>
  <div class="t-wrap" style="border-top-left-radius:0;border-top-right-radius:0;margin-bottom:24px"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th><th>Status</th><th>Act</th></tr></thead><tbody>${att.map((a,i)=>`<tr><td>${i+1}</td><td><b>${a.name}</b>${a.backdated?' <span class="tag tag-o" style="font-size:9px">Manual</span>':''}</td><td>${a.prof||'-'}</td><td><span class="tag tag-${a.sec==='Indian'?'ind':'pak'}">${a.sec==='Indian'?'IN':'PK'}</span></td><td><span class="tag ${a.shift==='Night'?'tag-o':'tag-b'}">${a.shift==='Night'?'Night':'Day'}</span></td><td style="color:#059669">${fT(a.checkinTime)}</td><td style="color:#dc2626">${fT(a.checkoutTime)}</td><td style="color:var(--p);font-weight:700">${(a.total||0).toFixed(2)}h</td><td>${(a.regular||0).toFixed(2)}h</td><td style="color:#d97706">${(a.compOT||0).toFixed(2)}h</td><td style="color:#dc2626;font-weight:700">${(a.extraOT||0)>0?(a.extraOT).toFixed(2)+'h':'-'}</td><td>${stg(a.status)}</td><td><button class="btn btn-outline btn-sm" onclick="editHistoryEntry('${a.id}')">✏️</button><button class="btn btn-danger btn-sm" onclick="deleteHistoryEntry('${a.id}')">🗑️</button></td></tr>`).join('')}</tbody></table></div>`;
}

function renderAbsentTable(absent){
  return `<div style="background:#dc2626;color:#fff;padding:14px 20px;border-radius:12px 12px 0 0"><h3 style="font-size:16px;margin:0">Absent Workers (${absent.length})</h3></div>
  <div class="t-wrap" style="border-top-left-radius:0;border-top-right-radius:0"><table><thead><tr><th style="background:#dc2626">#</th><th style="background:#dc2626">Name</th><th style="background:#dc2626">Work</th><th style="background:#dc2626">Country</th><th style="background:#dc2626">Default Shift</th><th style="background:#dc2626">Status</th></tr></thead><tbody>${absent.map((w,i)=>`<tr style="background:#fef2f2"><td>${i+1}</td><td><b style="color:#dc2626">${w.name}</b></td><td>${w.prof||'-'}</td><td><span class="tag tag-${w.sec==='Indian'?'ind':'pak'}">${w.sec==='Indian'?'IN':'PK'} ${w.sec}</span></td><td><span class="tag ${w.shift==='Night'?'tag-o':'tag-b'}">${w.shift==='Night'?'Night':'Day'}</span></td><td><span class="tag tag-r">ABSENT</span></td></tr>`).join('')}</tbody></table></div>`;
}

function renderAbsentSection(absent,date,total){
  return `<div style="background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:20px;border-radius:12px;margin-bottom:20px"><h3 style="font-size:20px;margin-bottom:8px">Absent Workers - ${date}</h3><p style="opacity:.9;font-size:14px">${absent.length} out of ${total} workers absent</p></div>`+renderAbsentTable(absent);
}

function editHistoryEntry(id){
  const r=gA().find(a=>a.id===id);if(!r)return;
  document.getElementById('historyWorker').value=r.wid;
  document.getElementById('historyEntryDate').value=r.date;
  document.getElementById('historyShift').value=r.shift||'Day';
  try{
    const it=new Date(r.checkinTime).toLocaleTimeString('en-GB',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit'});
    const ot=new Date(r.checkoutTime).toLocaleTimeString('en-GB',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit'});
    document.getElementById('historyCheckIn').value=it;
    document.getElementById('historyCheckOut').value=ot;
  }catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
  toast('Form filled - update and save','info');
}

function deleteHistoryEntry(id){
  const r=gA().find(a=>a.id===id);if(!r)return;
  confirmDlg('Delete?',r.name+' entry for '+r.date+'?',async()=>{
    await FB.del(COL.A,id);toast('Deleted','info');loadHistoryForDate();
  });
}

// ============ PDF - COMPANY BRANDED ============
function downloadHistoryPDF(){
  const date=document.getElementById('historyDate').value;
  const filter=document.getElementById('historyFilter').value;
  if(!date)return toast('Select date','err');
  if(!window.jspdf)return toast('Loading PDF library...','err');
  
  let att=gA().filter(a=>a.date===date);
  const allW=gW().filter(w=>w.on);
  if(filter==='Day')att=att.filter(a=>a.shift==='Day'||!a.shift);
  else if(filter==='Night')att=att.filter(a=>a.shift==='Night');
  else if(filter==='Indian')att=att.filter(a=>a.sec==='Indian');
  else if(filter==='Pakistani')att=att.filter(a=>a.sec==='Pakistani');
  
  const attWids=att.map(a=>a.wid);
  let absent=allW.filter(w=>!gA().filter(a=>a.date===date).map(a=>a.wid).includes(w.wid));
  if(filter==='Indian')absent=absent.filter(w=>w.sec==='Indian');
  else if(filter==='Pakistani')absent=absent.filter(w=>w.sec==='Pakistani');
  else if(filter==='Present')absent=[];
  
  if(!att.length&&!absent.length)return toast('No data','err');
  
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF('l','mm','a4');
  
  // ===== HEADER =====
  doc.setFillColor(30,64,175);
  doc.rect(0,0,297,52,'F');
  
  if(LOGO_BASE64){try{doc.addImage(LOGO_BASE64,'PNG',12,8,34,34);}catch(e){}}
  
  doc.setTextColor(255,255,255);
  doc.setFontSize(26);
  doc.setFont('helvetica','bold');
  doc.text('AL BOWRY CARPENTRY LLC',148.5,18,{align:'center'});
  
  doc.setFontSize(13);
  doc.setFont('helvetica','normal');
  doc.text('Attendance Report - '+date,148.5,27,{align:'center'});
  
  doc.setFontSize(12);
  doc.setFont('helvetica','bold');
  doc.text('PROJECT COP31 at Antalya, Turkey',148.5,35,{align:'center'});
  
  doc.setFontSize(10);
  doc.setFont('helvetica','normal');
  doc.text('Company Registered: Sharjah, UAE  |  www.albowry.com',148.5,42,{align:'center'});
  
  doc.setFontSize(9);
  doc.text((filter||'All Workers')+'  |  Schedule: 9h Regular + 3h Compulsory OT',148.5,49,{align:'center'});
  
  // ===== STATS =====
  const tH=att.reduce((s,a)=>s+(a.total||0),0);
  const tOT=att.reduce((s,a)=>s+(a.ot||0),0);
  const dayS=att.filter(a=>a.shift==='Day'||!a.shift).length;
  const nightS=att.filter(a=>a.shift==='Night').length;
  
  doc.setFillColor(240,249,255);
  doc.rect(10,57,277,14,'F');
  doc.setDrawColor(30,64,175);
  doc.setLineWidth(0.5);
  doc.rect(10,57,277,14,'S');
  
  doc.setTextColor(30,64,175);
  doc.setFontSize(10);
  doc.setFont('helvetica','bold');
  doc.text('Present: '+att.length+'   |   Absent: '+absent.length+'   |   Day: '+dayS+'   |   Night: '+nightS+'   |   Hours: '+tH.toFixed(2)+'h   |   OT: '+tOT.toFixed(2)+'h',148.5,66,{align:'center'});
  
  doc.setTextColor(0);
  let curY=78;
  
  // ===== PRESENT =====
  if(att.length){
    doc.setFillColor(5,150,105);
    doc.rect(10,curY,277,9,'F');
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont('helvetica','bold');
    doc.text('PRESENT WORKERS ('+att.length+')',15,curY+6);
    curY+=11;
    
    const rows=att.map((a,i)=>[i+1,a.name+(a.backdated?' (Manual)':''),a.prof||'-',a.sec,a.shift||'Day',fT(a.checkinTime),fT(a.checkoutTime),(a.total||0).toFixed(2)+'h',(a.regular||0).toFixed(2)+'h',(a.compOT||0).toFixed(2)+'h',(a.extraOT||0).toFixed(2)+'h']);
    rows.push(['','','TOTALS','','','','',tH.toFixed(2)+'h',att.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)+'h',att.reduce((s,a)=>s+(a.compOT||0),0).toFixed(2)+'h',att.reduce((s,a)=>s+(a.extraOT||0),0).toFixed(2)+'h']);
    
    doc.autoTable({
      startY:curY,
      head:[['#','Name','Work','Country','Shift','Check-In','Check-Out','Total','Reg 9h','OT 3h','Extra']],
      body:rows,
      theme:'grid',
      headStyles:{fillColor:[5,150,105],textColor:255,fontSize:9,fontStyle:'bold',halign:'center'},
      bodyStyles:{fontSize:8,cellPadding:3},
      alternateRowStyles:{fillColor:[240,253,244]},
      columnStyles:{0:{halign:'center',cellWidth:10},1:{halign:'left',fontStyle:'bold'},7:{halign:'right',fontStyle:'bold'}},
      didParseCell:function(d){if(d.row.index===rows.length-1){d.cell.styles.fontStyle='bold';d.cell.styles.fillColor=[209,250,229];d.cell.styles.textColor=[5,95,70];}}
    });
    
    curY=doc.lastAutoTable.finalY+8;
  }
  
  // ===== ABSENT =====
  if(absent.length){
    if(curY>170){doc.addPage();curY=15;}
    
    doc.setFillColor(220,38,38);
    doc.rect(10,curY,277,9,'F');
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont('helvetica','bold');
    doc.text('ABSENT WORKERS ('+absent.length+')',15,curY+6);
    curY+=11;
    
    const aRows=absent.map((w,i)=>[i+1,w.name,w.prof||'-',w.sec,w.shift||'Day','ABSENT']);
    
    doc.autoTable({
      startY:curY,
      head:[['#','Name','Work','Country','Default Shift','Status']],
      body:aRows,
      theme:'grid',
      headStyles:{fillColor:[220,38,38],textColor:255,fontSize:9,fontStyle:'bold',halign:'center'},
      bodyStyles:{fontSize:8,cellPadding:3},
      alternateRowStyles:{fillColor:[254,242,242]},
      columnStyles:{0:{halign:'center',cellWidth:15},1:{halign:'left',fontStyle:'bold',textColor:[220,38,38]},5:{halign:'center',fontStyle:'bold',textColor:[220,38,38]}}
    });
  }
  
  // ===== FOOTER =====
  const pc=doc.internal.getNumberOfPages();
  for(let i=1;i<=pc;i++){
    doc.setPage(i);
    doc.setDrawColor(200);doc.setLineWidth(0.3);doc.line(10,198,287,198);
    doc.setFontSize(8);doc.setTextColor(120);doc.setFont('helvetica','normal');
    doc.text('AL BOWRY CARPENTRY LLC  |  Registered: Sharjah, UAE  |  Project Site: COP31, Antalya, Turkey',148.5,203,{align:'center'});
    doc.text('Generated: '+new Date().toLocaleString()+'  |  Page '+i+'/'+pc,148.5,208,{align:'center'});
  }
  
  doc.save('AlBowry_COP31_'+date+'_'+(filter||'All')+'.pdf');
  toast('PDF downloaded!');
}

// ============ EXCEL - COMPANY BRANDED ============
function downloadHistoryExcel(){
  const date=document.getElementById('historyDate').value;
  const filter=document.getElementById('historyFilter').value;
  if(!date)return toast('Select date','err');
  
  let att=gA().filter(a=>a.date===date);
  const allW=gW().filter(w=>w.on);
  if(filter==='Day')att=att.filter(a=>a.shift==='Day'||!a.shift);
  else if(filter==='Night')att=att.filter(a=>a.shift==='Night');
  else if(filter==='Indian')att=att.filter(a=>a.sec==='Indian');
  else if(filter==='Pakistani')att=att.filter(a=>a.sec==='Pakistani');
  
  const attWids=att.map(a=>a.wid);
  let absent=allW.filter(w=>!gA().filter(a=>a.date===date).map(a=>a.wid).includes(w.wid));
  if(filter==='Indian')absent=absent.filter(w=>w.sec==='Indian');
  else if(filter==='Pakistani')absent=absent.filter(w=>w.sec==='Pakistani');
  else if(filter==='Present')absent=[];
  
  if(!att.length&&!absent.length)return toast('No data','err');
  
  const logo=LOGO_BASE64?`<img src="${LOGO_BASE64}" width="70" height="70" style="border-radius:8px">`:'<div style="width:70px;height:70px;background:#fff;color:#1e40af;font-size:40px;font-weight:bold;display:flex;align-items:center;justify-content:center;border-radius:8px">A</div>';
  const tH=att.reduce((s,a)=>s+(a.total||0),0);
  const dayS=att.filter(a=>a.shift==='Day'||!a.shift).length;
  const nightS=att.filter(a=>a.shift==='Night').length;
  
  let h=`<html><head><meta charset="UTF-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%}th{background:#1e40af;color:#fff;padding:10px 8px;border:1px solid #1e3a8a;font-size:11px;text-align:center;font-weight:bold}td{padding:8px;border:1px solid #ccc;font-size:11px;text-align:center}.e{background:#f0f9ff}.ar{background:#fef2f2}.ar td{border-color:#fca5a5}th.ath{background:#dc2626;border-color:#991b1b}</style></head><body><table border="1">`;
  
  // Header
  h+=`<tr><td colspan="12" style="background:#1e40af;color:#fff;padding:20px"><table style="border:none;width:100%"><tr><td style="border:none;width:90px;vertical-align:middle">${logo}</td><td style="border:none;text-align:center;vertical-align:middle"><div style="font-size:28px;font-weight:bold;letter-spacing:1px">AL BOWRY CARPENTRY LLC</div><div style="font-size:14px;font-weight:bold;margin-top:6px">Attendance Report</div><div style="font-size:13px;font-weight:bold;margin-top:4px">PROJECT COP31 at Antalya, Turkey</div><div style="font-size:11px;opacity:.9;margin-top:4px">Company Registered: Sharjah, UAE | www.albowry.com</div></td></tr></table></td></tr>`;
  
  h+=`<tr><td colspan="12" style="background:#dbeafe;text-align:center;padding:12px;font-weight:bold;font-size:14px;color:#1e40af">Date: ${date} | ${filter||'All Workers'} | Regular: 9h + Compulsory OT: 3h</td></tr>`;
  h+=`<tr><td colspan="12" style="background:#eff6ff;text-align:center;padding:10px;font-size:12px">Present: ${att.length} | Absent: ${absent.length} | Day: ${dayS} | Night: ${nightS} | Hours: ${tH.toFixed(2)}h</td></tr>`;
  h+=`<tr><td colspan="12" style="padding:5px"></td></tr>`;
  
  // Present
  if(att.length){
    h+=`<tr><td colspan="12" style="background:#059669;color:#fff;padding:12px;font-weight:bold;text-align:center;font-size:14px">PRESENT WORKERS (${att.length})</td></tr>`;
    h+=`<tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th><th>Check-In</th><th>Check-Out</th><th>Total</th><th>Reg 9h</th><th>OT 3h</th><th>Extra OT</th><th>Status</th></tr>`;
    att.forEach((a,i)=>{
      h+=`<tr class="${i%2===0?'e':''}"><td>${i+1}</td><td style="text-align:left;font-weight:bold">${a.name}${a.backdated?' (Manual)':''}</td><td>${a.prof||'-'}</td><td>${a.sec}</td><td>${a.shift||'Day'}</td><td>${fT(a.checkinTime)}</td><td>${fT(a.checkoutTime)}</td><td><b>${(a.total||0).toFixed(2)}</b></td><td>${(a.regular||0).toFixed(2)}</td><td>${(a.compOT||0).toFixed(2)}</td><td>${(a.extraOT||0).toFixed(2)}</td><td>${a.status}</td></tr>`;
    });
    h+=`<tr style="background:#dbeafe;font-weight:bold"><td colspan="7" style="text-align:right">TOTALS:</td><td>${tH.toFixed(2)}</td><td>${att.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)}</td><td>${att.reduce((s,a)=>s+(a.compOT||0),0).toFixed(2)}</td><td>${att.reduce((s,a)=>s+(a.extraOT||0),0).toFixed(2)}</td><td></td></tr>`;
  }
  
  // Absent
  if(absent.length){
    h+=`<tr><td colspan="12" style="padding:5px"></td></tr>`;
    h+=`<tr><td colspan="12" style="background:#dc2626;color:#fff;padding:12px;font-weight:bold;text-align:center;font-size:14px">ABSENT WORKERS (${absent.length})</td></tr>`;
    h+=`<tr><th class="ath">#</th><th class="ath">Name</th><th class="ath">Work</th><th class="ath">Country</th><th class="ath">Default Shift</th><th class="ath" colspan="7">Status</th></tr>`;
    absent.forEach((w,i)=>{
      h+=`<tr class="ar"><td>${i+1}</td><td style="text-align:left;font-weight:bold;color:#dc2626">${w.name}</td><td>${w.prof||'-'}</td><td>${w.sec}</td><td>${w.shift||'Day'}</td><td colspan="7" style="font-weight:bold;color:#dc2626">ABSENT</td></tr>`;
    });
  }
  
  // Footer
  h+=`<tr><td colspan="12" style="padding:5px"></td></tr>`;
  h+=`<tr><td colspan="12" style="background:#1e40af;color:#fff;text-align:center;padding:14px;font-size:11px">AL BOWRY CARPENTRY LLC | Registered: Sharjah, UAE | Project: COP31, Antalya, Turkey | Generated: ${new Date().toLocaleString()}</td></tr>`;
  h+=`</table></body></html>`;
  
  const b=new Blob([h],{type:'application/vnd.ms-excel'});
  const l=document.createElement('a');
  l.href=URL.createObjectURL(b);
  l.download='AlBowry_COP31_'+date+'_'+(filter||'All')+'.xls';
  l.click();
  toast('Excel downloaded!');
}

async function bulkBackdatedEntry(){
  const date=document.getElementById('bulkBackdateDate').value;
  const shift=document.getElementById('bulkBackdateShift').value;
  const inTime=document.getElementById('bulkBackdateIn').value;
  const outTime=document.getElementById('bulkBackdateOut').value;
  const filter=document.getElementById('bulkBackdateFilter').value;
  
  if(!date)return toast('Select date','err');
  if(!shift)return toast('Select shift','err');
  if(!inTime||!outTime)return toast('Enter times','err');
  
  let workers=gW().filter(w=>w.on);
  if(filter==='Indian')workers=workers.filter(w=>w.sec==='Indian');
  else if(filter==='Pakistani')workers=workers.filter(w=>w.sec==='Pakistani');
  
  const existW=gA().filter(a=>a.date===date).map(a=>a.wid);
  const toAdd=workers.filter(w=>!existW.includes(w.wid));
  
  if(!toAdd.length)return toast('All workers already have entries for '+date,'info');
  
  confirmDlg('Bulk Add?',toAdd.length+' entries for '+date+'?',async()=>{
    const ci=new Date(date+'T'+inTime+':00').toISOString();
    let co=new Date(date+'T'+outTime+':00').toISOString();
    if(new Date(co)<=new Date(ci)){const d=new Date(co);d.setDate(d.getDate()+1);co=d.toISOString();}
    const c=calcHours(ci,co);
    
    for(const w of toAdd){
      const rid='att_'+Date.now()+'_'+w.wid+'_b'+Math.random();
      await FB.save(COL.A,rid,{
        recId:rid,wid:w.wid,name:w.name,prof:w.prof,sec:w.sec,shift,date,
        checkinReqTime:ci,checkinTime:ci,checkoutReqTime:co,checkoutTime:co,
        total:c.total,regular:c.regular,compOT:c.compOT,extraOT:c.extraOT,ot:c.ot,
        status:'completed',backdated:true
      });
    }
    toast(toAdd.length+' entries added!');
    loadHistoryForDate();
  });
}

console.log('History Module Ready!');
