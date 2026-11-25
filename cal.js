const pd=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const ymd=s=>{const[y,m,d]=s.split('-').map(Number);return[y,m-1,d]};
const days=(a,b)=>Math.round((Date.UTC(...ymd(b))-Date.UTC(...ymd(a)))/864e5);
const shift=(s,n,u)=>{const x=pd(s);u==='m'?x.setMonth(x.getMonth()+n,1):x.setDate(x.getDate()+n);return iso(x)};
const CATS0=[['Personal','#E8D2D2'],['Trabajo','#C9D2C1'],['Familia','#E9DFD2'],['Amigos','#D9C3A5'],['Salud','#B9CDB3'],['Celebraciones','#E6C1B8'],['Viajes','#C1CFD6'],['Otros','#D8D0C8']];
const cats=()=>cfg.cats||CATS0;
const catColor=n=>(cats().find(c=>c[0]===n)||['','#D8D0C8'])[1];
const PR={baja:'Baja',media:'Media',alta:'Alta'};
let cs={mode:'mes',d:null};
function occurs(e,d){if(d<e.date)return false;const r=e.repeat||'';if(!r)return d===e.date;const a=ymd(e.date),b=ymd(d);
 if(r==='d')return true;if(r==='w')return days(e.date,d)%7===0;if(r==='m')return a[2]===b[2];if(r==='y')return a[1]===b[1]&&a[2]===b[2];return false}
function dayHtml(E,T,d){const ev=E.filter(v=>occurs(v,d)).sort((a,b)=>(a.start||'').localeCompare(b.start||'')),ts=T.filter(v=>v.date===d);
 return `<div class="card">${ev.length?ev.map(v=>`<div class="row" data-e="${v.id}" style="cursor:pointer"><i class="sw" style="background:${v.color||catColor(v.cat)}"></i><div><b>${esc(v.title)}</b><div class="empty">${esc([v.start&&(v.start+(v.end?'–'+v.end:'')),v.cat,v.loc].filter(Boolean).join(' · '))}</div></div></div>`).join(''):'<div class="empty">Sin eventos este día.</div>'}<button class="pri" id="ne" style="margin-top:8px">Nuevo evento</button></div>
<h2>Tareas</h2><div class="card">${ts.length?ts.map(x=>`<div class="row"><button class="ck ${x.done?'on':''}" data-ck="${x.id}">${x.done?'✓':''}</button><span class="${x.done?'done':''}">${esc(x.title)}</span></div>`).join(''):'<div class="empty">Sin tareas este día.</div>'}</div>`}
async function calendario(){
 if(!cs.d)cs.d=iso(new Date());
 const [E,T]=await Promise.all([DB.all('events'),DB.all('tasks')]),d=cs.d,x=pd(d),td=iso(new Date());let body='',title='';
 const dot=k=>(E.some(v=>occurs(v,k))?'<i class="dt e"></i>':'')+(T.some(v=>v.date===k)?'<i class="dt t"></i>':'');
 if(cs.mode==='mes'){title=fmt(x,{month:'long',year:'numeric'});
  const first=(new Date(x.getFullYear(),x.getMonth(),1).getDay()+6)%7,n=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();
  body='<div class="card"><div class="cal">'+[...'LMMJVSD'].map(c=>`<b>${c}</b>`).join('')+'<span></span>'.repeat(first);
  for(let i=1;i<=n;i++){const k=iso(new Date(x.getFullYear(),x.getMonth(),i));body+=`<span class="${k===td?'hoy':''}" data-d="${k}">${i}<br>${dot(k)}</span>`}
  body+='</div></div>'}
 else if(cs.mode==='semana'){const mon=shift(d,-((x.getDay()+6)%7),'d');title='Semana del '+fmt(pd(mon),{day:'numeric',month:'long'});
  for(let i=0;i<7;i++){const k=shift(mon,i,'d');body+=`<div class="row" data-d="${k}" style="cursor:pointer"><b style="width:70px;text-transform:capitalize">${fmt(pd(k),{weekday:'short',day:'numeric'})}</b><span>${E.filter(v=>occurs(v,k)).map(v=>esc(v.title)).join(' · ')||'—'} ${dot(k)}</span></div>`}
  body=`<div class="card">${body}</div>`}
 else{title=fmt(x,{weekday:'long',day:'numeric',month:'long',year:'numeric'});body=dayHtml(E,T,d)}
 view.innerHTML=`<h1>Calendario</h1><div class="seg">${[['mes','Mes'],['semana','Semana'],['dia','Día']].map(([k,l])=>`<button data-m="${k}" class="${cs.mode===k?'on':''}">${l}</button>`).join('')}</div>
 <div class="nav">${cs.mode==='mes'?'<button data-s="-12">«</button>':''}<button data-s="-1">‹</button><span class="sub">${title}</span><button data-s="1">›</button>${cs.mode==='mes'?'<button data-s="12">»</button>':''}</div>${body}`;
 view.onclick=async ev=>{const b=ev.target.closest('[data-m],[data-d],[data-e],[data-ck],[data-s],#ne');if(!b)return;
  if(b.dataset.m)cs.mode=b.dataset.m;
  else if(b.dataset.d){cs.d=b.dataset.d;cs.mode='dia'}
  else if(b.dataset.s){const s=+b.dataset.s;cs.d=(Math.abs(s)===12||cs.mode==='mes')?shift(d,s,'m'):shift(d,s*(cs.mode==='semana'?7:1),'d')}
  else if(b.dataset.e)return eventForm(E.find(q=>q.id===b.dataset.e));
  else if(b.id==='ne')return eventForm({date:d});
  else if(b.dataset.ck){const t=T.find(q=>q.id===b.dataset.ck);t.done=!t.done;await DB.put('tasks',t)}
  calendario()}}
function eventForm(e){const isNew=!e.id;e={title:'',start:'',end:'',desc:'',cat:'Personal',loc:'',prio:'media',rem:'',repeat:'',...e};
 const opt=(a,v)=>a.map(([k,l])=>`<option value="${k}" ${k===v?'selected':''}>${l}</option>`).join('');
 view.onclick=null;window.scrollTo(0,0);
 view.innerHTML=`<h1>${isNew?'Nuevo evento':'Editar evento'}</h1><form id="ef" class="card fm">
 <label>Título<input name="title" value="${esc(e.title)}" required maxlength="100"></label>
 <label>Fecha (cámbiala para reprogramar)<input type="date" name="date" value="${e.date}" required></label>
 <div class="two"><label>Inicio<input type="time" name="start" value="${e.start}"></label><label>Fin<input type="time" name="end" value="${e.end}"></label></div>
 <label>Categoría<select name="cat">${cats().map(c=>`<option ${c[0]===e.cat?'selected':''}>${esc(c[0])}</option>`).join('')}<option value="__n">+ Nueva categoría…</option></select></label>
 <label>Ubicación (opcional)<input name="loc" value="${esc(e.loc)}" maxlength="100"></label>
 <label>Descripción<textarea name="desc">${esc(e.desc)}</textarea></label>
 <div class="two"><label>Prioridad<select name="prio">${opt(Object.entries(PR),e.prio)}</select></label>
 <label>Repetición<select name="repeat">${opt([['','No se repite'],['d','Cada día'],['w','Cada semana'],['m','Cada mes'],['y','Cada año']],e.repeat)}</select></label></div>
 <label>Recordatorio<select name="rem">${opt([['','Sin recordatorio'],['0','En el momento'],['5','5 min antes'],['15','15 min antes'],['30','30 min antes'],['60','1 hora antes'],['1440','1 día antes']],e.rem)}</select></label>
 <div class="empty">El recordatorio se guarda; los avisos del sistema se activan en la etapa 5.</div>
 <div class="two"><button class="pri">Guardar</button><button type="button" class="sec" id="cn">Cancelar</button></div>
 ${isNew?'':'<div class="two"><button type="button" class="sec" id="dp">Duplicar</button><button type="button" class="sec" id="dl">Eliminar</button></div>'}</form>`;
 const f=view.querySelector('#ef'),sel=f.cat;
 sel.onchange=async()=>{if(sel.value!=='__n')return;const n=(prompt('Nombre de la nueva categoría')||'').trim();
  if(!n){sel.value=e.cat;return}const c=[...cats(),[n,CATS0[cats().length%CATS0.length][1]]];cfg.cats=c;await DB.put('settings',{key:'cats',value:c});sel.add(new Option(n,n),sel.options.length-1);sel.value=n};
 f.querySelector('#cn').onclick=()=>go(tab);
 f.onsubmit=async ev=>{ev.preventDefault();const o=Object.fromEntries(new FormData(f));
  if(o.end&&o.start&&o.end<o.start){toast('La hora de fin es anterior a la de inicio.',true);return}
  const x={...e,...o,id:e.id||DB.uid(),color:catColor(o.cat)};
  try{await DB.put('events',x);if(!await DB.get('events',x.id))throw 0;cs.d=x.date;cs.mode='dia';go('calendario');toast('✓ Evento guardado')}
  catch(err){toast('No se pudo guardar. Revisa el espacio de tu celular e inténtalo de nuevo.',true)}};
 const dp=f.querySelector('#dp');if(dp){dp.onclick=async()=>{const c={...e,id:DB.uid(),title:e.title+' (copia)'};await DB.put('events',c);const ok=!!await DB.get('events',c.id);cs.d=c.date;cs.mode='dia';go('calendario');toast(ok?'✓ Evento duplicado':'No se pudo duplicar',!ok)};
  f.querySelector('#dl').onclick=async()=>{if(!confirm('¿Eliminar este evento? Si se repite, se eliminan todas sus repeticiones.'))return;await DB.del('events',e.id);const ok=!await DB.get('events',e.id);go('calendario');toast(ok?'✓ Evento eliminado':'No se pudo eliminar',!ok)}}}
async function tareas(){
 const T=await DB.all('tasks'),t=iso(new Date()),by=(a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''));
 const G=[['Vencidas',T.filter(x=>!x.done&&x.date<t)],['Hoy',T.filter(x=>x.date===t)],['Próximas',T.filter(x=>!x.done&&x.date>t)]];
 const row=x=>`<div class="row"><button class="ck ${x.done?'on':''}" data-ck="${x.id}">${x.done?'✓':''}</button><div style="flex:1"><span class="${x.done?'done':''}" data-ren="${x.id}">${esc(x.title)}</span><div class="empty">${fmt(pd(x.date),{day:'numeric',month:'short'})}${x.time?' · '+x.time:''} · ${PR[x.prio||'media']}</div></div>${!x.done&&x.date<t?`<button class="mini" data-hoy="${x.id}">Hoy</button>`:''}<button class="mini" data-del="${x.id}" aria-label="Eliminar">✕</button></div>`;
 view.innerHTML=`<h1>Tareas</h1><form id="tf" class="card fm"><input name="title" placeholder="Nueva tarea" required maxlength="120">
 <div class="two"><input type="date" name="date" value="${t}" required><input type="time" name="time"></div>
 <select name="prio">${Object.entries(PR).map(([k,l])=>`<option value="${k}" ${k==='media'?'selected':''}>Prioridad ${l.toLowerCase()}</option>`).join('')}</select><button class="pri">Guardar tarea</button></form>
 ${G.map(([n,a])=>a.length?`<h2>${n}</h2><div class="card">${a.sort(by).map(row).join('')}</div>`:'').join('')}`;
 view.querySelector('#tf').onsubmit=async ev=>{ev.preventDefault();const x={...Object.fromEntries(new FormData(ev.target)),id:DB.uid(),done:false,created:Date.now()};
  try{await DB.put('tasks',x);if(!await DB.get('tasks',x.id))throw 0;await tareas();toast('✓ Tarea guardada')}catch(err){toast('No se pudo guardar. Inténtalo de nuevo.',true)}};
 view.onclick=async ev=>{const b=ev.target.closest('[data-ck],[data-del],[data-hoy],[data-ren]');if(!b)return;
  const id=b.dataset.ck||b.dataset.del||b.dataset.hoy||b.dataset.ren,x=T.find(q=>q.id===id);
  if(b.dataset.ck)x.done=!x.done;else if(b.dataset.hoy)x.date=t;
  else if(b.dataset.ren){const n=(prompt('Editar tarea',x.title)||'').trim();if(!n)return;x.title=n}
  else{if(!confirm('¿Eliminar esta tarea?'))return;await DB.del('tasks',id);return tareas()}
  await DB.put('tasks',x);tareas()}}
