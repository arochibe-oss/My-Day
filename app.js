const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fmt=(d,o)=>new Intl.DateTimeFormat('es-MX',o).format(d);
const TABS=[['inicio','Inicio'],['calendario','Calendario'],['tareas','Tareas'],['recuerdos','Recuerdos'],['perfil','Perfil']];
const SOON={calendario:['Calendario','Vistas mensual, semanal y diaria, y eventos con recordatorios. Llega en la etapa 2.'],tareas:['Tareas','Listas personalizadas, prioridades y fechas límite. Llega en la etapa 2.'],recuerdos:['Recuerdos','Tu diario, fotografías, línea del tiempo y "Un día como hoy". Llega en las etapas 3 y 4.']};
let tab='inicio',cfg={};
const view=document.getElementById('view');
function toast(msg,bad){const o=document.querySelector('.toast');if(o)o.remove();const d=document.createElement('div');d.className='toast'+(bad?' bad':'');d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}
function theme(){document.documentElement.dataset.theme=cfg.theme||'auto'}
async function inicio(){
 const now=new Date(),t=iso(now),h=now.getHours();
 const [allT,allE]=await Promise.all([DB.all('tasks'),DB.all('events')]);
 const tasks=allT.filter(x=>x.date===t),evs=allE.filter(x=>occurs(x,t)).sort((a,b)=>(a.start||'').localeCompare(b.start||''));
 const marks=new Set(allT.map(x=>x.date));
 const y=now.getFullYear(),m=now.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate();
 let cells='';for(const d of 'LMMJVSD')cells+=`<b>${d}</b>`;
 for(let i=0;i<first;i++)cells+='<span></span>';
 for(let d=1;d<=days;d++){const k=iso(new Date(y,m,d));cells+=`<span class="${d===now.getDate()?'hoy':''} ${(marks.has(k)||allE.some(e=>occurs(e,k)))?'dot':''}">${d}</span>`}
 const done=tasks.filter(x=>x.done).length,pct=tasks.length?Math.round(done/tasks.length*100):0;
 const greet=h<12?'Buenos días':h<20?'Buenas tardes':'Buenas noches';
 view.innerHTML=`<div class="sub">${fmt(now,{weekday:'long'})}</div>
 <h1>${greet}${cfg.name?', '+esc(cfg.name):''}</h1><div class="sub">${fmt(now,{day:'numeric',month:'long',year:'numeric'})}</div>
 <div class="card" style="margin-top:16px"><div class="sub" style="margin-bottom:6px">${fmt(now,{month:'long',year:'numeric'})}</div><div class="cal">${cells}</div></div>
 <h2>Tu día de hoy</h2>
 <div class="card"><div class="empty">${evs.length?evs.map(e=>`<div class="row"><i class="sw" style="background:${e.color||catColor(e.cat)};height:24px"></i>${esc(e.start||'')} ${esc(e.title)}</div>`).join(''):'No tienes eventos hoy.'}</div><button class="pri" id="ne" style="margin-top:8px">Nuevo evento</button></div>
 <div class="card"><div>${tasks.length?`${done} de ${tasks.length} tareas completadas`:'Aún no tienes tareas para hoy.'}</div>
 ${tasks.length?`<div class="bar"><i style="width:${pct}%"></i></div>`:''}
 ${tasks.map(x=>`<div class="row"><button class="ck ${x.done?'on':''}" data-id="${x.id}" aria-label="Marcar tarea">${x.done?'✓':''}</button><span class="${x.done?'done':''}">${esc(x.title)}</span></div>`).join('')}
 <form id="f"><input id="n" placeholder="Agregar una tarea para hoy" maxlength="120"><button class="pri">Guardar</button></form></div>`;
 view.querySelectorAll('.ck').forEach(b=>b.onclick=async()=>{const x=tasks.find(q=>q.id===b.dataset.id);x.done=!x.done;await DB.put('tasks',x);inicio()});
 view.querySelector('#ne').onclick=()=>eventForm({date:t});
 view.querySelector('#f').onsubmit=async e=>{e.preventDefault();const v=view.querySelector('#n').value.trim();if(!v)return;
  const x={id:DB.uid(),title:v,date:t,done:false,created:Date.now()};
  try{await DB.put('tasks',x);const back=await DB.get('tasks',x.id);if(!back)throw 0;await inicio();toast('✓ Tarea guardada')}
  catch(err){toast('No se pudo guardar. Revisa el espacio de tu celular e inténtalo de nuevo.',true)}};
}
async function perfil(){
 const ok=await DB.persist();
 view.innerHTML=`<h1>Perfil</h1><h2>Tu nombre</h2><div class="card"><input id="nm" value="${esc(cfg.name||'')}" placeholder="Cómo quieres que te salude" maxlength="40"></div>
 <h2>Apariencia</h2><div class="card"><select id="th"><option value="auto">Automático</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></div>
 <h2>Tus datos</h2><div class="card empty">Todo se guarda solo en este celular. ${ok===true?'El almacenamiento está protegido contra borrado automático.':'Tu navegador puede borrar datos si falta espacio; los respaldos (etapa 5) te protegerán.'}</div>`;
 const th=view.querySelector('#th');th.value=cfg.theme||'auto';
 th.onchange=async()=>{cfg.theme=th.value;await DB.put('settings',{key:'theme',value:cfg.theme});theme()};
 view.querySelector('#nm').onchange=async e=>{cfg.name=e.target.value.trim();await DB.put('settings',{key:'name',value:cfg.name})};
}
function soon(k){const[a,b]=SOON[k];view.innerHTML=`<h1>${a}</h1><div class="card" style="margin-top:16px">${b}</div>`}
function go(k){tab=k;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===k));view.onclick=null;window.scrollTo(0,0);k==='inicio'?inicio():k==='perfil'?perfil():k==='calendario'?calendario():k==='tareas'?tareas():soon(k)}
(async()=>{
 document.getElementById('tabs').innerHTML=TABS.map(([k,l])=>`<button data-t="${k}">${l}</button>`).join('');
 document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>go(b.dataset.t));
 try{(await DB.all('settings')).forEach(s=>cfg[s.key]=s.value)}catch(e){}
 theme();go('inicio');
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
