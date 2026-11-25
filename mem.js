const URLS=[],mkurl=b=>{const u=URL.createObjectURL(b);URLS.push(u);return u};
async function shrink(f){try{const b=await createImageBitmap(f),s=Math.min(1,1600/Math.max(b.width,b.height)),c=document.createElement('canvas');c.width=Math.round(b.width*s);c.height=Math.round(b.height*s);c.getContext('2d').drawImage(b,0,0,c.width,c.height);return await new Promise(r=>c.toBlob(r,'image/jpeg',.82))}catch(e){return f}}
const LF=d=>fmt(pd(d),{day:'numeric',month:'long',year:'numeric'});
async function recuerdos(q=''){
 const [N,P]=await Promise.all([DB.all('entries'),DB.all('photos')]),ent=Object.fromEntries(N.map(x=>[x.date,x]));
 const dates=[...new Set([...N.map(x=>x.date),...P.map(x=>x.date)])].sort().reverse(),t=iso(new Date()),ql=q.trim().toLowerCase();
 const main=d=>{const a=P.filter(p=>p.date===d);return a.find(p=>p.main)||a[0]};
 const list=dates.filter(d=>{const e=ent[d]||{};return !ql||((e.title||'')+' '+(e.text||'')+' '+d+' '+LF(d)).toLowerCase().includes(ql)});
 const same=dates.filter(d=>d.slice(5)===t.slice(5)&&d<t);
 const card=d=>{const e=ent[d]||{},m=main(d);return `<div class="card"><div class="row" data-r="${d}" style="cursor:pointer">${m?`<img class="th" src="${mkurl(m.blob)}">`:'<i class="th"></i>'}<div><b>${esc(e.title||'Sin título')}</b><div class="empty">${LF(d)}</div></div></div></div>`};
 let h='',last='';for(const d of list){const g=fmt(pd(d),{month:'long',year:'numeric'});if(g!==last){h+=`<h2 style="text-transform:capitalize">${g}</h2>`;last=g}h+=card(d)}
 view.innerHTML=`<h1>Recuerdos</h1><div class="card fm"><input id="q" type="search" placeholder="Buscar por título, fecha o palabras" value="${esc(q)}"><button class="pri" data-r="${t}">Escribir el recuerdo de hoy</button></div>
 ${same.length&&!ql?`<h2>Un día como hoy</h2>${same.map(card).join('')}`:''}${h||'<div class="card empty">No hay recuerdos para mostrar. Escribe el primero.</div>'}`;
 view.querySelector('#q').onchange=e=>recuerdos(e.target.value);
 view.onclick=e=>{const b=e.target.closest('[data-r]');if(b)memDia(b.dataset.r)}}
async function memDia(d){
 const [en,P,E,T]=await Promise.all([DB.get('entries',d),DB.all('photos'),DB.all('events'),DB.all('tasks')]);
 const e=en||{title:'',text:''},ph=P.filter(p=>p.date===d).sort((a,b)=>a.created-b.created),ev=E.filter(v=>occurs(v,d)),dn=T.filter(x=>x.date===d&&x.done);
 view.onclick=null;window.scrollTo(0,0);
 view.innerHTML=`<button class="mini" id="bk">‹ Recuerdos</button><div class="sub" style="margin-top:12px">${fmt(pd(d),{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
 <form id="mf" class="card fm"><input name="title" value="${esc(e.title)}" placeholder="Título del día (opcional)" maxlength="100"><h2 style="margin:6px 0 0">Así fue mi día</h2>
 <div class="chips">${['¿Qué hice hoy?','¿Qué fue lo mejor del día?','¿Con quién compartí este momento?','¿Qué quiero recordar?','¿Cómo me sentí?'].map(p=>`<button type="button" class="mini" data-p="${p}">${p}</button>`).join('')}</div>
 <textarea name="text" style="min-height:140px" placeholder="Escribe con libertad…">${esc(e.text)}</textarea><button class="pri">Guardar recuerdo</button></form>
 <h2>Fotografías</h2><div class="card"><div class="two"><label class="fl">Elegir fotos<input type="file" id="fi" accept="image/*" multiple hidden></label><label class="fl">Tomar foto<input type="file" id="fc" accept="image/*" capture="environment" hidden></label></div>
 <div class="grid">${ph.map(p=>`<img src="${mkurl(p.blob)}" data-ph="${p.id}" class="${p.main?'main':''}">`).join('')}</div></div>
 ${ev.length||dn.length?`<h2>Ese día</h2><div class="card empty">${[...ev.map(v=>'• '+esc(v.title)),...dn.map(x=>'✓ '+esc(x.title))].join('<br>')}</div>`:''}`;
 const f=view.querySelector('#mf');
 view.querySelector('#bk').onclick=()=>recuerdos();
 view.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const t=f.elements.text;t.value+=(t.value&&!t.value.endsWith('\n')?'\n':'')+b.dataset.p+' ';t.focus()});
 f.onsubmit=async ev=>{ev.preventDefault();const x={date:d,title:f.elements.title.value.trim(),text:f.elements.text.value};
  try{await DB.put('entries',x);const b=await DB.get('entries',d);if(!b||b.text!==x.text||b.title!==x.title)throw 0;toast('✓ Recuerdo guardado')}catch(err){toast('No se pudo guardar. Inténtalo de nuevo.',true)}};
 const add=async inp=>{const fs=[...inp.files];if(!fs.length)return;let n=0;
  for(const fl of fs){const p={id:DB.uid(),date:d,blob:await shrink(fl),desc:'',main:!ph.length&&!n,created:Date.now()+n};try{await DB.put('photos',p);if(await DB.get('photos',p.id))n++}catch(x){}}
  await memDia(d);toast(n===fs.length?`✓ ${n} foto(s) guardada(s)`:'No se pudieron guardar todas las fotos',n!==fs.length)};
 view.querySelector('#fi').onchange=e=>add(e.target);view.querySelector('#fc').onchange=e=>add(e.target);
 view.querySelectorAll('[data-ph]').forEach(i=>i.onclick=()=>{const p=ph.find(q=>q.id===i.dataset.ph),o=document.createElement('div');o.className='ov';
  o.innerHTML=`<img src="${mkurl(p.blob)}"><div class="empty" style="color:#fff;text-align:center">${esc(p.desc||'')}</div><div class="two"><button class="sec" data-a="d">Descripción</button><button class="sec" data-a="m">Hacer principal</button><button class="sec" data-a="x">Eliminar</button><button class="sec" data-a="c">Cerrar</button></div>`;
  o.onclick=async ev=>{const a=ev.target.dataset.a;if(!a)return;
   if(a==='d'){const t=prompt('Descripción de la foto',p.desc||'');if(t===null)return;p.desc=t;await DB.put('photos',p)}
   if(a==='m'){for(const q of ph)if(q.main&&q.id!==p.id){q.main=false;await DB.put('photos',q)}p.main=true;await DB.put('photos',p)}
   if(a==='x'){if(!confirm('¿Eliminar esta foto?'))return;await DB.del('photos',p.id);const r=ph.find(q=>q.id!==p.id);if(p.main&&r){r.main=true;await DB.put('photos',r)}}
   o.remove();if(a!=='c')memDia(d)};document.body.appendChild(o)})}
