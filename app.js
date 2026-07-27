const REG_HOURS=9,COMP_OT=3,DEFAULT_PW='Worker@123',CURRENT_YEAR=2026;
const COL={W:'workers',A:'attendance',AD:'admin'};
const K={U:'alb_session'};

// ALL 37 INDIAN WORKERS
const IND=[
{n:"Hajari Lal",p:"Foreman"},
{n:"Rajeev Punia",p:"Supervisor"},
{n:"Om Prakash",p:"Supervisor"},
{n:"Nitesh Bugalia",p:"Helper"},
{n:"Govind Jangir",p:"Helper"},
{n:"Lokesh Kumar Verma",p:"Helper"},
{n:"Rajendra Kumar",p:"Helper"},
{n:"Surendra Budania",p:"Helper"},
{n:"Majid Abdul",p:"Helper"},
{n:"Pradeep Singh",p:"Helper"},
{n:"Akram Khan",p:"Helper"},
{n:"Manoj Kumar Jakhar",p:"Helper"},
{n:"Puneet Sewda",p:"Helper"},
{n:"Surendra Kumar Mahala",p:"Helper"},
{n:"Deepak Kumar Jangir",p:"Carpenter"},
{n:"Jeth Mal Jangir",p:"Carpenter"},
{n:"Rahul",p:"Carpenter"},
{n:"Vijendra Kumar",p:"Carpenter"},
{n:"Rakesh Kumar Jangir",p:"Carpenter"},
{n:"Jitendra Kumar Jangid",p:"Carpenter"},
{n:"Dharmendra Khyaliya",p:"Carpenter (Cutter Operator)"},
{n:"Jitendra Jangid",p:"Carpenter"},
{n:"Rahul Verma",p:"Carpenter"},
{n:"Raj Pal",p:"Carpenter (Cutter Operator)"},
{n:"Mukesh Saini",p:"Carpenter (Cutter Operator)"},
{n:"Suresh Kumar Jangir",p:"Carpenter (Cutter Operator)"},
{n:"Pradip Kumar",p:"Carpenter"},
{n:"Ajay Jangir",p:"Carpenter (Cutter Operator)"},
{n:"Rajesh Khyalia",p:"Carpenter (Cutter Operator)"},
{n:"Ratan Lal",p:"Painter"},
{n:"Rakesh Kumar",p:"Painter"},
{n:"Chetan Kumar",p:"Painter"},
{n:"Wajid Khan",p:"Painter"},
{n:"Mohammad Arif",p:"Painter"},
{n:"Sajid",p:"Painter"},
{n:"Fariyad Khan",p:"Painter"},
{n:"Sayad",p:"Painter"}
];

// ALL 19 PAKISTANI WORKERS
const PAK=[
{n:"Asad Raza",p:"Worker"},
{n:"Muhammad Ramzan",p:"Worker"},
{n:"Muhammad Rizwan",p:"Worker"},
{n:"Sharafat Hussain",p:"Worker"},
{n:"Ali Raza",p:"Worker"},
{n:"Muhammad Amjad",p:"Worker"},
{n:"Sher Bahadur",p:"Worker"},
{n:"Muhammad Arshad",p:"Worker"},
{n:"Taimoor Ahmad",p:"Worker"},
{n:"Muhammad Imtiaz",p:"Worker"},
{n:"Kashif Hussain",p:"Worker"},
{n:"Muhammad Saleem",p:"Worker"},
{n:"Mudasir Hussain",p:"Worker"},
{n:"Sami Ullah",p:"Worker"},
{n:"Muhammad Parvaiz",p:"Worker"},
{n:"Muhammad Awais",p:"Worker"},
{n:"Muhammad Naeem",p:"Worker"},
{n:"Muhammad Faheem",p:"Worker"},
{n:"Muhammad Mansoor",p:"Worker"}
];

let WC=[],AC=[],ADC=null,LOGO_BASE64=null;

function speakWelcome(name){
  if(!('speechSynthesis' in window))return;
  try{
    const msg=new SpeechSynthesisUtterance('Welcome '+name);
    msg.rate=0.9;msg.pitch=1;msg.volume=0.8;msg.lang='en-US';
    speechSynthesis.speak(msg);
  }catch(e){}
}

function loadLogoBase64(){
  const img=new Image();img.crossOrigin='anonymous';
  img.onload=function(){
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
    c.getContext('2d').drawImage(img,0,0);
    try{LOGO_BASE64=c.toDataURL('image/png');}catch(e){}
  };
  img.onerror=function(){
    const c=document.createElement('canvas');c.width=200;c.height=200;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#1e40af';ctx.fillRect(0,0,200,200);
    ctx.fillStyle='#fff';ctx.font='bold 120px Arial';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('A',100,105);
    LOGO_BASE64=c.toDataURL('image/png');
  };
  img.src='logo.png';
}

async function initDB(){
  console.log('🔥 Initializing 56 workers...');
  loadLogoBase64();
  if('speechSynthesis' in window)speechSynthesis.getVoices();
  
  const ew=await FB.getAll(COL.W);
  console.log('Existing workers:',ew.length);
  
  if(ew.length<56){
    for(const w of ew)await FB.del(COL.W,w.wid||w.id);
    toast('Setting up 56 workers...','info');
    for(let i=0;i<IND.length;i++){
      const w=IND[i],id='IND'+String(i+1).padStart(4,'0');
      await FB.save(COL.W,id,{wid:id,name:w.n,prof:w.p,sec:'Indian',shift:'Day',pw:DEFAULT_PW,on:true});
    }
    for(let i=0;i<PAK.length;i++){
      const w=PAK[i],id='PAK'+String(i+1).padStart(4,'0');
      await FB.save(COL.W,id,{wid:id,name:w.n,prof:w.p,sec:'Pakistani',shift:'Day',pw:DEFAULT_PW,on:true});
    }
    toast('✅ 56 workers created!');
  }
  
  const ad=await FB.get(COL.AD,'main');
  if(!ad)await FB.save(COL.AD,'main',{adminId:'ADMIN001',pw:'Admin@2026',name:'Administrator'});
  
  FB.listen(COL.W,d=>{
    WC=d;fillDD();popReportDD();
    if(typeof populateManualWorkerDD==='function')populateManualWorkerDD();
    if(typeof populateManualCustomDD==='function')populateManualCustomDD();
    if(typeof populateHistoryWorkerDD==='function')populateHistoryWorkerDD();
    const u=gU();
    if(u&&u.role==='admin'){
      loadStats();
      if($('sec-workers')?.classList.contains('active'))loadWorkerTable();
      if($('sec-manual')?.classList.contains('active')&&typeof loadManualToday==='function')loadManualToday();
    }
  });
  FB.listen(COL.A,d=>{
    AC=d;const u=gU();
    if(u&&u.role==='worker'){upWS();loadWH();loadWQS();}
    if(u&&u.role==='admin'){
      loadStats();const a=document.querySelector('.sec.active');
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
  FB.listen(COL.AD,d=>{if(d.length)ADC=d[0];});
  
  setTimeout(()=>{const l=$('loadingScreen');if(l)l.style.display='none';},2000);
}

const $=id=>document.getElementById(id);
const gW=()=>WC;const gA=()=>AC;
const gAD=()=>ADC||{adminId:'ADMIN001',pw:'Admin@2026',name:'Administrator'};
const gU=()=>JSON.parse(localStorage.getItem(K.U));
const sU=d=>localStorage.setItem(K.U,JSON.stringify(d));
const cU=()=>localStorage.removeItem(K.U);
const tT=()=>new Date().toLocaleString('en-US',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
const tD=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
const tDF=()=>new Date().toLocaleDateString('en-US',{timeZone:'Europe/Istanbul',weekday:'long',year:'numeric',month:'long',day:'numeric'});
function fT(iso){if(!iso)return'-';return new Date(iso).toLocaleString('en-US',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});}
function greet(){const h=parseInt(new Date().toLocaleString('en-US',{timeZone:'Europe/Istanbul',hour:'numeric',hour12:false}));return h<12?'Good Morning ☀️':h<17?'Good Afternoon 🌤️':'Good Evening 🌙';}
function toast(m,t='ok'){const e=$('toast');if(!e)return;e.textContent=m;e.className='toast show '+t;setTimeout(()=>e.classList.remove('show'),3500);}
function togglePw(id,b){const e=$(id);e.type=e.type==='password'?'text':'password';b.textContent=e.type==='password'?'👁':'🙈';}
function openModal(id){$(id).classList.add('open');}
function closeModal(id){$(id).classList.remove('open');}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');}
function confirmDlg(t,m,cb){$('mcTitle').textContent=t;$('mcMsg').textContent=m;const y=$('mcYes'),n=y.cloneNode(true);y.parentNode.replaceChild(n,y);n.onclick=()=>{closeModal('mConfirm');cb();};openModal('mConfirm');}
function st(id,v){const e=$(id);if(e)e.textContent=v;}
function setDefaultManualDate(){const md=$('manualDate');if(md&&!md.value)md.value=tD();}

function calcHours(ci,co){
  const hrs=(new Date(co)-new Date(ci))/36e5;
  const total=Math.round(hrs*100)/100;
  const regular=Math.round(Math.min(hrs,REG_HOURS)*100)/100;
  const compOT=Math.round(Math.min(Math.max(hrs-REG_HOURS,0),COMP_OT)*100)/100;
  const extraOT=Math.max(0,Math.round((hrs-REG_HOURS-COMP_OT)*100)/100);
  return{total,regular,compOT,extraOT,ot:Math.round((compOT+extraOT)*100)/100};
}

function switchLogin(t,b){document.querySelectorAll('.ltabs .ltab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.lform').forEach(f=>f.classList.remove('active'));$(t+'LoginForm').classList.add('active');$('loginErr').classList.remove('show');}
function showErr(m){const e=$('loginErr');e.textContent='⚠️ '+m;e.classList.add('show');}

function fillDD(){
  const w=gW().filter(x=>x.on).sort((a,b)=>a.name.localeCompare(b.name));
  const ind=w.filter(x=>x.sec==='Indian');
  const pak=w.filter(x=>x.sec==='Pakistani');
  let h='<option value="">— Choose your name —</option>';
  if(ind.length){h+='<optgroup label="🇮🇳 Indian Workers">';ind.forEach(x=>h+=`<option value="${x.wid}">${x.name} (${x.prof})</option>`);h+='</optgroup>';}
  if(pak.length){h+='<optgroup label="🇵🇰 Pakistani Workers">';pak.forEach(x=>h+=`<option value="${x.wid}">${x.name}</option>`);h+='</optgroup>';}
  const s=$('workerSelect');if(s)s.innerHTML=h;
}

async function workerLogin(e){
  e.preventDefault();
  const id=$('workerSelect').value;
  const pw=$('workerPw').value;
  const shift=$('workerShift').value;
  if(!id)return showErr('Select your name');
  if(!shift)return showErr('Select your shift (Day/Night)');
  const w=gW().find(x=>x.wid===id);
  if(!w)return showErr('Not found');
  if(!w.on)return showErr('Deactivated');
  if(w.pw!==pw)return showErr('Wrong password');
  
  if(w.shift!==shift){
    await FB.save(COL.W,w.wid,{...w,shift:shift});
  }
  
  sU({...w,id:w.wid,shift:shift,role:'worker'});
  toast('Welcome '+w.name+'! ('+shift+' Shift)');
  loadWD();
  return false;
}

function adminLogin(e){
  e.preventDefault();const id=$('adminId').value.trim(),pw=$('adminPw').value;
  if(!id||!pw)return showErr('Enter ID & password');
  const ad=gAD();if(ad.adminId!==id||ad.pw!==pw)return showErr('Invalid credentials');
  sU({...ad,id:ad.adminId,role:'admin'});
  speakWelcome(ad.name||'Admin');
  toast('Welcome, '+ad.name+'!');
  loadAD();return false;
}

function logout(){confirmDlg('Logout?','Sure?',()=>{cU();showPage('loginPage');$('workerSelect').value='';$('workerPw').value='';if($('workerShift'))$('workerShift').value='';$('adminId').value='';$('adminPw').value='';$('loginErr').classList.remove('show');});}

function loadWD(){const u=gU();$('wGreet').textContent=greet();$('wName').textContent=u.name;$('wInfo').textContent=`${u.prof} • ${u.sec} • ${u.shift||'Day'} Shift`;$('wNavName').textContent=u.name;$('wAvatar').textContent=u.name.charAt(0);$('wDate').textContent=tDF();showPage('workerPage');upWS();loadWH();loadWQS();}

async function doCheckIn(){
  const u=gU(),today=tD(),ex=gA().find(a=>a.wid===u.id&&a.date===today);
  if(ex){if(ex.status==='pending_checkin')return toast('Already pending!','err');if(ex.status==='checked_in'||ex.status==='pending_checkout')return toast('Already checked in!','err');if(ex.status==='completed')return toast('Already done','err');}
  confirmDlg('Check In?','Start work day?',async()=>{
    const now=new Date().toISOString(),rid='att_'+Date.now()+'_'+u.id;
    await FB.save(COL.A,rid,{recId:rid,wid:u.id,name:u.name,prof:u.prof,sec:u.sec,shift:u.shift||'Day',date:today,checkinReqTime:now,checkinTime:null,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'pending_checkin'});
    toast('✅ Check-in request sent!');
  });
}

async function doCheckOut(){
  const u=gU(),today=tD(),rec=gA().find(a=>a.wid===u.id&&a.date===today);
  if(!rec)return toast('Check-in first!','err');if(rec.status==='pending_checkin')return toast('Wait for approval','err');if(rec.status==='completed')return toast('Already done','err');if(rec.status==='pending_checkout')return toast('Already pending!','err');if(rec.status!=='checked_in')return toast('Cannot','err');
  confirmDlg('Check Out?','End work day?',async()=>{
    const now=new Date().toISOString();
    await FB.save(COL.A,rec.id,{...rec,checkoutReqTime:now,status:'pending_checkout'});
    toast('✅ Check-out request sent!');
  });
}

function upWS(){
  const u=gU();if(!u||u.role!=='worker')return;
  const today=tD(),rec=gA().find(a=>a.wid===u.id&&a.date===today);
  const bI=$('btnCheckin'),bO=$('btnCheckout'),st2=$('wacStatus'),ic=$('wsIcon'),tx=$('wsText'),sb=$('wsSub'),tm=$('wsTimes');
  if(!bI)return;tm.innerHTML='';
  if(!rec){bI.disabled=false;bO.disabled=true;st2.className='wac-status';st2.innerHTML='<span>📋</span> Ready. Click CHECK IN.';ic.textContent='📋';tx.textContent='Not Started';sb.textContent='Waiting';return;}
  if(rec.checkinReqTime)tm.innerHTML+=`<div class="wsc-time-item"><small>Requested</small><b style="color:#f59e0b">${fT(rec.checkinReqTime)}</b></div>`;
  if(rec.checkinTime)tm.innerHTML+=`<div class="wsc-time-item"><small>Check-in</small><b style="color:#059669">${fT(rec.checkinTime)}</b></div>`;
  if(rec.checkoutReqTime)tm.innerHTML+=`<div class="wsc-time-item"><small>Out Req</small><b style="color:#f59e0b">${fT(rec.checkoutReqTime)}</b></div>`;
  if(rec.checkoutTime)tm.innerHTML+=`<div class="wsc-time-item"><small>Check-out</small><b style="color:#dc2626">${fT(rec.checkoutTime)}</b></div>`;
  if(rec.total>0)tm.innerHTML+=`<div class="wsc-time-item"><small>Total</small><b style="color:#1e40af">${rec.total.toFixed(2)}h</b></div>`;
  if(rec.ot>0)tm.innerHTML+=`<div class="wsc-time-item"><small>OT</small><b style="color:#d97706">${rec.ot.toFixed(2)}h</b></div>`;
  const states={pending_checkin:['⏳','Check-in Pending','Waiting for admin',true,true,'pending'],checked_in:['🟢','Working','Since '+fT(rec.checkinTime),true,false,'active'],pending_checkout:['⏳','Check-out Pending','Waiting for admin',true,true,'pending'],completed:['🎉','Completed','Total: '+rec.total.toFixed(2)+'h | OT: '+rec.ot.toFixed(2)+'h',true,true,'done']};
  const s=states[rec.status];if(!s)return;
  ic.textContent=s[0];tx.textContent=s[1];sb.textContent=s[2];bI.disabled=s[3];bO.disabled=s[4];st2.className='wac-status '+s[5];st2.innerHTML='<span>'+s[0]+'</span> '+s[2];
}

function loadWQS(){const u=gU();if(!u)return;const my=gA().filter(a=>a.wid===u.id&&a.status==='completed');st('wTotalDays',my.length);st('wTotalHrs',my.reduce((s,a)=>s+(a.total||0),0).toFixed(1)+'h');st('wTotalOT',my.reduce((s,a)=>s+(a.ot||0),0).toFixed(1)+'h');}

function loadWH(){
  const u=gU();if(!u)return;const h=gA().filter(a=>a.wid===u.id&&a.status==='completed').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15);
  st('wHistCount',h.length+' records');const el=$('wHistory');if(!el)return;
  if(!h.length){el.innerHTML='<div class="empty"><div class="em-icon">📭</div><h3>No History</h3></div>';return;}
  el.innerHTML=h.map(r=>`<div class="hist-item"><b>${r.date}</b><span style="color:#059669">🔓 ${fT(r.checkinTime)}</span><span style="color:#dc2626">🔒 ${fT(r.checkoutTime)}</span><b style="color:#1e40af">${r.total.toFixed(2)}h</b>${r.ot>0?`<span class="tag tag-o">OT ${r.ot.toFixed(2)}h</span>`:'<span></span>'}</div>`).join('');
}

async function changeWorkerPw(e){
  e.preventDefault();const old=$('cwOld').value,nw=$('cwNew').value,cf=$('cwConf').value;
  if(nw!==cf)return toast('Mismatch','err');if(nw.length<4)return toast('Min 4','err');
  const u=gU(),w=gW().find(x=>x.wid===u.id);if(w.pw!==old)return toast('Wrong','err');
  await FB.save(COL.W,u.id,{...w,pw:nw});sU({...u,pw:nw});$('cwOld').value='';$('cwNew').value='';$('cwConf').value='';toast('✅ Updated!');return false;
}

function loadAD(){
  const u=gU();$('aNavName').textContent=u.name;showPage('adminPage');
  $('fDate').value=tD();$('expStart').value=tD();$('expEnd').value=tD();
  $('setCurId').value=u.id;$('reportMonth').value=tD().substring(0,7);
  popReportDD();loadStats();
}

function goSection(s,b){
  document.querySelectorAll('.side-btn').forEach(x=>x.classList.remove('active'));
  if(b)b.classList.add('active');
  document.querySelectorAll('.sec').forEach(x=>x.classList.remove('active'));
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
  if(s==='history'){if(typeof loadHistorySection==='function')loadHistorySection();}
}

function loadStats(){
  const ws=gW().filter(w=>w.on),today=tD(),att=gA().filter(a=>a.date===today);
  const present=att.filter(a=>['checked_in','completed','pending_checkout'].includes(a.status)).length;
  const pend=att.filter(a=>['pending_checkin','pending_checkout'].includes(a.status)).length;
  const dayAtt=att.filter(a=>a.shift==='Day'||!a.shift);
  const nightAtt=att.filter(a=>a.shift==='Night');
  const dayP=dayAtt.filter(a=>['checked_in','completed','pending_checkout'].includes(a.status)).length;
  const nightP=nightAtt.filter(a=>['checked_in','completed','pending_checkout'].includes(a.status)).length;
  const dayPe=dayAtt.filter(a=>['pending_checkin','pending_checkout'].includes(a.status)).length;
  const nightPe=nightAtt.filter(a=>['pending_checkin','pending_checkout'].includes(a.status)).length;

  st('sTotalW',ws.length);st('sPresent',present);st('sAbsent',ws.length-present);st('sPending',pend);st('dashDate',tDF());
  st('dIndT',dayAtt.length);st('dIndP',dayP);st('dIndA',0);st('dIndPend',dayPe);
  st('dPakT',nightAtt.length);st('dPakP',nightP);st('dPakA',0);st('dPakPend',nightPe);
  const iP=dayAtt.length?Math.round(dayP/dayAtt.length*100):0,pP=nightAtt.length?Math.round(nightP/nightAtt.length*100):0;
  const iB=$('dIndBar'),pB=$('dPakBar');if(iB)iB.style.width=iP+'%';if(pB)pB.style.width=pP+'%';
  st('dIndPct',iP+'%');st('dPakPct',pP+'%');
  const b=$('sBadge');if(b){if(pend>0){b.textContent=pend;b.classList.add('show');}else b.classList.remove('show');}
  loadAbsentToday();
}

// ⭐ NEW: Absent Workers Today
function loadAbsentToday(){
  const today=tD();
  const att=gA().filter(a=>a.date===today);
  const allWorkers=gW().filter(w=>w.on);
  const attWids=att.map(a=>a.wid);
  const absentWorkers=allWorkers.filter(w=>!attWids.includes(w.wid));
  
  const el=$('absentWorkersToday');
  const cntEl=$('absentCountToday');
  if(cntEl)cntEl.textContent=absentWorkers.length+' Absent';
  if(!el)return;
  
  if(!absentWorkers.length){
    el.innerHTML='<div class="empty" style="padding:30px"><div class="em-icon">✅</div><h3>Great! All workers are present today!</h3></div>';
    return;
  }
  
  el.innerHTML=`<div class="t-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Default Shift</th></tr></thead><tbody>${absentWorkers.map((w,i)=>`<tr><td>${i+1}</td><td><b>${w.name}</b></td><td>${w.prof||'-'}</td><td><span class="tag tag-${w.sec==='Indian'?'ind':'pak'}">${w.sec==='Indian'?'🇮🇳':'🇵🇰'} ${w.sec}</span></td><td><span class="tag ${w.shift==='Night'?'tag-o':'tag-b'}">${w.shift==='Night'?'🌙 Night':'☀️ Day'}</span></td></tr>`).join('')}</tbody></table></div>`;
}

function loadAppr(){
  const pend=gA().filter(a=>['pending_checkin','pending_checkout'].includes(a.status));
  const el=$('approveList');if(!el)return;
  if(!pend.length){el.innerHTML='<div class="empty"><div class="em-icon">✅</div><h3>All Clear!</h3></div>';}
  else{el.innerHTML=pend.map(p=>{const ic=p.status==='pending_checkin';return`<div class="appr-item"><div class="appr-info"><h4>${p.name} <span class="tag ${p.shift==='Night'?'tag-o':'tag-b'}">${p.shift==='Night'?'🌙 Night':'☀️ Day'}</span> <span class="tag tag-${p.sec==='Indian'?'ind':'pak'}">${p.sec==='Indian'?'🇮🇳':'🇵🇰'}</span> <span class="tag ${ic?'tag-g':'tag-r'}">${ic?'🔓 IN':'🔒 OUT'}</span></h4><p>${p.prof||'-'} • ${p.wid} • ${fT(ic?p.checkinReqTime:p.checkoutReqTime)}</p>${!ic&&p.checkinTime?`<p>In: ${fT(p.checkinTime)}</p>`:''}</div><div class="appr-btns"><button class="btn btn-success btn-sm" onclick="doApprove('${p.id}')">✅</button><button class="btn btn-danger btn-sm" onclick="doReject('${p.id}')">❌</button></div></div>`;}).join('');}
  loadRecentAppr();
}

function loadRecentAppr(){
  const today=tD(),rec=gA().filter(a=>a.date===today&&(a.status==='checked_in'||a.status==='completed'));
  const el=$('recentApproved');if(!el)return;
  if(!rec.length){el.innerHTML='<div class="empty" style="padding:30px"><h3>No recent</h3></div>';return;}
  el.innerHTML=rec.map(p=>`<div class="appr-item" style="border-left-color:${p.status==='completed'?'var(--g)':'var(--pl)'}"><div class="appr-info"><h4>${p.name} <span class="tag ${p.shift==='Night'?'tag-o':'tag-b'}">${p.shift==='Night'?'🌙':'☀️'}</span> <span class="tag ${p.status==='checked_in'?'tag-b':'tag-g'}">${p.status==='checked_in'?'🟢':'✅'}</span></h4><p>In: ${fT(p.checkinTime)} ${p.checkoutTime?'| Out: '+fT(p.checkoutTime):''} ${p.total?'| '+p.total.toFixed(2)+'h':''}</p></div><div class="appr-btns">${p.status==='completed'?`<button class="btn btn-outline btn-sm" onclick="undoCO('${p.id}')">↩️</button>`:''}<button class="btn btn-danger btn-sm" onclick="undoCI('${p.id}')">🗑️</button></div></div>`).join('');
}

async function undoCO(id){confirmDlg('Undo?','Revert?',async()=>{const r=gA().find(a=>a.id===id);if(!r)return;await FB.save(COL.A,id,{...r,checkoutTime:null,checkoutReqTime:null,total:0,regular:0,compOT:0,extraOT:0,ot:0,status:'checked_in'});toast('↩️ Undone','info');});}
async function undoCI(id){const r=gA().find(a=>a.id===id);confirmDlg('Remove?',`Delete ${r?.name}?`,async()=>{await FB.del(COL.A,id);toast('🗑️ Removed','info');});}

async function doApprove(id){
  const r=gA().find(a=>a.id===id);if(!r)return;const u={...r};
  if(r.status==='pending_checkin'){u.checkinTime=r.checkinReqTime;u.status='checked_in';toast('✅ '+r.name+' In');}
  else if(r.status==='pending_checkout'){u.checkoutTime=r.checkoutReqTime;const c=calcHours(u.checkinTime,u.checkoutTime);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';toast('✅ '+u.total.toFixed(2)+'h');}
  await FB.save(COL.A,id,u);
}

function doReject(id){confirmDlg('Reject?','Sure?',async()=>{const r=gA().find(a=>a.id===id);if(r.status==='pending_checkin')await FB.del(COL.A,id);else await FB.save(COL.A,id,{...r,checkoutReqTime:null,status:'checked_in'});toast('Rejected','info');});}

function approveAll(){const p=gA().filter(a=>['pending_checkin','pending_checkout'].includes(a.status));if(!p.length)return toast('None','info');confirmDlg('Approve All?',p.length+'?',async()=>{for(const r of p){const u={...r};if(r.status==='pending_checkin'){u.checkinTime=r.checkinReqTime;u.status='checked_in';}else{u.checkoutTime=r.checkoutReqTime;const c=calcHours(u.checkinTime,u.checkoutTime);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';}await FB.save(COL.A,r.id,u);}toast('✅ All!');});}

function loadED(){
  const today=tD(),w=gA().filter(a=>a.date===today&&(a.status==='checked_in'||a.status==='pending_checkout'));
  st('edWorkingCount',w.length);const el=$('edWorkingList');if(!el)return;
  if(!w.length){el.innerHTML='<div class="empty"><div class="em-icon">✅</div><h3>All Clear!</h3></div>';return;}
  el.innerHTML=w.map(x=>`<div class="ed-worker-item"><div class="ed-info"><h4>${x.name} ${x.shift==='Night'?'🌙':'☀️'}</h4><p>${x.prof||'-'} • ${x.sec}</p></div><div class="ed-time">🟢 ${fT(x.checkinTime)}</div></div>`).join('');
}

function endDayForAll(){
  const today=tD(),w=gA().filter(a=>a.date===today&&(a.status==='checked_in'||a.status==='pending_checkout'));
  if(!w.length)return toast('None','info');const ti=$('edLogoutTime').value;if(!ti)return toast('Set time','err');
  confirmDlg('End Day?',w.length+' at '+ti+'?',async()=>{const[h,m]=ti.split(':');for(const r of w){const cd=new Date();cd.setHours(parseInt(h),parseInt(m),0,0);const u={...r};u.checkoutTime=cd.toISOString();u.checkoutReqTime=u.checkoutReqTime||u.checkoutTime;const c=calcHours(u.checkinTime,u.checkoutTime);u.total=c.total;u.regular=c.regular;u.compOT=c.compOT;u.extraOT=c.extraOT;u.ot=c.ot;u.status='completed';await FB.save(COL.A,r.id,u);}toast('✅ Done '+w.length+'!');});
}

function loadLive(){
  const today=tD(),att=gA().filter(a=>a.date===today),w=att.filter(a=>a.status==='checked_in'),d=att.filter(a=>a.status==='completed');
  st('liveCount',w.length);st('doneCount',d.length);
  const lE=$('liveList'),dE=$('doneList');
  if(lE){if(!w.length)lE.innerHTML='<div class="empty"><div class="em-icon">💤</div><h3>No one</h3></div>';else lE.innerHTML=w.map(x=>`<div class="live-item"><div class="li-info"><h4>${x.name} <span class="tag ${x.shift==='Night'?'tag-o':'tag-b'}">${x.shift==='Night'?'🌙':'☀️'}</span> <span class="tag tag-${x.sec==='Indian'?'ind':'pak'}">${x.sec==='Indian'?'🇮🇳':'🇵🇰'}</span></h4><p>${x.prof||'-'}</p></div><div class="li-time">🟢 ${fT(x.checkinTime)}</div></div>`).join('');}
  if(dE){if(!d.length)dE.innerHTML='<div class="empty"><div class="em-icon">📋</div><h3>None</h3></div>';else dE.innerHTML=d.map(x=>`<div class="live-item"><div class="li-info"><h4>${x.name} ${x.shift==='Night'?'🌙':'☀️'}</h4><p>${x.total.toFixed(2)}h | OT: ${x.ot.toFixed(2)}h</p></div><div class="li-time">✅ ${fT(x.checkoutTime)}</div></div>`).join('');}
}

// ⭐ UPDATED: Attendance with Absent Workers
function loadAttend(){
  const date=$('fDate').value,sec=$('fSec').value;
  let att=gA().filter(a=>a.date===date);
  const allWorkers=gW().filter(w=>w.on);
  const el=$('attendTable');if(!el)return;
  
  // Handle "Absent" filter separately
  if(sec==='Absent'){
    const attWids=att.map(a=>a.wid);
    const absentWorkers=allWorkers.filter(w=>!attWids.includes(w.wid));
    if(!absentWorkers.length){el.innerHTML='<div class="empty"><div class="em-icon">✅</div><h3>All workers were present on '+date+'!</h3></div>';return;}
    el.innerHTML=`<div style="background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:20px;border-radius:12px;margin-bottom:20px"><h3>❌ Absent Workers on ${date}</h3><p style="opacity:.9">Total Absent: ${absentWorkers.length} / ${allWorkers.length}</p></div><div class="t-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Default Shift</th></tr></thead><tbody>${absentWorkers.map((w,i)=>`<tr><td>${i+1}</td><td><b>${w.name}</b></td><td>${w.prof||'-'}</td><td><span class="tag tag-${w.sec==='Indian'?'ind':'pak'}">${w.sec==='Indian'?'🇮🇳':'🇵🇰'} ${w.sec}</span></td><td><span class="tag ${w.shift==='Night'?'tag-o':'tag-b'}">${w.shift==='Night'?'🌙 Night':'☀️ Day'}</span></td></tr>`).join('')}</tbody></table></div>`;
    return;
  }
  
  // Apply filters
  if(sec==='Day')att=att.filter(a=>a.shift==='Day'||!a.shift);
  else if(sec==='Night')att=att.filter(a=>a.shift==='Night');
  else if(sec==='Indian')att=att.filter(a=>a.sec==='Indian');
  else if(sec==='Pakistani')att=att.filter(a=>a.sec==='Pakistani');
  else if(sec==='Present')att=att.filter(a=>a.status==='completed'||a.status==='checked_in');
  
  const stg=s=>({completed:'<span class="tag tag-g">✓</span>',checked_in:'<span class="tag tag-b">🟢</span>',pending_checkin:'<span class="tag tag-o">⏳In</span>',pending_checkout:'<span class="tag tag-o">⏳Out</span>'}[s]||s);
  
  // Get absent workers
  const attWids=att.map(a=>a.wid);
  let absentWorkers=allWorkers.filter(w=>!attWids.includes(w.wid));
  if(sec==='Indian')absentWorkers=absentWorkers.filter(w=>w.sec==='Indian');
  else if(sec==='Pakistani')absentWorkers=absentWorkers.filter(w=>w.sec==='Pakistani');
  else if(sec==='Day')absentWorkers=absentWorkers.filter(w=>w.shift==='Day'||!w.shift);
  else if(sec==='Night')absentWorkers=absentWorkers.filter(w=>w.shift==='Night');
  else if(sec==='Present')absentWorkers=[];
  
  let html='';
  
  if(att.length){
    html+=`<div style="background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:16px 20px;border-radius:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><h3 style="font-size:16px;margin:0">✅ Present Workers (${att.length})</h3><p style="opacity:.9;font-size:12px;margin-top:4px">${date}</p></div></div>`;
    html+=`<div class="t-wrap" style="margin-bottom:24px"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th><th>St</th><th>Act</th></tr></thead><tbody>${att.map((a,i)=>`<tr><td>${i+1}</td><td><b>${a.name}</b>${a.backdated?' <span class="tag tag-o" style="font-size:9px">📝</span>':''}</td><td>${a.prof||'-'}</td><td><span class="tag tag-${a.sec==='Indian'?'ind':'pak'}">${a.sec==='Indian'?'🇮🇳':'🇵🇰'}</span></td><td><span class="tag ${a.shift==='Night'?'tag-o':'tag-b'}">${a.shift==='Night'?'🌙':'☀️'}</span></td><td style="color:#059669">${fT(a.checkinTime)}</td><td style="color:#dc2626">${fT(a.checkoutTime)}</td><td style="color:var(--p);font-weight:700">${(a.total||0).toFixed(2)}h</td><td>${(a.regular||0).toFixed(2)}h</td><td style="color:#d97706">${(a.compOT||0).toFixed(2)}h</td><td style="color:#dc2626;font-weight:700">${(a.extraOT||0)>0?(a.extraOT).toFixed(2)+'h':'-'}</td><td>${stg(a.status)}</td><td><button class="btn btn-danger btn-sm" onclick="undoCI('${a.id}')">🗑️</button></td></tr>`).join('')}</tbody></table></div>`;
  }
  
  if(absentWorkers.length&&sec!=='Present'){
    html+=`<div style="background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:16px 20px;border-radius:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><h3 style="font-size:16px;margin:0">❌ Absent Workers (${absentWorkers.length})</h3><p style="opacity:.9;font-size:12px;margin-top:4px">Not marked for ${date}</p></div></div>`;
    html+=`<div class="t-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Default Shift</th><th>Action</th></tr></thead><tbody>${absentWorkers.map((w,i)=>`<tr><td>${i+1}</td><td><b>${w.name}</b></td><td>${w.prof||'-'}</td><td><span class="tag tag-${w.sec==='Indian'?'ind':'pak'}">${w.sec==='Indian'?'🇮🇳':'🇵🇰'}</span></td><td><span class="tag ${w.shift==='Night'?'tag-o':'tag-b'}">${w.shift==='Night'?'🌙 Night':'☀️ Day'}</span></td><td><span class="tag tag-r">❌ Absent</span></td></tr>`).join('')}</tbody></table></div>`;
  }
  
  if(!att.length&&!absentWorkers.length){
    html='<div class="empty"><div class="em-icon">📋</div><h3>No Records for '+date+'</h3></div>';
  }
  
  el.innerHTML=html;
}

let curTab='Indian',editId=null;
function swWorkerTab(s,b){curTab=s;document.querySelectorAll('#sec-workers .ltab').forEach(x=>x.classList.remove('active'));b.classList.add('active');loadWorkerTable();}

function loadWorkerTable(){
  const q=($('wSearch')?.value||'').toLowerCase();
  let ws;
  if(curTab==='Indian')ws=gW().filter(w=>w.sec==='Indian');
  else if(curTab==='Pakistani')ws=gW().filter(w=>w.sec==='Pakistani');
  else ws=gW();
  ws=ws.sort((a,b)=>a.name.localeCompare(b.name));
  
  st('indCount','('+gW().filter(w=>w.on&&w.sec==='Indian').length+')');
  st('pakCount','('+gW().filter(w=>w.on&&w.sec==='Pakistani').length+')');
  
  if(q)ws=ws.filter(w=>w.name.toLowerCase().includes(q)||w.wid.toLowerCase().includes(q)||(w.prof||'').toLowerCase().includes(q));
  const el=$('workerTable');if(!el)return;
  if(!ws.length){el.innerHTML='<div class="empty"><div class="em-icon">👷</div><h3>No Workers</h3></div>';return;}
  el.innerHTML=`<div class="t-wrap"><table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Work</th><th>Country</th><th>Default Shift</th><th>PW</th><th>Status</th><th>Actions</th></tr></thead><tbody>${ws.map((w,i)=>`<tr style="${w.on?'':'opacity:.5'}"><td>${i+1}</td><td><code>${w.wid}</code></td><td><b>${w.name}</b></td><td>${w.prof||'-'}</td><td><span class="tag tag-${w.sec==='Indian'?'ind':'pak'}">${w.sec==='Indian'?'🇮🇳':'🇵🇰'}</span></td><td><button class="btn btn-outline btn-sm" onclick="toggleShift('${w.wid}')"><span class="tag ${w.shift==='Night'?'tag-o':'tag-b'}">${w.shift==='Night'?'🌙 Night':'☀️ Day'}</span></button></td><td><code id="p-${w.wid}">••••</code> <button class="btn btn-outline btn-sm" onclick="showPw('${w.wid}')" style="padding:2px 6px">👁</button></td><td>${w.on?'<span class="tag tag-g">On</span>':'<span class="tag tag-r">Off</span>'}</td><td style="white-space:nowrap"><button class="btn btn-outline btn-sm" onclick="editW('${w.wid}')">✏️</button><button class="btn btn-outline btn-sm" onclick="resetPw('${w.wid}')">🔑</button><button class="btn btn-${w.on?'danger':'success'} btn-sm" onclick="toggleW('${w.wid}')">${w.on?'🚫':'✅'}</button><button class="btn btn-danger btn-sm" onclick="delW('${w.wid}')">🗑️</button></td></tr>`).join('')}</tbody></table></div>`;
}

async function toggleShift(id){
  const w=gW().find(x=>x.wid===id);
  const newShift=(w.shift==='Night')?'Day':'Night';
  await FB.save(COL.W,id,{...w,shift:newShift});
  toast(`${w.name} → ${newShift} Shift`,'info');
}

function showPw(id){const w=gW().find(x=>x.wid===id),el=$('p-'+id);if(el.textContent==='••••'){el.textContent=w.pw;setTimeout(()=>el.textContent='••••',4000);}}
function resetPw(id){confirmDlg('Reset?','Reset to '+DEFAULT_PW,async()=>{const w=gW().find(x=>x.wid===id);await FB.save(COL.W,id,{...w,pw:DEFAULT_PW});$('mPwBody').innerHTML=`<div class="pw-show"><div class="pw-lbl">Reset</div><div class="pw-name">${w.name}</div><div class="pw-val">${DEFAULT_PW}</div></div>`;openModal('mPw');});}
function openAddWorker(){editId=null;$('mwTitle').textContent='➕ Add';$('mwName').value='';$('mwProf').value='';$('mwSec').value='Indian';$('mwShift').value='Day';$('mwPw').value=DEFAULT_PW;openModal('mWorker');}
function editW(id){const w=gW().find(x=>x.wid===id);editId=id;$('mwTitle').textContent='✏️ Edit';$('mwName').value=w.name;$('mwProf').value=w.prof||'';$('mwSec').value=w.sec||'Indian';$('mwShift').value=w.shift||'Day';$('mwPw').value=w.pw;openModal('mWorker');}

async function saveWorkerForm(e){
  e.preventDefault();const name=$('mwName').value.trim(),prof=$('mwProf').value||'Worker',sec=$('mwSec').value,shift=$('mwShift').value,pw=$('mwPw').value.trim();
  if(!name||!pw)return toast('Fill all','err');
  if(editId){const w=gW().find(x=>x.wid===editId);await FB.save(COL.W,editId,{...w,name,prof,sec,shift,pw});toast('✅ Updated!');}
  else{const pre=sec==='Indian'?'IND':'PAK';const nums=gW().filter(w=>w.wid.startsWith(pre)).map(w=>parseInt(w.wid.replace(pre,''))).filter(n=>!isNaN(n));const next=nums.length?Math.max(...nums)+1:1;const wid=pre+String(next).padStart(4,'0');await FB.save(COL.W,wid,{wid,name,prof,sec,shift,pw,on:true});$('mPwBody').innerHTML=`<div class="pw-show"><div class="pw-lbl">✅ Added</div><div class="pw-name">${name} (${wid})</div><div class="pw-val">${pw}</div></div>`;openModal('mPw');toast('✅ '+wid);}
  closeModal('mWorker');return false;
}

async function toggleW(id){const w=gW().find(x=>x.wid===id);await FB.save(COL.W,id,{...w,on:!w.on});toast(w.on?'Off':'On','info');}
function delW(id){const w=gW().find(x=>x.wid===id);confirmDlg('Delete?',w.name+'?',async()=>{await FB.del(COL.W,id);for(const a of gA().filter(x=>x.wid===id))await FB.del(COL.A,a.id);toast('Deleted','info');});}

function popReportDD(){
  const s=$('reportWorker');if(!s)return;const cv=s.value;const w=gW().filter(x=>x.on).sort((a,b)=>a.name.localeCompare(b.name));
  let h='<option value="">— Select —</option><option value="__ALL__">📋 All Workers</option>';
  w.forEach(x=>h+=`<option value="${x.wid}">${x.name} — ${x.sec}</option>`);s.innerHTML=h;if(cv)s.value=cv;
}

function loadMR(){
  const wid=$('reportWorker')?.value,month=$('reportMonth')?.value,el=$('reportContent');if(!el)return;
  if(!wid||!month){el.innerHTML='<div class="empty"><div class="em-icon">📊</div><h3>Select worker & month</h3></div>';return;}
  if(wid==='__ALL__'){
    const ws=gW().filter(w=>w.on),att=gA().filter(a=>a.date.startsWith(month)&&a.status==='completed');
    el.innerHTML=`<div class="t-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Work</th><th>Country</th><th>Days</th><th>Day Shift</th><th>Night Shift</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th></tr></thead><tbody>${ws.map((w,i)=>{const m=att.filter(a=>a.wid===w.wid);const dayD=m.filter(a=>a.shift==='Day'||!a.shift).length;const nightD=m.filter(a=>a.shift==='Night').length;return`<tr><td>${i+1}</td><td><b>${w.name}</b></td><td>${w.prof||'-'}</td><td><span class="tag tag-${w.sec==='Indian'?'ind':'pak'}">${w.sec==='Indian'?'🇮🇳':'🇵🇰'}</span></td><td><b>${m.length}</b></td><td style="color:var(--p)">${dayD}</td><td style="color:var(--o)">${nightD}</td><td style="color:var(--p);font-weight:700">${m.reduce((s,a)=>s+(a.total||0),0).toFixed(2)}h</td><td>${m.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)}h</td><td style="color:#d97706">${m.reduce((s,a)=>s+(a.compOT||0),0).toFixed(2)}h</td><td style="color:#dc2626;font-weight:700">${m.reduce((s,a)=>s+(a.extraOT||0),0).toFixed(2)}h</td></tr>`;}).join('')}</tbody></table></div>`;
  }else{
    const w=gW().find(x=>x.wid===wid);if(!w)return;const att=gA().filter(a=>a.wid===wid&&a.date.startsWith(month)&&a.status==='completed').sort((a,b)=>a.date.localeCompare(b.date));
    const tH=att.reduce((s,a)=>s+(a.total||0),0),rH=att.reduce((s,a)=>s+(a.regular||0),0),cOT=att.reduce((s,a)=>s+(a.compOT||0),0),eOT=att.reduce((s,a)=>s+(a.extraOT||0),0);
    const dayD=att.filter(a=>a.shift==='Day'||!a.shift).length;const nightD=att.filter(a=>a.shift==='Night').length;
    el.innerHTML=`<div class="w-card" style="margin-bottom:20px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff"><h3 style="font-size:20px;font-weight:800;margin-bottom:6px">${w.name}</h3><p style="opacity:.9">${w.prof} • ${w.sec}</p><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px"><div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800">${att.length}</div><div style="font-size:10px;opacity:.9">Days</div></div><div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800">☀️${dayD}</div><div style="font-size:10px;opacity:.9">Day</div></div><div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800">🌙${nightD}</div><div style="font-size:10px;opacity:.9">Night</div></div><div style="background:rgba(255,255,255,.15);padding:12px;border-radius:10px;text-align:center"><div style="font-size:22px;font-weight:800">${tH.toFixed(1)}h</div><div style="font-size:10px;opacity:.9">Total</div></div></div></div>${att.length?`<div class="t-wrap"><table><thead><tr><th>#</th><th>Date</th><th>Shift</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th></tr></thead><tbody>${att.map((a,i)=>`<tr><td>${i+1}</td><td><b>${a.date}</b></td><td><span class="tag ${a.shift==='Night'?'tag-o':'tag-b'}">${a.shift==='Night'?'🌙':'☀️'}</span></td><td style="color:#059669">${fT(a.checkinTime)}</td><td style="color:#dc2626">${fT(a.checkoutTime)}</td><td style="color:var(--p);font-weight:700">${a.total.toFixed(2)}h</td><td>${a.regular.toFixed(2)}h</td><td style="color:#d97706">${(a.compOT||0).toFixed(2)}h</td><td style="color:#dc2626;font-weight:700">${(a.extraOT||0)>0?(a.extraOT).toFixed(2)+'h':'-'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty"><div class="em-icon">📭</div><h3>No records</h3></div>'}`;
  }
}

function addPDFHeader(doc,title,sub,w){
  doc.setFillColor(30,64,175);doc.rect(0,0,w,42,'F');
  if(LOGO_BASE64){try{doc.addImage(LOGO_BASE64,'PNG',10,6,30,30);}catch(e){}}
  doc.setTextColor(255);doc.setFontSize(22);doc.setFont('helvetica','bold');
  doc.text('AL BOWRY CARPENTRY',w/2,16,{align:'center'});
  doc.setFontSize(11);doc.setFont('helvetica','normal');doc.text(title,w/2,25,{align:'center'});
  doc.setFontSize(9);doc.text(sub,w/2,33,{align:'center'});
  doc.setFontSize(8);doc.text('Antalya, Turkey • albowry.com',w/2,39,{align:'center'});
  doc.setTextColor(0);
}

function downloadReportPDF(){
  const wid=$('reportWorker').value,month=$('reportMonth').value;if(!wid||!month)return toast('Select both','err');if(!window.jspdf)return toast('Loading...','err');
  const{jsPDF}=window.jspdf;const doc=new jsPDF();
  addPDFHeader(doc,'Monthly Report - '+month,'Reg: 9h + Comp OT: 3h | Shift: 8AM-8PM',210);
  let data=[],fn='';
  if(wid==='__ALL__'){fn=`All_${month}.pdf`;const ws=gW().filter(w=>w.on),att=gA().filter(a=>a.date.startsWith(month)&&a.status==='completed');data=ws.map((w,i)=>{const m=att.filter(a=>a.wid===w.wid);return[i+1,w.name,w.prof||'-',w.sec,m.length,m.filter(a=>a.shift==='Day'||!a.shift).length,m.filter(a=>a.shift==='Night').length,m.reduce((s,a)=>s+(a.total||0),0).toFixed(2)+'h',m.reduce((s,a)=>s+(a.compOT||0),0).toFixed(2)+'h',m.reduce((s,a)=>s+(a.extraOT||0),0).toFixed(2)+'h'];});doc.autoTable({startY:48,head:[['#','Name','Work','Country','Days','Day','Night','Total','OT','Extra']],body:data,theme:'grid',headStyles:{fillColor:[30,64,175]},alternateRowStyles:{fillColor:[240,249,255]},styles:{fontSize:7}});}
  else{const w=gW().find(x=>x.wid===wid);fn=`${w.name.replace(/\s/g,'_')}_${month}.pdf`;doc.setFontSize(14);doc.setFont('helvetica','bold');doc.text(w.name,14,52);doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text(`${w.prof} | ${w.sec}`,14,59);const att=gA().filter(a=>a.wid===wid&&a.date.startsWith(month)&&a.status==='completed').sort((a,b)=>a.date.localeCompare(b.date));data=att.map((a,i)=>[i+1,a.date,a.shift||'Day',fT(a.checkinTime),fT(a.checkoutTime),a.total.toFixed(2)+'h',a.regular.toFixed(2)+'h',(a.compOT||0).toFixed(2)+'h',(a.extraOT||0).toFixed(2)+'h']);doc.autoTable({startY:65,head:[['#','Date','Shift','In','Out','Total','Reg','OT','Extra']],body:data,theme:'grid',headStyles:{fillColor:[30,64,175]},alternateRowStyles:{fillColor:[240,249,255]}});}
  const pc=doc.internal.getNumberOfPages();for(let i=1;i<=pc;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(150);doc.text(`© ${CURRENT_YEAR} AL BOWRY | Page ${i}/${pc}`,105,290,{align:'center'});}
  doc.save('AlBowry_'+fn);toast('✅ PDF!');
}

function exportPDF(){
  const s=$('expStart').value,e=$('expEnd').value,sec=$('expSec').value;if(!s||!e)return toast('Dates','err');if(!window.jspdf)return toast('Loading','err');
  let data=gA().filter(a=>a.date>=s&&a.date<=e&&a.status==='completed');
  if(sec==='Day')data=data.filter(a=>a.shift==='Day'||!a.shift);
  else if(sec==='Night')data=data.filter(a=>a.shift==='Night');
  else if(sec==='Indian')data=data.filter(a=>a.sec==='Indian');
  else if(sec==='Pakistani')data=data.filter(a=>a.sec==='Pakistani');
  if(!data.length)return toast('No data','err');
  const{jsPDF}=window.jspdf;const doc=new jsPDF('l');
  addPDFHeader(doc,`${s} to ${e} | ${sec||'All'}`,'Reg: 9h | Comp OT: 3h',297);
  const rows=data.map((a,i)=>[i+1,a.name,a.prof||'-',a.sec,a.shift||'Day',a.date,fT(a.checkinTime),fT(a.checkoutTime),a.total.toFixed(2),a.regular.toFixed(2),(a.compOT||0).toFixed(2),(a.extraOT||0).toFixed(2)]);
  doc.autoTable({startY:48,head:[['#','Name','Work','Country','Shift','Date','In','Out','Total','Reg','OT','Extra']],body:rows,theme:'grid',headStyles:{fillColor:[30,64,175]},styles:{fontSize:7}});
  doc.save(`AlBowry_${s}_to_${e}.pdf`);toast('✅ PDF!');
}

// ⭐ UPDATED: Admin Settings with Name Update
async function updateAdmin(){
  const nid=$('setNewId').value.trim();
  const nname=$('setNewName').value.trim();
  const npw=$('setNewPw').value;
  const cpw=$('setConfPw').value;
  
  const currentAd=gAD();
  const finalId=nid||currentAd.adminId;
  const finalName=nname||currentAd.name;
  const finalPw=npw||currentAd.pw;
  
  if(npw&&npw!==cpw)return toast('Passwords don\'t match','err');
  if(npw&&npw.length<6)return toast('Min 6 characters','err');
  if(!nid&&!nname&&!npw)return toast('Enter at least one field to update','err');
  
  await FB.save(COL.AD,'main',{adminId:finalId,pw:finalPw,name:finalName});
  const u=gU();u.id=finalId;u.name=finalName;u.pw=finalPw;sU(u);
  
  $('setCurId').value=finalId;
  $('aNavName').textContent=finalName;
  if($('setNewName'))$('setNewName').value='';
  $('setNewId').value='';
  $('setNewPw').value='';
  $('setConfPw').value='';
  toast('✅ Admin updated! Welcome '+finalName);
  speakWelcome(finalName);
}

function backupAll(){const d={workers:gW(),attendance:gA(),admin:gAD(),date:new Date().toISOString()};const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='AlBowry_Backup_'+tD()+'.json';l.click();toast('✅ Backup!');}
function resetAllPasswords(){confirmDlg('Reset All?','All to '+DEFAULT_PW,async()=>{for(const w of gW())await FB.save(COL.W,w.wid,{...w,pw:DEFAULT_PW});toast('✅ Reset!');});}
function clearAttendanceData(){confirmDlg('Clear?','Delete ALL?',async()=>{for(const a of gA())await FB.del(COL.A,a.id);toast('Cleared','info');});}

function setExpDate(r){const t=tD();if(r==='today'){$('expStart').value=t;$('expEnd').value=t;}else if(r==='week'){const n=new Date(),d=n.getDay(),diff=n.getDate()-d+(d===0?-6:1);$('expStart').value=new Date(n.setDate(diff)).toLocaleDateString('en-CA');$('expEnd').value=tD();}else{$('expStart').value=t.substring(0,8)+'01';$('expEnd').value=t;}}

function exportExcel(){const s=$('expStart').value,e=$('expEnd').value,sec=$('expSec').value;if(!s||!e)return toast('Dates','err');let data=gA().filter(a=>a.date>=s&&a.date<=e);
if(sec==='Day')data=data.filter(a=>a.shift==='Day'||!a.shift);else if(sec==='Night')data=data.filter(a=>a.shift==='Night');else if(sec==='Indian')data=data.filter(a=>a.sec==='Indian');else if(sec==='Pakistani')data=data.filter(a=>a.sec==='Pakistani');
if(!data.length)return toast('No data','err');
const logoHTML=LOGO_BASE64?`<img src="${LOGO_BASE64}" width="50" height="50">`:'<b style="font-size:30px;color:#1e40af">A</b>';
let html=`<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Arial}th{background:#1e40af;color:#fff;padding:8px;border:1px solid #1e3a8a;font-size:10px}td{padding:6px;border:1px solid #ccc;font-size:10px}.e{background:#f0f9ff}</style></head><body><table border="1"><tr><td colspan="13" style="background:#1e40af;color:#fff;padding:16px"><table style="border:none;width:100%"><tr><td style="border:none;width:60px">${logoHTML}</td><td style="border:none;text-align:center"><div style="font-size:24px;font-weight:bold">AL BOWRY CARPENTRY</div><div style="font-size:11px">Antalya, Turkey | albowry.com</div></td></tr></table></td></tr><tr><td colspan="13" style="background:#dbeafe;text-align:center;padding:8px;font-weight:bold">${s} to ${e} | ${sec||'All'} | Reg:9h + OT:3h</td></tr><tr><td colspan="13"></td></tr><tr><th>#</th><th>ID</th><th>Name</th><th>Work</th><th>Country</th><th>Shift</th><th>Date</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>Extra</th></tr>${data.map((a,i)=>`<tr class="${i%2===0?'e':''}"><td>${i+1}</td><td>${a.wid}</td><td><b>${a.name}</b></td><td>${a.prof||'-'}</td><td>${a.sec}</td><td>${a.shift||'Day'}</td><td>${a.date}</td><td>${fT(a.checkinTime)}</td><td>${fT(a.checkoutTime)}</td><td><b>${(a.total||0).toFixed(2)}</b></td><td>${(a.regular||0).toFixed(2)}</td><td>${(a.compOT||0).toFixed(2)}</td><td>${(a.extraOT||0).toFixed(2)}</td></tr>`).join('')}<tr style="background:#dbeafe;font-weight:bold"><td colspan="9" style="text-align:right">TOTALS:</td><td>${data.reduce((s,a)=>s+(a.total||0),0).toFixed(2)}</td><td>${data.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)}</td><td>${data.reduce((s,a)=>s+(a.compOT||0),0).toFixed(2)}</td><td>${data.reduce((s,a)=>s+(a.extraOT||0),0).toFixed(2)}</td></tr><tr><td colspan="13" style="background:#1e40af;color:#fff;text-align:center;padding:8px">© ${CURRENT_YEAR} AL BOWRY Carpentry</td></tr></table></body></html>`;
const b=new Blob([html],{type:'application/vnd.ms-excel'});const l=document.createElement('a');l.href=URL.createObjectURL(b);l.download=`AlBowry_${s}_to_${e}.xls`;l.click();toast('✅ Excel!');}

function exportCSV(){const s=$('expStart').value,e=$('expEnd').value,sec=$('expSec').value;if(!s||!e)return toast('Dates','err');let data=gA().filter(a=>a.date>=s&&a.date<=e);
if(sec==='Day')data=data.filter(a=>a.shift==='Day'||!a.shift);else if(sec==='Night')data=data.filter(a=>a.shift==='Night');else if(sec==='Indian')data=data.filter(a=>a.sec==='Indian');else if(sec==='Pakistani')data=data.filter(a=>a.sec==='Pakistani');
if(!data.length)return toast('No data','err');let csv='AL BOWRY CARPENTRY\n'+s+' to '+e+'\nReg:9h + OT:3h\n\n#,ID,Name,Work,Country,Shift,Date,In,Out,Total,Reg,OT,Extra,Status\n';csv+=data.map((a,i)=>[i+1,a.wid,`"${a.name}"`,`"${a.prof||'-'}"`,a.sec,a.shift||'Day',a.date,fT(a.checkinTime),fT(a.checkoutTime),(a.total||0).toFixed(2),(a.regular||0).toFixed(2),(a.compOT||0).toFixed(2),(a.extraOT||0).toFixed(2),a.status].join(',')).join('\n');const b=new Blob([csv],{type:'text/csv'});const l=document.createElement('a');l.href=URL.createObjectURL(b);l.download=`AlBowry_${s}_to_${e}.csv`;l.click();toast('✅ CSV!');}

function updateClocks(){const t=tT();['loginClock','wClock','aClock','wBigClock'].forEach(id=>{const e=$(id);if(e)e.textContent=t;});}

let deferredPrompt=null;
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').then(()=>console.log('✅ SW')).catch(()=>{});});}
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;setTimeout(()=>{if(!localStorage.getItem('install_dismissed')&&!localStorage.getItem('app_installed')){const b=$('installBanner');if(b)b.classList.add('show');}},2000);});
async function installApp(){if(!deferredPrompt){if(/iPhone|iPad|iPod/i.test(navigator.userAgent))alert('📱 Tap Share ⎋ → Add to Home Screen');else alert('📱 Browser menu → Add to Home Screen');return;}deferredPrompt.prompt();const{outcome}=await deferredPrompt.userChoice;if(outcome==='accepted'){toast('✅ Installed!');localStorage.setItem('app_installed','true');}deferredPrompt=null;dismissInstall();}
function dismissInstall(){const b=$('installBanner');if(b){b.classList.remove('show');localStorage.setItem('install_dismissed','true');setTimeout(()=>localStorage.removeItem('install_dismissed'),7*24*60*60*1000);}}
window.addEventListener('appinstalled',()=>{localStorage.setItem('app_installed','true');toast('✅ Installed!');dismissInstall();});
if(/iPhone|iPad|iPod/i.test(navigator.userAgent)&&!window.matchMedia('(display-mode:standalone)').matches){setTimeout(()=>{if(!localStorage.getItem('install_dismissed')){const b=$('installBanner');if(b)b.classList.add('show');}},3000);}

async function boot(){console.log('🚀 Booting AL BOWRY...');await initDB();fillDD();updateClocks();setInterval(updateClocks,1000);const u=gU();if(u){if(u.role==='worker')loadWD();else if(u.role==='admin')loadAD();}}
if(window.FB_READY)boot();else window.addEventListener('fb-ready',boot);
