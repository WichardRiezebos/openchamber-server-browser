(()=>{var E="openchamber.sdk",f=1;var He=`
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [data-oc-scrolling] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [data-oc-scrolling] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [data-oc-scrolling]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [data-oc-scrolling] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;function Xe(e){let r=e.documentElement;if(r.hasAttribute("data-oc-scrollbar-activity"))return;r.setAttribute("data-oc-scrollbar-activity","");let n=new WeakMap;e.addEventListener("scroll",(u)=>{let a=u.target===e?r:u.target;if(!(a instanceof Element))return;if(!a.hasAttribute("data-oc-scrolling"))a.setAttribute("data-oc-scrolling","");let m=n.get(a);if(m!==void 0)clearTimeout(m);n.set(a,setTimeout(()=>{n.delete(a),a.removeAttribute("data-oc-scrolling")},1000))},{capture:!0,passive:!0})}var Ro=`(${Xe.toString()})(document);`;var Be=128,Ve=65536;var Te=128;var me=65536;var Ft=/^[a-z][a-z0-9-]{0,39}$/;var Pt=(e)=>Object(e)===e&&!Array.isArray(e),ze=(e,r)=>Object.keys(e).every((n)=>r.includes(n)),Dt=(e)=>String(e)===e&&e.length>=1&&e.length<=60,$t=(e)=>String(e)===e&&e.length>=1&&e.length<=80,Ht=(e)=>{if(!Array.isArray(e)||e.length>4)return!1;let r=new Set;for(let n of e){if(!Pt(n)||!Ft.test(n.id)||!Dt(n.label))return!1;if(n.disabled!==void 0&&n.disabled!==!0&&n.disabled!==!1)return!1;if(r.has(n.id))return!1;if(r.add(n.id),n.kind==="button"){if(!ze(n,["kind","id","label","disabled"]))return!1;continue}if(n.kind!=="select"||!ze(n,["kind","id","label","value","options","disabled"]))return!1;if(!$t(n.value)||!Array.isArray(n.options)||n.options.length<1||n.options.length>16)return!1;let u=new Set;for(let a of n.options){if(!Pt(a)||!ze(a,["value","label"])||!$t(a.value)||!Dt(a.label)||u.has(a.value))return!1;u.add(a.value)}if(!u.has(n.value))return!1}return!0};var he=20000000,xe=256;var je=(e)=>("bytes"in e)?e.bytes.byteLength:e.content.length,Xt=(e,r)=>{if(e.path!==r.path||e.readOnly!==r.readOnly)return!1;if(e.encoding==="text"||r.encoding==="text")return e.encoding==="text"&&r.encoding==="text"&&e.content===r.content;if(e.bytes.byteLength!==r.bytes.byteLength)return!1;for(let n=0;n<e.bytes.byteLength;n+=1)if(e.bytes[n]!==r.bytes[n])return!1;return!0};var Bt=/^[A-Za-z0-9_-]{1,80}$/;var Vt=["left","right","top","bottom"];var zt=(e,r=0,n={remaining:16000})=>{if(--n.remaining<0||r>=32)return!1;if(e===null)return!0;let u=Array.isArray(e)?e:Object(e)===e?Object.values(e):[];for(let a of u)if(!zt(a,r+1,n))return!1;return!0},Ke=(e)=>{if(e===null||e===!0||e===!1)return!0;if(Array.isArray(e))return Object.keys(e).every((r)=>/^(0|[1-9]\d*)$/.test(r)&&Number(r)<e.length)&&e.every(Ke);if(Object(e)===e){let r=Object.getPrototypeOf(e);return(r===null||r===Object.prototype)&&Object.values(e).every(Ke)}return String(e)===e||Number.isFinite(e)},We=(e)=>{try{if(String(e.id)!==e.id||!Bt.test(e.id)||!Number.isFinite(e.anchor.x)||Math.abs(e.anchor.x)>1e5||!Number.isFinite(e.anchor.y)||Math.abs(e.anchor.y)>1e5||!Number.isFinite(e.anchor.width)||!Number.isFinite(e.anchor.height)||e.anchor.width<=0||e.anchor.height<=0||e.anchor.width>1e5||e.anchor.height>1e5||!Number.isInteger(e.width)||e.width<160||e.width>640||!Number.isInteger(e.height)||e.height<48||e.height>480||e.side!==void 0&&!Vt.includes(e.side)||e.focus!==void 0&&e.focus!==!0&&e.focus!==!1||!zt(e.data)||!Ke(e.data))return!1;return JSON.stringify(e.data).length<=16000}catch{return!1}};var Kt=["file","directory","other","missing"],Ye=(e)=>Boolean(e&&"sessionId"in e),Qe=(e)=>Boolean(e&&"sent"in e&&!("sessionId"in e));var Wt=/^[0-9a-f]{7,64}$/i,Ze=(e)=>Wt.test(e),be=500,Ae=32000,Jt=16000,Yt=128,Qt=200,Zt=2000,qt=16000,eo=80,to=200,oo=16000;var ro=2000;var qe=20000,ge=1024,ke=2000000;var ye=64000,Oe=8000,et=4000;var tt=960000;var no=999,so=1e4,pe=500,io=["HOST_UNAVAILABLE","HOST_TIMEOUT","HOST_REJECTED","DISCONNECTED","DISABLED","BAD_PATH","NO_INTEGRATION","NO_SERVICE","SERVICE_FAILED","REQUEST_FAILED","RESPONSE_TOO_LARGE","NO_SESSION","SESSION_BUSY","NOT_GRANTED","NO_DIRECTORY","NOT_FOUND","FILE_TOO_LARGE","DENIED","NO_MODEL","MODEL_FAILED","UNSUPPORTED"],ao=["stopped","starting","ready","failed"],wo=new Set(io),co=(e)=>wo.has(e),lo=(e)=>e&&co(e)?e:"HOST_REJECTED",re=(e)=>{if(e===void 0)return!1;if(e===null||e===!0||e===!1)return!0;if(String(e)===e)return!0;if(Number(e)===e)return Number.isFinite(e);if(Array.isArray(e))return e.every(re);if(Object(e)===e)return Object.values(e).every(re);return!1},po=(e)=>re(e)&&JSON.stringify(e).length<=oo,jt=(e)=>e?.trim().slice(0,to)??"",ne=(e)=>{let r=e.id.trim().slice(0,Yt),n=e.title.trim().slice(0,Qt),u=e.url.trim().slice(0,Zt),a=e.text?.trim().slice(0,qt),m=e.author?.trim().slice(0,eo),R=e.kind==="pull"?"pull":"issue",O={providerId:e.providerId.trim(),id:r,title:n||r,url:u,kind:R};if(a)O.text=a;if(m)O.author=m;if(R==="pull"){let v=jt(e.branches?.head),L=jt(e.branches?.base);if(v&&L)O.branches={head:v,base:L}}if(po(e.data))O.data=e.data;return O},ot=(e)=>{let r=ne(e);if(e.projectId)r.projectId=e.projectId;if(e.navigation)r.navigation=e.navigation;if(e.worktree)r.worktree=e.worktree;return r},rt=(e)=>{let r={text:e.text.trim().slice(0,Jt)};if(e.send)r.send=!0;return r},nt=(e)=>{if(e===null||!Number.isFinite(e))return null;return Math.min(no,Math.max(0,Math.round(e)))},st=(e)=>{if(!Number.isFinite(e))return 0;return Math.min(so,Math.max(0,Math.ceil(e)))};var se=(e)=>e.length>0&&e.length<=ge&&!e.includes("\x00")&&!e.includes("\\");var ve=(e)=>{if(!e.startsWith("/")||e.includes("\x00")||e.includes("\\")||e.includes("://"))return!1;if(e.length>ro)return!1;return!e.split("/").some((n)=>n==="."||n==="..")},Uo=new Set(ao),it=(e)=>Boolean(e&&"status"in e&&Uo.has(String(e.status))&&!("body"in e)),Re=(e)=>Boolean(e&&"status"in e&&"body"in e&&Number.isInteger(e.status)),at=(e)=>Boolean(e&&"content"in e&&String(e.content)===e.content),ct=(e)=>Boolean(e&&"written"in e&&e.written===!0),dt=(e)=>Boolean(e&&"entries"in e&&Array.isArray(e.entries)),Io=new Set(Kt),lt=(e)=>Boolean(e&&"kind"in e&&"size"in e&&Io.has(String(e.kind))&&Number.isFinite(e.size)),pt=(e)=>Boolean(e&&"text"in e&&String(e.text)===e.text&&!("status"in e)),Co=new Set(["workspace","shells","ready","directory","session","connection","settings","session-lifecycle","item","resolve","action","status-control-event","popover-closed","file-open","file-snapshot","file-saved","generate-late"]),Lo=(e)=>Object(e)===e?e:null,Je=(e)=>String(e)===e&&e.length>0,Mo=(e)=>{if(!Je(e.id))return null;if(e.ok===!0){let r={channel:E,v:f,type:"result",id:e.id,ok:!0};if(Object(e.payload)===e.payload)r.payload=e.payload;return r}if(e.ok===!1&&Je(e.error))return{channel:E,v:f,type:"result",id:e.id,ok:!1,error:e.error,code:lo(Je(e.code)?e.code:void 0)};return null},ut=(e)=>{let r=Lo(e);if(!r||r.channel!==E||r.v!==f)return null;if(r.type==="result")return Mo(r);if(!Co.has(String(r.type))||Object(r.payload)!==r.payload)return null;return r};var uo=(e)=>("key"in e)&&("metaKey"in e)&&("ctrlKey"in e),Go=(e)=>(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey&&e.key.toLowerCase()==="s";class c extends Error{code;constructor(e,r){super(r);this.name="HostRequestError",this.code=e}}var Eo=()=>Promise.reject(new c("BAD_PATH",'Request path must start with "/" and stay on the declared origin.')),we=()=>Promise.reject(new c("BAD_PATH",`File path must be 1 to ${ge} characters without NUL or backslash.`)),Ue=(e)=>{if(e===void 0)return;if(Object(e)!==e||Array.isArray(e)||e.scope!==void 0&&e.scope!=="instance"&&e.scope!=="device")throw new c("HOST_REJECTED",'Storage scope must be "instance" or "device".');return e.scope==="device"?"device":void 0},p=(e)=>(e.value+=1,`oc-${e.value}`),Et=(e={})=>{let r=e.target??("window"in globalThis?window:null);if(!r)throw new c("HOST_UNAVAILABLE","No window. connectHost runs in a browser frame.");let n=e.acceptSource??((t)=>t===r.parent),u=e.requestTimeoutMs??qe,a=new Set,m=new Set,R=new Set,O=new Set,v=new Set,L=new Set,Z=new Set,z=new Set,_=new Set,w=new Set,X=[],M=null,B=null,ue=new Set,Ee=new Set,ae=null,ce=null,Pe=!1,ee=new Map,te=new Map,oe=new Map,V=!1,l={value:0},d=null,j=null,de=!1,le=!1,yt=null,Ot=(t)=>{if(!t)return null;return{sessionId:t.id,phase:t.busy?"started":"completed"}},P=(t)=>{r.parent.postMessage(t,"*")},vt=()=>{if(V||r.parent===r||w.size===0||d?.features?.lateGenerateResults!==!0)return;P({channel:E,v:f,type:"generate-late-listen"})},b=(t,o)=>{for(let s of t)try{s(o)}catch(i){console.error(i)}},Rt=(t)=>{if(!(t instanceof MessageEvent))return;if(!n(t.source))return;let o=ut(t.data);if(!o)return;if(o.type==="workspace"){let i=te.get(o.payload.subscriptionId);if(i)b([i],o.payload.snapshot);return}if(o.type==="shells"){let i=oe.get(o.payload.subscriptionId);if(i)b([i],o.payload.snapshot);return}if(o.type==="ready"){if(d=o.payload,j=Ot(o.payload.session),b(a,o.payload),b(m,o.payload.directory),b(R,o.payload.session),j)b(O,j);b(v,o.payload.connection),b(L,o.payload.settings),b(Z,o.payload.item),vt();return}if(o.type==="generate-late"){if(w.size===0)X.push(o.payload);else b(w,o.payload);return}if(o.type==="directory"){if(d)d={...d,directory:o.payload.directory};b(m,o.payload.directory);return}if(o.type==="session"){if(d)d={...d,session:o.payload.session};if(!o.payload.session)j=null;else if(j?.sessionId!==o.payload.session.id)j=Ot(o.payload.session);b(R,o.payload.session);return}if(o.type==="session-lifecycle"){j=o.payload,b(O,o.payload);return}if(o.type==="connection"){if(d)d={...d,connection:o.payload.connection};b(v,o.payload.connection);return}if(o.type==="settings"){if(d)d={...d,settings:o.payload.settings};b(L,o.payload.settings);return}if(o.type==="item"){if(d)d={...d,item:o.payload.item};b(Z,o.payload.item);return}if(o.type==="status-control-event"){b(z,o.payload);return}if(o.type==="popover-closed"){b(_,o.payload);return}if(o.type==="action"){let i=(S)=>{if(!V)P({channel:E,v:f,type:"action-result",id:o.id,payload:S})},T=B;if(!T){i({ok:!1,error:"This extension does not handle background actions."});return}Promise.resolve().then(()=>T(o.payload)).then(()=>i({ok:!0}),(S)=>{let y=(S instanceof Error?S.message:String(S)).trim();i({ok:!1,error:(y||"Action failed.").slice(0,pe)})});return}if(o.type==="file-open"){let i=o.payload;if(ce&&Xt(ce,i))return;ce=i,b(ue,o.payload);return}if(o.type==="file-saved"){b(Ee,o.payload.version);return}if(o.type==="file-snapshot"){let i=(y)=>{if(!V)P({channel:E,v:f,type:"file-snapshot-result",id:o.id,payload:y})},T=(y)=>i({error:(y.trim()||"Could not read the edited file.").slice(0,pe)}),S=ae;if(!S){T("This extension does not edit files.");return}Promise.resolve().then(()=>S(o.payload.purpose)).then((y)=>{if(je(y)>he){T(`The file is over ${he} ${"bytes"in y?"bytes":"characters"}.`);return}if(y.version.length>xe){T(`The snapshot version is over ${xe} characters.`);return}i({snapshot:"bytes"in y?{bytes:y.bytes,version:y.version}:{content:y.content,version:y.version}})},(y)=>T(y instanceof Error?y.message:String(y)));return}if(o.type==="resolve"){let i=(S)=>{P({channel:E,v:f,type:"resolve-result",id:o.id,payload:S})},T=M;if(!T){i({error:"This extension does not resolve commands."});return}Promise.resolve().then(()=>T(o.payload)).then((S)=>i({item:S?ne(S):null}),(S)=>{let y=(S instanceof Error?S.message:String(S)).trim();i({error:(y||"Command failed.").slice(0,pe)})});return}let s=ee.get(o.id);if(!s)return;if(clearTimeout(s.timer),ee.delete(o.id),o.ok){s.resolve(o.payload);return}s.reject(new c(o.code,o.error))};r.addEventListener("message",Rt),P({channel:E,v:f,type:"hello"});let G=(t,o=u)=>{if(V||r.parent===r)return Promise.reject(new c("HOST_UNAVAILABLE","No host frame. This page is not in an iframe."));return new Promise((s,i)=>{let T=setTimeout(()=>{ee.delete(t.id),i(new c("HOST_TIMEOUT","Host did not answer in time."))},o);ee.set(t.id,{resolve:s,reject:i,timer:T}),P(t)})},g=(t)=>G(t).then(()=>{return}),k={channel:E,v:f},De=(t)=>{if(!V&&r.parent!==r)P(t)},wt=()=>De({...k,type:"file-save"}),Ut=(t)=>{if(!uo(t)||!Go(t))return;t.preventDefault(),wt()},It=(t)=>{if(!uo(t)||t.key!=="Escape"||d?.surface!=="popover"||!d.popover)return;t.preventDefault(),Gt(d.popover.id,"escape").catch(()=>{return})},fe=()=>{let t=d?.surface==="popover"?d.popover:void 0;if(!t)return;let o=de||le;if(yt===o)return;yt=o,Nt(t.id,o).catch(()=>{return})},_e=()=>{if(d?.surface!=="popover"||de)return;de=!0,fe()},Ct=(t)=>{if(d?.surface!=="popover"||t.relatedTarget!==null||!de)return;de=!1,fe()},Lt=()=>{if(d?.surface!=="popover"||le)return;le=!0,fe()},Mt=()=>{if(d?.surface!=="popover"||!le)return;le=!1,fe()},F=(t,o=1024)=>{if(!t.trim()||t.length>o)throw new c("HOST_REJECTED",`Identity must contain 1 to ${o} characters.`)},$e=async(t)=>{if(t.kind!=="projects")F(t.projectId);let o=await G({...k,type:"workspace-read",id:p(l),payload:t});if(!o||!("kind"in o)||!("state"in o)||o.kind!==t.kind)throw new c("HOST_REJECTED","Host did not return workspace data.");return o},Fe=async(t,o)=>{if(t.kind!=="projects")F(t.projectId);let s=p(l);te.set(s,o);try{await g({...k,type:"workspace-subscribe",id:p(l),payload:{subscriptionId:s,query:t}})}catch(i){if(te.delete(s),!V)P({...k,type:"workspace-unsubscribe",id:p(l),payload:{subscriptionId:s}});throw i}return()=>{if(!te.delete(s)||V)return;P({...k,type:"workspace-unsubscribe",id:p(l),payload:{subscriptionId:s}})}},vo=async(t,o)=>{if(t.kind==="session")F(t.sessionId);if(t.kind==="project")F(t.projectId);let s=p(l);oe.set(s,o);try{await g({...k,type:"shells-subscribe",id:p(l),payload:{subscriptionId:s,scope:t}})}catch(i){if(oe.delete(s),!V)P({...k,type:"shells-unsubscribe",id:p(l),payload:{subscriptionId:s}});throw i}return()=>{if(!oe.delete(s)||V)return;P({...k,type:"shells-unsubscribe",id:p(l),payload:{subscriptionId:s}})}},Se=async(t)=>{if("key"in t&&(t.key.length===0||t.key.length>Be))throw new c("HOST_REJECTED","Storage key must contain 1 to 128 characters.");if(t.op==="set"&&!re(t.value))throw new c("HOST_REJECTED","Storage values must be JSON.");if(t.op==="set"&&new TextEncoder().encode(JSON.stringify(t.value)).length>Ve)throw new c("HOST_REJECTED","Storage value exceeds 64 KiB.");if(t.scope==="device"&&d?.features?.deviceStorage!==!0)throw new c("UNSUPPORTED","This host does not support device storage.");let o=await G({...k,type:"storage",id:p(l),payload:t});if(!o||!("storage"in o)||o.op!==t.op)throw new c("HOST_REJECTED","Host did not return storage data.");return o},Gt=(t,o)=>d?.features?.popovers!==!0&&!(d?.surface==="popover"&&d.popover?.id===t)?Promise.reject(new c("UNSUPPORTED","This host does not support popovers.")):g({...k,type:"popover-close",id:p(l),payload:o?{id:t,reason:o}:{id:t}}),Nt=(t,o)=>d?.features?.popovers!==!0&&!(d?.surface==="popover"&&d.popover?.id===t)?Promise.reject(new c("UNSUPPORTED","This host does not support popovers.")):g({...k,type:"popover-anchor",id:p(l),payload:{id:t,active:o}});return r.addEventListener("keydown",It,!0),r.addEventListener("pointerover",_e),r.addEventListener("pointermove",_e),r.addEventListener("pointerout",Ct),r.addEventListener("focus",Lt),r.addEventListener("blur",Mt),{onAction:(t)=>(B=t,()=>{if(B===t)B=null}),listProjects:async()=>{let t=await $e({kind:"projects"});if(t.kind!=="projects")throw new c("HOST_REJECTED","Expected projects.");return t},listWorktrees:async(t)=>{let o=await $e({kind:"worktrees",projectId:t});if(o.kind!=="worktrees")throw new c("HOST_REJECTED","Expected worktrees.");return o},listSessions:async(t)=>{let o=await $e({kind:"sessions",projectId:t});if(o.kind!=="sessions")throw new c("HOST_REJECTED","Expected sessions.");return o},onProjects:(t)=>Fe({kind:"projects"},(o)=>{if(o.kind==="projects")t(o)}),onWorktrees:(t,o)=>Fe({kind:"worktrees",projectId:t},(s)=>{if(s.kind==="worktrees")o(s)}),onSessions:(t,o)=>Fe({kind:"sessions",projectId:t},(s)=>{if(s.kind==="sessions")o(s)}),onRunningShells:(t,o)=>vo(t,o),readShellOutput:async(t,o)=>{F(t,Te);let s=o?.cursor;if(s!==void 0&&(!Number.isInteger(s)||s<0))throw new c("HOST_REJECTED","Shell output cursor must be a non-negative integer.");let i=o?.tailBytes;if(i!==void 0&&(!Number.isInteger(i)||i<1||i>me))throw new c("HOST_REJECTED",`Shell output tailBytes must be an integer between 1 and ${me}.`);let S=await G({...k,type:"shell-output",id:p(l),payload:{shellId:t,cursor:s,tailBytes:i}});if(!S||typeof S.output!=="string"||!Number.isFinite(S.cursor))throw new c("HOST_REJECTED","Host did not return shell output.");return S},stopShell:async(t)=>{if(F(t,Te),(await G({...k,type:"shell-stop",id:p(l),payload:{shellId:t}}))?.stopped!==!0)throw new c("HOST_REJECTED","Host did not stop the shell.");return{stopped:!0}},openSession:async(t)=>{F(t),await g({...k,type:"open-session",id:p(l),payload:{sessionId:t}})},storage:{get:async(t,o)=>{let s=Ue(o),i={op:"get",key:t};if(s)i.scope=s;let T=await Se(i);return T.op==="get"&&T.found?T.value:void 0},set:async(t,o,s)=>{let i=Ue(s),T={op:"set",key:t,value:o};if(i)T.scope=i;await Se(T)},delete:async(t,o)=>{let s=Ue(o),i={op:"delete",key:t};if(s)i.scope=s;await Se(i)},keys:async(t)=>{let o=Ue(t),s={op:"keys"};if(o)s.scope=o;let i=await Se(s);if(i.op!=="keys")throw new c("HOST_REJECTED","Expected storage keys.");return i.keys}},onReady:(t)=>{if(a.add(t),d)t(d);return()=>{a.delete(t)}},onDirectory:(t)=>{if(m.add(t),d)t(d.directory);return()=>{m.delete(t)}},onSession:(t)=>{if(R.add(t),d)t(d.session);return()=>{R.delete(t)}},onSessionLifecycle:(t)=>{if(O.add(t),j)t(j);return()=>{O.delete(t)}},onConnection:(t)=>{if(v.add(t),d)t(d.connection);return()=>{v.delete(t)}},onSettings:(t)=>{if(L.add(t),d)t(d.settings);return()=>{L.delete(t)}},onItem:(t)=>{if(Z.add(t),d)t(d.item);return()=>{Z.delete(t)}},onStatusControl:(t)=>(z.add(t),()=>{z.delete(t)}),onPopoverClosed:(t)=>(_.add(t),()=>{_.delete(t)}),setStatusControls:(t)=>{if(d?.features?.statusControls!==!0)return Promise.reject(new c("UNSUPPORTED","This host does not support status controls."));if(!Ht(t))return Promise.reject(new c("HOST_REJECTED","Status controls must have unique bounded ids and valid selected options."));return g({...k,type:"status-controls",id:p(l),payload:{controls:t}})},openPopover:(t)=>{if(d?.features?.popovers!==!0)return Promise.reject(new c("UNSUPPORTED","This host does not support popovers."));if(!We(t))return Promise.reject(new c("HOST_REJECTED","Popover requests need bounded geometry and JSON data."));return g({...k,type:"popover-open",id:p(l),payload:t})},closePopover:Gt,setPopoverAnchorActive:Nt,onResolve:(t)=>(M=t,()=>{if(M===t)M=null}),toast:(t)=>{let o=t.message.trim();if(!o||o.length>be)return Promise.reject(new c("HOST_REJECTED",`Toast message must contain 1 to ${be} characters.`));if(t.copy&&t.copy!==!0&&(!t.copy.text.length||t.copy.text.length>Ae))return Promise.reject(new c("HOST_REJECTED",`Toast copy text must contain 1 to ${Ae} characters.`));return g({channel:E,v:f,type:"toast",id:p(l),payload:{...t,message:o}})},openUrl:(t)=>g({channel:E,v:f,type:"open-url",id:p(l),payload:{url:t}}),openCommit:(t)=>Ze(t)?g({channel:E,v:f,type:"open-commit",id:p(l),payload:{sha:t}}):Promise.reject(new c("HOST_REJECTED","Commit id must be 7 to 64 hex characters.")),openSurface:(t)=>g({channel:E,v:f,type:"open-surface",id:p(l),payload:{surfaceId:t}}),writeClipboard:(t)=>g({channel:E,v:f,type:"clipboard-write",id:p(l),payload:{text:t}}),compose:(t)=>g({channel:E,v:f,type:"compose",id:p(l),payload:t}),attach:(t)=>g({channel:E,v:f,type:"attach",id:p(l),payload:ne(t)}),startSession:async(t)=>{if(t.projectId!==void 0)F(t.projectId);let o=t.worktree;if(o&&o!==!0)if(o.kind==="existing")F(o.directory);else{if(o.name!==void 0)F(o.name,200);if(o.baseBranch!==void 0)F(o.baseBranch,200)}let s=await G({channel:E,v:f,type:"start-session",id:p(l),payload:ot(t)},e.requestTimeoutMs??180000);if(!Ye(s))throw new c("HOST_REJECTED","Host did not return a session.");return s},prompt:(t)=>G({channel:E,v:f,type:"prompt",id:p(l),payload:rt(t)}).then((o)=>{if(!Qe(o))throw new c("HOST_REJECTED","Host did not return a prompt result.");return o}),sessionLink:(t)=>g({channel:E,v:f,type:"session-link",id:p(l),payload:ne(t)}),close:()=>g({channel:E,v:f,type:"close",id:p(l)}),oauthStart:()=>g({channel:E,v:f,type:"oauth-start",id:p(l)}),oauthDisconnect:()=>g({channel:E,v:f,type:"oauth-disconnect",id:p(l)}),request:(t)=>(ve(t.path)?G({channel:E,v:f,type:"request",id:p(l),payload:t}):Eo()).then((o)=>{if(!Re(o))throw new c("HOST_REJECTED","Host request result was empty.");return o}),serviceRequest:(t)=>(ve(t.path)?G({channel:E,v:f,type:"service-request",id:p(l),payload:t}):Eo()).then((o)=>{if(!Re(o))throw new c("HOST_REJECTED","Host service request result was empty.");return o}),serviceStatus:()=>G({channel:E,v:f,type:"service-status",id:p(l)}).then((t)=>{if(!it(t))throw new c("HOST_REJECTED","Host did not return service status.");return t}),readFile:(t)=>(se(t)?G({channel:E,v:f,type:"file-read",id:p(l),payload:{path:t}}):we()).then((o)=>{if(!at(o))throw new c("HOST_REJECTED","Host did not return file content.");return o}),writeFile:(t,o)=>{if(!se(t))return we();if(o.length>ke)return Promise.reject(new c("FILE_TOO_LARGE",`Content is over ${ke} characters.`));return G({channel:E,v:f,type:"file-write",id:p(l),payload:{path:t,content:o}}).then((s)=>{if(!ct(s))throw new c("HOST_REJECTED","Host did not confirm the write.");return s})},listDir:(t)=>(se(t)?G({channel:E,v:f,type:"file-list",id:p(l),payload:{path:t}}):we()).then((o)=>{if(!dt(o))throw new c("HOST_REJECTED","Host did not return directory entries.");return o}),stat:(t)=>(se(t)?G({channel:E,v:f,type:"file-stat",id:p(l),payload:{path:t}}):we()).then((o)=>{if(!lt(o))throw new c("HOST_REJECTED","Host did not return file status.");return o}),generate:(t)=>{let o=t.prompt.trim(),s=t.system?.trim();if(o.length===0||o.length>ye)return Promise.reject(new c("HOST_REJECTED",`Prompt must be 1 to ${ye} characters.`));if(s!==void 0&&(s.length===0||s.length>Oe))return Promise.reject(new c("HOST_REJECTED",`System prompt must be 1 to ${Oe} characters.`));let i=t.maxOutputTokens===void 0?void 0:Math.min(et,Math.max(1,Math.floor(t.maxOutputTokens)));if(i!==void 0&&!Number.isFinite(i))return Promise.reject(new c("HOST_REJECTED","maxOutputTokens must be a number."));let T={prompt:o};if(s!==void 0)T.system=s;if(i!==void 0)T.maxOutputTokens=i;return G({channel:E,v:f,type:"generate",id:p(l),payload:T},e.requestTimeoutMs??tt).then((S)=>{if(!pt(S))throw new c("HOST_REJECTED","Host did not return generated text.");return S})},onLateGenerateResult:(t)=>{w.add(t);for(let o of X.splice(0))b([t],o);return vt(),()=>{w.delete(t)}},setBadge:(t)=>g({channel:E,v:f,type:"badge",id:p(l),payload:{count:nt(t)}}),setHeight:(t)=>g({channel:E,v:f,type:"resize",id:p(l),payload:{height:st(t)}}),onFileOpen:(t)=>{if(ue.add(t),!Pe)Pe=!0,r.addEventListener("keydown",Ut,!0);if(ce)t(ce);return()=>{ue.delete(t)}},onFileSnapshot:(t)=>(ae=t,()=>{if(ae===t)ae=null}),onFileSaved:(t)=>(Ee.add(t),()=>{Ee.delete(t)}),reportFileChange:(t)=>De({...k,type:"file-change",payload:{dirty:t.dirty,edited:t.edited}}),requestFileSave:wt,reportFileUnsupported:()=>De({...k,type:"file-unsupported"}),dispose:()=>{for(let t of te.keys())P({...k,type:"workspace-unsubscribe",id:p(l),payload:{subscriptionId:t}});te.clear();for(let t of oe.keys())P({...k,type:"shells-unsubscribe",id:p(l),payload:{subscriptionId:t}});if(oe.clear(),V=!0,M=null,B=null,ae=null,ue.clear(),Ee.clear(),Pe)r.removeEventListener("keydown",Ut,!0);r.removeEventListener("message",Rt),r.removeEventListener("keydown",It,!0),r.removeEventListener("pointerover",_e),r.removeEventListener("pointermove",_e),r.removeEventListener("pointerout",Ct),r.removeEventListener("focus",Lt),r.removeEventListener("blur",Mt);for(let t of ee.values())clearTimeout(t.timer),t.reject(new c("HOST_UNAVAILABLE","Host client was disposed."));ee.clear(),a.clear(),m.clear(),R.clear(),O.clear(),v.clear(),L.clear(),Z.clear(),z.clear(),_.clear(),w.clear(),X.length=0}}};var fo=["browser.open","browser.snapshot","browser.click","browser.type","browser.scroll","browser.back","browser.forward","browser.inspect","browser.capture","browser.resize","browser.close"];var fr=new Set(fo);var _o=["none","agent","user"];var Sr=new Set(_o);var No=[["--oc-bg","background"],["--oc-elevated","elevated"],["--oc-fg","foreground"],["--oc-muted","muted"],["--oc-subtle","subtle"],["--oc-border","border"],["--oc-hover","hover"],["--oc-selection","selection"],["--oc-focus","focus"],["--oc-primary","primary"],["--oc-muted-surface","mutedSurface"],["--oc-elevated-fg","elevatedForeground"],["--oc-active","active"],["--oc-selection-fg","selectionForeground"],["--oc-primary-fg","primaryForeground"],["--oc-primary-text","primaryText"],["--oc-success-text","successText"],["--oc-warning-text","warningText"],["--oc-error-text","errorText"],["--oc-info-text","infoText"],["--oc-success","success"],["--oc-warning","warning"],["--oc-error","error"],["--oc-info","info"],["--oc-font","font"],["--oc-mono","mono"],["--oc-radius","radius"],["--surface-background","background"],["--surface-elevated","elevated"],["--surface-foreground","foreground"],["--surface-muted-foreground","muted"],["--surface-subtle","subtle"],["--interactive-border","border"],["--interactive-hover","hover"],["--interactive-selection","selection"],["--interactive-focus-ring","focus"],["--primary","primary"],["--surface-muted","mutedSurface"],["--surface-elevated-foreground","elevatedForeground"],["--interactive-active","active"],["--interactive-selection-foreground","selectionForeground"],["--primary-foreground","primaryForeground"],["--primary-text","primaryText"],["--success-text","successText"],["--warning-text","warningText"],["--error-text","errorText"],["--info-text","infoText"],["--status-success","success"],["--status-warning","warning"],["--status-error","error"],["--status-info","info"],["--font-sans","font"],["--font-mono","mono"],["--radius","radius"]],Po=[["--oc-syntax-keyword","--syntax-keyword","syntaxKeyword"],["--oc-syntax-string","--syntax-string","syntaxString"],["--oc-syntax-number","--syntax-number","syntaxNumber"],["--oc-syntax-function","--syntax-function","syntaxFunction"],["--oc-syntax-type","--syntax-type","syntaxType"],["--oc-syntax-comment","--syntax-comment","syntaxComment"],["--oc-syntax-variable","--syntax-variable","syntaxVariable"],["--oc-syntax-operator","--syntax-operator","syntaxOperator"]],So=(e,r)=>{r.style.colorScheme=e.mode;for(let[n,u]of No)r.style.setProperty(n,e.tokens[u]);for(let[n,u,a]of Po){let m=e.tokens[a]??"";r.style.setProperty(n,m),r.style.setProperty(u,m)}r.style.setProperty("font-family",e.tokens.font),r.style.setProperty("font-size","0.875rem"),r.style.setProperty("line-height","1.45"),r.style.setProperty("color",e.tokens.foreground)},ft=(e,r)=>{if(So(e.theme,r),r.dataset)r.dataset.ocSurface=e.surface,r.dataset.ocTheme=e.theme.mode};var Do={"surface-background":"bg","surface-elevated":"elevated","surface-elevated-foreground":"elevated-fg","surface-foreground":"fg","surface-muted-foreground":"muted","surface-muted":"muted-surface","surface-subtle":"subtle","interactive-border":"border","interactive-hover":"hover","interactive-active":"active","interactive-selection":"selection","interactive-selection-foreground":"selection-fg","interactive-focus-ring":"focus",primary:"primary","primary-foreground":"primary-fg","primary-text":"primary-text","success-text":"success-text","warning-text":"warning-text","error-text":"error-text","info-text":"info-text","status-success":"success","status-warning":"warning","status-error":"error","status-info":"info","font-sans":"font","font-mono":"mono",radius:"radius"},x=(e,r)=>`var(--${e}, var(--oc-${Do[e]}, ${r}))`,W=x("surface-background","transparent"),Ce=x("surface-elevated","transparent"),ie=x("surface-elevated-foreground","inherit"),D=x("surface-foreground","inherit"),h=x("surface-muted-foreground","gray"),$o=x("surface-muted","transparent"),Y=x("interactive-border","currentColor"),N=x("interactive-hover","transparent"),q=x("interactive-active","transparent"),_t=x("interactive-selection","transparent"),St=x("interactive-selection-foreground","inherit"),K=x("primary","currentColor"),Tt=x("primary-text","inherit"),mt=x("error-text","inherit"),Fo=x("font-sans","inherit"),ht=x("font-mono","monospace"),bo=x("radius","9px"),xt=`calc(${bo} - 2px)`,To=`calc(${bo} - 4px)`,A=(e,r,n="transparent")=>`color-mix(in srgb, ${e} ${r}%, ${n})`,mo=`background-image: linear-gradient(${N}, ${N});`,bt=(e)=>`box-shadow: inset 0 0 0 1px ${e}, var(--oc-sdk-field-lift);`,At="box-shadow: inset 0 0 0 1px var(--oc-sdk-edge), var(--oc-sdk-raised-lift);",ho="box-shadow: var(--oc-sdk-lit);",xo=`inset 0 1px 0 0 ${A(D,1.5)}, 0 1px 1px 0 rgb(0 0 0 / 0.28), 0 2px 3px -2px rgb(0 0 0 / 0.2)`,Ho=`
:root {
  --oc-sdk-edge: ${A(D,10)};
  --oc-sdk-field-bg: ${Ce};
  --oc-sdk-raised-bg: ${W};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 2px 0 rgb(0 0 0 / 0.06);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.45), 0 1px 2px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.8), inset 0 0 0 1px rgb(0 0 0 / 0.04), 0 0 0 1px rgb(0 0 0 / 0.1), 0 1px 2px -0.5px rgb(0 0 0 / 0.08), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.08);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${A(D,6)};
  --oc-sdk-field-bg: ${A(W,50,Ce)};
  --oc-sdk-raised-bg: ${Ce};
  --oc-sdk-field-lift: ${xo};
  --oc-sdk-raised-lift: ${xo};
  --oc-sdk-lit: inset 0 1px 0 0 ${A(D,1.5)}, 0 1px 1px 0 rgb(0 0 0 / 0.28), 0 2px 3px -2px rgb(0 0 0 / 0.2);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.06), inset 0 0 0 1px rgb(255 255 255 / 0.08), 0 0 0 1px rgb(0 0 0 / 0.36), 0 1px 1px -0.5px rgb(0 0 0 / 0.22), 0 3px 3px -1.5px rgb(0 0 0 / 0.2), 0 6px 6px -3px rgb(0 0 0 / 0.16);
}`,Ie=(e)=>{let r=x(`status-${e}`,"currentColor");return`
.oc-sdk[data-tone="${e}"], .oc-sdk [data-tone="${e}"] { --oc-sdk-tone: ${r}; --oc-sdk-tone-text: ${x(`${e}-text`,"inherit")}; }`},Xo=`
.oc-sdk { box-sizing: border-box; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 32px; padding: 0 12px; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; }
.oc-sdk-btn[data-size="sm"] { gap: 6px; height: 28px; padding: 0 10px; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { gap: 4px; height: 24px; padding: 0 8px; font-size: 0.75rem; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: 14px; height: 14px; }

.oc-sdk-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: 32px; padding: 0 10px; border: 0; font-size: 0.875rem; line-height: 1.45; appearance: none; }
textarea.oc-sdk-input { height: auto; padding: 8px 10px; resize: vertical; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: 34px; padding-right: 34px; }
.oc-sdk-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.oc-sdk-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: 24px; height: 24px; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; width: auto; max-width: 100%; min-width: 0; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; text-align: left; }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; }
.oc-sdk-popup { position: fixed; z-index: 50; display: flex; flex-direction: column; gap: 2px; min-width: 160px; max-width: calc(100vw - 16px); max-height: min(320px, calc(100vh - 16px)); overflow: auto; padding: 4px; border: 1px solid transparent; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: 2px 2px 4px; }
.oc-sdk-popup-search .oc-sdk-input { height: 28px; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; }
.oc-sdk-option-check { flex: 0 0 auto; display: inline-flex; width: 14px; visibility: hidden; }
.oc-sdk-option[aria-selected="true"] > .oc-sdk-option-check { visibility: visible; }
.oc-sdk-popup-empty { padding: 8px; font-size: 0.8125rem; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; margin-top: 3px; border: 1px solid transparent; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: 36px; height: 20px; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; }

.oc-sdk-tabs { display: inline-flex; gap: 2px; padding: 2px; max-width: 100%; overflow: auto; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: 1px 6px; font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; text-align: left; }
.oc-sdk-row-lead { flex: 0 0 auto; width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-list-empty { padding: 16px 8px; text-align: center; font-size: 0.8125rem; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 40px 16px; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; }
.oc-sdk-empty-action { margin-top: 12px; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; }
.oc-sdk-spinner-ring { width: 16px; height: 16px; border: 2px solid transparent; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: 12px; height: 12px; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: 12px; padding: 8px 12px; border: 1px solid transparent; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-banner-body { font-size: 0.8125rem; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: 8px; width: 100%; margin: 8px 0; font-size: 0.75rem; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: 4px 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: 6px; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; transform-origin: left; transition: transform 200ms ease-out; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text img { display: block; max-width: 100%; margin: 8px 0; }
`,Ao=`${Ho}
.oc-sdk { color: ${D}; font-family: ${Fo}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${mo} }
.oc-sdk-mono { font-family: ${ht}; }
.oc-sdk-muted { color: ${h}; }
${Ie("success")}${Ie("warning")}${Ie("error")}${Ie("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${K}; --oc-sdk-tone-text: ${Tt}; }

.oc-sdk-btn { border-radius: ${xt}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${To}; }
.oc-sdk-btn[data-variant="default"] { color: ${Tt}; background: ${A(K,10,W)}; border-color: ${A(K,12)}; ${ho} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${A(K,16,W)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${A(K,22,W)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${$o}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${q}, ${q}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${ie}; border-color: transparent; ${At} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${q}, ${q}); box-shadow: inset 0 0 0 1px var(--oc-sdk-edge); }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${N}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${q}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${x("status-error","red")}; color: ${mt}; background: ${A("var(--oc-sdk-tone)",7,W)}; border-color: ${A("var(--oc-sdk-tone)",12)}; ${ho} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${A("var(--oc-sdk-tone)",9,W)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${A("var(--oc-sdk-tone)",11,W)}; box-shadow: none; }

.oc-sdk-field-note { color: ${h}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${mt}; }
.oc-sdk-input { border-radius: ${xt}; background: var(--oc-sdk-field-bg); color: ${ie}; ${bt("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${h}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${bt(A(D,26))} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${bt(x("status-error","red"))} }
.oc-sdk-input[data-mono="true"] { font-family: ${ht}; }

.oc-sdk-search-icon { color: ${h}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${K}; }
.oc-sdk-search-clear { border-radius: ${To}; color: ${h}; }
.oc-sdk-search-clear:hover { background: ${N}; color: ${D}; }

.oc-sdk-trigger { border-color: transparent; border-radius: ${xt}; background: var(--oc-sdk-raised-bg); color: ${ie}; ${At} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${N}, ${N}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${q}, ${q}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${h}; }
.oc-sdk-trigger-chevron { color: ${h}; }
/* The app's dropdown light: lit top, hairline rings and a layered shadow, no border. */
.oc-sdk-popup { --surface-foreground: ${ie}; border-color: transparent; border-radius: 12px; background: ${Ce}; color: ${ie}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${N}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${_t}; color: ${St}; }
.oc-sdk-option-check { color: ${D}; }
.oc-sdk-option[data-destructive="true"] { color: ${mt}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${A(x("status-error","red"),10)}; }
.oc-sdk-option-hint { color: ${h}; }
.oc-sdk-popup-empty { color: ${h}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${Y}; border-radius: 4px; color: ${D}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${A(D,60,Y)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${Y}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${W}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${K}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(16px); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${mo} }
.oc-sdk-check-desc { color: ${h}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${A(D,4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${h}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${D}; }
.oc-sdk-tab[aria-selected="true"] { color: ${St}; background: ${_t}; border-color: ${Y}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${ie}; background: var(--oc-sdk-raised-bg); border-color: transparent; ${At} }
.oc-sdk-tab-count { color: ${h}; }

.oc-sdk-badge { border-radius: 9999px; background: ${N}; color: ${h}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${A("var(--oc-sdk-tone)",15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${N}; }
.oc-sdk-row[aria-selected="true"] { background: ${_t}; color: ${St}; }
.oc-sdk-row-lead { font-family: ${ht}; color: ${h}; }
.oc-sdk-row-sub { color: ${h}; }
.oc-sdk-row-meta { color: ${h}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${h}; }

.oc-sdk-empty-body { color: ${h}; }

.oc-sdk-spinner { color: ${h}; }
.oc-sdk-spinner-ring { border-color: ${Y}; border-top-color: ${K}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${A("var(--oc-sdk-tone)",10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${h}; }

.oc-sdk-separator { color: ${h}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${A(Y,40)}; }

.oc-sdk-progress-label { color: ${h}; }
.oc-sdk-progress-track { border-radius: 9999px; background: ${Y}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${K}); }

.oc-sdk-text a { color: ${Tt}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${A(Y,60)}; }
`,U=`
${He}
${Xo}
${Ao}`;var go="oc-sdk-ui-style";var I=(e)=>{let r=document.getElementById(go);if(r instanceof HTMLStyleElement){if(r.textContent!==e)r.textContent=e;return}Xe(document);let n=document.createElement("style");n.id=go,n.textContent=e,document.head.appendChild(n)},C=(e,r)=>{let n=document.createElement(e);if(r)n.className=r;return n},Q=(e)=>{let r=C("button",e);return r.type="button",r},H=(e,r)=>{let n=r??"";if(e.textContent!==n)e.textContent=n};var Bo=()=>{let e=document.createElement("span");return e.className="oc-sdk-spinner-ring",e.setAttribute("aria-hidden","true"),e},J=(e,r)=>{I(U);let n=r,u=Q("oc-sdk oc-sdk-btn"),a=Bo(),m=document.createElement("span");u.append(m),e.append(u);let R=()=>{if(u.dataset.variant=n.variant??"default",u.dataset.size=n.size??"default",u.disabled=Boolean(n.disabled)||Boolean(n.loading),u.dataset.loading=n.loading?"true":"false",u.setAttribute("aria-busy",n.loading?"true":"false"),n.loading&&a.parentNode!==u)u.prepend(a);else if(!n.loading&&a.parentNode===u)a.remove();H(m,n.label)},O=()=>{if(n.disabled||n.loading)return;n.onClick()};return u.addEventListener("click",O),R(),{update:(v)=>{n={...n,...v},R()},dispose:()=>{u.removeEventListener("click",O),u.remove()}}};var kt=Et(),yo=document.querySelector("#root");if(!yo)throw Error("Missing root");var Oo=document.createElement("style");Oo.textContent=`
  .bar { display:flex; align-items:center; gap:4px; height:100%; padding:0 6px; box-sizing:border-box; font: 12px/1.2 var(--font-sans, system-ui, sans-serif); color: var(--foreground, inherit); }
  .addr { flex:1; min-width:60px; height:26px; box-sizing:border-box; padding:0 8px; border-radius:6px;
    border:1px solid var(--border, rgba(127,127,127,.35)); background: var(--input, transparent); color:inherit;
    font: 12px var(--font-mono, ui-monospace, monospace); outline:none; }
  .addr:focus { border-color: var(--ring, #3b82f6); }
  select { height:26px; max-width:140px; border-radius:6px; border:1px solid var(--border, rgba(127,127,127,.35));
    background: var(--input, transparent); color:inherit; font: 12px var(--font-sans, system-ui, sans-serif); padding:0 4px; }
  select option { color: initial; }
  .dot { width:8px; height:8px; border-radius:50%; flex:none; background:#9ca3af; margin:0 2px; }
  .dot.agent { background:#3b82f6; } .dot.user { background:#22c55e; } .dot.error { background:#ef4444; } .dot.loading { animation: pulse 1s infinite; }
  @keyframes pulse { 50% { opacity:.3; } }
  .error { flex:1; color:#ef4444; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
`;document.head.append(Oo);var ko=!1;kt.onReady((e)=>{if(ft(e,document.documentElement),ko)return;ko=!0;let r=document.createElement("div");r.className="bar",yo.append(r);let n=async(_,w={})=>{try{await kt.serviceRequest({method:"POST",path:_,body:JSON.stringify(w)})}catch{}z()},u=document.createElement("span");u.className="dot",r.append(u),J(r,{label:"‹",size:"xs",variant:"ghost",onClick:()=>{n("/nav",{action:"back"})}}),J(r,{label:"›",size:"xs",variant:"ghost",onClick:()=>{n("/nav",{action:"forward"})}}),J(r,{label:"↻",size:"xs",variant:"ghost",onClick:()=>{n("/nav",{action:"reload"})}});let a=document.createElement("input");a.className="addr",a.placeholder="http://app.localhost:3000",a.spellcheck=!1,a.autocapitalize="off";let m=!1;a.addEventListener("focus",()=>{m=!0,a.select()}),a.addEventListener("blur",()=>{m=!1}),a.addEventListener("keydown",(_)=>{if(_.key==="Enter"&&a.value.trim())m=!1,a.blur(),n("/navigate",{url:a.value.trim()});else if(_.key==="Escape")m=!1,a.blur(),z()}),r.append(a);let R=document.createElement("span");R.className="error",R.hidden=!0,r.append(R);let O=document.createElement("span");O.hidden=!0,r.append(O),J(O,{label:"Restart",size:"xs",variant:"outline",onClick:()=>{n("/restart")}});let v=document.createElement("select");v.title="Tabs",v.addEventListener("change",()=>{n("/tab",{id:v.value})}),r.append(v);let L=document.createElement("select");L.title="Viewport";for(let[_,w]of[["desktop","Desktop"],["tablet","Tablet"],["mobile","Mobile"],["fill","Fit panel"]]){let X=document.createElement("option");X.value=_,X.textContent=w,L.append(X)}L.addEventListener("change",()=>{n("/viewport",{mode:L.value})}),r.append(L);let Z=(_)=>{let w=Boolean(_.error)&&!_.running;if(u.className=`dot ${w?"error":_.controller==="user"?"user":_.agentActive?"agent":""}${_.loading?" loading":""}`,u.title=w?"Browser not running":_.controller==="user"?"You are in control":_.agentActive?"Agent is working":"Idle",a.hidden=w,R.hidden=!w,R.textContent=_.error??"",R.title=_.error??"",O.hidden=!w,!m&&a.value!==_.url)a.value=_.url;let X=_.tabs.map((M)=>`${M.id}|${M.title}|${M.active}`).join(`
`);if(v.dataset.signature!==X)v.dataset.signature=X,v.replaceChildren(..._.tabs.map((M)=>{let B=document.createElement("option");return B.value=M.id,B.textContent=(M.title||M.url||M.id).slice(0,60),B.selected=M.active,B}));v.hidden=_.tabs.length<2,L.value=_.viewport},z=async()=>{try{let _=await kt.serviceRequest({method:"GET",path:"/state"});if(_.status===200)Z(JSON.parse(_.body))}catch{}};z(),setInterval(()=>{z()},1000)});})();
