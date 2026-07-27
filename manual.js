function loadManualSection(){
  populateManualWorkerDD();
  populateManualCustomDD();
  loadManualToday();
  setDefaultManualDate();
}

function populateManualWorkerDD(){
  var sel=document.getElementById('manualWorker');if(!sel)return;
  var cv=sel.value;var w=gW().filter(function(x){return x.on;}).sort(function(a,b){return(a.name||'').localeCompare(b.name||'');});
  var ind=[],pak=[];
  for(var i=0;i<w.length;i++){if(w[i].sec==='Indian')ind.push(w[i]);else pak.push(w[i]);}
  var h='<option value="">-- Select Worker --</option>';
  if(ind.length){h+='<optgroup label="Indian ('+ind.length+')">';for(var j=0;j<ind.length;j++)h+='<option value="'+ind[j].wid+'">'+ind[j].name+' - '+(ind[j].prof||'Worker')+'</option>';h+='</optgroup>';}
  if(pak.length){h+='<optgroup label="Pakistani ('+pak.length+')">';for(var k=0;k<pak.length;k++)h+='<option value="'+pak[k].wid+'">'+pak[k].name+'</option>';h+='</optgroup>';}
  sel.innerHTML=h;if(cv)sel.value=cv;
}

function populateManualCustomDD(){
  var sel=document.getElementById('manualCustomWorker');if(!sel)return;
  var main=document.getElementById('manualWorker');if(main)sel.innerHTML=main.innerHTML;
}

async function manualQuickCheckIn(){
  var wid=document.getElementById('manualWorker').value;
  var shift=document.getElementById('manualQuickShift').value;
  if(!wid)return toast('Select worker','err');
  if(!shift)return toast('Select shift','err');
  var worker=null;var ws=gW();for(var i=0;i<ws.length;i++){if(ws[i].wid===wid){worker=ws[i];break;}}
  if(!worker)return toast('Not found','err');
  var today=tD();var att=gA();var existing=null;
  for(var j=0;j<att.length;j++){if(att[j].wid===wid&&att[j].date===today){existing=att[j];break;}}
  if(existing){
    if(existing.status==='checked_in')return toast(worker.name+' already in!','err');
    if(existing.status==='completed')return toast('Already done','err');
    if(existing.status==='pending_checkin'){
      var u=Object.assign({},existing,{checkinTime:existing.checkinReqTime,shift:shift,status:'checked_in'});
      await FB.save(COL.A,existing.id,u);toast(worker.name+' approved!');return;
    }
  }
  var now=new Date().toISOString(),recId='att_'+Date.now()+'_'+wid;
  await FB.save(COL.A,recId,{recId:recId,wid:wid,name:worker.name,prof:worker.prof,sec:worker.sec,shift:shift,date:today,checkinReqTime:now,checkinTime:now,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'checked_in'});
  toast(worker.name+' checked in ('+shift+')!');document.getElementById('manualWorker').value='';
}

async function manualQuickCheckOut(){
  var wid=document.getElementById('manualWorker').value;
  if(!wid)return toast('Select worker','err');
  var worker=null;var ws=gW();for(var i=0;i<ws.length;i++){if(ws[i].wid===wid){worker=ws[i];break;}}
  if(!worker)return toast('Not found','err');
  var today=tD();var att=gA();var rec=null;
  for(var j=0;j<att.length;j++){if(att[j].wid===wid&&att[j].date===today){rec=att[j];break;}}
  if(!rec)return toast('Not checked in','err');
  if(rec.status==='completed')return toast('Already out','err');
  if(rec.status==='pending_checkin')return toast('Check-in first!','err');
  if(rec.status==='pending_checkout'){
    var u2=Object.assign({},rec);u2.checkoutTime=rec.checkoutReqTime;var c2=calcHours(u2.checkinTime,u2.checkoutTime);
    u2.total=c2.total;u2.regular=c2.regular;u2.compOT=c2.compOT;u2.extraOT=c2.extraOT;u2.ot=c2.ot;u2.status='completed';
    await FB.save(COL.A,rec.id,u2);toast(worker.name+' approved! '+u2.total.toFixed(2)+'h');return;
  }
  var now=new Date().toISOString();var u=Object.assign({},rec);u.checkoutReqTime=now;u.checkoutTime=now;
  var c=calcHours(rec.checkinTime,now);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';
  await FB.save(COL.A,rec.id,u);toast(worker.name+' out! '+u.total.toFixed(2)+'h');document.getElementById('manualWorker').value='';
}

async function manualCustomCheckIn(){
  var wid=document.getElementById('manualCustomWorker').value;var date=document.getElementById('manualDate').value;var time=document.getElementById('manualCheckInTime').value;var shift=document.getElementById('manualCustomShift').value;
  if(!wid)return toast('Select worker','err');if(!date)return toast('Date','err');if(!time)return toast('Time','err');if(!shift)return toast('Shift','err');
  var worker=null;var ws=gW();for(var i=0;i<ws.length;i++){if(ws[i].wid===wid){worker=ws[i];break;}}
  if(!worker)return toast('Not found','err');
  var att=gA();var existing=null;for(var j=0;j<att.length;j++){if(att[j].wid===wid&&att[j].date===date){existing=att[j];break;}}
  if(existing&&(existing.status==='checked_in'||existing.status==='completed'))return toast('Already has record','err');
  var now=new Date(date+'T'+time+':00').toISOString(),recId='att_'+Date.now()+'_'+wid;
  await FB.save(COL.A,recId,{recId:recId,wid:wid,name:worker.name,prof:worker.prof,sec:worker.sec,shift:shift,date:date,checkinReqTime:now,checkinTime:now,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'checked_in'});
  toast(worker.name+' in for '+date);
}

async function manualCustomCheckOut(){
  var wid=document.getElementById('manualCustomWorker').value;var date=document.getElementById('manualDate').value;var time=document.getElementById('manualCheckOutTime').value;
  if(!wid)return toast('Select','err');if(!date)return toast('Date','err');if(!time)return toast('Time','err');
  var worker=null;var ws=gW();for(var i=0;i<ws.length;i++){if(ws[i].wid===wid){worker=ws[i];break;}}
  if(!worker)return toast('Not found','err');
  var att=gA();var rec=null;for(var j=0;j<att.length;j++){if(att[j].wid===wid&&att[j].date===date){rec=att[j];break;}}
  if(!rec)return toast('No check-in for '+date,'err');if(rec.status==='completed')return toast('Done','err');
  var coISO=new Date(date+'T'+time+':00').toISOString();
  if(new Date(coISO)<=new Date(rec.checkinTime)){var d=new Date(coISO);d.setDate(d.getDate()+1);coISO=d.toISOString();}
  var u=Object.assign({},rec);u.checkoutReqTime=coISO;u.checkoutTime=coISO;
  var c=calcHours(rec.checkinTime,coISO);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';
  await FB.save(COL.A,rec.id,u);toast(worker.name+': '+u.total.toFixed(2)+'h');
}

async function bulkCheckInAll(){
  var sec=document.getElementById('bulkSection').value;var shift=document.getElementById('bulkShift').value;
  if(!shift)return toast('Select shift','err');
  var workers=gW().filter(function(w){return w.on;});
  if(sec==='Indian')workers=workers.filter(function(w){return w.sec==='Indian';});
  else if(sec==='Pakistani')workers=workers.filter(function(w){return w.sec==='Pakistani';});
  var today=tD();var todayAtt=gA().filter(function(a){return a.date===today;});
  var todayWids=todayAtt.map(function(a){return a.wid;});
  var toAdd=workers.filter(function(w){return todayWids.indexOf(w.wid)===-1;});
  if(!toAdd.length)return toast('All checked in!','info');
  confirmDlg('Bulk In?',toAdd.length+' workers ('+shift+')?',async function(){
    var now=new Date().toISOString();
    for(var i=0;i<toAdd.length;i++){
      var w=toAdd[i];var recId='att_'+Date.now()+'_'+w.wid+Math.random().toString(36).substr(2,5);
      await FB.save(COL.A,recId,{recId:recId,wid:w.wid,name:w.name,prof:w.prof,sec:w.sec,shift:shift,date:today,checkinReqTime:now,checkinTime:now,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'checked_in'});
    }
    toast(toAdd.length+' checked in!');
  });
}

async function bulkCheckOutAll(){
  var sec=document.getElementById('bulkSection').value;var today=tD();
  var active=gA().filter(function(a){return a.date===today&&(a.status==='checked_in'||a.status==='pending_checkout');});
  if(sec==='Indian')active=active.filter(function(a){return a.sec==='Indian';});
  else if(sec==='Pakistani')active=active.filter(function(a){return a.sec==='Pakistani';});
  if(!active.length)return toast('None active','info');
  confirmDlg('Bulk Out?',active.length+'?',async function(){
    var now=new Date().toISOString();
    for(var i=0;i<active.length;i++){
      var r=active[i];var u=Object.assign({},r);u.checkoutReqTime=now;u.checkoutTime=now;
      var c=calcHours(r.checkinTime,now);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';
      await FB.save(COL.A,r.id,u);
    }
    toast(active.length+' checked out!');
  });
}

function loadManualToday(){
  var today=tD();var att=gA().filter(function(a){return a.date===today;});
  var ws=gW().filter(function(w){return w.on;});
  var el=document.getElementById('manualTodayList');if(!el)return;
  var attWids=att.map(function(a){return a.wid;});
  var notIn=ws.filter(function(w){return attWids.indexOf(w.wid)===-1;});
  var working=att.filter(function(a){return a.status==='checked_in';});
  var pending=att.filter(function(a){return a.status==='pending_checkin'||a.status==='pending_checkout';});
  var done=att.filter(function(a){return a.status==='completed';});
  var dayW=working.filter(function(a){return a.shift==='Day'||!a.shift;});
  var nightW=working.filter(function(a){return a.shift==='Night';});
  var cnt=document.getElementById('manualStatusCount');
  if(cnt)cnt.innerHTML='<span class="tag tag-r" style="margin-right:6px">Not In: '+notIn.length+'</span><span class="tag tag-o" style="margin-right:6px">Pending: '+pending.length+'</span><span class="tag tag-b" style="margin-right:6px">Day: '+dayW.length+'</span><span class="tag tag-o" style="margin-right:6px">Night: '+nightW.length+'</span><span class="tag tag-g">Done: '+done.length+'</span>';
  var html='';
  if(notIn.length){
    html+='<h4 style="margin:16px 0 10px;color:var(--r);font-weight:700">Not Checked In ('+notIn.length+')</h4><div class="t-wrap" style="margin-bottom:20px"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Action</th></tr></thead><tbody>';
    for(var i=0;i<notIn.length;i++){var w=notIn[i];html+='<tr><td>'+(i+1)+'</td><td><b>'+w.name+'</b></td><td>'+(w.prof||'-')+'</td><td><span class="tag tag-'+(w.sec==='Indian'?'ind':'pak')+'">'+(w.sec==='Indian'?'IN':'PK')+'</span></td><td><button class="btn btn-success btn-sm" onclick="manualSingleCheckIn(\''+w.wid+'\',\'Day\')">Day</button> <button class="btn btn-outline btn-sm" onclick="manualSingleCheckIn(\''+w.wid+'\',\'Night\')">Night</button></td></tr>';}
    html+='</tbody></table></div>';
  }
  if(working.length){
    html+='<h4 style="margin:16px 0 10px;color:var(--p);font-weight:700">Working ('+working.length+')</h4><div class="t-wrap" style="margin-bottom:20px"><table><thead><tr><th>#</th><th>Name</th><th>Shift</th><th>In</th><th>Action</th></tr></thead><tbody>';
    for(var j=0;j<working.length;j++){var a=working[j];html+='<tr><td>'+(j+1)+'</td><td><b>'+a.name+'</b></td><td><span class="tag '+(a.shift==='Night'?'tag-o':'tag-b')+'">'+(a.shift==='Night'?'Night':'Day')+'</span></td><td style="color:#059669">'+fT(a.checkinTime)+'</td><td><button class="btn btn-danger btn-sm" onclick="manualSingleCheckOut(\''+a.id+'\')">Out</button></td></tr>';}
    html+='</tbody></table></div>';
  }
  if(pending.length){
    html+='<h4 style="margin:16px 0 10px;color:var(--o);font-weight:700">Pending ('+pending.length+')</h4><div class="t-wrap" style="margin-bottom:20px"><table><thead><tr><th>#</th><th>Name</th><th>Type</th><th>Shift</th><th>Time</th><th>Action</th></tr></thead><tbody>';
    for(var k=0;k<pending.length;k++){var p=pending[k];var isIn=p.status==='pending_checkin';html+='<tr><td>'+(k+1)+'</td><td><b>'+p.name+'</b></td><td><span class="tag '+(isIn?'tag-g':'tag-r')+'">'+(isIn?'IN':'OUT')+'</span></td><td><span class="tag '+(p.shift==='Night'?'tag-o':'tag-b')+'">'+(p.shift==='Night'?'Night':'Day')+'</span></td><td>'+fT(isIn?p.checkinReqTime:p.checkoutReqTime)+'</td><td><button class="btn btn-success btn-sm" onclick="doApprove(\''+p.id+'\')">Approve</button> <button class="btn btn-danger btn-sm" onclick="doReject(\''+p.id+'\')">Reject</button></td></tr>';}
    html+='</tbody></table></div>';
  }
  if(done.length){
    html+='<h4 style="margin:16px 0 10px;color:var(--g);font-weight:700">Completed ('+done.length+')</h4><div class="t-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Shift</th><th>In</th><th>Out</th><th>Total</th><th>OT</th><th>Act</th></tr></thead><tbody>';
    for(var m=0;m<done.length;m++){var d=done[m];html+='<tr><td>'+(m+1)+'</td><td><b>'+d.name+'</b></td><td><span class="tag '+(d.shift==='Night'?'tag-o':'tag-b')+'">'+(d.shift==='Night'?'Night':'Day')+'</span></td><td style="color:#059669">'+fT(d.checkinTime)+'</td><td style="color:#dc2626">'+fT(d.checkoutTime)+'</td><td style="color:var(--p);font-weight:700">'+d.total.toFixed(2)+'h</td><td style="color:#d97706">'+d.ot.toFixed(2)+'h</td><td><button class="btn btn-outline btn-sm" onclick="undoCO(\''+d.id+'\')">Undo</button> <button class="btn btn-danger btn-sm" onclick="undoCI(\''+d.id+'\')">Del</button></td></tr>';}
    html+='</tbody></table></div>';
  }
  if(!html)html='<div class="empty"><h3>No records today</h3></div>';
  el.innerHTML=html;
}

async function manualSingleCheckIn(wid,shift){
  var worker=null;var ws=gW();for(var i=0;i<ws.length;i++){if(ws[i].wid===wid){worker=ws[i];break;}}
  if(!worker)return;var today=tD();var now=new Date().toISOString();var recId='att_'+Date.now()+'_'+wid;
  await FB.save(COL.A,recId,{recId:recId,wid:wid,name:worker.name,prof:worker.prof,sec:worker.sec,shift:shift||'Day',date:today,checkinReqTime:now,checkinTime:now,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'checked_in'});
  toast(worker.name+' in ('+shift+')!');
}

async function manualSingleCheckOut(attId){
  var att=gA();var rec=null;for(var i=0;i<att.length;i++){if(att[i].id===attId){rec=att[i];break;}}
  if(!rec)return;var now=new Date().toISOString();var u=Object.assign({},rec);u.checkoutReqTime=now;u.checkoutTime=now;
  var c=calcHours(rec.checkinTime,now);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';
  await FB.save(COL.A,rec.id,u);toast(rec.name+' out! '+u.total.toFixed(2)+'h');
}

console.log('Manual Loaded!');
