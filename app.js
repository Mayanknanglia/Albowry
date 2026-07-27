const REG_HOURS=9,COMP_OT=3,DEFAULT_PW='Worker@123',CURRENT_YEAR=2026;
const COL={W:'workers',A:'attendance',AD:'admin'};
const K={U:'alb_session'};
const COMPANY={
  name:'AL BOWRY CARPENTRY LLC',
  project:'PROJECT COP31',
  site:'Antalya, Turkey',
  office:'Sharjah, UAE',
  web:'www.albowry.com',
  full:'AL BOWRY CARPENTRY LLC | Registered: Sharjah, UAE | Project: COP31, Antalya, Turkey'
};

const IND=[
{n:"Hajari Lal",p:"Foreman"},{n:"Rajeev Punia",p:"Supervisor"},
{n:"Om Prakash",p:"Supervisor"},{n:"Nitesh Bugalia",p:"Helper"},
{n:"Govind Jangir",p:"Helper"},{n:"Lokesh Kumar Verma",p:"Helper"},
{n:"Rajendra Kumar",p:"Helper"},{n:"Surendra Budania",p:"Helper"},
{n:"Majid Abdul",p:"Helper"},{n:"Pradeep Singh",p:"Helper"},
{n:"Akram Khan",p:"Helper"},{n:"Manoj Kumar Jakhar",p:"Helper"},
{n:"Puneet Sewda",p:"Helper"},{n:"Surendra Kumar Mahala",p:"Helper"},
{n:"Deepak Kumar Jangir",p:"Carpenter"},{n:"Jeth Mal Jangir",p:"Carpenter"},
{n:"Rahul",p:"Carpenter"},{n:"Vijendra Kumar",p:"Carpenter"},
{n:"Rakesh Kumar Jangir",p:"Carpenter"},{n:"Jitendra Kumar Jangid",p:"Carpenter"},
{n:"Dharmendra Khyaliya",p:"Carpenter (Cutter Operator)"},{n:"Jitendra Jangid",p:"Carpenter"},
{n:"Rahul Verma",p:"Carpenter"},{n:"Raj Pal",p:"Carpenter (Cutter Operator)"},
{n:"Mukesh Saini",p:"Carpenter (Cutter Operator)"},{n:"Suresh Kumar Jangir",p:"Carpenter (Cutter Operator)"},
{n:"Pradip Kumar",p:"Carpenter"},{n:"Ajay Jangir",p:"Carpenter (Cutter Operator)"},
{n:"Rajesh Khyalia",p:"Carpenter (Cutter Operator)"},{n:"Ratan Lal",p:"Painter"},
{n:"Rakesh Kumar",p:"Painter"},{n:"Chetan Kumar",p:"Painter"},
{n:"Wajid Khan",p:"Painter"},{n:"Mohammad Arif",p:"Painter"},
{n:"Sajid",p:"Painter"},{n:"Fariyad Khan",p:"Painter"},{n:"Sayad",p:"Painter"}
];

const PAK=[
{n:"Asad Raza",p:"Worker"},{n:"Muhammad Ramzan",p:"Worker"},
{n:"Muhammad Rizwan",p:"Worker"},{n:"Sharafat Hussain",p:"Worker"},
{n:"Ali Raza",p:"Worker"},{n:"Muhammad Amjad",p:"Worker"},
{n:"Sher Bahadur",p:"Worker"},{n:"Muhammad Arshad",p:"Worker"},
{n:"Taimoor Ahmad",p:"Worker"},{n:"Muhammad Imtiaz",p:"Worker"},
{n:"Kashif Hussain",p:"Worker"},{n:"Muhammad Saleem",p:"Worker"},
{n:"Mudasir Hussain",p:"Worker"},{n:"Sami Ullah",p:"Worker"},
{n:"Muhammad Parvaiz",p:"Worker"},{n:"Muhammad Awais",p:"Worker"},
{n:"Muhammad Naeem",p:"Worker"},{n:"Muhammad Faheem",p:"Worker"},
{n:"Muhammad Mansoor",p:"Worker"}
];

let WC=[],AC=[],ADC=null,LOGO_BASE64=null;

function speakWelcome(name){
  if(!('speechSynthesis' in window))return;
  try{var msg=new SpeechSynthesisUtterance('Welcome '+name);msg.rate=0.9;msg.pitch=1;msg.volume=0.8;msg.lang='en-US';speechSynthesis.speak(msg);}catch(e){}
}

function loadLogoBase64(){
  var img=new Image();img.crossOrigin='anonymous';
  img.onload=function(){var c=document.createElement('canvas');c.width=img.width;c.height=img.height;c.getContext('2d').drawImage(img,0,0);try{LOGO_BASE64=c.toDataURL('image/png');}catch(e){}};
  img.onerror=function(){var c=document.createElement('canvas');c.width=200;c.height=200;var ctx=c.getContext('2d');ctx.fillStyle='#1e40af';ctx.fillRect(0,0,200,200);ctx.fillStyle='#fff';ctx.font='bold 120px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('A',100,105);LOGO_BASE64=c.toDataURL('image/png');};
  img.src='logo.png';
}

async function initDB(){
  console.log('Booting AL BOWRY...');
  loadLogoBase64();
  if('speechSynthesis' in window)speechSynthesis.getVoices();
  
  var ew=await FB.getAll(COL.W);
  console.log('Existing workers:',ew.length);
  
  if(ew.length<56){
    for(var x=0;x<ew.length;x++)await FB.del(COL.W,ew[x].wid||ew[x].id);
    toast('Setting up 56 workers...','info');
    for(var i=0;i<IND.length;i++){var w=IND[i],id='IND'+String(i+1).padStart(4,'0');await FB.save(COL.W,id,{wid:id,name:w.n,prof:w.p,sec:'Indian',shift:'Day',pw:DEFAULT_PW,on:true});}
    for(var j=0;j<PAK.length;j++){var w2=PAK[j],id2='PAK'+String(j+1).padStart(4,'0');await FB.save(COL.W,id2,{wid:id2,name:w2.n,prof:w2.p,sec:'Pakistani',shift:'Day',pw:DEFAULT_PW,on:true});}
    toast('56 workers created!');
  }
  
  var ad=await FB.get(COL.AD,'main');
  if(!ad)await FB.save(COL.AD,'main',{adminId:'ADMIN001',pw:'Admin@2026',name:'Pradeep Jangir'});
  
  FB.listen(COL.W,function(d){
    WC=d;fillDD();popReportDD();
    if(typeof populateManualWorkerDD==='function')populateManualWorkerDD();
    if(typeof populateManualCustomDD==='function')populateManualCustomDD();
    if(typeof loadHistoryWorkers==='function')loadHistoryWorkers();
    var u=gU();
    if(u&&u.role==='admin'){
      loadStats();
      if($('sec-workers')&&$('sec-workers').classList.contains('active'))loadWorkerTable();
      if($('sec-manual')&&$('sec-manual').classList.contains('active')&&typeof loadManualToday==='function')loadManualToday();
      if($('sec-history')&&$('sec-history').classList.contains('active')&&typeof loadHistoryForDate==='function')loadHistoryForDate();
    }
  });
  
  FB.listen(COL.A,function(d){
    AC=d;var u=gU();
    if(u&&u.role==='worker'){upWS();loadWH();loadWQS();}
    if(u&&u.role==='admin'){
      loadStats();var a=document.querySelector('.sec.active');
      if(a){
        if(a.id==='sec-approve')loadAppr();
        if(a.id==='sec-live')loadLive();
        if(a.id==='sec-attend')loadAttend();
        if(a.id==='sec-endday')loadED();
        if(a.id==='sec-report')loadMR();
        if(a.id==='sec-manual'&&typeof loadManualToday==='function')loadManualToday();
        if(a.id==='sec-history'&&typeof loadHistoryForDate==='function')loadHistoryForDate();
      }
    }
  });
  
  FB.listen(COL.AD,function(d){if(d.length)ADC=d[0];});
  setTimeout(function(){var l=$('loadingScreen');if(l)l.style.display='none';},2000);
}

var $=function(id){return document.getElementById(id);};
var gW=function(){return WC;};
var gA=function(){return AC;};
var gAD=function(){return ADC||{adminId:'ADMIN001',pw:'Admin@2026',name:'Pradeep Jangir'};};
var gU=function(){try{return JSON.parse(localStorage.getItem(K.U));}catch(e){return null;}};
var sU=function(d){localStorage.setItem(K.U,JSON.stringify(d));};
var cU=function(){localStorage.removeItem(K.U);};
var tT=function(){return new Date().toLocaleString('en-US',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});};
var tD=function(){return new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});};
var tDF=function(){return new Date().toLocaleDateString('en-US',{timeZone:'Europe/Istanbul',weekday:'long',year:'numeric',month:'long',day:'numeric'});};

function fT(iso){if(!iso)return'-';try{return new Date(iso).toLocaleString('en-US',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});}catch(e){return'-';}}
function greet(){var h=parseInt(new Date().toLocaleString('en-US',{timeZone:'Europe/Istanbul',hour:'numeric',hour12:false}));return h<12?'Good Morning':'Good Afternoon';}
function toast(m,t){var e=$('toast');if(!e)return;e.textContent=m;e.className='toast show '+(t||'ok');setTimeout(function(){e.classList.remove('show');},3500);}
function togglePw(id,b){var e=$(id);e.type=e.type==='password'?'text':'password';b.textContent=e.type==='password'?'👁':'🙈';}
function openModal(id){$(id).classList.add('open');}
function closeModal(id){$(id).classList.remove('open');}
function showPage(id){var pages=document.querySelectorAll('.page');for(var i=0;i<pages.length;i++)pages[i].classList.remove('active');$(id).classList.add('active');}
function confirmDlg(t,m,cb){$('mcTitle').textContent=t;$('mcMsg').textContent=m;var y=$('mcYes'),n=y.cloneNode(true);y.parentNode.replaceChild(n,y);n.onclick=function(){closeModal('mConfirm');cb();};openModal('mConfirm');}
function st(id,v){var e=$(id);if(e)e.textContent=v;}
function setDefaultManualDate(){var md=$('manualDate');if(md&&!md.value)md.value=tD();}

function calcHours(ci,co){
  var hrs=(new Date(co)-new Date(ci))/36e5;
  var total=Math.round(hrs*100)/100;
  var regular=Math.round(Math.min(hrs,REG_HOURS)*100)/100;
  var compOT=Math.round(Math.min(Math.max(hrs-REG_HOURS,0),COMP_OT)*100)/100;
  var extraOT=Math.max(0,Math.round((hrs-REG_HOURS-COMP_OT)*100)/100);
  return{total:total,regular:regular,compOT:compOT,extraOT:extraOT,ot:Math.round((compOT+extraOT)*100)/100};
}

// ===== LOGIN =====
function switchLogin(t,b){var tabs=document.querySelectorAll('.ltabs .ltab');for(var i=0;i<tabs.length;i++)tabs[i].classList.remove('active');b.classList.add('active');var forms=document.querySelectorAll('.lform');for(var j=0;j<forms.length;j++)forms[j].classList.remove('active');$(t+'LoginForm').classList.add('active');$('loginErr').classList.remove('show');}
function showErr(m){var e=$('loginErr');e.textContent='⚠️ '+m;e.classList.add('show');}

function fillDD(){
  var w=gW().filter(function(x){return x.on;}).sort(function(a,b){return(a.name||'').localeCompare(b.name||'');});
  var ind=w.filter(function(x){return x.sec==='Indian';});
  var pak=w.filter(function(x){return x.sec==='Pakistani';});
  var h='<option value="">— Choose your name —</option>';
  if(ind.length){h+='<optgroup label="Indian Workers ('+ind.length+')">';for(var i=0;i<ind.length;i++)h+='<option value="'+ind[i].wid+'">'+ind[i].name+' ('+ind[i].prof+')</option>';h+='</optgroup>';}
  if(pak.length){h+='<optgroup label="Pakistani Workers ('+pak.length+')">';for(var j=0;j<pak.length;j++)h+='<option value="'+pak[j].wid+'">'+pak[j].name+'</option>';h+='</optgroup>';}
  var s=$('workerSelect');if(s)s.innerHTML=h;
}

function workerLogin(e){
  e.preventDefault();var id=$('workerSelect').value,pw=$('workerPw').value,shift=$('workerShift').value;
  if(!id)return showErr('Select your name');
  if(!shift)return showErr('Select shift');
  var w=null;var workers=gW();for(var i=0;i<workers.length;i++){if(workers[i].wid===id){w=workers[i];break;}}
  if(!w)return showErr('Not found');if(!w.on)return showErr('Deactivated');if(w.pw!==pw)return showErr('Wrong password');
  if(w.shift!==shift)FB.save(COL.W,w.wid,Object.assign({},w,{shift:shift}));
  sU(Object.assign({},w,{id:w.wid,shift:shift,role:'worker'}));
  toast('Welcome, '+w.name+'!');loadWD();return false;
}

function adminLogin(e){
  e.preventDefault();var id=$('adminId').value.trim(),pw=$('adminPw').value;
  if(!id||!pw)return showErr('Enter ID & password');
  var ad=gAD();if(ad.adminId!==id||ad.pw!==pw)return showErr('Invalid credentials');
  sU(Object.assign({},ad,{id:ad.adminId,role:'admin'}));
  speakWelcome(ad.name||'Admin');
  toast('Welcome, '+(ad.name||'Admin')+'!');loadAD();return false;
}

function logout(){confirmDlg('Logout?','Sure?',function(){cU();showPage('loginPage');$('workerSelect').value='';$('workerPw').value='';if($('workerShift'))$('workerShift').value='';$('adminId').value='';$('adminPw').value='';$('loginErr').classList.remove('show');});}

// ===== WORKER DASHBOARD =====
function loadWD(){var u=gU();$('wGreet').textContent=greet();$('wName').textContent=u.name;$('wInfo').textContent=(u.prof||'Worker')+' • '+(u.sec||'')+' • '+(u.shift||'Day')+' Shift';$('wNavName').textContent=u.name;$('wAvatar').textContent=(u.name||'W').charAt(0);$('wDate').textContent=tDF();showPage('workerPage');upWS();loadWH();loadWQS();}

function doCheckIn(){
  var u=gU(),today=tD();var att=gA();var ex=null;
  for(var i=0;i<att.length;i++){if(att[i].wid===u.id&&att[i].date===today){ex=att[i];break;}}
  if(ex){
    if(ex.status==='pending_checkin')return toast('Already pending!','err');
    if(ex.status==='checked_in'||ex.status==='pending_checkout')return toast('Already checked in!','err');
    if(ex.status==='completed')return toast('Already done','err');
  }
  confirmDlg('Check In?','Start work day?',function(){
    var now=new Date().toISOString(),rid='att_'+Date.now()+'_'+u.id;
    FB.save(COL.A,rid,{recId:rid,wid:u.id,name:u.name,prof:u.prof,sec:u.sec,shift:u.shift||'Day',date:today,checkinReqTime:now,checkinTime:null,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'pending_checkin'});
    toast('Check-in request sent!');
  });
}

function doCheckOut(){
  var u=gU(),today=tD();var att=gA();var rec=null;
  for(var i=0;i<att.length;i++){if(att[i].wid===u.id&&att[i].date===today){rec=att[i];break;}}
  if(!rec)return toast('Check-in first!','err');
  if(rec.status==='pending_checkin')return toast('Wait for approval','err');
  if(rec.status==='completed')return toast('Already done','err');
  if(rec.status==='pending_checkout')return toast('Already pending!','err');
  if(rec.status!=='checked_in')return toast('Cannot','err');
  confirmDlg('Check Out?','End work day?',function(){
    var now=new Date().toISOString();
    FB.save(COL.A,rec.id,Object.assign({},rec,{checkoutReqTime:now,status:'pending_checkout'}));
    toast('Check-out request sent!');
  });
}

function upWS(){
  var u=gU();if(!u||u.role!=='worker')return;
  var today=tD();var att=gA();var rec=null;
  for(var i=0;i<att.length;i++){if(att[i].wid===u.id&&att[i].date===today){rec=att[i];break;}}
  var bI=$('btnCheckin'),bO=$('btnCheckout'),st2=$('wacStatus'),ic=$('wsIcon'),tx=$('wsText'),sb=$('wsSub'),tm=$('wsTimes');
  if(!bI)return;tm.innerHTML='';
  if(!rec){bI.disabled=false;bO.disabled=true;st2.className='wac-status';st2.innerHTML='<span>📋</span> Ready. Click CHECK IN.';ic.textContent='📋';tx.textContent='Not Started';sb.textContent='Waiting';return;}
  if(rec.checkinReqTime)tm.innerHTML+='<div class="wsc-time-item"><small>Requested</small><b style="color:#f59e0b">'+fT(rec.checkinReqTime)+'</b></div>';
  if(rec.checkinTime)tm.innerHTML+='<div class="wsc-time-item"><small>Check-in</small><b style="color:#059669">'+fT(rec.checkinTime)+'</b></div>';
  if(rec.checkoutReqTime)tm.innerHTML+='<div class="wsc-time-item"><small>Out Req</small><b style="color:#f59e0b">'+fT(rec.checkoutReqTime)+'</b></div>';
  if(rec.checkoutTime)tm.innerHTML+='<div class="wsc-time-item"><small>Check-out</small><b style="color:#dc2626">'+fT(rec.checkoutTime)+'</b></div>';
  if(rec.total>0)tm.innerHTML+='<div class="wsc-time-item"><small>Total</small><b style="color:#1e40af">'+(rec.total).toFixed(2)+'h</b></div>';
  if(rec.ot>0)tm.innerHTML+='<div class="wsc-time-item"><small>OT</small><b style="color:#d97706">'+(rec.ot).toFixed(2)+'h</b></div>';
  
  var states={
    pending_checkin:['⏳','Check-in Pending','Waiting for admin',true,true,'pending'],
    checked_in:['🟢','Working','Since '+fT(rec.checkinTime),true,false,'active'],
    pending_checkout:['⏳','Check-out Pending','Waiting for admin',true,true,'pending'],
    completed:['🎉','Completed','Total: '+(rec.total||0).toFixed(2)+'h | OT: '+(rec.ot||0).toFixed(2)+'h',true,true,'done']
  };
  var s=states[rec.status];if(!s)return;
  ic.textContent=s[0];tx.textContent=s[1];sb.textContent=s[2];bI.disabled=s[3];bO.disabled=s[4];st2.className='wac-status '+s[5];st2.innerHTML='<span>'+s[0]+'</span> '+s[2];
}

function loadWQS(){var u=gU();if(!u)return;var my=gA().filter(function(a){return a.wid===u.id&&a.status==='completed';});st('wTotalDays',my.length);st('wTotalHrs',my.reduce(function(s,a){return s+(a.total||0);},0).toFixed(1)+'h');st('wTotalOT',my.reduce(function(s,a){return s+(a.ot||0);},0).toFixed(1)+'h');}

function loadWH(){
  var u=gU();if(!u)return;
  var h=gA().filter(function(a){return a.wid===u.id&&a.status==='completed';}).sort(function(a,b){return b.date.localeCompare(a.date);}).slice(0,15);
  st('wHistCount',h.length+' records');var el=$('wHistory');if(!el)return;
  if(!h.length){el.innerHTML='<div class="empty"><div class="em-icon">📭</div><h3>No History</h3></div>';return;}
  var html='';for(var i=0;i<h.length;i++){var r=h[i];html+='<div class="hist-item"><b>'+r.date+'</b><span style="color:#059669">'+fT(r.checkinTime)+'</span><span style="color:#dc2626">'+fT(r.checkoutTime)+'</span><b style="color:#1e40af">'+r.total.toFixed(2)+'h</b>'+(r.ot>0?'<span class="tag tag-o">OT '+r.ot.toFixed(2)+'h</span>':'<span></span>')+'</div>';}
  el.innerHTML=html;
}

function changeWorkerPw(e){
  e.preventDefault();var old=$('cwOld').value,nw=$('cwNew').value,cf=$('cwConf').value;
  if(nw!==cf)return toast('Mismatch','err');if(nw.length<4)return toast('Min 4','err');
  var u=gU();var workers=gW();var w=null;for(var i=0;i<workers.length;i++){if(workers[i].wid===u.id){w=workers[i];break;}}
  if(!w||w.pw!==old)return toast('Wrong password','err');
  FB.save(COL.W,u.id,Object.assign({},w,{pw:nw}));sU(Object.assign({},u,{pw:nw}));
  $('cwOld').value='';$('cwNew').value='';$('cwConf').value='';toast('Password updated!');return false;
}

// ===== ADMIN =====
function loadAD(){
  var u=gU();$('aNavName').textContent=u.name||'Admin';showPage('adminPage');
  $('fDate').value=tD();$('expStart').value=tD();$('expEnd').value=tD();
  $('setCurId').value=u.id;$('reportMonth').value=tD().substring(0,7);
  popReportDD();loadStats();
}

function goSection(s,b){
  var btns=document.querySelectorAll('.side-btn');for(var i=0;i<btns.length;i++)btns[i].classList.remove('active');
  if(b)b.classList.add('active');
  var secs=document.querySelectorAll('.sec');for(var j=0;j<secs.length;j++)secs[j].classList.remove('active');
  $('sec-'+s).classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(s==='dash')loadStats();
  if(s==='approve')loadAppr();
  if(s==='live')loadLive();
  if(s==='attend')loadAttend();
  if(s==='workers')loadWorkerTable();
  if(s==='endday')loadED();
  if(s==='report'){popReportDD();loadMR();}
  if(s==='manual'){if(typeof loadManualSection==='function')loadManualSection();if(typeof populateManualCustomDD==='function')populateManualCustomDD();setDefaultManualDate();}
  if(s==='history'){setTimeout(function(){if(typeof loadHistorySection==='function')loadHistorySection();},500);}
}

function loadStats(){
  var ws=gW().filter(function(w){return w.on;}),today=tD(),att=gA().filter(function(a){return a.date===today;});
  var present=att.filter(function(a){return['checked_in','completed','pending_checkout'].indexOf(a.status)>-1;}).length;
  var pend=att.filter(function(a){return['pending_checkin','pending_checkout'].indexOf(a.status)>-1;}).length;
  var dayAtt=att.filter(function(a){return a.shift==='Day'||!a.shift;});
  var nightAtt=att.filter(function(a){return a.shift==='Night';});
  var dayP=dayAtt.filter(function(a){return['checked_in','completed','pending_checkout'].indexOf(a.status)>-1;}).length;
  var nightP=nightAtt.filter(function(a){return['checked_in','completed','pending_checkout'].indexOf(a.status)>-1;}).length;
  var dayPe=dayAtt.filter(function(a){return['pending_checkin','pending_checkout'].indexOf(a.status)>-1;}).length;
  var nightPe=nightAtt.filter(function(a){return['pending_checkin','pending_checkout'].indexOf(a.status)>-1;}).length;

  st('sTotalW',ws.length);st('sPresent',present);st('sAbsent',ws.length-present);st('sPending',pend);st('dashDate',tDF());
  st('dIndT',dayAtt.length);st('dIndP',dayP);st('dIndA',0);st('dIndPend',dayPe);
  st('dPakT',nightAtt.length);st('dPakP',nightP);st('dPakA',0);st('dPakPend',nightPe);
  var iP=dayAtt.length?Math.round(dayP/dayAtt.length*100):0,pP=nightAtt.length?Math.round(nightP/nightAtt.length*100):0;
  var iB=$('dIndBar'),pB=$('dPakBar');if(iB)iB.style.width=iP+'%';if(pB)pB.style.width=pP+'%';
  st('dIndPct',iP+'%');st('dPakPct',pP+'%');
  var b=$('sBadge');if(b){if(pend>0){b.textContent=pend;b.classList.add('show');}else b.classList.remove('show');}
  loadAbsentToday();
}

function loadAbsentToday(){
  var today=tD();var att=gA().filter(function(a){return a.date===today;});
  var allW=gW().filter(function(w){return w.on;});
  var attWids=att.map(function(a){return a.wid;});
  var absent=allW.filter(function(w){return attWids.indexOf(w.wid)===-1;});
  var el=$('absentWorkersToday'),cnt=$('absentCountToday');
  if(cnt)cnt.textContent=absent.length+' Absent';
  if(!el)return;
  if(!absent.length){el.innerHTML='<div class="empty" style="padding:30px"><h3>All workers present today!</h3></div>';return;}
  var html='<div class="t-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th></tr></thead><tbody>';
  for(var i=0;i<absent.length;i++){var w=absent[i];html+='<tr><td>'+(i+1)+'</td><td><b>'+w.name+'</b></td><td>'+(w.prof||'-')+'</td><td><span class="tag tag-'+(w.sec==='Indian'?'ind':'pak')+'">'+(w.sec==='Indian'?'IN':'PK')+' '+w.sec+'</span></td><td><span class="tag '+(w.shift==='Night'?'tag-o':'tag-b')+'">'+(w.shift==='Night'?'Night':'Day')+'</span></td></tr>';}
  html+='</tbody></table></div>';el.innerHTML=html;
}

function loadAppr(){
  var pend=gA().filter(function(a){return['pending_checkin','pending_checkout'].indexOf(a.status)>-1;});
  var el=$('approveList');if(!el)return;
  if(!pend.length){el.innerHTML='<div class="empty"><div class="em-icon">✅</div><h3>All Clear!</h3></div>';}
  else{var html='';for(var i=0;i<pend.length;i++){var p=pend[i],ic=p.status==='pending_checkin';html+='<div class="appr-item"><div class="appr-info"><h4>'+p.name+' <span class="tag '+(p.shift==='Night'?'tag-o':'tag-b')+'">'+(p.shift==='Night'?'Night':'Day')+'</span> <span class="tag tag-'+(p.sec==='Indian'?'ind':'pak')+'">'+(p.sec==='Indian'?'IN':'PK')+'</span> <span class="tag '+(ic?'tag-g':'tag-r')+'">'+(ic?'IN':'OUT')+'</span></h4><p>'+(p.prof||'-')+' • '+p.wid+' • '+fT(ic?p.checkinReqTime:p.checkoutReqTime)+'</p>'+((!ic&&p.checkinTime)?'<p>In: '+fT(p.checkinTime)+'</p>':'')+'</div><div class="appr-btns"><button class="btn btn-success btn-sm" onclick="doApprove(\''+p.id+'\')">✅</button><button class="btn btn-danger btn-sm" onclick="doReject(\''+p.id+'\')">❌</button></div></div>';}
  el.innerHTML=html;}
  loadRecentAppr();
}

function loadRecentAppr(){
  var today=tD();var rec=gA().filter(function(a){return a.date===today&&(a.status==='checked_in'||a.status==='completed');});
  var el=$('recentApproved');if(!el)return;
  if(!rec.length){el.innerHTML='<div class="empty" style="padding:30px"><h3>No recent</h3></div>';return;}
  var html='';for(var i=0;i<rec.length;i++){var p=rec[i];html+='<div class="appr-item" style="border-left-color:'+(p.status==='completed'?'var(--g)':'var(--pl)')+'"><div class="appr-info"><h4>'+p.name+' <span class="tag '+(p.status==='checked_in'?'tag-b':'tag-g')+'">'+(p.status==='checked_in'?'Working':'Done')+'</span></h4><p>In: '+fT(p.checkinTime)+(p.checkoutTime?' | Out: '+fT(p.checkoutTime):'')+(p.total?' | '+p.total.toFixed(2)+'h':'')+'</p></div><div class="appr-btns">'+(p.status==='completed'?'<button class="btn btn-outline btn-sm" onclick="undoCO(\''+p.id+'\')">↩️</button>':'')+'<button class="btn btn-danger btn-sm" onclick="undoCI(\''+p.id+'\')">🗑️</button></div></div>';}
  el.innerHTML=html;
}

function undoCO(id){confirmDlg('Undo?','Revert checkout?',function(){var r=null;var att=gA();for(var i=0;i<att.length;i++){if(att[i].id===id){r=att[i];break;}}if(!r)return;FB.save(COL.A,id,Object.assign({},r,{checkoutTime:null,checkoutReqTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'checked_in'}));toast('Undone','info');});}
function undoCI(id){var att=gA();var r=null;for(var i=0;i<att.length;i++){if(att[i].id===id){r=att[i];break;}}if(!r)return;confirmDlg('Remove?','Delete '+r.name+'?',function(){FB.del(COL.A,id);toast('Removed','info');});}

function doApprove(id){
  var att=gA();var r=null;for(var i=0;i<att.length;i++){if(att[i].id===id){r=att[i];break;}}if(!r)return;
  var u=Object.assign({},r);
  if(r.status==='pending_checkin'){u.checkinTime=r.checkinReqTime;u.status='checked_in';toast(r.name+' checked in');}
  else if(r.status==='pending_checkout'){u.checkoutTime=r.checkoutReqTime;var c=calcHours(u.checkinTime,u.checkoutTime);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';toast(u.total.toFixed(2)+'h');}
  FB.save(COL.A,id,u);
}

function doReject(id){confirmDlg('Reject?','Sure?',function(){var att=gA();var r=null;for(var i=0;i<att.length;i++){if(att[i].id===id){r=att[i];break;}}if(!r)return;if(r.status==='pending_checkin')FB.del(COL.A,id);else FB.save(COL.A,id,Object.assign({},r,{checkoutReqTime:null,status:'checked_in'}));toast('Rejected','info');});}

function approveAll(){var p=gA().filter(function(a){return['pending_checkin','pending_checkout'].indexOf(a.status)>-1;});if(!p.length)return toast('None','info');confirmDlg('Approve All?',p.length+'?',async function(){for(var i=0;i<p.length;i++){var r=p[i];var u=Object.assign({},r);if(r.status==='pending_checkin'){u.checkinTime=r.checkinReqTime;u.status='checked_in';}else{u.checkoutTime=r.checkoutReqTime;var c=calcHours(u.checkinTime,u.checkoutTime);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';}await FB.save(COL.A,r.id,u);}toast('All approved!');});}

function loadED(){
  var today=tD();var w=gA().filter(function(a){return a.date===today&&(a.status==='checked_in'||a.status==='pending_checkout');});
  st('edWorkingCount',w.length);var el=$('edWorkingList');if(!el)return;
  if(!w.length){el.innerHTML='<div class="empty"><div class="em-icon">✅</div><h3>All Clear!</h3></div>';return;}
  var html='';for(var i=0;i<w.length;i++){var x=w[i];html+='<div class="ed-worker-item"><div class="ed-info"><h4>'+x.name+' '+(x.shift==='Night'?'🌙':'☀️')+'</h4><p>'+(x.prof||'-')+'</p></div><div class="ed-time">'+fT(x.checkinTime)+'</div></div>';}
  el.innerHTML=html;
}

function endDayForAll(){
  var today=tD();var w=gA().filter(function(a){return a.date===today&&(a.status==='checked_in'||a.status==='pending_checkout');});
  if(!w.length)return toast('None','info');var ti=$('edLogoutTime').value;if(!ti)return toast('Set time','err');
  confirmDlg('End Day?',w.length+' at '+ti+'?',async function(){var parts=ti.split(':');for(var i=0;i<w.length;i++){var r=w[i];var cd=new Date();cd.setHours(parseInt(parts[0]),parseInt(parts[1]),0,0);var u=Object.assign({},r);u.checkoutTime=cd.toISOString();u.checkoutReqTime=u.checkoutReqTime||u.checkoutTime;var c=calcHours(u.checkinTime,u.checkoutTime);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';await FB.save(COL.A,r.id,u);}toast('Done for '+w.length+'!');});
}

function loadLive(){
  var today=tD();var att=gA().filter(function(a){return a.date===today;});
  var w=att.filter(function(a){return a.status==='checked_in';});
  var d=att.filter(function(a){return a.status==='completed';});
  st('liveCount',w.length);st('doneCount',d.length);
  var lE=$('liveList'),dE=$('doneList');
  if(lE){if(!w.length)lE.innerHTML='<div class="empty"><div class="em-icon">💤</div><h3>No one</h3></div>';else{var h='';for(var i=0;i<w.length;i++){var x=w[i];h+='<div class="live-item"><div class="li-info"><h4>'+x.name+' <span class="tag '+(x.shift==='Night'?'tag-o':'tag-b')+'">'+(x.shift==='Night'?'Night':'Day')+'</span> <span class="tag tag-'+(x.sec==='Indian'?'ind':'pak')+'">'+(x.sec==='Indian'?'IN':'PK')+'</span></h4><p>'+(x.prof||'-')+'</p></div><div class="li-time">'+fT(x.checkinTime)+'</div></div>';}lE.innerHTML=h;}}
  if(dE){if(!d.length)dE.innerHTML='<div class="empty"><div class="em-icon">📋</div><h3>None</h3></div>';else{var h2='';for(var j=0;j<d.length;j++){var y=d[j];h2+='<div class="live-item"><div class="li-info"><h4>'+y.name+' '+(y.shift==='Night'?'🌙':'☀️')+'</h4><p>'+y.total.toFixed(2)+'h | OT: '+y.ot.toFixed(2)+'h</p></div><div class="li-time">'+fT(y.checkoutTime)+'</div></div>';}dE.innerHTML=h2;}}
}

// ===== ATTENDANCE WITH ABSENT =====
function loadAttend(){
  var date=$('fDate').value,sec=$('fSec').value;
  var allAtt=gA().filter(function(a){return a.date===date;});
  var allW=gW().filter(function(w){return w.on;});
  var el=$('attendTable');if(!el)return;
  
  if(sec==='Absent'){
    var attWids=allAtt.map(function(a){return a.wid;});
    var absent=allW.filter(function(w){return attWids.indexOf(w.wid)===-1;});
    if(!absent.length){el.innerHTML='<div class="empty"><h3>All present on '+date+'!</h3></div>';return;}
    el.innerHTML='<div style="background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:20px;border-radius:12px;margin-bottom:20px"><h3>Absent Workers on '+date+'</h3><p style="opacity:.9">'+absent.length+' / '+allW.length+' absent</p></div><div class="t-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th></tr></thead><tbody>'+absent.map(function(w,i){return'<tr><td>'+(i+1)+'</td><td><b>'+w.name+'</b></td><td>'+(w.prof||'-')+'</td><td><span class="tag tag-'+(w.sec==='Indian'?'ind':'pak')+'">'+w.sec+'</span></td><td><span class="tag '+(w.shift==='Night'?'tag-o':'tag-b')+'">'+(w.shift==='Night'?'Night':'Day')+'</span></td></tr>';}).join('')+'</tbody></table></div>';
    return;
  }
  
  var att=allAtt.slice();
  if(sec==='Day')att=att.filter(function(a){return a.shift==='Day'||!a.shift;});
  else if(sec==='Night')att=att.filter(function(a){return a.shift==='Night';});
  else if(sec==='Indian')att=att.filter(function(a){return a.sec==='Indian';});
  else if(sec==='Pakistani')att=att.filter(function(a){return a.sec==='Pakistani';});
  else if(sec==='Present')att=att.filter(function(a){return a.status==='completed'||a.status==='checked_in';});
  
  var stg=function(s){var m={'completed':'<span class="tag tag-g">Done</span>','checked_in':'<span class="tag tag-b">Working</span>','pending_checkin':'<span class="tag tag-o">Pending IN</span>','pending_checkout':'<span class="tag tag-o">Pending OUT</span>'};return m[s]||s;};
  
  var attWids2=allAtt.map(function(a){return a.wid;});
  var absentW=allW.filter(function(w){return attWids2.indexOf(w.wid)===-1;});
  if(sec==='Indian')absentW=absentW.filter(function(w){return w.sec==='Indian';});
  else if(sec==='Pakistani')absentW=absentW.filter(function(w){return w.sec==='Pakistani';});
  else if(sec==='Present')absentW=[];
  
  var html='';
  if(att.length){
    html+='<div style="background:#059669;color:#fff;padding:14px 20px;border-radius:12px 12px 0 0"><h3 style="margin:0">Present Workers ('+att.length+')</h3></div>';
    html+='<div class="t-wrap" style="border-top-left-radius:0;border-top-right-radius:0;margin-bottom:24px"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th><th>Status</th><th>Act</th></tr></thead><tbody>';
    for(var i=0;i<att.length;i++){var a=att[i];html+='<tr><td>'+(i+1)+'</td><td><b>'+a.name+'</b>'+(a.backdated?' <span class="tag tag-o" style="font-size:9px">Manual</span>':'')+'</td><td>'+(a.prof||'-')+'</td><td><span class="tag tag-'+(a.sec==='Indian'?'ind':'pak')+'">'+(a.sec==='Indian'?'IN':'PK')+'</span></td><td><span class="tag '+(a.shift==='Night'?'tag-o':'tag-b')+'">'+(a.shift==='Night'?'Night':'Day')+'</span></td><td style="color:#059669">'+fT(a.checkinTime)+'</td><td style="color:#dc2626">'+fT(a.checkoutTime)+'</td><td style="color:var(--p);font-weight:700">'+(a.total||0).toFixed(2)+'h</td><td>'+(a.regular||0).toFixed(2)+'h</td><td style="color:#d97706">'+(a.compOT||0).toFixed(2)+'h</td><td style="color:#dc2626;font-weight:700">'+((a.extraOT||0)>0?(a.extraOT).toFixed(2)+'h':'-')+'</td><td>'+stg(a.status)+'</td><td><button class="btn btn-danger btn-sm" onclick="undoCI(\''+a.id+'\')">🗑️</button></td></tr>';}
    html+='</tbody></table></div>';
  }
  
  if(absentW.length&&sec!=='Present'){
    html+='<div style="background:#dc2626;color:#fff;padding:14px 20px;border-radius:12px 12px 0 0;margin-top:20px"><h3 style="margin:0">Absent Workers ('+absentW.length+')</h3></div>';
    html+='<div class="t-wrap" style="border-top-left-radius:0;border-top-right-radius:0"><table><thead><tr><th style="background:#dc2626">#</th><th style="background:#dc2626">Name</th><th style="background:#dc2626">Work</th><th style="background:#dc2626">Country</th><th style="background:#dc2626">Shift</th><th style="background:#dc2626">Status</th></tr></thead><tbody>';
    for(var j=0;j<absentW.length;j++){var w=absentW[j];html+='<tr style="background:#fef2f2"><td>'+(j+1)+'</td><td><b style="color:#dc2626">'+w.name+'</b></td><td>'+(w.prof||'-')+'</td><td><span class="tag tag-'+(w.sec==='Indian'?'ind':'pak')+'">'+w.sec+'</span></td><td><span class="tag '+(w.shift==='Night'?'tag-o':'tag-b')+'">'+(w.shift==='Night'?'Night':'Day')+'</span></td><td><span class="tag tag-r">ABSENT</span></td></tr>';}
    html+='</tbody></table></div>';
  }
  
  if(!att.length&&!absentW.length)html='<div class="empty"><h3>No Records for '+date+'</h3></div>';
  el.innerHTML=html;
}

// ===== WORKERS =====
var curTab='Indian',editId=null;
function swWorkerTab(s,b){curTab=s;var tabs=document.querySelectorAll('#sec-workers .ltab');for(var i=0;i<tabs.length;i++)tabs[i].classList.remove('active');b.classList.add('active');loadWorkerTable();}

function loadWorkerTable(){
  var q=($('wSearch')?$('wSearch').value:'').toLowerCase();
  var ws=gW().filter(function(w){return curTab==='Indian'?w.sec==='Indian':w.sec==='Pakistani';}).sort(function(a,b){return(a.name||'').localeCompare(b.name||'');});
  st('indCount','('+gW().filter(function(w){return w.on&&w.sec==='Indian';}).length+')');
  st('pakCount','('+gW().filter(function(w){return w.on&&w.sec==='Pakistani';}).length+')');
  if(q)ws=ws.filter(function(w){return(w.name||'').toLowerCase().indexOf(q)>-1||(w.wid||'').toLowerCase().indexOf(q)>-1||(w.prof||'').toLowerCase().indexOf(q)>-1;});
  var el=$('workerTable');if(!el)return;
  if(!ws.length){el.innerHTML='<div class="empty"><h3>No Workers</h3></div>';return;}
  var html='<div class="t-wrap"><table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th><th>PW</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
  for(var i=0;i<ws.length;i++){var w=ws[i];html+='<tr style="'+(w.on?'':'opacity:.5')+'"><td>'+(i+1)+'</td><td><code>'+w.wid+'</code></td><td><b>'+w.name+'</b></td><td>'+(w.prof||'-')+'</td><td><span class="tag tag-'+(w.sec==='Indian'?'ind':'pak')+'">'+(w.sec==='Indian'?'IN':'PK')+'</span></td><td><button class="btn btn-outline btn-sm" onclick="toggleShift(\''+w.wid+'\')"><span class="tag '+(w.shift==='Night'?'tag-o':'tag-b')+'">'+(w.shift==='Night'?'Night':'Day')+'</span></button></td><td><code id="p-'+w.wid+'">••••</code> <button class="btn btn-outline btn-sm" onclick="showPw(\''+w.wid+'\')" style="padding:2px 6px">👁</button></td><td>'+(w.on?'<span class="tag tag-g">On</span>':'<span class="tag tag-r">Off</span>')+'</td><td style="white-space:nowrap"><button class="btn btn-outline btn-sm" onclick="editW(\''+w.wid+'\')">✏️</button><button class="btn btn-outline btn-sm" onclick="resetPw(\''+w.wid+'\')">🔑</button><button class="btn btn-'+(w.on?'danger':'success')+' btn-sm" onclick="toggleW(\''+w.wid+'\')">'+(w.on?'🚫':'✅')+'</button><button class="btn btn-danger btn-sm" onclick="delW(\''+w.wid+'\')">🗑️</button></td></tr>';}
  html+='</tbody></table></div>';el.innerHTML=html;
}

function toggleShift(id){var workers=gW();var w=null;for(var i=0;i<workers.length;i++){if(workers[i].wid===id){w=workers[i];break;}}if(!w)return;var ns=w.shift==='Night'?'Day':'Night';FB.save(COL.W,id,Object.assign({},w,{shift:ns}));toast(w.name+' -> '+ns+' Shift','info');}
function showPw(id){var workers=gW();var w=null;for(var i=0;i<workers.length;i++){if(workers[i].wid===id){w=workers[i];break;}}if(!w)return;var el=$('p-'+id);if(el.textContent==='••••'){el.textContent=w.pw;setTimeout(function(){el.textContent='••••';},4000);}}
function resetPw(id){confirmDlg('Reset?','Reset to '+DEFAULT_PW,function(){var workers=gW();var w=null;for(var i=0;i<workers.length;i++){if(workers[i].wid===id){w=workers[i];break;}}if(!w)return;FB.save(COL.W,id,Object.assign({},w,{pw:DEFAULT_PW}));$('mPwBody').innerHTML='<div class="pw-show"><div class="pw-lbl">Reset</div><div class="pw-name">'+w.name+'</div><div class="pw-val">'+DEFAULT_PW+'</div></div>';openModal('mPw');});}
function openAddWorker(){editId=null;$('mwTitle').textContent='Add Worker';$('mwName').value='';$('mwProf').value='';$('mwSec').value='Indian';$('mwShift').value='Day';$('mwPw').value=DEFAULT_PW;openModal('mWorker');}
function editW(id){var workers=gW();var w=null;for(var i=0;i<workers.length;i++){if(workers[i].wid===id){w=workers[i];break;}}if(!w)return;editId=id;$('mwTitle').textContent='Edit Worker';$('mwName').value=w.name;$('mwProf').value=w.prof||'';$('mwSec').value=w.sec||'Indian';$('mwShift').value=w.shift||'Day';$('mwPw').value=w.pw;openModal('mWorker');}

function saveWorkerForm(e){
  e.preventDefault();var name=$('mwName').value.trim(),prof=$('mwProf').value||'Worker',sec=$('mwSec').value,shift=$('mwShift').value,pw=$('mwPw').value.trim();
  if(!name||!pw)return toast('Fill all','err');
  if(editId){var workers=gW();var w=null;for(var i=0;i<workers.length;i++){if(workers[i].wid===editId){w=workers[i];break;}}if(w)FB.save(COL.W,editId,Object.assign({},w,{name:name,prof:prof,sec:sec,shift:shift,pw:pw}));toast('Updated!');closeModal('mWorker');}
  else{var pre=sec==='Indian'?'IND':'PAK';var nums=gW().filter(function(w){return w.wid.indexOf(pre)===0;}).map(function(w){return parseInt(w.wid.replace(pre,''));}).filter(function(n){return!isNaN(n);});var next=nums.length?Math.max.apply(null,nums)+1:1;var wid=pre+String(next).padStart(4,'0');FB.save(COL.W,wid,{wid:wid,name:name,prof:prof,sec:sec,shift:shift,pw:pw,on:true});$('mPwBody').innerHTML='<div class="pw-show"><div class="pw-lbl">Added</div><div class="pw-name">'+name+' ('+wid+')</div><div class="pw-val">'+pw+'</div></div>';openModal('mPw');toast(wid+' added!');closeModal('mWorker');}
  return false;
}

function toggleW(id){var workers=gW();var w=null;for(var i=0;i<workers.length;i++){if(workers[i].wid===id){w=workers[i];break;}}if(!w)return;FB.save(COL.W,id,Object.assign({},w,{on:!w.on}));toast(w.on?'Deactivated':'Activated','info');}
function delW(id){var workers=gW();var w=null;for(var i=0;i<workers.length;i++){if(workers[i].wid===id){w=workers[i];break;}}if(!w)return;confirmDlg('Delete?',w.name+'?',async function(){await FB.del(COL.W,id);var att=gA().filter(function(a){return a.wid===id;});for(var i=0;i<att.length;i++)await FB.del(COL.A,att[i].id);toast('Deleted','info');});}

// ===== REPORTS =====
function popReportDD(){
  var s=$('reportWorker');if(!s)return;var cv=s.value;var w=gW().filter(function(x){return x.on;}).sort(function(a,b){return(a.name||'').localeCompare(b.name||'');});
  var h='<option value="">— Select —</option><option value="__ALL__">All Workers</option>';
  for(var i=0;i<w.length;i++)h+='<option value="'+w[i].wid+'">'+w[i].name+' — '+w[i].sec+'</option>';
  s.innerHTML=h;if(cv)s.value=cv;
}

function loadMR(){
  var wid=$('reportWorker')?$('reportWorker').value:'';
  var month=$('reportMonth')?$('reportMonth').value:'';
  var el=$('reportContent');if(!el)return;
  if(!wid||!month){el.innerHTML='<div class="empty"><h3>Select worker & month</h3></div>';return;}
  
  if(wid==='__ALL__'){
    var ws=gW().filter(function(w){return w.on;});var att=gA().filter(function(a){return a.date.indexOf(month)===0&&a.status==='completed';});
    var html='<div class="t-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Days</th><th>Day</th><th>Night</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th></tr></thead><tbody>';
    for(var i=0;i<ws.length;i++){var w=ws[i];var m=att.filter(function(a){return a.wid===w.wid;});var dayD=m.filter(function(a){return a.shift==='Day'||!a.shift;}).length;var nightD=m.filter(function(a){return a.shift==='Night';}).length;html+='<tr><td>'+(i+1)+'</td><td><b>'+w.name+'</b></td><td>'+(w.prof||'-')+'</td><td><span class="tag tag-'+(w.sec==='Indian'?'ind':'pak')+'">'+(w.sec==='Indian'?'IN':'PK')+'</span></td><td><b>'+m.length+'</b></td><td>'+dayD+'</td><td>'+nightD+'</td><td style="color:var(--p);font-weight:700">'+m.reduce(function(s,a){return s+(a.total||0);},0).toFixed(2)+'h</td><td>'+m.reduce(function(s,a){return s+(a.regular||0);},0).toFixed(2)+'h</td><td style="color:#d97706">'+m.reduce(function(s,a){return s+(a.compOT||0);},0).toFixed(2)+'h</td><td style="color:#dc2626;font-weight:700">'+m.reduce(function(s,a){return s+(a.extraOT||0);},0).toFixed(2)+'h</td></tr>';}
    html+='</tbody></table></div>';el.innerHTML=html;
  }else{
    var workers=gW();var w2=null;for(var j=0;j<workers.length;j++){if(workers[j].wid===wid){w2=workers[j];break;}}if(!w2)return;
    var att2=gA().filter(function(a){return a.wid===wid&&a.date.indexOf(month)===0&&a.status==='completed';}).sort(function(a,b){return a.date.localeCompare(b.date);});
    var tH=att2.reduce(function(s,a){return s+(a.total||0);},0);var rH=att2.reduce(function(s,a){return s+(a.regular||0);},0);var cOT=att2.reduce(function(s,a){return s+(a.compOT||0);},0);var eOT=att2.reduce(function(s,a){return s+(a.extraOT||0);},0);
    var dayD2=att2.filter(function(a){return a.shift==='Day'||!a.shift;}).length;var nightD2=att2.filter(function(a){return a.shift==='Night';}).length;
    
    var html2='<div class="w-card" style="margin-bottom:20px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff"><h3 style="font-size:20px;font-weight:800;margin-bottom:6px">'+w2.name+'</h3><p style="opacity:.9">'+(w2.prof||'Worker')+' • '+w2.sec+'</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px"><div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800">'+att2.length+'</div><div style="font-size:10px;opacity:.9">Days</div></div><div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800">'+dayD2+'</div><div style="font-size:10px;opacity:.9">Day</div></div><div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800">'+nightD2+'</div><div style="font-size:10px;opacity:.9">Night</div></div><div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800">'+tH.toFixed(1)+'h</div><div style="font-size:10px;opacity:.9">Total</div></div></div></div>';
    
    if(att2.length){
      html2+='<div class="t-wrap"><table><thead><tr><th>#</th><th>Date</th><th>Shift</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th></tr></thead><tbody>';
      for(var k=0;k<att2.length;k++){var a=att2[k];html2+='<tr><td>'+(k+1)+'</td><td><b>'+a.date+'</b></td><td><span class="tag '+(a.shift==='Night'?'tag-o':'tag-b')+'">'+(a.shift==='Night'?'Night':'Day')+'</span></td><td style="color:#059669">'+fT(a.checkinTime)+'</td><td style="color:#dc2626">'+fT(a.checkoutTime)+'</td><td style="color:var(--p);font-weight:700">'+a.total.toFixed(2)+'h</td><td>'+a.regular.toFixed(2)+'h</td><td style="color:#d97706">'+(a.compOT||0).toFixed(2)+'h</td><td style="color:#dc2626;font-weight:700">'+((a.extraOT||0)>0?(a.extraOT).toFixed(2)+'h':'-')+'</td></tr>';}
      html2+='<tr style="background:#eff6ff;font-weight:700"><td colspan="5" style="text-align:right">TOTAL:</td><td style="color:var(--p)">'+tH.toFixed(2)+'h</td><td>'+rH.toFixed(2)+'h</td><td style="color:#d97706">'+cOT.toFixed(2)+'h</td><td style="color:#dc2626">'+eOT.toFixed(2)+'h</td></tr></tbody></table></div>';
    }else html2+='<div class="empty"><h3>No records</h3></div>';
    el.innerHTML=html2;
  }
}

// ===== PDF HEADER (ALL PDFs) =====
function addPDFHeader(doc,title,sub,w){
  doc.setFillColor(30,64,175);
  doc.rect(0,0,w,52,'F');
  if(LOGO_BASE64){try{doc.addImage(LOGO_BASE64,'PNG',12,8,32,32);}catch(e){}}
  doc.setTextColor(255,255,255);
  doc.setFontSize(24);doc.setFont('helvetica','bold');
  doc.text(COMPANY.name,w/2,18,{align:'center'});
  doc.setFontSize(12);doc.setFont('helvetica','normal');
  doc.text('Attendance Report',w/2,26,{align:'center'});
  doc.setFontSize(12);doc.setFont('helvetica','bold');
  doc.text(COMPANY.project+' at '+COMPANY.site,w/2,34,{align:'center'});
  doc.setFontSize(9);doc.setFont('helvetica','normal');
  doc.text('Company Registered: '+COMPANY.office+'  |  '+COMPANY.web,w/2,41,{align:'center'});
  doc.setFontSize(9);
  doc.text(title+'  |  '+sub,w/2,48,{align:'center'});
  doc.setTextColor(0,0,0);
}

function addPDFFooter(doc){
  var pc=doc.internal.getNumberOfPages();
  for(var i=1;i<=pc;i++){
    doc.setPage(i);
    doc.setDrawColor(200);doc.setLineWidth(0.3);doc.line(10,doc.internal.pageSize.height-15,doc.internal.pageSize.width-10,doc.internal.pageSize.height-15);
    doc.setFontSize(8);doc.setTextColor(120);doc.setFont('helvetica','normal');
    doc.text(COMPANY.full,doc.internal.pageSize.width/2,doc.internal.pageSize.height-10,{align:'center'});
    doc.text('Generated: '+new Date().toLocaleString()+' | Page '+i+'/'+pc,doc.internal.pageSize.width/2,doc.internal.pageSize.height-6,{align:'center'});
  }
}

// ===== MONTHLY REPORT PDF =====
function downloadReportPDF(){
  var wid=$('reportWorker').value,month=$('reportMonth').value;
  if(!wid||!month)return toast('Select both','err');
  if(!window.jspdf)return toast('Loading...','err');
  var jsPDF=window.jspdf.jsPDF;var doc=new jsPDF();
  addPDFHeader(doc,'Monthly Report - '+month,'Reg: 9h + Comp OT: 3h',210);
  
  var data=[],fn='';
  if(wid==='__ALL__'){
    fn='All_'+month+'.pdf';var ws=gW().filter(function(w){return w.on;});var att=gA().filter(function(a){return a.date.indexOf(month)===0&&a.status==='completed';});
    for(var i=0;i<ws.length;i++){var w=ws[i];var m=att.filter(function(a){return a.wid===w.wid;});data.push([i+1,w.name,w.prof||'-',w.sec,m.length,m.filter(function(a){return a.shift==='Day'||!a.shift;}).length,m.filter(function(a){return a.shift==='Night';}).length,m.reduce(function(s,a){return s+(a.total||0);},0).toFixed(2)+'h',m.reduce(function(s,a){return s+(a.compOT||0);},0).toFixed(2)+'h',m.reduce(function(s,a){return s+(a.extraOT||0);},0).toFixed(2)+'h']);}
    doc.autoTable({startY:56,head:[['#','Name','Work','Country','Days','Day','Night','Total','OT','Extra']],body:data,theme:'grid',headStyles:{fillColor:[30,64,175]},alternateRowStyles:{fillColor:[240,249,255]},styles:{fontSize:7}});
  }else{
    var workers=gW();var w2=null;for(var j=0;j<workers.length;j++){if(workers[j].wid===wid){w2=workers[j];break;}}
    fn=(w2?w2.name.replace(/\s/g,'_'):'Worker')+'_'+month+'.pdf';
    doc.setFontSize(14);doc.setFont('helvetica','bold');doc.text(w2?w2.name:'',14,58);
    doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text((w2?w2.prof:'')+'  |  '+(w2?w2.sec:'')+'  |  '+(w2?(w2.shift||'Day'):'Day')+' Shift',14,64);
    var att2=gA().filter(function(a){return a.wid===wid&&a.date.indexOf(month)===0&&a.status==='completed';}).sort(function(a,b){return a.date.localeCompare(b.date);});
    for(var k=0;k<att2.length;k++){var a=att2[k];data.push([k+1,a.date,a.shift||'Day',fT(a.checkinTime),fT(a.checkoutTime),a.total.toFixed(2)+'h',a.regular.toFixed(2)+'h',(a.compOT||0).toFixed(2)+'h',(a.extraOT||0).toFixed(2)+'h']);}
    doc.autoTable({startY:70,head:[['#','Date','Shift','In','Out','Total','Reg','OT','Extra']],body:data,theme:'grid',headStyles:{fillColor:[30,64,175]},alternateRowStyles:{fillColor:[240,249,255]}});
  }
  addPDFFooter(doc);
  doc.save('AlBowry_COP31_'+fn);toast('PDF downloaded!');
}

// ===== EXPORT PDF =====
function exportPDF(){
  var s=$('expStart').value,e=$('expEnd').value,sec=$('expSec').value;
  if(!s||!e)return toast('Select dates','err');if(!window.jspdf)return toast('Loading','err');
  var data=gA().filter(function(a){return a.date>=s&&a.date<=e&&a.status==='completed';});
  if(sec==='Day')data=data.filter(function(a){return a.shift==='Day'||!a.shift;});
  else if(sec==='Night')data=data.filter(function(a){return a.shift==='Night';});
  else if(sec==='Indian')data=data.filter(function(a){return a.sec==='Indian';});
  else if(sec==='Pakistani')data=data.filter(function(a){return a.sec==='Pakistani';});
  if(!data.length)return toast('No data','err');
  
  var jsPDF=window.jspdf.jsPDF;var doc=new jsPDF('l');
  addPDFHeader(doc,s+' to '+e+' | '+(sec||'All'),'Reg: 9h | Comp OT: 3h',297);
  
  var rows=[];for(var i=0;i<data.length;i++){var a=data[i];rows.push([i+1,a.name,a.prof||'-',a.sec,a.shift||'Day',a.date,fT(a.checkinTime),fT(a.checkoutTime),a.total.toFixed(2),a.regular.toFixed(2),(a.compOT||0).toFixed(2),(a.extraOT||0).toFixed(2)]);}
  doc.autoTable({startY:56,head:[['#','Name','Work','Country','Shift','Date','In','Out','Total','Reg','OT','Extra']],body:rows,theme:'grid',headStyles:{fillColor:[30,64,175]},styles:{fontSize:7}});
  addPDFFooter(doc);
  doc.save('AlBowry_COP31_'+s+'_to_'+e+'.pdf');toast('PDF downloaded!');
}

// ===== EXPORT EXCEL =====
function exportExcel(){
  var s=$('expStart').value,e=$('expEnd').value,sec=$('expSec').value;if(!s||!e)return toast('Dates','err');
  var data=gA().filter(function(a){return a.date>=s&&a.date<=e;});
  if(sec==='Day')data=data.filter(function(a){return a.shift==='Day'||!a.shift;});
  else if(sec==='Night')data=data.filter(function(a){return a.shift==='Night';});
  else if(sec==='Indian')data=data.filter(function(a){return a.sec==='Indian';});
  else if(sec==='Pakistani')data=data.filter(function(a){return a.sec==='Pakistani';});
  if(!data.length)return toast('No data','err');
  
  var logo=LOGO_BASE64?'<img src="'+LOGO_BASE64+'" width="60" height="60" style="border-radius:8px">':'<div style="width:60px;height:60px;background:#fff;color:#1e40af;font-size:36px;font-weight:bold;text-align:center;line-height:60px;border-radius:8px">A</div>';
  var html='<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Arial}th{background:#1e40af;color:#fff;padding:10px 8px;border:1px solid #1e3a8a;font-size:11px;text-align:center}td{padding:8px;border:1px solid #ccc;font-size:11px;text-align:center}.e{background:#f0f9ff}</style></head><body><table border="1">';
  html+='<tr><td colspan="13" style="background:#1e40af;color:#fff;padding:20px"><table style="border:none;width:100%"><tr><td style="border:none;width:80px;vertical-align:middle">'+logo+'</td><td style="border:none;text-align:center;vertical-align:middle"><div style="font-size:26px;font-weight:bold;letter-spacing:1px">'+COMPANY.name+'</div><div style="font-size:14px;font-weight:bold;margin-top:6px">Attendance Report</div><div style="font-size:13px;font-weight:bold;margin-top:4px">'+COMPANY.project+' at '+COMPANY.site+'</div><div style="font-size:11px;margin-top:4px">Registered: '+COMPANY.office+' | '+COMPANY.web+'</div></td></tr></table></td></tr>';
  html+='<tr><td colspan="13" style="background:#dbeafe;text-align:center;padding:10px;font-weight:bold;color:#1e40af">'+s+' to '+e+' | '+(sec||'All')+' | Reg:9h + OT:3h</td></tr><tr><td colspan="13"></td></tr>';
  html+='<tr><th>#</th><th>ID</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th><th>Date</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th></tr>';
  for(var i=0;i<data.length;i++){var a=data[i];html+='<tr class="'+(i%2===0?'e':'')+'"><td>'+(i+1)+'</td><td>'+a.wid+'</td><td style="text-align:left"><b>'+a.name+'</b></td><td>'+(a.prof||'-')+'</td><td>'+a.sec+'</td><td>'+(a.shift||'Day')+'</td><td>'+a.date+'</td><td>'+fT(a.checkinTime)+'</td><td>'+fT(a.checkoutTime)+'</td><td><b>'+(a.total||0).toFixed(2)+'</b></td><td>'+(a.regular||0).toFixed(2)+'</td><td>'+(a.compOT||0).toFixed(2)+'</td><td>'+(a.extraOT||0).toFixed(2)+'</td></tr>';}
  html+='<tr style="background:#dbeafe;font-weight:bold"><td colspan="9" style="text-align:right">TOTALS:</td><td>'+data.reduce(function(s,a){return s+(a.total||0);},0).toFixed(2)+'</td><td>'+data.reduce(function(s,a){return s+(a.regular||0);},0).toFixed(2)+'</td><td>'+data.reduce(function(s,a){return s+(a.compOT||0);},0).toFixed(2)+'</td><td>'+data.reduce(function(s,a){return s+(a.extraOT||0);},0).toFixed(2)+'</td></tr>';
  html+='<tr><td colspan="13" style="background:#1e40af;color:#fff;text-align:center;padding:14px;font-size:11px">'+COMPANY.full+' | '+new Date().toLocaleString()+'</td></tr></table></body></html>';
  var b=new Blob([html],{type:'application/vnd.ms-excel'});var l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='AlBowry_COP31_'+s+'_to_'+e+'.xls';l.click();toast('Excel downloaded!');
}

function exportCSV(){
  var s=$('expStart').value,e=$('expEnd').value,sec=$('expSec').value;if(!s||!e)return toast('Dates','err');
  var data=gA().filter(function(a){return a.date>=s&&a.date<=e;});
  if(sec==='Day')data=data.filter(function(a){return a.shift==='Day'||!a.shift;});
  else if(sec==='Night')data=data.filter(function(a){return a.shift==='Night';});
  else if(sec==='Indian')data=data.filter(function(a){return a.sec==='Indian';});
  else if(sec==='Pakistani')data=data.filter(function(a){return a.sec==='Pakistani';});
  if(!data.length)return toast('No data','err');
  var csv=COMPANY.name+'\n'+COMPANY.project+' at '+COMPANY.site+'\nRegistered: '+COMPANY.office+'\n'+s+' to '+e+'\nReg:9h + OT:3h\n\n#,ID,Name,Work,Country,Shift,Date,In,Out,Total,Reg,OT,Extra,Status\n';
  for(var i=0;i<data.length;i++){var a=data[i];csv+=(i+1)+','+a.wid+',"'+a.name+'","'+(a.prof||'-')+'",'+a.sec+','+(a.shift||'Day')+','+a.date+','+fT(a.checkinTime)+','+fT(a.checkoutTime)+','+(a.total||0).toFixed(2)+','+(a.regular||0).toFixed(2)+','+(a.compOT||0).toFixed(2)+','+(a.extraOT||0).toFixed(2)+','+a.status+'\n';}
  var b=new Blob([csv],{type:'text/csv'});var l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='AlBowry_COP31_'+s+'_to_'+e+'.csv';l.click();toast('CSV downloaded!');
}

// ===== SETTINGS =====
function updateAdmin(){
  var nid=$('setNewId').value.trim();var nname=$('setNewName')?$('setNewName').value.trim():'';
  var npw=$('setNewPw').value;var cpw=$('setConfPw').value;
  var cur=gAD();var fId=nid||cur.adminId;var fName=nname||cur.name;var fPw=npw||cur.pw;
  if(npw&&npw!==cpw)return toast('Mismatch','err');
  if(npw&&npw.length<6)return toast('Min 6','err');
  if(!nid&&!nname&&!npw)return toast('Enter something','err');
  FB.save(COL.AD,'main',{adminId:fId,pw:fPw,name:fName});
  var u=gU();u.id=fId;u.name=fName;sU(u);
  $('setCurId').value=fId;$('aNavName').textContent=fName;
  if($('setNewName'))$('setNewName').value='';$('setNewId').value='';$('setNewPw').value='';$('setConfPw').value='';
  toast('Updated! Welcome '+fName);speakWelcome(fName);
}

function backupAll(){var d={workers:gW(),attendance:gA(),admin:gAD(),date:new Date().toISOString()};var b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});var l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='AlBowry_COP31_Backup_'+tD()+'.json';l.click();toast('Backup downloaded!');}
function resetAllPasswords(){confirmDlg('Reset All?','All to '+DEFAULT_PW,async function(){var ws=gW();for(var i=0;i<ws.length;i++)await FB.save(COL.W,ws[i].wid,Object.assign({},ws[i],{pw:DEFAULT_PW}));toast('All passwords reset!');});}
function clearAttendanceData(){confirmDlg('Clear ALL?','Delete ALL attendance?',async function(){var att=gA();for(var i=0;i<att.length;i++)await FB.del(COL.A,att[i].id);toast('Cleared','info');});}

function setExpDate(r){var t=tD();if(r==='today'){$('expStart').value=t;$('expEnd').value=t;}else if(r==='week'){var n=new Date(),d=n.getDay(),diff=n.getDate()-d+(d===0?-6:1);$('expStart').value=new Date(n.setDate(diff)).toLocaleDateString('en-CA');$('expEnd').value=tD();}else{$('expStart').value=t.substring(0,8)+'01';$('expEnd').value=t;}}

// ===== CLOCKS =====
function updateClocks(){var t=tT();var ids=['loginClock','wClock','aClock','wBigClock'];for(var i=0;i<ids.length;i++){var e=$(ids[i]);if(e)e.textContent=t;}}

// ===== PWA INSTALL =====
var deferredPrompt=null;
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').then(function(){console.log('SW');}).catch(function(){});});}
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;setTimeout(function(){if(!localStorage.getItem('install_dismissed')&&!localStorage.getItem('app_installed')){var b=$('installBanner');if(b)b.classList.add('show');}},2000);});
function installApp(){if(!deferredPrompt){alert('Use browser menu -> Add to Home Screen');return;}deferredPrompt.prompt();deferredPrompt.userChoice.then(function(r){if(r.outcome==='accepted'){toast('Installed!');localStorage.setItem('app_installed','true');}deferredPrompt=null;dismissInstall();});}
function dismissInstall(){var b=$('installBanner');if(b){b.classList.remove('show');localStorage.setItem('install_dismissed','true');setTimeout(function(){localStorage.removeItem('install_dismissed');},7*24*60*60*1000);}}
window.addEventListener('appinstalled',function(){localStorage.setItem('app_installed','true');toast('Installed!');dismissInstall();});

// ===== BOOT =====
async function boot(){console.log('Booting AL BOWRY...');await initDB();fillDD();updateClocks();setInterval(updateClocks,1000);var u=gU();if(u){if(u.role==='worker')loadWD();else if(u.role==='admin')loadAD();}}
if(window.FB_READY)boot();else window.addEventListener('fb-ready',boot);
