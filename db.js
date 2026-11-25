const DB=(()=>{let p;
const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('myday',1);
r.onupgradeneeded=()=>{const d=r.result;
d.createObjectStore('events',{keyPath:'id'}).createIndex('date','date');
d.createObjectStore('tasks',{keyPath:'id'}).createIndex('date','date');
d.createObjectStore('entries',{keyPath:'date'});
d.createObjectStore('photos',{keyPath:'id'}).createIndex('date','date');
d.createObjectStore('settings',{keyPath:'key'});};
r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}));
const tx=async(s,m,f)=>{const d=await open();return new Promise((res,rej)=>{const t=d.transaction(s,m);const q=f(t.objectStore(s));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);});};
return{
put:(s,v)=>tx(s,'readwrite',o=>o.put(v)),
del:(s,k)=>tx(s,'readwrite',o=>o.delete(k)),
get:(s,k)=>tx(s,'readonly',o=>o.get(k)),
all:s=>tx(s,'readonly',o=>o.getAll()),
persist:async()=>{try{return navigator.storage&&navigator.storage.persist?await navigator.storage.persist():null}catch(e){return null}},
uid:()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7)};})();
