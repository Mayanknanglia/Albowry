const REG_HOURS=8,DEFAULT_PW='Worker@123',CURRENT_YEAR=2026;
const COL={W:'workers',A:'attendance',AD:'admin'};
const K={U:'alb_session'};

const IND=[
{n:"Sandeep Jangir",p:"GM"},{n:"Pradeep Kumar Jangid",p:"Production Head"},
{n:"Nitesh Kumar Bugalia",p:"Supervisor"},{n:"Rajeev Punia",p:"Supervisor"},
{n:"Govind Jangir",p:"Helper"},{n:"Abdul Majid",p:"Helper"},
{n:"Akaram Khan",p:"Helper"},{n:"Manoj Kumar Jakhar",p:"Helper"},
{n:"Punit Kumar",p:"Helper"},{n:"Pintu",p:"Helper"},
{n:"Rajendra Kumar",p:"Helper"},{n:"Surendra Kumar Mahala",p:"Helper"},
{n:"Lokesh Kumar Varma",p:"Helper"},{n:"Surendra Budania",p:"Helper"},
{n:"Pradeep Singh",p:"Helper"},{n:"Sandip Ratanlal Jangid",p:"Carpenter"},
{n:"Ajay Jangir",p:"Carpenter"},{n:"Dharmendra Khyalia",p:"Carpenter"},
{n:"Pradip Kumar",p:"Carpenter"},{n:"Rajesh Khyalia",p:"Carpenter"},
{n:"Raj Pal",p:"Carpenter"},{n:"Suresh Kumar Jangir",p:"Carpenter"},
{n:"Rahul Varma",p:"Carpenter"},{n:"Mukesh Saini",p:"Carpenter"},
{n:"Deepak Kumar Jangir",p:"Carpenter"},{n:"Jitendra Jangid",p:"Carpenter"},
{n:"Rakesh Kumar Jangir",p:"Carpenter"},{n:"Om Prakash",p:"Carpenter"},
{n:"Jeth Mal Jangir",p:"Carpenter"},{n:"Rahul",p:"Carpenter"},
{n:"Vijendra Kumar",p:"Carpenter"},{n:"Hajari Lal",p:"Carpenter"}
];
const PAK=[
{n:"Ali Raza",p:"Assistant Carpenter"},{n:"Asad Raza",p:"Assistant Carpenter"},
{n:"Kashif Hussain",p:"Assistant Carpenter"},{n:"Mudasir Hussain",p:"Helper"},
{n:"Muhammad Amjad",p:"Helper"},{n:"Muhammad Arshad",p:"Helper"},
{n:"Muhammad Faheem",p:"Assistant Carpenter"},{n:"Muhammad Imtiaz",p:"Helper"},
{n:"Muhammad Naeem",p:"Helper"},{n:"Muhammad Parvaiz",p:"Assistant Carpenter"},
{n:"Muhammad Ramzan",p:"Helper"},{n:"Muhammad Rizwan",p:"Helper"},
{n:"Muhammad Sikandar",p:"Assistant Carpenter"},{n:"Muhammad Saleem",p:"Helper"},
{n:"Sami Ullah",p:"Assistant Carpenter"},{n:"Sharafat Hussain",p:"Assistant Carpenter"},
{n:"Matloob Ahmad",p:"Assistant Carpenter"},{n:"Taimoor Ahmad",p:"Assistant Carpenter"},
{n:"Sher Bahadur",p:"Helper"},{n:"Muhammad Awais",p:"Assistant Carpenter"},
{n:"Muhammad Mansoor",p:"Assistant Carpenter"}
];

let WC=[],AC=[],ADC=null;

async function initDB(){
  console.log('Initializing...');
  const ew=await FB.getAll(COL.W);
  if(!ew.length){
    toast('Setting up workers...','info');
    for(let i=0;i<IND.length;i++){const w=IND[i],id='IND'+String(i+1).padStart(4,'0');await FB.save(COL.W,id,{wid:id,name:w.n,prof:w.p,sec:'Indian',pw:DEFAULT_PW,on:true});}
    for(let i=0;i<PAK.length;i++){const w=PAK[i],id='PAK'+String(i+1).padStart(4,'0');await FB.save(COL.W,id,{wid:id,name:w.n,prof:w.p,sec:'Pakistani',pw:DEFAULT_PW,on:true});}
  }
  const ad=await FB.get(COL.AD,'main');
  if(!ad)await FB.save(COL.AD,'main',{adminId:'ADMIN001',pw:'Admin@2026',name:'Administrator'});
  
  FB.listen(COL.W,d=>{
    WC=d;fillDD();popReportDD();
    if(typeof populateManualWorkerDD==='function')populateManualWorkerDD();
    if(typeof populateManualCustomDD==='function')populateManualCustomDD();
    const u=gU();
    if(u&&u.role==='admin'){
      loadStats();
      if($('sec-workers')?.classList.contains('active'))loadWorkerTable();
      if($('sec-manual')?.classList.contains('active')&&typeof loadManualToday==='function')loadManualToday();
    }
  });
  FB.listen(COL.A,d=>{
    AC=d;
    const u=gU();
    if(u&&u.role==='worker'){upWS();loadWH();loadWQS();}
    if(u&&u.role==='admin'){
      loadStats();
      const a=document.querySelector('.sec.active');
      if(a){
        if(a.id==='sec-approve')loadAppr();
        if(a.id==='sec-live')loadLive();
        if(a.id==='sec-attend')loadAttend();
        if(a.id==='sec-endday')loadED();
        if(a.id==='sec-report')loadMR();
        if(a.id==='sec-manual'&&typeof loadManualToday==='function')loadManualToday();
      }
    }
  });
  FB.listen(COL.AD,d=>{if(d.length)ADC=d[0];});
  
  setTimeout(()=>{const l=$('loadingScreen');if(l)l.style.display='none';},2000);
  console.log('🔥 Ready!');
}

// Helpers
const $=id=>document.getElementById(id.replace('#',''));
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

// Set today's date as default for manual date input
function setDefaultManualDate(){
  const md=$('manualDate');
  if(md&&!md.value)md.value=tD();
}

// Login
function switchLogin(t,b){document.querySelectorAll('.ltabs .ltab').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.lform').forEach(f=>f.classList.remove('active'));$(t+'LoginForm').classList.add('active');$('loginErr').classList.remove('show');}
function showErr(m){const e=$('loginErr');e.textContent='⚠️ '+m;e.classList.add('show');}
function fillDD(){
  const w=gW().filter(x=>x.on),ind=w.filter(x=>x.sec==='Indian').sort((a,b)=>a.wid.localeCompare(b.wid)),pak=w.filter(x=>x.sec==='Pakistani').sort((a,b)=>a.wid.localeCompare(b.wid));
  let h='<option value="">— Choose your name —</option>';
  if(ind.length){h+='<optgroup label="🇮🇳 Indian Workers">';ind.forEach(x=>h+=`<option value="${x.wid}">${x.name} — ${x.prof}</option>`);h+='</optgroup>';}
  if(pak.length){h+='<optgroup label="🇵🇰 Pakistani Workers">';pak.forEach(x=>h+=`<option value="${x.wid}">${x.name} — ${x.prof}</option>`);h+='</optgroup>';}
  const s=$('workerSelect');if(s)s.innerHTML=h;
}
function workerLogin(e){
  e.preventDefault();const id=$('workerSelect').value,pw=$('workerPw').value;
  if(!id)return showErr('Select your name');
  const w=gW().find(x=>x.wid===id);
  if(!w)return showErr('Not found');if(!w.on)return showErr('Deactivated');if(w.pw!==pw)return showErr('Wrong password');
  sU({...w,id:w.wid,role:'worker'});toast('Welcome, '+w.name+'!');loadWD();return false;
}
function adminLogin(e){
  e.preventDefault();const id=$('adminId').value.trim(),pw=$('adminPw').value;
  if(!id||!pw)return showErr('Enter ID & password');
  const ad=gAD();if(ad.adminId!==id||ad.pw!==pw)return showErr('Invalid credentials');
  sU({...ad,id:ad.adminId,role:'admin'});toast('Welcome, Admin!');loadAD();return false;
}
function logout(){confirmDlg('Logout?','Sure?',()=>{cU();showPage('loginPage');$('workerSelect').value='';$('workerPw').value='';$('adminId').value='';$('adminPw').value='';$('loginErr').classList.remove('show');});}

// Worker Dashboard
function loadWD(){const u=gU();$('wGreet').textContent=greet();$('wName').textContent=u.name;$('wInfo').textContent=`${u.prof} • ${u.sec} • ${u.id}`;$('wNavName').textContent=u.name;$('wAvatar').textContent=u.name.charAt(0);$('wDate').textContent=tDF();showPage('workerPage');upWS();loadWH();loadWQS();}

async function doCheckIn(){
  const u=gU(),today=tD(),ex=gA().find(a=>a.wid===u.id&&a.date===today);
  if(ex){if(ex.status==='pending_checkin')return toast('Already pending!','err');if(ex.status==='checked_in'||ex.status==='pending_checkout')return toast('Already checked in!','err');if(ex.status==='completed')return toast('Already done today','err');}
  confirmDlg('Check In?','Send request to admin?',async()=>{
    const now=new Date().toISOString(),rid='att_'+Date.now()+'_'+u.id;
    const ok=await FB.save(COL.A,rid,{recId:rid,wid:u.id,name:u.name,prof:u.prof,sec:u.sec,date:today,checkinReqTime:now,checkinTime:null,checkoutReqTime:null,checkoutTime:null,total:0,regular:0,ot:0,status:'pending_checkin'});
    if(ok)toast('✅ Check-in request sent!');else toast('❌ Failed','err');
  });
}

async function doCheckOut(){
  const u=gU(),today=tD(),rec=gA().find(a=>a.wid===u.id&&a.date===today);
  if(!rec)return toast('Check-in first!','err');if(rec.status==='pending_checkin')return toast('Wait for approval','err');if(rec.status==='completed')return toast('Already done','err');if(rec.status==='pending_checkout')return toast('Already pending!','err');if(rec.status!=='checked_in')return toast('Cannot checkout','err');
  confirmDlg('Check Out?','Send request to admin?',async()=>{
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
  if(rec.checkoutReqTime)tm.innerHTML+=`<div class="wsc-time-item"><small>Out Request</small><b style="color:#f59e0b">${fT(rec.checkoutReqTime)}</b></div>`;
  if(rec.checkoutTime)tm.innerHTML+=`<div class="wsc-time-item"><small>Check-out</small><b style="color:#dc2626">${fT(rec.checkoutTime)}</b></div>`;
  if(rec.total>0)tm.innerHTML+=`<div class="wsc-time-item"><small>Total</small><b style="color:#1e40af">${rec.total.toFixed(2)}h</b></div>`;
  if(rec.ot>0)tm.innerHTML+=`<div class="wsc-time-item"><small>OT</small><b style="color:#d97706">${rec.ot.toFixed(2)}h</b></div>`;
  const states={pending_checkin:['⏳','Check-in Pending','Waiting for admin',true,true,'pending'],checked_in:['🟢','Working','Checked in at '+fT(rec.checkinTime),true,false,'active'],pending_checkout:['⏳','Check-out Pending','Waiting for admin',true,true,'pending'],completed:['🎉','Day Completed','Total: '+rec.total.toFixed(2)+'h',true,true,'done']};
  const s=states[rec.status];if(!s)return;
  ic.textContent=s[0];tx.textContent=s[1];sb.textContent=s[2];bI.disabled=s[3];bO.disabled=s[4];st2.className='wac-status '+s[5];
  st2.innerHTML='<span>'+s[0]+'</span> '+s[2];
}

function loadWQS(){const u=gU();if(!u)return;const my=gA().filter(a=>a.wid===u.id&&a.status==='completed');st('wTotalDays',my.length);st('wTotalHrs',my.reduce((s,a)=>s+(a.total||0),0).toFixed(1)+'h');st('wTotalOT',my.reduce((s,a)=>s+(a.ot||0),0).toFixed(1)+'h');}

function loadWH(){
  const u=gU();if(!u)return;
  const h=gA().filter(a=>a.wid===u.id&&a.status==='completed').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15);
  st('wHistCount',h.length+' records');
  const el=$('wHistory');if(!el)return;
  if(!h.length){el.innerHTML='<div class="empty"><div class="em-icon">📭</div><h3>No History</h3></div>';return;}
  el.innerHTML=h.map(r=>`<div class="hist-item"><b>${r.date}</b><span style="color:#059669">🔓 ${fT(r.checkinTime)}</span><span style="color:#dc2626">🔒 ${fT(r.checkoutTime)}</span><b style="color:#1e40af">${r.total.toFixed(2)}h</b>${r.ot>0?`<span class="tag tag-o">OT ${r.ot.toFixed(2)}h</span>`:'<span></span>'}</div>`).join('');
}

async function changeWorkerPw(e){
  e.preventDefault();const old=$('cwOld').value,nw=$('cwNew').value,cf=$('cwConf').value;
  if(nw!==cf)return toast('Mismatch','err');if(nw.length<4)return toast('Min 4','err');
  const u=gU(),w=gW().find(x=>x.wid===u.id);if(w.pw!==old)return toast('Wrong current','err');
  await FB.save(COL.W,u.id,{...w,pw:nw});sU({...u,pw:nw});$('cwOld').value='';$('cwNew').value='';$('cwConf').value='';toast('✅ Updated!');return false;
}

// Admin
function loadAD(){const u=gU();$('aNavName').textContent=u.name;showPage('adminPage');$('fDate').value=tD();$('expStart').value=tD();$('expEnd').value=tD();$('setCurId').value=u.id;$('reportMonth').value=tD().substring(0,7);popReportDD();loadStats();}

function goSection(s,b){
  document.querySelectorAll('.side-btn').forEach(x=>x.classList.remove('active'));
  if(b)b.classList.add('active');
  document.querySelectorAll('.sec').forEach(x=>x.classList.remove('active'));
  $('sec-'+s).classList.add('active');
  if(s==='dash')loadStats();
  if(s==='approve')loadAppr();
  if(s==='live')loadLive();
  if(s==='attend')loadAttend();
  if(s==='workers')loadWorkerTable();
  if(s==='endday')loadED();
  if(s==='report'){popReportDD();loadMR();}
  if(s==='manual'){
    if(typeof loadManualSection==='function')loadManualSection();
    if(typeof populateManualCustomDD==='function')populateManualCustomDD();
    setDefaultManualDate();
  }
}

function loadStats(){
  const ws=gW().filter(w=>w.on),today=tD(),att=gA().filter(a=>a.date===today);
  const present=att.filter(a=>['checked_in','completed','pending_checkout'].includes(a.status)).length;
  const pend=att.filter(a=>['pending_checkin','pending_checkout'].includes(a.status)).length;
  const ind=ws.filter(w=>w.sec==='Indian'),pak=ws.filter(w=>w.sec==='Pakistani');
  const indP=att.filter(a=>a.sec==='Indian'&&['checked_in','completed','pending_checkout'].includes(a.status)).length;
  const pakP=att.filter(a=>a.sec==='Pakistani'&&['checked_in','completed','pending_checkout'].includes(a.status)).length;
  const indPe=att.filter(a=>a.sec==='Indian'&&['pending_checkin','pending_checkout'].includes(a.status)).length;
  const pakPe=att.filter(a=>a.sec==='Pakistani'&&['pending_checkin','pending_checkout'].includes(a.status)).length;
  st('sTotalW',ws.length);st('sPresent',present);st('sAbsent',ws.length-present);st('sPending',pend);st('dashDate',tDF());
  st('dIndT',ind.length);st('dIndP',indP);st('dIndA',ind.length-indP);st('dIndPend',indPe);
  st('dPakT',pak.length);st('dPakP',pakP);st('dPakA',pak.length-pakP);st('dPakPend',pakPe);
  const iP=ind.length?Math.round(indP/ind.length*100):0,pP=pak.length?Math.round(pakP/pak.length*100):0;
  const iB=$('dIndBar'),pB=$('dPakBar');if(iB)iB.style.width=iP+'%';if(pB)pB.style.width=pP+'%';
  st('dIndPct',iP+'%');st('dPakPct',pP+'%');
  const b=$('sBadge');if(b){if(pend>0){b.textContent=pend;b.classList.add('show');}else b.classList.remove('show');}
}

function loadAppr(){
  const pend=gA().filter(a=>['pending_checkin','pending_checkout'].includes(a.status));
  const el=$('approveList');if(!el)return;
  if(!pend.length){el.innerHTML='<div class="empty"><div class="em-icon">✅</div><h3>All Clear!</h3></div>';}
  else{el.innerHTML=pend.map(p=>{const ic=p.status==='pending_checkin';return`<div class="appr-item"><div class="appr-info"><h4>${p.name} <span class="tag tag-${p.sec==='Indian'?'ind':'pak'}">${p.sec==='Indian'?'🇮🇳':'🇵🇰'}</span> <span class="tag ${ic?'tag-g':'tag-r'}">${ic?'🔓 IN':'🔒 OUT'}</span></h4><p><b>${p.prof}</b> • ${p.wid} • ${fT(ic?p.checkinReqTime:p.checkoutReqTime)}</p>${!ic&&p.checkinTime?`<p>In: ${fT(p.checkinTime)}</p>`:''}</div><div class="appr-btns"><button class="btn btn-success btn-sm" onclick="doApprove('${p.id}')">✅</button><button class="btn btn-danger btn-sm" onclick="doReject('${p.id}')">❌</button></div></div>`;}).join('');}
  loadRecentAppr();
}

function loadRecentAppr(){
  const today=tD(),rec=gA().filter(a=>a.date===today&&(a.status==='checked_in'||a.status==='completed'));
  const el=$('recentApproved');if(!el)return;
  if(!rec.length){el.innerHTML='<div class="empty" style="padding:30px"><h3>No recent</h3></div>';return;}
  el.innerHTML=rec.map(p=>`<div class="appr-item" style="border-left-color:${p.status==='completed'?'var(--g)':'var(--pl)'}"><div class="appr-info"><h4>${p.name} <span class="tag ${p.status==='checked_in'?'tag-b':'tag-g'}">${p.status==='checked_in'?'🟢 Working':'✅ Done'}</span></h4><p>In: ${fT(p.checkinTime)} ${p.checkoutTime?'| Out: '+fT(p.checkoutTime):''} ${p.total?'| '+p.total.toFixed(2)+'h':''}</p></div><div class="appr-btns">${p.status==='completed'?`<button class="btn btn-outline btn-sm" onclick="undoCO('${p.id}')">↩️ Undo</button>`:''}<button class="btn btn-danger btn-sm" onclick="undoCI('${p.id}')">🗑️</button></div></div>`).join('');
}

async function undoCO(id){confirmDlg('Undo?','Revert checkout?',async()=>{const r=gA().find(a=>a.id===id);if(!r)return;await FB.save(COL.A,id,{...r,checkoutTime:null,checkoutReqTime:null,total:0,regular:0,ot:0,status:'checked_in'});toast('↩️ Undone','info');});}
async function undoCI(id){const r=gA().find(a=>a.id===id);confirmDlg('Remove?',`Delete ${r?.name}'s record?`,async()=>{await FB.del(COL.A,id);toast('🗑️ Removed','info');});}

async function doApprove(id){
  const r=gA().find(a=>a.id===id);if(!r)return;const u={...r};
  if(r.status==='pending_checkin'){u.checkinTime=r.checkinReqTime;u.status='checked_in';toast('✅ In: '+r.name);}
  else if(r.status==='pending_checkout'){u.checkoutTime=r.checkoutReqTime;const h=(new Date(u.checkoutTime)-new Date(u.checkinTime))/36e5;u.total=Math.round(h*100)/100;u.regular=Math.round(Math.min(h,REG_HOURS)*100)/100;u.ot=Math.max(0,Math.round((h-REG_HOURS)*100)/100);u.status='completed';toast('✅ Out: '+u.total.toFixed(2)+'h');}
  await FB.save(COL.A,id,u);
}
function doReject(id){confirmDlg('Reject?','Sure?',async()=>{const r=gA().find(a=>a.id===id);if(r.status==='pending_checkin')await FB.del(COL.A,id);else await FB.save(COL.A,id,{...r,checkoutReqTime:null,status:'checked_in'});toast('Rejected','info');});}
function approveAll(){const p=gA().filter(a=>['pending_checkin','pending_checkout'].includes(a.status));if(!p.length)return toast('None','info');confirmDlg('Approve All?',p.length+' requests?',async()=>{for(const r of p){const u={...r};if(r.status==='pending_checkin'){u.checkinTime=r.checkinReqTime;u.status='checked_in';}else{u.checkoutTime=r.checkoutReqTime;const h=(new Date(u.checkoutTime)-new Date(u.checkinTime))/36e5;u.total=Math.round(h*100)/100;u.regular=Math.round(Math.min(h,REG_HOURS)*100)/100;u.ot=Math.max(0,Math.round((h-REG_HOURS)*100)/100);u.status='completed';}await FB.save(COL.A,r.id,u);}toast('✅ All approved!');});}

function loadED(){
  const today=tD(),w=gA().filter(a=>a.date===today&&(a.status==='checked_in'||a.status==='pending_checkout'));
  st('edWorkingCount',w.length);const el=$('edWorkingList');if(!el)return;
  if(!w.length){el.innerHTML='<div class="empty"><div class="em-icon">✅</div><h3>All Clear!</h3></div>';return;}
  el.innerHTML=w.map(x=>`<div class="ed-worker-item"><div class="ed-info"><h4>${x.name}</h4><p>${x.prof} • ${x.wid}</p></div><div class="ed-time">🟢 ${fT(x.checkinTime)}</div></div>`).join('');
}

function endDayForAll(){
  const today=tD(),w=gA().filter(a=>a.date===today&&(a.status==='checked_in'||a.status==='pending_checkout'));
  if(!w.length)return toast('None','info');const ti=$('edLogoutTime').value;if(!ti)return toast('Set time','err');
  confirmDlg('End Day?',w.length+' workers at '+ti+'?',async()=>{const[h,m]=ti.split(':');for(const r of w){const cd=new Date();cd.setHours(parseInt(h),parseInt(m),0,0);const u={...r};u.checkoutTime=cd.toISOString();u.checkoutReqTime=u.checkoutReqTime||u.checkoutTime;const hrs=(new Date(u.checkoutTime)-new Date(u.checkinTime))/36e5;u.total=Math.round(hrs*100)/100;u.regular=Math.round(Math.min(hrs,REG_HOURS)*100)/100;u.ot=Math.max(0,Math.round((hrs-REG_HOURS)*100)/100);u.status='completed';await FB.save(COL.A,r.id,u);}toast('✅ Done for '+w.length+'!');});
}

function loadLive(){
  const today=tD(),att=gA().filter(a=>a.date===today),w=att.filter(a=>a.status==='checked_in'),d=att.filter(a=>a.status==='completed');
  st('liveCount',w.length);st('doneCount',d.length);
  const lE=$('liveList'),dE=$('doneList');
  if(lE){if(!w.length)lE.innerHTML='<div class="empty"><div class="em-icon">💤</div><h3>No one</h3></div>';else lE.innerHTML=w.map(x=>`<div class="live-item"><div class="li-info"><h4>${x.name} <span class="tag tag-${x.sec==='Indian'?'ind':'pak'}">${x.sec==='Indian'?'🇮🇳':'🇵🇰'}</span></h4><p>${x.prof}</p></div><div class="li-time">🟢 ${fT(x.checkinTime)}</div></div>`).join('');}
  if(dE){if(!d.length)dE.innerHTML='<div class="empty"><div class="em-icon">📋</div><h3>None</h3></div>';else dE.innerHTML=d.map(x=>`<div class="live-item"><div class="li-info"><h4>${x.name}</h4><p>${x.total.toFixed(2)}h ${x.ot>0?'(OT '+x.ot.toFixed(2)+'h)':''}</p></div><div class="li-time">✅ ${fT(x.checkoutTime)}</div></div>`).join('');}
}

function loadAttend(){
  const date=$('fDate').value,sec=$('fSec').value;let att=gA().filter(a=>a.date===date);if(sec)att=att.filter(a=>a.sec===sec);
  const el=$('attendTable');if(!el)return;
  if(!att.length){el.innerHTML='<div class="empty"><div class="em-icon">📋</div><h3>No Records</h3></div>';return;}
  const stg=s=>({completed:'<span class="tag tag-g">✓</span>',checked_in:'<span class="tag tag-b">🟢</span>',pending_checkin:'<span class="tag tag-o">⏳ In</span>',pending_checkout:'<span class="tag tag-o">⏳ Out</span>'}[s]||s);
  el.innerHTML=`<div class="t-wrap"><table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Prof</th><th>Sec</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th><th>St</th><th>Act</th></tr></thead><tbody>${att.map((a,i)=>`<tr><td>${i+1}</td><td><code>${a.wid}</code></td><td><b>${a.name}</b></td><td>${a.prof}</td><td><span class="tag tag-${a.sec==='Indian'?'ind':'pak'}">${a.sec==='Indian'?'🇮🇳':'🇵🇰'}</span></td><td style="color:#059669">${fT(a.checkinTime)}</td><td style="color:#dc2626">${fT(a.checkoutTime)}</td><td style="color:var(--p);font-weight:700">${(a.total||0).toFixed(2)}h</td><td>${(a.regular||0).toFixed(2)}h</td><td style="color:#d97706">${a.ot>0?a.ot.toFixed(2)+'h':'-'}</td><td>${stg(a.status)}</td><td><button class="btn btn-danger btn-sm" onclick="undoCI('${a.id}')">🗑️</button></td></tr>`).join('')}</tbody></table></div>`;
}

// Workers
let curTab='Indian',editId=null;
function swWorkerTab(s,b){curTab=s;document.querySelectorAll('#sec-workers .ltab').forEach(x=>x.classList.remove('active'));b.classList.add('active');loadWorkerTable();}
function loadWorkerTable(){
  const q=($('wSearch')?.value||'').toLowerCase();let ws=gW().filter(w=>w.sec===curTab).sort((a,b)=>a.wid.localeCompare(b.wid));
  st('indCount','('+gW().filter(w=>w.sec==='Indian'&&w.on).length+')');st('pakCount','('+gW().filter(w=>w.sec==='Pakistani'&&w.on).length+')');
  if(q)ws=ws.filter(w=>w.name.toLowerCase().includes(q)||w.wid.toLowerCase().includes(q));
  const el=$('workerTable');if(!el)return;
  if(!ws.length){el.innerHTML='<div class="empty"><div class="em-icon">👷</div><h3>No Workers</h3></div>';return;}
  el.innerHTML=`<div class="t-wrap"><table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Prof</th><th>PW</th><th>Status</th><th>Actions</th></tr></thead><tbody>${ws.map((w,i)=>`<tr style="${w.on?'':'opacity:.5'}"><td>${i+1}</td><td><code>${w.wid}</code></td><td><b>${w.name}</b></td><td>${w.prof}</td><td><code id="p-${w.wid}">••••</code> <button class="btn btn-outline btn-sm" onclick="showPw('${w.wid}')" style="padding:2px 6px">👁</button></td><td>${w.on?'<span class="tag tag-g">On</span>':'<span class="tag tag-r">Off</span>'}</td><td style="white-space:nowrap"><button class="btn btn-outline btn-sm" onclick="editW('${w.wid}')">✏️</button><button class="btn btn-outline btn-sm" onclick="resetPw('${w.wid}')">🔑</button><button class="btn btn-${w.on?'danger':'success'} btn-sm" onclick="toggleW('${w.wid}')">${w.on?'🚫':'✅'}</button><button class="btn btn-danger btn-sm" onclick="delW('${w.wid}')">🗑️</button></td></tr>`).join('')}</tbody></table></div>`;
}
function showPw(id){const w=gW().find(x=>x.wid===id),el=$('p-'+id);if(el.textContent==='••••'){el.textContent=w.pw;setTimeout(()=>el.textContent='••••',4000);}}
function resetPw(id){confirmDlg('Reset?','Reset to '+DEFAULT_PW,async()=>{const w=gW().find(x=>x.wid===id);await FB.save(COL.W,id,{...w,pw:DEFAULT_PW});$('mPwBody').innerHTML=`<div class="pw-show"><div class="pw-lbl">Reset</div><div class="pw-name">${w.name}</div><div class="pw-val">${DEFAULT_PW}</div></div>`;openModal('mPw');});}
function openAddWorker(){editId=null;$('mwTitle').textContent='➕ Add';$('mwName').value='';$('mwProf').value='';$('mwSec').value=curTab;$('mwPw').value=DEFAULT_PW;openModal('mWorker');}
function editW(id){const w=gW().find(x=>x.wid===id);editId=id;$('mwTitle').textContent='✏️ Edit';$('mwName').value=w.name;$('mwProf').value=w.prof;$('mwSec').value=w.sec;$('mwPw').value=w.pw;openModal('mWorker');}
async function saveWorkerForm(e){
  e.preventDefault();const name=$('mwName').value.trim(),prof=$('mwProf').value,sec=$('mwSec').value,pw=$('mwPw').value.trim();
  if(!name||!prof||!pw)return toast('Fill all','err');
  if(editId){const w=gW().find(x=>x.wid===editId);await FB.save(COL.W,editId,{...w,name,prof,sec,pw});toast('✅ Updated!');}
  else{const pre=sec==='Indian'?'IND':'PAK';const nums=gW().filter(w=>w.wid.startsWith(pre)).map(w=>parseInt(w.wid.replace(pre,''))).filter(n=>!isNaN(n));const next=nums.length?Math.max(...nums)+1:1;const wid=pre+String(next).padStart(4,'0');await FB.save(COL.W,wid,{wid,name,prof,sec,pw,on:true});$('mPwBody').innerHTML=`<div class="pw-show"><div class="pw-lbl">✅ Added</div><div class="pw-name">${name} (${wid})</div><div class="pw-val">${pw}</div></div>`;openModal('mPw');toast('✅ '+wid);}
  closeModal('mWorker');return false;
}
async function toggleW(id){const w=gW().find(x=>x.wid===id);await FB.save(COL.W,id,{...w,on:!w.on});toast(w.on?'Off':'On','info');}
function delW(id){const w=gW().find(x=>x.wid===id);confirmDlg('Delete?',w.name+'?',async()=>{await FB.del(COL.W,id);for(const a of gA().filter(x=>x.wid===id))await FB.del(COL.A,a.id);toast('Deleted','info');});}

// Monthly Report
function popReportDD(){
  const s=$('reportWorker');if(!s)return;const cv=s.value;const w=gW().filter(x=>x.on).sort((a,b)=>a.name.localeCompare(b.name));
  let h='<option value="">— Select —</option><option value="__ALL__">📋 All Workers</option>';
  w.forEach(x=>h+=`<option value="${x.wid}">${x.name} — ${x.prof}</option>`);s.innerHTML=h;if(cv)s.value=cv;
}
function loadMR(){
  const wid=$('reportWorker')?.value,month=$('reportMonth')?.value,el=$('reportContent');if(!el)return;
  if(!wid||!month){el.innerHTML='<div class="empty"><div class="em-icon">📊</div><h3>Select worker & month</h3></div>';return;}
  if(wid==='__ALL__'){
    const ws=gW().filter(w=>w.on),att=gA().filter(a=>a.date.startsWith(month)&&a.status==='completed');
    el.innerHTML=`<div class="t-wrap"><table><thead><tr><th>#</th><th>ID</th><th>Name</th><th>Sec</th><th>Days</th><th>Total</th><th>Reg</th><th>OT</th></tr></thead><tbody>${ws.map((w,i)=>{const m=att.filter(a=>a.wid===w.wid);return`<tr><td>${i+1}</td><td><code>${w.wid}</code></td><td><b>${w.name}</b></td><td><span class="tag tag-${w.sec==='Indian'?'ind':'pak'}">${w.sec==='Indian'?'🇮🇳':'🇵🇰'}</span></td><td><b>${m.length}</b></td><td style="color:var(--p);font-weight:700">${m.reduce((s,a)=>s+(a.total||0),0).toFixed(2)}h</td><td>${m.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)}h</td><td style="color:#d97706">${m.reduce((s,a)=>s+(a.ot||0),0).toFixed(2)}h</td></tr>`;}).join('')}<tr style="background:#eff6ff;font-weight:700"><td colspan="4" style="text-align:right">TOTAL:</td><td>${att.length}</td><td style="color:var(--p)">${att.reduce((s,a)=>s+(a.total||0),0).toFixed(2)}h</td><td>${att.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)}h</td><td style="color:#d97706">${att.reduce((s,a)=>s+(a.ot||0),0).toFixed(2)}h</td></tr></tbody></table></div>`;
  }else{
    const w=gW().find(x=>x.wid===wid);if(!w)return;const att=gA().filter(a=>a.wid===wid&&a.date.startsWith(month)&&a.status==='completed').sort((a,b)=>a.date.localeCompare(b.date));
    const tH=att.reduce((s,a)=>s+(a.total||0),0),rH=att.reduce((s,a)=>s+(a.regular||0),0),oH=att.reduce((s,a)=>s+(a.ot||0),0);
    el.innerHTML=`<div class="w-card" style="margin-bottom:20px;background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff"><h3 style="font-size:22px;font-weight:800;margin-bottom:6px">${w.name}</h3><p style="opacity:.9">${w.prof} • ${w.sec} • ${w.wid}</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px"><div style="background:rgba(255,255,255,.15);padding:16px;border-radius:12px;text-align:center"><div style="font-size:28px;font-weight:800">${att.length}</div><div style="font-size:12px;opacity:.9">Days</div></div><div style="background:rgba(255,255,255,.15);padding:16px;border-radius:12px;text-align:center"><div style="font-size:28px;font-weight:800">${tH.toFixed(1)}h</div><div style="font-size:12px;opacity:.9">Total</div></div><div style="background:rgba(255,255,255,.15);padding:16px;border-radius:12px;text-align:center"><div style="font-size:28px;font-weight:800">${oH.toFixed(1)}h</div><div style="font-size:12px;opacity:.9">OT</div></div></div></div>${att.length?`<div class="t-wrap"><table><thead><tr><th>#</th><th>Date</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th></tr></thead><tbody>${att.map((a,i)=>`<tr><td>${i+1}</td><td><b>${a.date}</b></td><td style="color:#059669">${fT(a.checkinTime)}</td><td style="color:#dc2626">${fT(a.checkoutTime)}</td><td style="color:var(--p);font-weight:700">${a.total.toFixed(2)}h</td><td>${a.regular.toFixed(2)}h</td><td style="color:#d97706">${a.ot>0?a.ot.toFixed(2)+'h':'-'}</td></tr>`).join('')}<tr style="background:#eff6ff;font-weight:700"><td colspan="4" style="text-align:right">TOTAL:</td><td style="color:var(--p)">${tH.toFixed(2)}h</td><td>${rH.toFixed(2)}h</td><td style="color:#d97706">${oH.toFixed(2)}h</td></tr></tbody></table></div>`:'<div class="empty"><div class="em-icon">📭</div><h3>No records</h3></div>'}`;
  }
}

// PDF
function downloadReportPDF(){
  const wid=$('reportWorker').value,month=$('reportMonth').value;if(!wid||!month)return toast('Select both','err');if(!window.jspdf)return toast('Loading...','err');
  const{jsPDF}=window.jspdf;const doc=new jsPDF();
  doc.setFillColor(30,64,175);doc.rect(0,0,210,35,'F');doc.setTextColor(255);doc.setFontSize(20);doc.setFont('helvetica','bold');doc.text('ALBOWRY CARPENTRY',105,15,{align:'center'});doc.setFontSize(11);doc.text('Report - '+month,105,25,{align:'center'});doc.setFontSize(9);doc.text('Antalya, Turkey | albowry.com',105,32,{align:'center'});doc.setTextColor(0);
  let data=[],fn='';
  if(wid==='__ALL__'){fn=`All_${month}.pdf`;const ws=gW().filter(w=>w.on),att=gA().filter(a=>a.date.startsWith(month)&&a.status==='completed');data=ws.map((w,i)=>{const m=att.filter(a=>a.wid===w.wid);return[i+1,w.wid,w.name,w.sec,m.length,m.reduce((s,a)=>s+(a.total||0),0).toFixed(2)+'h',m.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)+'h',m.reduce((s,a)=>s+(a.ot||0),0).toFixed(2)+'h'];});doc.autoTable({startY:42,head:[['#','ID','Name','Sec','Days','Total','Reg','OT']],body:data,theme:'grid',headStyles:{fillColor:[30,64,175]},alternateRowStyles:{fillColor:[240,249,255]}});}
  else{const w=gW().find(x=>x.wid===wid);fn=`${w.name.replace(/\s/g,'_')}_${month}.pdf`;doc.setFontSize(14);doc.setFont('helvetica','bold');doc.text(w.name,14,45);doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text(`${w.prof} | ${w.sec} | ${w.wid}`,14,52);const att=gA().filter(a=>a.wid===wid&&a.date.startsWith(month)&&a.status==='completed').sort((a,b)=>a.date.localeCompare(b.date));data=att.map((a,i)=>[i+1,a.date,fT(a.checkinTime),fT(a.checkoutTime),a.total.toFixed(2)+'h',a.regular.toFixed(2)+'h',a.ot.toFixed(2)+'h']);const tH=att.reduce((s,a)=>s+(a.total||0),0);data.push(['','TOTAL','','',tH.toFixed(2)+'h',att.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)+'h',att.reduce((s,a)=>s+(a.ot||0),0).toFixed(2)+'h']);doc.autoTable({startY:58,head:[['#','Date','In','Out','Total','Reg','OT']],body:data,theme:'grid',headStyles:{fillColor:[30,64,175]},alternateRowStyles:{fillColor:[240,249,255]}});}
  doc.save('Albowry_'+fn);toast('✅ PDF!');
}

function exportPDF(){
  const s=$('expStart').value,e=$('expEnd').value,sec=$('expSec').value;if(!s||!e)return toast('Dates','err');if(!window.jspdf)return toast('Loading','err');
  let data=gA().filter(a=>a.date>=s&&a.date<=e&&a.status==='completed');if(sec)data=data.filter(a=>a.sec===sec);if(!data.length)return toast('No data','err');
  const{jsPDF}=window.jspdf;const doc=new jsPDF('l');doc.setFillColor(30,64,175);doc.rect(0,0,297,30,'F');doc.setTextColor(255);doc.setFontSize(18);doc.setFont('helvetica','bold');doc.text('ALBOWRY CARPENTRY',148.5,13,{align:'center'});doc.setFontSize(10);doc.text(`${s} to ${e}`,148.5,23,{align:'center'});doc.setTextColor(0);
  const rows=data.map((a,i)=>[i+1,a.wid,a.name,a.prof,a.sec,a.date,fT(a.checkinTime),fT(a.checkoutTime),a.total.toFixed(2),a.regular.toFixed(2),a.ot.toFixed(2)]);
  doc.autoTable({startY:35,head:[['#','ID','Name','Prof','Sec','Date','In','Out','Total','Reg','OT']],body:rows,theme:'grid',headStyles:{fillColor:[30,64,175]},styles:{fontSize:8}});
  doc.save(`Albowry_${s}_to_${e}.pdf`);toast('✅ PDF!');
}

// Settings
async function updateAdmin(){const nid=$('setNewId').value.trim(),npw=$('setNewPw').value,cpw=$('setConfPw').value;if(!nid||!npw)return toast('Fill all','err');if(npw!==cpw)return toast('Mismatch','err');if(npw.length<6)return toast('Min 6','err');await FB.save(COL.AD,'main',{adminId:nid,pw:npw,name:'Administrator'});const u=gU();u.id=nid;sU(u);$('setCurId').value=nid;$('setNewId').value='';$('setNewPw').value='';$('setConfPw').value='';toast('✅ Updated!');}
function backupAll(){const d={workers:gW(),attendance:gA(),admin:gAD(),date:new Date().toISOString()};const b=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const l=document.createElement('a');l.href=URL.createObjectURL(b);l.download='Albowry_Backup_'+tD()+'.json';l.click();toast('✅ Backup!');}
function resetAllPasswords(){confirmDlg('Reset All?','All to '+DEFAULT_PW,async()=>{for(const w of gW())await FB.save(COL.W,w.wid,{...w,pw:DEFAULT_PW});toast('✅ Reset!');});}
function clearAttendanceData(){confirmDlg('Clear?','Delete ALL?',async()=>{for(const a of gA())await FB.del(COL.A,a.id);toast('Cleared','info');});}

// Export
function setExpDate(r){const t=tD();if(r==='today'){$('expStart').value=t;$('expEnd').value=t;}else if(r==='week'){const n=new Date(),d=n.getDay(),diff=n.getDate()-d+(d===0?-6:1);$('expStart').value=new Date(n.setDate(diff)).toLocaleDateString('en-CA');$('expEnd').value=tD();}else{$('expStart').value=t.substring(0,8)+'01';$('expEnd').value=t;}}

function exportExcel(){const s=$('expStart').value,e=$('expEnd').value,sec=$('expSec').value;if(!s||!e)return toast('Dates','err');let data=gA().filter(a=>a.date>=s&&a.date<=e);if(sec)data=data.filter(a=>a.sec===sec);if(!data.length)return toast('No data','err');let html=`<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Arial}.t{background:#1e40af;color:#fff;font-size:22px;font-weight:bold;text-align:center;padding:16px}.s{background:#3b82f6;color:#fff;text-align:center;padding:10px;font-size:12px}.p{background:#dbeafe;text-align:center;padding:10px;font-weight:600}th{background:#1e40af;color:#fff;padding:10px;border:1px solid #1e3a8a;text-align:center;font-size:11px}td{padding:8px;border:1px solid #ccc;font-size:11px;text-align:center}.e{background:#f0f9ff}.f{background:#1e40af;color:#fff;text-align:center;padding:10px;font-size:11px}</style></head><body><table border="1"><tr><td colspan="11" class="t">ALBOWRY CARPENTRY</td></tr><tr><td colspan="11" class="s">Antalya, Turkey | albowry.com</td></tr><tr><td colspan="11" class="p">${s} to ${e}</td></tr><tr><td colspan="11"></td></tr><tr><th>#</th><th>ID</th><th>Name</th><th>Prof</th><th>Sec</th><th>Date</th><th>In</th><th>Out</th><th>Total</th><th>Reg</th><th>OT</th></tr>${data.map((a,i)=>`<tr class="${i%2===0?'e':''}"><td>${i+1}</td><td>${a.wid}</td><td style="text-align:left"><b>${a.name}</b></td><td>${a.prof}</td><td>${a.sec}</td><td>${a.date}</td><td>${fT(a.checkinTime)}</td><td>${fT(a.checkoutTime)}</td><td><b>${(a.total||0).toFixed(2)}</b></td><td>${(a.regular||0).toFixed(2)}</td><td>${(a.ot||0).toFixed(2)}</td></tr>`).join('')}<tr><td colspan="8" style="text-align:right;background:#f0f9ff;padding:10px"><b>TOTALS:</b></td><td style="background:#dbeafe"><b>${data.reduce((s,a)=>s+(a.total||0),0).toFixed(2)}</b></td><td style="background:#dbeafe"><b>${data.reduce((s,a)=>s+(a.regular||0),0).toFixed(2)}</b></td><td style="background:#dbeafe"><b>${data.reduce((s,a)=>s+(a.ot||0),0).toFixed(2)}</b></td></tr><tr><td colspan="11"></td></tr><tr><td colspan="11" class="f">© ${CURRENT_YEAR} Albowry Carpentry</td></tr></table></body></html>`;const b=new Blob([html],{type:'application/vnd.ms-excel'});const l=document.createElement('a');l.href=URL.createObjectURL(b);l.download=`Albowry_${s}_to_${e}.xls`;l.click();toast('✅ Excel!');}

function exportCSV(){const s=$('expStart').value,e=$('expEnd').value,sec=$('expSec').value;if(!s||!e)return toast('Dates','err');let data=gA().filter(a=>a.date>=s&&a.date<=e);if(sec)data=data.filter(a=>a.sec===sec);if(!data.length)return toast('No data','err');let csv='ALBOWRY CARPENTRY\n'+s+' to '+e+'\n\n#,ID,Name,Prof,Sec,Date,In,Out,Total,Reg,OT,Status\n';csv+=data.map((a,i)=>[i+1,a.wid,`"${a.name}"`,a.prof,a.sec,a.date,fT(a.checkinTime),fT(a.checkoutTime),(a.total||0).toFixed(2),(a.regular||0).toFixed(2),(a.ot||0).toFixed(2),a.status].join(',')).join('\n');const b=new Blob([csv],{type:'text/csv'});const l=document.createElement('a');l.href=URL.createObjectURL(b);l.download=`Albowry_${s}_to_${e}.csv`;l.click();toast('✅ CSV!');}

// Clocks
function updateClocks(){const t=tT();['loginClock','wClock','aClock','wBigClock'].forEach(id=>{const e=$(id);if(e)e.textContent=t;});}

// Boot
async function boot(){console.log('🚀 Booting...');await initDB();fillDD();updateClocks();setInterval(updateClocks,1000);const u=gU();if(u){if(u.role==='worker')loadWD();else if(u.role==='admin')loadAD();}}
if(window.FB_READY)boot();else window.addEventListener('fb-ready',boot);
