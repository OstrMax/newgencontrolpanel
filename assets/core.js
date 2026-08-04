(function(){var t=document.getElementById('tsw');
 function set(d){document.documentElement.setAttribute('data-theme',d?'dark':'light');
   t.setAttribute('aria-checked',d?'true':'false');t.querySelector('.l').textContent=d?'Dark':'Light';}
 set(document.documentElement.getAttribute('data-theme')==='dark');
 t.addEventListener('click',function(){set(document.documentElement.getAttribute('data-theme')!=='dark');});
 var n=document.getElementById('navT');
 n.addEventListener('click',function(){document.body.classList.toggle('nav-open');});
 var rt=document.getElementById('railT');
 if(rt){
  if(localStorage.getItem('railCollapsed')==='1'){document.body.classList.add('rail-collapsed');rt.setAttribute('aria-pressed','true');rt.title='Expand sidebar';rt.setAttribute('aria-label','Expand sidebar');}
  rt.addEventListener('click',function(){var c=document.body.classList.toggle('rail-collapsed');localStorage.setItem('railCollapsed',c?'1':'0');rt.setAttribute('aria-pressed',c?'true':'false');rt.title=c?'Expand sidebar':'Collapse sidebar';rt.setAttribute('aria-label',rt.title);});
 }
 (function(){
  var tip=document.createElement('div');tip.className='rail-tip';document.body.appendChild(tip);
  function show(e){if(!document.body.classList.contains('rail-collapsed')||window.innerWidth<=820)return;
   var it=e.currentTarget,l=it.querySelector('.lbl');if(!l)return;var r=it.getBoundingClientRect();
   tip.textContent=l.textContent;tip.style.top=(r.top+r.height/2)+'px';tip.style.left=(r.right+12)+'px';tip.classList.add('on');}
  function hide(){tip.classList.remove('on');}
  document.querySelectorAll('.rail .nav-item').forEach(function(it){
   it.addEventListener('mouseenter',show);it.addEventListener('mouseleave',hide);it.addEventListener('click',hide);});
 })();
 (function(){var sw=document.querySelector('.accsw');if(!sw)return;
  function set(v){document.body.classList.toggle('acc-b',v==='b');
   sw.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.accent===v);});
   localStorage.setItem('accent',v);}
  sw.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){set(b.dataset.accent);});});
  set(localStorage.getItem('accent')||'a');})();
 function sn(){n.style.display=window.innerWidth<=820?'grid':'none';}
 window.addEventListener('resize',sn);sn();})();
function donut(el,segs,size,sw){var C=2*Math.PI*((size-sw)/2),r=(size-sw)/2,c=size/2,o=0,a='';
 var tot=segs.reduce(function(x,y){return x+y.v},0);
 var real=segs.filter(function(s){return s.c!=='transparent';}).length;
 var g=real>1?3:0; /* gap between visible slices; none for single-value rings */
 segs.forEach(function(s){var len=s.v/tot*C;
  if(s.c!=='transparent'){var dash=Math.max(len-g,0.01);
   a+='<circle cx="'+c+'" cy="'+c+'" r="'+r+'" fill="none" stroke="'+s.c+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+dash+' '+(C-dash)+'" stroke-dashoffset="'+(-(o+g/2))+'"/>';}
  o+=len;});
 var t=document.getElementById(el); if(t)t.innerHTML='<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" style="transform:rotate(-90deg)"><circle cx="'+c+'" cy="'+c+'" r="'+r+'" fill="none" stroke="var(--track)" stroke-width="'+sw+'"/>'+a+'</svg>';}
