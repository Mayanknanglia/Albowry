function loadManualSection(){populateManualWorkerDD();populateManualCustomDD();loadManualToday();setDefaultManualDate();}

function populateManualWorkerDD(){
  const sel=document.getElementById('manualWorker');if(!sel)return;const cv=sel.value;
  const w=gW().filter(x=>x.on).sort((a,b)=>a.name.localeCompare(b.name));
  let h='<option value="">— Select Worker —</option>';
  const day=w.filter(x=>x.shift==='Day'||!x.shift);
  const night=w.filter(x=>x.shift==='Night');
  if(day.length){h+='<optgroup label="☀️ Day Shift">';day.forEach(x=>h+=`<option value="${x.wid}">${x.name} — ${x.prof||'-'}</option>`);h+='</optgroup>';}
  if(night.length){h+='<optgroup label="🌙 Night Shift">';night.forEach(x=>h+=`<option value="${x.wid}">${x.name} — ${x.prof||'-'}</option>`);h+='</optgroup>';}
  sel.innerHTML=h;if(cv)sel.value=cv;
}

function populateManualCustomDD(){
  const sel=document.getElementById('manualCustomWorker');if(!sel)return;
  const main=document.getElementById('manualWorker');if(main)sel.innerHTML=main.innerHTML;
}

async function manualQuickCheckIn(){
  const wid=document.getElementById('manualWorker').value;if(!wid)return toast('Select worker','err');
  const worker=gW().find(x=>x.wid===wid),today=tD(),existing=gA().find(a=>a.wid===wid&&a.date===today);
  if(existing){
    if(existing.status==='checked_in')return toast(worker.name+' already checked in!','err');
    if(existing.status==='completed')return toast('Already completed','err');
    if(existing.status==='pending_checkin'){const u={...existing};u.checkinTime=existing.checkinReqTime;u.status='checked_in';await FB.save(COL.A,existing.id,u);toast('✅ Approved!');return;}
  }
  const now=new Date().toISOString(),recId='att_'+Date.now()+'_'+wid;
  await FB.save(COL.A,recId,{recId,wid,name:worker.name,prof:worker.prof,sec:worker.sec,shift:worker.shift||'Day',date:today,checkinReqTime:now,checkinTime:now,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'checked_in'});
  toast('✅ '+worker.name+' checked in!');document.getElementById('manualWorker').value='';
}

async function manualQuickCheckOut(){
  const wid=document.getElementById('manualWorker').value;if(!wid)return toast('Select worker','err');
  const worker=gW().find(x=>x.wid===wid),today=tD(),rec=gA().find(a=>a.wid===wid&&a.date===today);
  if(!rec)return toast(worker.name+' not checked in','err');
  if(rec.status==='completed')return toast('Already checked out','err');
  if(rec.status==='pending_checkin')return toast('Check-in first!','err');
  if(rec.status==='pending_checkout'){const u={...rec};u.checkoutTime=rec.checkoutReqTime;const c=calcHours(u.checkinTime,u.checkoutTime);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';await FB.save(COL.A,rec.id,u);toast('✅ Approved! '+u.total.toFixed(2)+'h');return;}
  const now=new Date().toISOString(),u={...rec};u.checkoutReqTime=now;u.checkoutTime=now;
  const c=calcHours(rec.checkinTime,now);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';
  await FB.save(COL.A,rec.id,u);toast('✅ '+worker.name+' checked out! '+u.total.toFixed(2)+'h');document.getElementById('manualWorker').value='';
}

async function manualCustomCheckIn(){
  const wid=document.getElementById('manualCustomWorker').value,date=document.getElementById('manualDate').value,time=document.getElementById('manualCheckInTime').value;
  if(!wid)return toast('Select worker','err');if(!date)return toast('Select date','err');if(!time)return toast('Select time','err');
  const worker=gW().find(x=>x.wid===wid),existing=gA().find(a=>a.wid===wid&&a.date===date);
  if(existing&&(existing.status==='checked_in'||existing.status==='completed'))return toast('Already has record for '+date,'err');
  const now=new Date(date+'T'+time+':00').toISOString(),recId='att_'+Date.now()+'_'+wid;
  await FB.save(COL.A,recId,{recId,wid,name:worker.name,prof:worker.prof,sec:worker.sec,shift:worker.shift||'Day',date,checkinReqTime:now,checkinTime:now,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'checked_in'});
  toast('✅ '+worker.name+' checked in for '+date);
}

async function manualCustomCheckOut(){
  const wid=document.getElementById('manualCustomWorker').value,date=document.getElementById('manualDate').value,time=document.getElementById('manualCheckOutTime').value;
  if(!wid)return toast('Select worker','err');if(!date)return toast('Select date','err');if(!time)return toast('Select time','err');
  const worker=gW().find(x=>x.wid===wid),rec=gA().find(a=>a.wid===wid&&a.date===date);
  if(!rec)return toast('No check-in for '+date,'err');
  if(rec.status==='completed')return toast('Already completed','err');
  const checkoutISO=new Date(date+'T'+time+':00').toISOString(),u={...rec};
  u.checkoutReqTime=checkoutISO;u.checkoutTime=checkoutISO;
  const c=calcHours(rec.checkinTime,checkoutISO);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';
  await FB.save(COL.A,rec.id,u);toast('✅ '+worker.name+' Total: '+u.total.toFixed(2)+'h');
}

async function bulkCheckInAll(){
  const sec=document.getElementById('bulkSection').value;
  let workers=gW().filter(w=>w.on);if(sec)workers=workers.filter(w=>w.shift===sec||(!w.shift&&sec==='Day'));
  const today=tD(),todayAtt=gA().filter(a=>a.date===today);
  const notCheckedIn=workers.filter(w=>!todayAtt.find(a=>a.wid===w.wid));
  if(!notCheckedIn.length)return toast('All checked in!','info');
  confirmDlg('Bulk Check-In?',`${notCheckedIn.length} workers?`,async()=>{
    const now=new Date().toISOString();
    for(const w of notCheckedIn){
      const recId='att_'+Date.now()+'_'+w.wid+Math.random();
      await FB.save(COL.A,recId,{recId,wid:w.wid,name:w.name,prof:w.prof,sec:w.sec,shift:w.shift||'Day',date:today,checkinReqTime:now,checkinTime:now,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'checked_in'});
    }
    toast('✅ '+notCheckedIn.length+' checked in!');
  });
}

async function bulkCheckOutAll(){
  const sec=document.getElementById('bulkSection').value,today=tD();
  let active=gA().filter(a=>a.date===today&&(a.status==='checked_in'||a.status==='pending_checkout'));
  if(sec)active=active.filter(a=>a.shift===sec||(!a.shift&&sec==='Day'));
  if(!active.length)return toast('No active','info');
  confirmDlg('Bulk Check-Out?',`${active.length} workers?`,async()=>{
    const now=new Date().toISOString();
    for(const r of active){
      const u={...r};u.checkoutReqTime=now;u.checkoutTime=now;
      const c=calcHours(r.checkinTime,now);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';
      await FB.save(COL.A,r.id,u);
    }
    toast('✅ '+active.length+' checked out!');
  });
}

function loadManualToday(){
  const today=tD(),att=gA().filter(a=>a.date===today),ws=gW().filter(w=>w.on);
  const el=document.getElementById('manualTodayList');if(!el)return;
  const notCheckedIn=ws.filter(w=>!att.find(a=>a.wid===w.wid));
  const working=att.filter(a=>a.status==='checked_in');
  const pending=att.filter(a=>a.status==='pending_checkin'||a.status==='pending_checkout');
  const completed=att.filter(a=>a.status==='completed');
  const countEl=document.getElementById('manualStatusCount');
  if(countEl)countEl.innerHTML=`<span class="tag tag-r" style="margin-right:6px">❌ ${notCheckedIn.length}</span><span class="tag tag-o" style="margin-right:6px">⏰ ${pending.length}</span><span class="tag tag-b" style="margin-right:6px">🟢 ${working.length}</span><span class="tag tag-g">✅ ${completed.length}</span>`;
  let html='';
  if(notCheckedIn.length){html+=`<h4 style="margin:16px 0 10px;color:var(--r);font-weight:700">❌ Not Checked In (${notCheckedIn.length})</h4><div class="t-wrap" style="margin-bottom:20px"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Shift</th><th>Action</th></tr></thead><tbody>${notCheckedIn.map((w,i)=>`<tr><td>${i+1}</td><td><b>${w.name}</b></td><td>${w.prof||'-'}</td><td><span class="tag tag-b">${w.shift||'Day'}</span></td><td><button class="btn btn-success btn-sm" onclick="manualSingleCheckIn('${w.wid}')">🔓 In</button></td></tr>`).join('')}</tbody></table></div>`;}
  if(working.length){html+=`<h4 style="margin:16px 0 10px;color:var(--p);font-weight:700">🟢 Working (${working.length})</h4><div class="t-wrap" style="margin-bottom:20px"><table><thead><tr><th>#</th><th>Name</th><th>Shift</th><th>In</th><th>Action</th></tr></thead><tbody>${working.map((a,i)=>`<tr><td>${i+1}</td><td><b>${a.name}</b></td><td><span class="tag tag-b">${a.shift||'Day'}</span></td><td style="color:#059669">${fT(a.checkinTime)}</td><td><button class="btn btn-danger btn-sm" onclick="manualSingleCheckOut('${a.id}')">🔒 Out</button></td></tr>`).join('')}</tbody></table></div>`;}
  if(pending.length){html+=`<h4 style="margin:16px 0 10px;color:var(--o);font-weight:700">⏰ Pending (${pending.length})</h4><div class="t-wrap" style="margin-bottom:20px"><table><thead><tr><th>#</th><th>Name</th><th>Type</th><th>Time</th><th>Action</th></tr></thead><tbody>${pending.map((a,i)=>{const isIn=a.status==='pending_checkin';return`<tr><td>${i+1}</td><td><b>${a.name}</b></td><td><span class="tag ${isIn?'tag-g':'tag-r'}">${isIn?'IN':'OUT'}</span></td><td>${fT(isIn?a.checkinReqTime:a.checkoutReqTime)}</td><td><button class="btn btn-success btn-sm" onclick="doApprove('${a.id}')">✅</button> <button class="btn btn-danger btn-sm" onclick="doReject('${a.id}')">❌</button></td></tr>`;}).join('')}</tbody></table></div>`;}
  if(completed.length){html+=`<h4 style="margin:16px 0 10px;color:var(--g);font-weight:700">✅ Completed (${completed.length})</h4><div class="t-wrap"><table><thead><tr><th>#</th><th>Name</th><th>In</th><th>Out</th><th>Total</th><th>OT</th><th>Action</th></tr></thead><tbody>${completed.map((a,i)=>`<tr><td>${i+1}</td><td><b>${a.name}</b></td><td style="color:#059669">${fT(a.checkinTime)}</td><td style="color:#dc2626">${fT(a.checkoutTime)}</td><td style="color:var(--p);font-weight:700">${a.total.toFixed(2)}h</td><td style="color:#d97706">${a.ot.toFixed(2)}h</td><td><button class="btn btn-outline btn-sm" onclick="undoCO('${a.id}')">↩️</button> <button class="btn btn-danger btn-sm" onclick="undoCI('${a.id}')">🗑️</button></td></tr>`).join('')}</tbody></table></div>`;}
  if(!html)html='<div class="empty"><div class="em-icon">📋</div><h3>No records</h3></div>';
  el.innerHTML=html;
}

async function manualSingleCheckIn(wid){
  const worker=gW().find(x=>x.wid===wid),today=tD(),now=new Date().toISOString(),recId='att_'+Date.now()+'_'+wid;
  await FB.save(COL.A,recId,{recId,wid,name:worker.name,prof:worker.prof,sec:worker.sec,shift:worker.shift||'Day',date:today,checkinReqTime:now,checkinTime:now,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'checked_in'});
  toast('✅ '+worker.name+' in!');
}

async function manualSingleCheckOut(attId){
  const rec=gA().find(a=>a.id===attId);if(!rec)return;
  const now=new Date().toISOString(),u={...rec};u.checkoutReqTime=now;u.checkoutTime=now;
  const c=calcHours(rec.checkinTime,now);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';
  await FB.save(COL.A,rec.id,u);toast('✅ '+rec.name+' out! '+u.total.toFixed(2)+'h');
}

console.log('📋 Manual Loaded!');
