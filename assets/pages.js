/* ===================== Control Panel — routing + page logic ===================== */
var V_TITLES={
  home:"Home", billing:"Billing", company:"Company Profile", inventory:"Inventory & Usage",
  security:"Security", users:"Users", prodapps:"Productivity Apps",
  chat:"Chat", sms:"SMS", video:"Video", voice:"Voice", cpaas:"CPaaS", reports:"Analytics"
};
function vgo(k){
  document.querySelectorAll('.vpage').forEach(function(s){s.classList.toggle('on', s.id==='v-'+k);});
  var pg=document.getElementById('v-'+k);
  var act=pg&&pg.dataset?pg.dataset.active:'';
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.toggle('active', n.dataset.key===act);});
  // keep Sangoma UC group open when a child is active
  var ug=document.getElementById('ucGroup');
  if(ug&&['chat','sms','video','voice'].indexOf(act)>=0)ug.classList.add('open');
  var c=document.getElementById('crumbPage'); if(c)c.textContent=V_TITLES[k]||'';
  var sc=document.querySelector('.scroll'); if(sc)sc.scrollTop=0;
  document.body.classList.remove('nav-open');
  if(location.hash!=='#'+k)history.replaceState(null,'','#'+k);
}
document.querySelectorAll('[data-go]').forEach(function(n){
  n.addEventListener('click',function(){vgo(n.dataset.go);});
});
(function(){var k=(location.hash||'').replace('#','');
  if(!(k in V_TITLES))k='home'; vgo(k);})();
window.addEventListener('hashchange',function(){var k=(location.hash||'').replace('#','');
  if(k in V_TITLES)vgo(k);});

/* Sangoma UC expand/collapse */
(function(){var p=document.getElementById('ucParent'),g=document.getElementById('ucGroup');
  if(p&&g)p.addEventListener('click',function(){g.classList.toggle('open');});})();

/* Inline dropdowns (license change) */
document.addEventListener('click',function(e){
  var btn=e.target.closest('.isel-btn');
  document.querySelectorAll('.isel.open').forEach(function(s){ if(!btn||!s.contains(btn))s.classList.remove('open'); });
  if(btn){var s=btn.closest('.isel'); s.classList.toggle('open');}
  var opt=e.target.closest('.isel-opt');
  if(opt){var sel=opt.closest('.isel');
    sel.querySelectorAll('.isel-opt').forEach(function(o){o.classList.remove('sel');});
    opt.classList.add('sel');
    var lab=sel.querySelector('.isel-btn .o-lab'); if(lab)lab.textContent=opt.querySelector('.o-nm').textContent;
    var rc=sel.closest('.role-cell'); if(rc){var tr=sel.closest('tr'); if(tr)tr.dataset.role=opt.querySelector('.o-nm').textContent;}
    sel.classList.remove('open');}
});

/* generic bulk-select tables: header checkbox + count bar */
document.querySelectorAll('table[data-bulk]').forEach(function(tb){
  var head=tb.querySelector('thead .ck'), rows=tb.querySelectorAll('tbody .ck');
  var bar=document.getElementById(tb.dataset.bulk), cnt=bar&&bar.querySelector('.cnt');
  function sync(){var n=0; rows.forEach(function(r){if(r.checked)n++;});
    if(head){head.indeterminate=n>0&&n<rows.length; head.checked=n===rows.length;}
    if(bar){bar.style.display=n>0?'flex':'none'; if(cnt)cnt.textContent=n+' selected';}}
  if(head)head.addEventListener('change',function(){rows.forEach(function(r){r.checked=head.checked;});sync();});
  rows.forEach(function(r){r.addEventListener('change',sync);});
  var clr=bar&&bar.querySelector('[data-clear]');
  if(clr)clr.addEventListener('click',function(){rows.forEach(function(r){r.checked=false;});if(head)head.checked=false;sync();});
  sync();
});

/* toggle switches */
document.querySelectorAll('.sw').forEach(function(s){s.addEventListener('click',function(){s.classList.toggle('on');});});

/* password visibility + live requirement checks */
document.querySelectorAll('.inp-wrap .eye').forEach(function(eye){
  eye.addEventListener('click',function(){var i=eye.parentNode.querySelector('.inp');
    i.type=i.type==='password'?'text':'password';eye.classList.toggle('on');});
});
(function(){var np=document.getElementById('newPass'); if(!np)return;
  var reqs={len:document.getElementById('r-len'),up:document.getElementById('r-up'),num:document.getElementById('r-num'),sym:document.getElementById('r-sym')};
  np.addEventListener('input',function(){var v=np.value;
    if(reqs.len)reqs.len.classList.toggle('ok',v.length>=8);
    if(reqs.up)reqs.up.classList.toggle('ok',/[A-Z]/.test(v));
    if(reqs.num)reqs.num.classList.toggle('ok',/[0-9]/.test(v));
    if(reqs.sym)reqs.sym.classList.toggle('ok',/[^A-Za-z0-9]/.test(v));});
})();

/* ---------- charts ---------- */
function ring(id,pct,color,size){donut(id,[{v:pct,c:color||'var(--g2)'},{v:100-pct,c:'transparent'}],size||104,8);}
if(document.getElementById('d-sms')){
  ring('d-sms',75,'var(--ch-ok)',104);
  donut('d-ext',[{v:62,c:'var(--ch-ok)'},{v:38,c:'var(--ch5)'}],150,12);
  donut('d-call',[{v:55,c:'var(--ch-ok)'},{v:32,c:'var(--ch5)'},{v:13,c:'var(--ch6)'}],150,12);
  ring('d-agents',75,'var(--ch-ok)',160);
  donut('d-cxcall',[{v:42,c:'var(--ch-ok)'},{v:22,c:'var(--ch5)'},{v:16,c:'var(--ch6)'},{v:12,c:'var(--ch4)'},{v:8,c:'var(--ch-mut)'}],150,12);
  donut('d-dev',[{v:74,c:'var(--ch-ok)'},{v:12,c:'var(--ch5)'},{v:9,c:'var(--ch6)'},{v:5,c:'var(--ch-mut)'}],150,12);
  donut('d-links',[{v:80,c:'var(--ch-ok)'},{v:14,c:'var(--ch5)'},{v:6,c:'var(--ch6)'}],150,12);
  var t1=[1,1,1,1,1,1,1,1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
  function trk(id,downs){var el=document.getElementById(id);if(!el)return;var h='';
    for(var i=0;i<30;i++){h+='<i class="'+(downs.indexOf(i)>=0?'bad':'')+'"></i>';}el.innerHTML=h;}
  trk('trk1',[7,18]); trk('trk2',[12,23,24]);
}

/* ---------- dashboard date-period picker ---------- */
(function(){
  var pick=document.getElementById('periodPick'); if(!pick)return;
  var btn=document.getElementById('periodBtn'), pop=document.getElementById('periodPop');
  var lab=btn.querySelector('.lab'), sub=btn.querySelector('.sub');
  function setPeriod(l,s){ if(lab)lab.textContent=l; if(sub)sub.textContent=s;
    document.querySelectorAll('.pmonth').forEach(function(m){m.textContent=s;}); }
  function open(){ pick.classList.add('open'); pop.hidden=false; btn.setAttribute('aria-expanded','true'); }
  function close(){ pick.classList.remove('open'); pop.hidden=true; btn.setAttribute('aria-expanded','false'); }
  btn.addEventListener('click',function(e){ e.stopPropagation(); pick.classList.contains('open')?close():open(); });
  pop.addEventListener('click',function(e){ e.stopPropagation(); });
  document.getElementById('ppPresets').addEventListener('click',function(e){
    var o=e.target.closest('.pp-opt'); if(!o)return;
    this.querySelectorAll('.pp-opt').forEach(function(x){x.classList.remove('active');});
    o.classList.add('active'); setPeriod(o.dataset.lab, o.dataset.sub); close();
  });
  var fromEl=document.getElementById('ppFrom'), toEl=document.getElementById('ppTo');
  document.getElementById('ppApply').addEventListener('click',function(){
    if(!fromEl.value||!toEl.value)return;
    var f=new Date(fromEl.value+'T00:00'), t=new Date(toEl.value+'T00:00');
    var mo={month:'short',day:'numeric'}, yr={month:'short',day:'numeric',year:'numeric'};
    var s=f.toLocaleDateString('en-US',mo)+' – '+t.toLocaleDateString('en-US',yr);
    document.querySelectorAll('.pp-opt').forEach(function(x){x.classList.remove('active');});
    setPeriod('Custom Range', s); close();
  });
  document.addEventListener('click',function(){ if(pick.classList.contains('open'))close(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&pick.classList.contains('open'))close(); });
})();

/* ===================== Sangoma UC — shared helpers ===================== */
var CEV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
var EXT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>';
var CHK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
var XIC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
var WARN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
var OKC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.4 2.4L15.5 9.8"/></svg>';
var ICONSET=['M3 9h18M9 21V9M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  'M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z',
  'M4 4h16v12H5.2L4 17.2zM8 9h8M8 12h5',
  'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20',
  'M20 7h-9M14 17H5M17 3l3 4-3 4M7 21l-3-4 3-4',
  'M14.7 6.3a4 4 0 0 1 0 5.7l-1 1-6.4-6.4 1-1a4 4 0 0 1 5.7 0zM7.3 9.7 3 14v4h4l4.3-4.3'];
function aicon(i){return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="'+ICONSET[i%ICONSET.length]+'"/></svg>';}
function appcard(nm,ds,i){return '<div class="appcard"><span class="ai">'+aicon(i)+'</span><div><div class="nm">'+nm+'</div><div class="ds">'+ds+'</div></div><span class="ext">'+EXT+'</span></div>';}

/* ===================== VOICE — configuration accordion ===================== */
var VOICE=[
  {cap:'Organization',cards:[['Sites','Manage physical sites and locations'],['Users','Add, edit and manage voice users'],['Departments','Organize users into departments'],['Groups','Create and manage user groups']]},
  {cap:'Local Information',cards:[['Location status','Review the status of each location'],['Location information','View and edit location details'],['Additional location information','Manage supplementary location data']]},
  {cap:'Device Configuration',cards:[['Extensions','Configure extensions for users'],['Extensions status','Monitor extension registration status'],['Multi-extension devices','Manage devices with multiple extensions']]},
  {cap:'Call Configuration',cards:[['Incoming call routing','Define how inbound calls are routed'],['E911 zone configuration','Set up emergency calling zones'],['Destinations','Manage call destinations'],['Analog operator / backup','Configure analog operator and backup'],['Recording settings','Manage call recording preferences'],['Automated attendants','Set up automated attendants'],['Inbound caller ID blocking','Block caller ID on inbound calls']]},
  {cap:'System Management',cards:[['International dial plan settings','Configure international dialing rules'],['Support tools','Access diagnostic and support tools'],['Asset management','Manage system assets'],['On hold options','Configure on-hold music and messages']]},
  {cap:'Numbers Management',cards:[['New number','Order a new phone number'],['Porting','Port existing numbers to Sangoma'],['Customer DIDs manager','Manage customer DID numbers']]},
  {cap:'Call Center',cards:[['Sangoma CX manager','Open the Sangoma CX management console']]},
  {cap:'Licence Management',cards:[['Application framework','Manage the application framework'],['License configuration','Configure product licenses']]},
  {cap:'Other Tools',cards:[['Print company directory','Generate a printable directory'],['Location assets list (.csv)','Export location assets to CSV'],['Customer assets list (.csv)','Export customer assets to CSV'],['Configuration summary','View a summary of configuration'],['BV report','Generate a Business Voice report'],['User management','Manage users and permissions'],['Individual phone settings','Adjust settings per phone']]}
];
(function(){var m=document.getElementById('voice-body');if(!m)return;var ci=0,h='';
  VOICE.forEach(function(s,si){var cards='';
    s.cards.forEach(function(c){cards+=appcard(c[0],c[1],ci++);});
    h+='<div class="vsec'+(si===0?' open':'')+'"><div class="vsec-h"><span class="cev">'+CEV+'</span><span class="cap">'+s.cap+'</span></div><div class="vsec-body"><div class="appcards">'+cards+'</div></div></div>';
  });
  m.innerHTML=h;
  m.addEventListener('click',function(e){var hd=e.target.closest('.vsec-h');if(hd)hd.parentNode.classList.toggle('open');});
})();

/* ===================== License data (Chat / Meet / SMS) ===================== */
var UC_USERS=[
  {n:'Ralph Edwards',e:'redwards@sangoma.com',r:'Member',lic:'Unlicensed',did:''},
  {n:'Leslie Alexander',e:'lalexander@sangoma.com',r:'Admin',lic:'Premium',did:'(207) 555-0119'},
  {n:'Theresa Webb',e:'twebb@sangoma.com',r:'Member',lic:'Advanced',did:'(684) 555-0102'},
  {n:'Guy Hawkins',e:'ghawkins@sangoma.com',r:'Member',lic:'Premium',did:'(307) 555-0133'},
  {n:'Savannah Nguyen',e:'snguyen@sangoma.com',r:'Member',lic:'Unlicensed',did:''},
  {n:'Cody Fisher',e:'cfisher@sangoma.com',r:'Admin',lic:'Advanced',did:'(252) 555-0126'},
  {n:'Darlene Robertson',e:'drobertson@sangoma.com',r:'Member',lic:'Premium',did:'(406) 555-0120'},
  {n:'Jacob Jones',e:'jjones@sangoma.com',r:'Member',lic:'Unlicensed',did:''},
  {n:'Cameron Williamson',e:'cwilliamson@sangoma.com',r:'Member',lic:'Premium',did:'(229) 555-0109'},
  {n:'Arlene McCoy',e:'amccoy@sangoma.com',r:'Member',lic:'Advanced',did:'(505) 555-0125'}
];
var LIC_OPTS=['Unlicensed','Advanced','Premium'];
var DID_AVAIL=['(208) 555-0112','(303) 555-0105','(207) 555-0119','(239) 555-0108','(307) 555-0133'];
function initials(n){return n.split(' ').map(function(w){return w[0];}).join('').slice(0,2);}
function avatar(n){return '<span class="uav">'+initials(n)+'</span>';}
function liselCell(val){var opts='';LIC_OPTS.forEach(function(o){opts+='<div class="isel-opt'+(o===val?' sel':'')+'"><span class="o-nm">'+o+'</span><span class="chk">'+CHK+'</span></div>';});
  return '<span class="lic-cell"><span class="isel"><button class="isel-btn"><span class="o-lab">'+val+'</span>'+CEV+'</button><div class="isel-menu">'+opts+'</div></span></span>';}
var ROLE_OPTS=['Admin','Member'];
function roleCell(val){var opts='';ROLE_OPTS.forEach(function(o){opts+='<div class="isel-opt'+(o===val?' sel':'')+'"><span class="o-nm">'+o+'</span><span class="chk">'+CHK+'</span></div>';});
  return '<span class="role-cell"><span class="isel"><button class="isel-btn role-pill"><span class="o-lab">'+val+'</span>'+CEV+'</button><div class="isel-menu" style="min-width:140px">'+opts+'</div></span></span>';}

/* toolbar + stat builders */
function statStrip(el,segs){var h='';segs.forEach(function(s){h+='<div class="glass"><div class="k">'+s[0]+'</div><div class="v mono">'+s[1]+'</div></div>';});el.innerHTML=h;}
function toolbar(el,withRole,tableId,licOpts){if(!el)return;
  var h='<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input placeholder="Search Users" data-search data-table="'+tableId+'"></div>';
  if(withRole)h+='<div class="chip" data-opts="All Roles,Admin,Member" data-filter="role" data-table="'+tableId+'"><span class="lab">All Roles</span>'+CEV+'</div>';
  h+='<div class="chip" data-opts="'+licOpts+'" data-filter="lic" data-table="'+tableId+'"><span class="lab">'+licOpts.split(',')[0].trim()+'</span>'+CEV+'</div>';
  el.innerHTML=h;}

/* ---- filtering registry + engine ---- */
var FILTERS={};
function tableRows(tableId){var m=document.getElementById(tableId);return m?[].slice.call(m.querySelectorAll('tbody tr')):[];}
function applyFilters(tableId){var f=FILTERS[tableId]||{};var q=(f.q||'').toLowerCase();
  tableRows(tableId).forEach(function(tr){var show=true;
    if(q){var nmEl=tr.querySelector('.cell-ic b'),emEl=tr.querySelector('td.muted');
      var hay=((nmEl?nmEl.textContent:'')+' '+(emEl?emEl.textContent:'')).toLowerCase();
      if(hay.indexOf(q)<0)show=false;}
    if(show&&f.role&&f.role.indexOf('All')<0){if(tr.dataset.role!==f.role)show=false;}
    if(show&&f.lic&&f.lic.indexOf('All')<0){var lv=tr.dataset.lic;
      var licLab=tr.querySelector('.lic-td .o-lab');if(licLab)lv=licLab.textContent.trim();
      if(lv!==f.lic)show=false;}
    tr.style.display=show?'':'none';});}
function applyChipFilter(a){var t=a.dataset.table;if(!t)return;FILTERS[t]=FILTERS[t]||{};
  if(a.dataset.filter==='role')FILTERS[t].role=a.dataset.val;else FILTERS[t].lic=a.dataset.val;
  applyFilters(t);}

/* ---- generic dropdown menus (chips / pickers / kebab) ---- */
function ddClose(){document.querySelectorAll('.dd-menu').forEach(function(m){m.remove();});
  document.querySelectorAll('.dd-on').forEach(function(a){a.classList.remove('dd-on');});}
function ddOpen(anchor){ddClose();
  var opts=(anchor.dataset.opts||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
  var lab=anchor.querySelector('.lab');var cur=anchor.dataset.val||(lab?lab.textContent.trim():'');
  var menu=document.createElement('div');menu.className='dd-menu';
  menu.innerHTML=opts.map(function(o){return '<div class="dd-opt'+(o===cur?' sel':'')+'" data-v="'+o+'"><span>'+o+'</span><span class="chk">'+CHK+'</span></div>';}).join('');
  anchor.appendChild(menu);anchor.classList.add('dd-on');
  menu.addEventListener('click',function(e){var op=e.target.closest('.dd-opt');if(!op)return;e.stopPropagation();
    var v=op.dataset.v;anchor.dataset.val=v;var l=anchor.querySelector('.lab');if(l)l.textContent=v;
    ddClose();if(anchor.dataset.filter)applyChipFilter(anchor);});}
document.addEventListener('click',function(e){var a=e.target.closest('[data-opts]');
  if(a){e.stopPropagation();if(a.classList.contains('dd-on'))ddClose();else ddOpen(a);return;}
  if(!e.target.closest('.dd-menu'))ddClose();});

/* ---- Chat / Meet renderer (role optional) ---- */
function renderLic(cfg){
  var mount=document.getElementById(cfg.mount);if(!mount)return;
  var cols='<th style="width:44px"><input type="checkbox" class="ck" data-head></th><th>User Name</th><th>Email</th>'+(cfg.role?'<th>Role</th>':'')+'<th>License</th>';
  var rows='';
  UC_USERS.forEach(function(u,i){
    rows+='<tr data-i="'+i+'" data-role="'+u.r+'"><td><input type="checkbox" class="ck" data-row></td>'+
      '<td><span class="cell-ic">'+avatar(u.n)+'<b style="font-weight:600">'+u.n+'</b></span></td>'+
      '<td class="muted">'+u.e+'</td>'+(cfg.role?'<td class="role-td">'+roleCell(u.r)+'</td>':'')+
      '<td class="lic-td">'+liselCell(u.lic)+'</td></tr>';
  });
  mount.innerHTML='<div class="tw"><div class="tscroll"><table><thead><tr>'+cols+'</tr></thead><tbody>'+rows+'</tbody></table></div>'+pager()+'</div>';
  wireSelection(cfg);
}
function pager(n){n=n||UC_USERS.length;
  return '<div class="pag"><div class="rows">Rows per page <span class="sel" data-opts="10,25,50,100" style="min-width:64px"><span class="lab">10</span>'+CEV+'</span></div>'+
  '<div class="right"><span>1–'+n+' of '+n+'</span><div class="arrows"><button disabled aria-label="Previous page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button><button disabled aria-label="Next page"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></button></div></div></div>';}

/* selection + bulk apply flow */
function wireSelection(cfg){
  var mount=document.getElementById(cfg.mount);
  var statEl=document.getElementById(cfg.stat);
  var head=mount.querySelector('[data-head]');
  var rows=[].slice.call(mount.querySelectorAll('[data-row]'));
  function selCount(){return rows.filter(function(r){return r.checked;}).length;}
  function baseStat(){statStrip(statEl,cfg.segs);}
  baseStat();
  function sync(){
    var n=selCount();
    head.indeterminate=n>0&&n<rows.length; head.checked=n===rows.length;
    var bar=mount.querySelector('.bulkbar');
    if(n>0){
      statEl.innerHTML='<div class="glass" style="grid-column:1/-1"><div class="k">Selected Users</div><div class="v mono">'+n+'</div></div>';
      if(!bar){bar=document.createElement('div');bar.className='bulkbar';
        bar.innerHTML='<span class="cnt">'+n+' selected</span><span class="isel" data-bulklic><button class="isel-btn"><span class="o-lab">Change License</span>'+CEV+'</button><div class="isel-menu">'+LIC_OPTS.map(function(o){return '<div class="isel-opt"><span class="o-nm">'+o+'</span><span class="chk">'+CHK+'</span></div>';}).join('')+'</div></span><span class="sp"></span><button class="btn btn-p" data-apply><span class="lbl">Apply</span></button><span class="lnk" data-clr>Clear</span>';
        mount.insertBefore(bar,mount.firstChild);
      } else bar.querySelector('.cnt').textContent=n+' selected';
    } else { baseStat(); if(bar)bar.remove(); }
  }
  head.addEventListener('change',function(){rows.forEach(function(r){r.checked=head.checked;});sync();});
  rows.forEach(function(r){r.addEventListener('change',sync);});
  mount.addEventListener('click',function(e){
    if(e.target.closest('[data-clr]')){rows.forEach(function(r){r.checked=false;});head.checked=false;sync();}
    if(e.target.closest('[data-apply]'))applyFlow(cfg,mount,rows,sync);
  });
}
function applyFlow(cfg,mount,rows,sync){
  var sel=rows.filter(function(r){return r.checked;});if(!sel.length)return;
  sel.forEach(function(r){var td=r.closest('tr').querySelector('.lic-td');
    var lab=td.querySelector('.o-lab');td.dataset.lic=lab?lab.textContent:'';
    td.innerHTML='<span class="processing"><span class="spin"></span>Processing…</span>';});
  var bar=mount.querySelector('.bulkbar');if(bar)bar.remove();
  setTimeout(function(){
    var fails=0,ok=0;
    sel.forEach(function(r){var tr=r.closest('tr');var td=tr.querySelector('.lic-td');
      var cur=td.dataset.lic||'Premium';
      var inner=liselCell(cur).replace(/^<span class="lic-cell">/,'').replace(/<\/span>$/,'');
      var isFail=/Guy Hawkins/.test(tr.textContent);
      if(isFail){fails++;tr.classList.add('row-fail');
        td.innerHTML='<span class="lic-cell fail">'+inner+' <span style="color:var(--bad-ink);display:inline-flex">'+WARN+'</span></span>';}
      else{ok++;tr.classList.remove('row-fail');
        td.innerHTML='<span class="lic-cell done">'+inner+' <span style="color:var(--ok);display:inline-flex">'+OKC+'</span></span>';}
      r.checked=false;});
    toast('ok',ok+' chat licenses have been successfully updated',true);
    if(fails)toast('err','There was an error updating the chat licenses of '+fails+' user'+(fails>1?'s':'')+'. <a href="#">Click here to see the users who failed.</a>',false);
    sync();
  },1600);
}

/* toasts */
function toast(kind,msg,auto){
  var box=document.querySelector('.toasts');
  if(!box){box=document.createElement('div');box.className='toasts';document.body.appendChild(box);}
  var t=document.createElement('div');t.className='toast '+kind;
  t.innerHTML='<span class="ti">'+(kind==='ok'?OKC:WARN)+'</span><span>'+msg+'</span><span class="x">'+XIC+'</span>';
  box.appendChild(t);
  t.querySelector('.x').addEventListener('click',function(){t.remove();});
  if(auto)setTimeout(function(){t.remove();},6000);
}

/* ---- SMS renderer ---- */
function didCell(u){
  if(!u.did)return '<span class="isel"><button class="isel-btn" style="color:var(--violet);border-color:var(--violet-tint)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>Add DID'+CEV+'</button>'+didMenu('')+'</span>';
  return '<span class="isel"><button class="isel-btn"><span class="o-lab mono">'+u.did+'</span><span class="x" style="color:var(--ink-4);display:inline-flex">'+XIC+'</span>'+CEV+'</button>'+didMenu(u.did)+'</span>';
}
function didMenu(cur){var s='<div class="search" style="height:34px;margin:2px 4px 6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input placeholder="Search numbers"></div>';
  DID_AVAIL.forEach(function(d){s+='<div class="isel-opt'+(d===cur?' sel':'')+'"><span class="o-nm mono" style="font-weight:600">'+d+'</span><span class="chk">'+CHK+'</span></div>';});
  return '<div class="isel-menu" style="min-width:240px">'+s+'</div>';}
function renderSMS(){
  var mount=document.getElementById('sms-table');if(!mount)return;
  var rows='';
  UC_USERS.forEach(function(u,i){
    rows+='<tr data-i="'+i+'" data-lic="'+(u.did?'Licensed':'Unlicensed')+'"><td><input type="checkbox" class="ck" data-row></td>'+
      '<td><span class="cell-ic">'+avatar(u.n)+'<b style="font-weight:600">'+u.n+'</b></span></td>'+
      '<td class="muted">'+u.e+'</td><td>'+didCell(u)+'</td>'+
      '<td>'+(u.did?'<span class="tag ok">Licensed</span>':'<span class="tag" style="background:var(--deg-tint);color:var(--ink-3)">Unlicensed</span>')+'</td></tr>';
  });
  mount.innerHTML='<div class="tw"><div class="tscroll"><table><thead><tr><th style="width:44px"><input type="checkbox" class="ck" data-head></th><th>User Name</th><th>Email</th><th>DID Number</th><th>License</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+pager()+'</div>';
}

/* ---- Users (app access — per-app toggles) ---- */
function renderUsers(){
  var mount=document.getElementById('users-table');if(!mount)return;
  var apps=['Chat','Meet','SMS','Voice'];
  var head='<th style="width:44px"><input type="checkbox" class="ck" data-head></th><th>User Name</th><th>Email</th><th>Role</th>'+apps.map(function(a){return '<th style="text-align:center">'+a+'</th>';}).join('');
  var rows='';
  UC_USERS.forEach(function(u,i){
    var on=[u.lic!=='Unlicensed',u.lic!=='Unlicensed',!!u.did,true];
    var tg=on.map(function(v){return '<td style="text-align:center"><span class="sw'+(v?' on':'')+'" style="display:inline-block;vertical-align:middle"></span></td>';}).join('');
    rows+='<tr data-role="'+u.r+'"><td><input type="checkbox" class="ck" data-row></td><td><span class="cell-ic">'+avatar(u.n)+'<b style="font-weight:600">'+u.n+'</b></span></td><td class="muted">'+u.e+'</td><td class="role-td">'+roleCell(u.r)+'</td>'+tg+'</tr>';
  });
  mount.innerHTML='<div class="tw"><div class="tscroll"><table><thead><tr>'+head+'</tr></thead><tbody>'+rows+'</tbody></table></div>'+pager()+'</div>';
}

/* ---- Productivity apps grid ---- */
(function(){var m=document.getElementById('prod-body');if(!m)return;
  var apps=[['Chat','Team messaging and presence','chat'],['Meet','Video meetings and webinars','video'],['SMS','Business text messaging','sms'],['Voice','Cloud PBX and calling','voice'],['CPaaS','APIs for SMS, email and voice','cpaas'],['Analytics','Usage insights and reporting','reports']];
  var h='<div class="appcards" style="grid-template-columns:repeat(3,1fr)">';
  apps.forEach(function(a,i){h+='<div class="appcard" data-go="'+a[2]+'"><span class="ai">'+aicon(i)+'</span><div><div class="nm">'+a[0]+'</div><div class="ds">'+a[1]+'</div></div><span class="ext">'+CEV+'</span></div>';});
  h+='</div>';m.innerHTML=h;
  m.querySelectorAll('[data-go]').forEach(function(n){n.addEventListener('click',function(){vgo(n.dataset.go);});});
})();

/* ---- init license pages ---- */
renderLic({mount:'chat-table',stat:'chat-stat',role:true,segs:[['Standard','0 /0'],['Advanced','560 /1600'],['Premium','200 /400'],['Total Assigned','760']]});
renderLic({mount:'meet-table',stat:'meet-stat',role:false,segs:[['Standard','0 /0'],['Advanced','560 /1600'],['Premium','200 /400'],['Total Assigned','760']]});
toolbar(document.getElementById('chat-tools'),true,'chat-table','All Licenses,Unlicensed,Advanced,Premium');
toolbar(document.getElementById('meet-tools'),false,'meet-table','All Licenses,Unlicensed,Advanced,Premium');
statStrip(document.getElementById('sms-stat'),[['Total DIDs','0 /0'],['Total Licenses','560 /1600'],['Assigned','7'],['Available','3']]);
toolbar(document.getElementById('sms-tools'),false,'sms-table','All Licenses,Licensed,Unlicensed');
renderSMS();
renderUsers();

/* ===================== Billing — invoices (Figma: SCP Billing) ===================== */
var INVOICES=['#9151','#8811','#5045','#2798','#9374','#3933','#9359','#8861','#6025','#1577','#1148'];
var INV_DATE='Sep 21, 2023';
var PIC='<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>';
function chevBtn(d,dis,lab){return '<button'+(dis?' disabled':'')+' aria-label="'+lab+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg></button>';}
function billPager(){
  return '<div class="pag bill-pag">'+
    '<div class="jump">Jump to page <span class="sel" data-opts="1,2,3,4,5" style="min-width:52px"><span class="lab">1</span>'+CEV+'</span></div>'+
    '<div class="right">'+
      '<div class="rows">Rows per page <span class="sel" data-opts="10,25,50,100" style="min-width:60px"><span class="lab">50</span>'+CEV+'</span></div>'+
      '<span class="range">1-10 of 50</span>'+
      '<div class="arrows">'+
        chevBtn('<path d="M18 6l-6 6 6 6"/><path d="M11 6l-6 6 6 6"/>',true,'First page')+
        chevBtn('<path d="M15 18l-6-6 6-6"/>',true,'Previous page')+
        chevBtn('<path d="M9 6l6 6-6 6"/>',false,'Next page')+
        chevBtn('<path d="M6 6l6 6-6 6"/><path d="M13 6l6 6-6 6"/>',false,'Last page')+
      '</div>'+
    '</div></div>';
}
function renderInvoices(){
  var mount=document.getElementById('inv-table');if(!mount)return;
  var head='<th style="width:44px"><input type="checkbox" class="ck" data-head></th><th>Invoice ID</th><th>Created</th><th style="width:52px"></th>';
  var rows='';
  INVOICES.forEach(function(id){
    rows+='<tr data-inv="'+id+'"><td><input type="checkbox" class="ck" data-row></td>'+
      '<td><span class="cell-ic"><b style="font-weight:600">'+id+'</b></span></td>'+
      '<td class="muted">'+INV_DATE+'</td>'+
      '<td><div class="kebab" data-opts="View,Download,Print,Delete">'+PIC+'</div></td></tr>';
  });
  mount.innerHTML='<div class="tw"><div class="tscroll"><table><thead><tr>'+head+'</tr></thead><tbody>'+rows+'</tbody></table></div>'+billPager()+'</div>';
  var hd=mount.querySelector('[data-head]'),rws=[].slice.call(mount.querySelectorAll('[data-row]'));
  if(hd){hd.addEventListener('change',function(){rws.forEach(function(r){r.checked=hd.checked;});});
    rws.forEach(function(r){r.addEventListener('change',function(){var n=rws.filter(function(x){return x.checked;}).length;hd.indeterminate=n>0&&n<rws.length;hd.checked=n===rws.length;});});}
  mount.querySelectorAll('tbody tr').forEach(function(tr){tr.addEventListener('click',function(e){
    if(e.target.closest('.ck')||e.target.closest('.kebab'))return;openInvoice(tr.dataset.inv);});});
}
var INV_IMG='assets/img/invoice-template.png';
function invoiceDoc(id){
  return '<div class="inv-imgwrap"><img class="inv-img" src="'+INV_IMG+'" alt="Invoice '+id+' — Sangoma"></div>';
}
function openInvoice(id){
  var doc=document.getElementById('inv-doc');if(doc)doc.innerHTML=invoiceDoc(id);
  var dr=document.getElementById('inv-drawer');if(dr){dr.classList.add('open');dr.setAttribute('aria-hidden','false');dr.dataset.inv=id;}
  var sc=document.getElementById('inv-scrim');if(sc){sc.hidden=false;requestAnimationFrame(function(){sc.classList.add('show');});}
}
function closeInvoice(){
  var dr=document.getElementById('inv-drawer');if(dr){dr.classList.remove('open');dr.setAttribute('aria-hidden','true');}
  var sc=document.getElementById('inv-scrim');if(sc){sc.classList.remove('show');setTimeout(function(){sc.hidden=true;},260);}
}
function openLightbox(){var lb=document.getElementById('inv-lightbox');if(lb){lb.hidden=false;requestAnimationFrame(function(){lb.classList.add('show');});}}
function closeLightbox(){var lb=document.getElementById('inv-lightbox');if(lb){lb.classList.remove('show');setTimeout(function(){lb.hidden=true;},220);}}
(function(){var c=document.getElementById('inv-close');if(c)c.addEventListener('click',closeInvoice);
  var sc=document.getElementById('inv-scrim');if(sc)sc.addEventListener('click',closeInvoice);
  var pv=document.getElementById('inv-preview');if(pv)pv.addEventListener('click',openLightbox);
  var img=document.getElementById('inv-doc');if(img)img.addEventListener('click',function(e){if(e.target.closest('.inv-img'))openLightbox();});
  var lbx=document.getElementById('inv-lb-close');if(lbx)lbx.addEventListener('click',closeLightbox);
  var lb=document.getElementById('inv-lightbox');if(lb)lb.addEventListener('click',function(e){if(e.target===lb)closeLightbox();});
  var pr=document.getElementById('inv-print');if(pr)pr.addEventListener('click',function(){var w=window.open('','_blank');if(w){w.document.write('<img src="'+INV_IMG+'" style="width:100%" onload="print()">');w.document.close();}});
  var dl=document.getElementById('inv-download');if(dl)dl.addEventListener('click',function(){var a=document.createElement('a');a.href=INV_IMG;a.download='invoice.png';document.body.appendChild(a);a.click();a.remove();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeLightbox();closeInvoice();}});})();
renderInvoices();

/* wire every search box to its table */
document.querySelectorAll('input[data-search]').forEach(function(inp){var t=inp.dataset.table;if(!t)return;
  FILTERS[t]=FILTERS[t]||{};
  inp.addEventListener('input',function(){FILTERS[t].q=inp.value;applyFilters(t);});});

/* ===================== White-label branding ===================== */
(function(){
  var DEFAULT='#7a1f86';
  /* color helpers */
  function hx(n){n=Math.max(0,Math.min(255,Math.round(n)));return ('0'+n.toString(16)).slice(-2);}
  function toRgb(h){h=(h||'').replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');
    return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};}
  function mix(h,t,a){var x=toRgb(h),y=toRgb(t);return '#'+hx(x.r+(y.r-x.r)*a)+hx(x.g+(y.g-x.g)*a)+hx(x.b+(y.b-x.b)*a);}
  function lighten(h,a){return mix(h,'#ffffff',a);}
  function darken(h,a){return mix(h,'#000000',a);}
  function rgba(h,a){var c=toRgb(h);return 'rgba('+c.r+','+c.g+','+c.b+','+a+')';}
  function brandCSS(hex){
    var lg=lighten(hex,.06),dk=darken(hex,.28);
    var light='--violet:'+hex+';--grad-icon:'+hex+';--violet-tint:'+rgba(hex,.12)+';--violet-soft:'+rgba(hex,.07)+
      ';--g1:'+lg+';--g2:'+hex+';--g3:'+dk+';--grad:linear-gradient(180deg,'+lg+' 0%,'+hex+' 55%,'+dk+' 130%)';
    var dv=lighten(hex,.45),di=lighten(hex,.52),d1=lighten(hex,.4),d2=lighten(hex,.28),d3=lighten(hex,.16);
    var dark='--violet:'+dv+';--grad-icon:'+di+';--violet-tint:'+rgba(dv,.16)+';--violet-soft:'+rgba(dv,.12)+
      ';--g1:'+d1+';--g2:'+d2+';--g3:'+d3+';--grad:linear-gradient(180deg,'+d1+' 0%,'+d2+' 55%,'+d3+' 110%)';
    return '.brandc,.brandc body{'+light+'}\n.brandc[data-theme="dark"],.brandc[data-theme="dark"] body{'+dark+'}';
  }
  function styleEl(){var s=document.getElementById('brandStyle');
    if(!s){s=document.createElement('style');s.id='brandStyle';document.head.appendChild(s);}return s;}
  function markSwatch(hex){document.querySelectorAll('#brandSwatches button').forEach(function(b){
    b.classList.toggle('on',(b.dataset.c||'').toLowerCase()===(hex||'').toLowerCase());});}

  function applyBrand(hex,save){
    styleEl().textContent=brandCSS(hex);
    document.documentElement.classList.add('brandc');
    document.body.classList.remove('acc-b');
    document.querySelectorAll('.accsw button').forEach(function(b){b.classList.remove('on');});
    var ci=document.getElementById('brandColor');if(ci)ci.value=hex;
    markSwatch(hex);
    if(save!==false)localStorage.setItem('brandColor',hex);
  }
  function resetBrand(){
    document.documentElement.classList.remove('brandc');
    var s=document.getElementById('brandStyle');if(s)s.textContent='';
    localStorage.removeItem('brandColor');markSwatch('');
    var a=localStorage.getItem('accent')||'a';
    document.body.classList.toggle('acc-b',a==='b');
    document.querySelectorAll('.accsw button').forEach(function(b){b.classList.toggle('on',b.dataset.accent===a);});
    var ci=document.getElementById('brandColor');if(ci)ci.value=DEFAULT;
  }

  /* wire controls (company-level settings in Company Profile) */
  var sw=document.getElementById('brandSwatches');
  if(sw)sw.addEventListener('click',function(e){var b=e.target.closest('button[data-c]');if(b)applyBrand(b.dataset.c,true);});
  var ci=document.getElementById('brandColor');
  if(ci)ci.addEventListener('input',function(){applyBrand(ci.value,true);});
  var br=document.getElementById('brandReset');if(br)br.addEventListener('click',resetBrand);

  /* accent A/B overrides custom brand */
  document.querySelectorAll('.accsw button').forEach(function(b){b.addEventListener('click',function(){
    document.documentElement.classList.remove('brandc');
    var s=document.getElementById('brandStyle');if(s)s.textContent='';
    localStorage.removeItem('brandColor');markSwatch('');});});

  /* restore saved brand on load */
  var savedC=localStorage.getItem('brandColor');if(savedC)applyBrand(savedC,false);
})();

/* ===================== Tooltips ===================== */
(function(){
  var tip=null, cur=null, timer=null;
  function label(el){
    if(el.dataset.tip)return el.dataset.tip;
    if(el.classList.contains('nav-item')&&document.body.classList.contains('rail-collapsed')){
      var l=el.querySelector('.lbl'); return l?l.textContent.trim():'';
    }
    return '';
  }
  function place(el,txt){
    if(tip)tip.remove();
    tip=document.createElement('div'); tip.className='tip';
    tip.textContent=txt; document.body.appendChild(tip);
    var r=el.getBoundingClientRect(), tr=tip.getBoundingClientRect(), gap=9;
    var pos=el.dataset.tipPos||(el.classList.contains('nav-item')?'right':'bottom');
    var x,y;
    if(pos==='right'){x=r.right+gap;y=r.top+r.height/2-tr.height/2;}
    else if(pos==='left'){x=r.left-tr.width-gap;y=r.top+r.height/2-tr.height/2;}
    else if(pos==='top'){x=r.left+r.width/2-tr.width/2;y=r.top-tr.height-gap;}
    else{x=r.left+r.width/2-tr.width/2;y=r.bottom+gap;}
    x=Math.max(8,Math.min(x,innerWidth-tr.width-8));
    y=Math.max(8,Math.min(y,innerHeight-tr.height-8));
    tip.style.left=x+'px'; tip.style.top=y+'px';
    tip.classList.add('t-'+pos);
    void tip.offsetWidth; tip.classList.add('show');
  }
  function hide(){ if(timer){clearTimeout(timer);timer=null;} if(tip){tip.remove();tip=null;} cur=null; }
  document.addEventListener('mouseover',function(e){
    var el=e.target.closest('[data-tip],.nav-item'); if(!el||el===cur)return;
    var txt=label(el); if(!txt){hide();return;}
    hide(); cur=el; timer=setTimeout(function(){place(el,txt);},380);
  });
  document.addEventListener('mouseout',function(e){
    var el=e.target.closest('[data-tip],.nav-item'); if(el&&el===cur)hide();
  });
  document.addEventListener('mousedown',hide);
  window.addEventListener('scroll',hide,true);
})();

/* ===================== Onboarding tour ===================== */
(function(){
  var STEPS=[
    {sel:null,step:'Getting started',t:'Welcome to your Control Panel',
     d:'A 60-second tour of the essentials. You can skip anytime, and replay it later from the help (?) button in the top bar.'},
    {sel:'.rail',pos:'right',step:'Navigation',t:'Everything in one place',
     d:'Jump between Billing, Company Profile, Inventory & Usage, Users, Security and your Sangoma UC apps from this sidebar.'},
    {sel:'#periodPick',pos:'bottom',step:'Reporting period',t:'Pick your date range',
     d:'Choose a preset like Last 3 Months or set a custom range. Every metric on the dashboard updates to match.'},
    {sel:'.svc-pick',pos:'bottom',step:'Service filter',t:'Focus on one service',
     d:'Narrow the dashboard to a single service — Chat, Meet, SMS, Voice or CPaaS.'},
    {sel:'#tsw',pos:'bottom',step:'Appearance',t:'Light or dark, your call',
     d:'Toggle the theme here, and use A / B to switch the portal accent colour.'},
    {sel:'#helpBtn',pos:'bottom',step:'Need a refresher?',t:'Help is always here',
     d:'Re-open this tour whenever you like from the help button. That\u2019s it — you\u2019re ready to go!'}
  ];
  var i=0, ring=null, card=null;
  function el(step){return step.sel?document.querySelector(step.sel):null;}
  function build(){
    ring=document.createElement('div'); ring.className='tour-ring'; ring.style.display='none';
    card=document.createElement('div'); card.className='tour-card';
    document.body.appendChild(ring); document.body.appendChild(card);
  }
  function render(){
    var s=STEPS[i], t=el(s), pad=6;
    var dots=STEPS.map(function(_,n){return '<i class="'+(n===i?'on':'')+'"></i>';}).join('');
    var last=i===STEPS.length-1;
    card.innerHTML='<div class="tour-step">'+s.step+'</div><div class="tour-t">'+s.t+'</div>'+
      '<div class="tour-d">'+s.d+'</div><div class="tour-foot"><div class="tour-dots">'+dots+'</div>'+
      (i>0?'<button class="tour-back" id="tBack">Back</button>':'<button class="tour-skip" id="tSkip">Skip tour</button>')+
      '<button class="tour-next" id="tNext">'+(last?'Finish':(i===0?'Start tour':'Next'))+'</button></div>';
    if(t){
      t.scrollIntoView({block:'nearest',behavior:'smooth'});
      setTimeout(function(){
        var r=t.getBoundingClientRect();
        ring.style.display='block';
        ring.style.left=(r.left-pad)+'px'; ring.style.top=(r.top-pad)+'px';
        ring.style.width=(r.width+pad*2)+'px'; ring.style.height=(r.height+pad*2)+'px';
        var pos=s.pos||'bottom', gap=14, cw=card.offsetWidth||320, ch=card.offsetHeight||190, x,y, arrow;
        if(pos==='right'){x=r.right+gap;y=r.top;arrow='a-left';}
        else if(pos==='left'){x=r.left-cw-gap;y=r.top;arrow='a-right';}
        else if(pos==='top'){x=r.left;y=r.top-ch-gap;arrow='a-bottom';}
        else{x=r.left;y=r.bottom+gap;arrow='a-top';}
        x=Math.max(12,Math.min(x,innerWidth-cw-12));
        y=Math.max(12,Math.min(y,innerHeight-ch-12));
        card.className='tour-card '+arrow; card.style.left=x+'px'; card.style.top=y+'px';
        card.style.transform='none';
      },160);
    }else{
      ring.style.display='none';
      card.className='tour-card center a-none'; card.style.left=''; card.style.top=''; card.style.transform='';
    }
    var nx=document.getElementById('tNext'); if(nx)nx.onclick=next;
    var sk=document.getElementById('tSkip'); if(sk)sk.onclick=end;
    var bk=document.getElementById('tBack'); if(bk)bk.onclick=function(){i=Math.max(0,i-1);render();};
  }
  function next(){ if(i>=STEPS.length-1){end();return;} i++; render(); }
  function end(){
    if(ring)ring.remove(); if(card)card.remove(); ring=card=null;
    document.removeEventListener('keydown',onKey);
    try{localStorage.setItem('cpTourDone','1');}catch(e){}
  }
  function onKey(e){ if(e.key==='Escape')end();
    else if(e.key==='ArrowRight'||e.key==='Enter')next();
    else if(e.key==='ArrowLeft'&&i>0){i--;render();} }
  function start(){ i=0; if(!ring)build(); document.addEventListener('keydown',onKey); render(); }
  var hb=document.getElementById('helpBtn'); if(hb)hb.addEventListener('click',start);
  window.addEventListener('resize',function(){ if(ring)render(); });
  try{ if(!localStorage.getItem('cpTourDone'))setTimeout(start,650); }catch(e){}
})();
