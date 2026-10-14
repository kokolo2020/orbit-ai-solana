(()=>{
'use strict';
const ID='orbit-v2-dual-paper',usd=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db;try{db=JSON.parse(localStorage.getItem(ID))}catch{}if(!db||db.version!==2)db={version:2,established:{cash:8000,positions:{},ledger:[]},launch:{budget:2000,observations:[]},auto:false};
db.auto=!!(db.trial&&db.trial.status==='RUNNING'&&Date.now()<db.trial.endsAt&&db.auto); // Resume only an explicitly started, unexpired 12-hour trial.
if(!Number.isFinite(db.maxDailyLossPct)||db.maxDailyLossPct<=0||db.maxDailyLossPct>100)db.maxDailyLossPct=5;
if(!db.dailyRisk)db.dailyRisk={};
if(db.trial&&db.trial.endsAt&&Date.now()>=db.trial.endsAt)db.auto=false;
let results=[],recent=[],lastCheck=null,scanning=false,cycle=null,errors=[],discoveryCount=0;
const persist=()=>localStorage.setItem(ID,JSON.stringify(db));
function ui(){
 const target=document.querySelector('.warning');if(!target)return;
 const host=document.createElement('section');host.className='panel';host.id='dualv2';host.innerHTML='<h2>◆ ORBIT AI v2.0 <small>· TWO STRATEGIES · SEPARATE PAPER LEDGERS</small></h2><div class="dualstats"><div><small>STRATEGY A · ESTABLISHED</small><strong id="v2equity">$8,000.00</strong><small id="v2cash">Cash $8,000.00</small></div><div><small>STRATEGY B · NEW LAUNCHES</small><strong>$2,000.00</strong><small>Observation only · no orders</small></div><div><small>DISCOVERED / ELIGIBLE</small><strong id="v2eligible">—</strong><small>Public DexScreener sample</small></div><div><small>EXECUTION STATE</small><strong id="v2mode">OFF</strong><small>Runs only while this page is open</small></div></div><div class="dualbar"><label style="color:#b8cce1;font-size:10px">MAX DAILY LOSS <input id="v2loss" type="number" min="0.1" max="100" step="0.1" value="5" style="width:65px"> %</label><button id="v2trial" style="border-color:#5ae4b1">RESET $10K + START 12H TRIAL</button><button id="v2start">START STRATEGY A</button><button id="v2scan">SCAN NOW</button><button id="v2export">EXPORT V2 LEDGER</button><span id="v2info">Waiting for first scan.</span><span id="v2timer" style="color:#5ae4b1">TRIAL NOT STARTED</span></div><div style="padding:8px;border-top:1px solid #2d415c"><b>WHY TOKENS ARE REJECTED</b><div id="v2rejections" class="note" style="margin-top:6px">Awaiting quotes.</div></div><div class="dualcolumns"><div><b>ESTABLISHED CANDIDATES</b><div id="v2candidates" class="dualrows"></div></div><div><b>NEW LAUNCH OBSERVATIONS</b><div id="v2new" class="dualrows"></div></div></div><div class="dualpositions"><b>ESTABLISHED PAPER POSITIONS &amp; FILLS</b><div id="v2positions"></div><div id="v2history"></div></div><p class="note" style="padding:0 10px 9px">A: ≥24h since pool creation, ≥$100k liquidity, ≥$100k reported 24h volume, positive but bounded 24h change, buy/sell ratio ≥1.1. Paper entry $50, up to 3 positions, maximum 3 buys per UTC day, TP +20% / SL −10%. Editable daily loss limit defaults to 5% ($400 on the $8,000 initial allocation) and blocks new entries based on day-start mark-to-market equity; missing quotes also block entries. B: pools under 10 minutes old observed only. Coverage is limited to tokens surfaced by the public discovery endpoints; not a comprehensive launch feed. Quote-based fills assume 1% slippage and 0.5% fees per side. Local data only; no persistent server or verified AI.</p>';
 target.insertAdjacentElement('afterend',host);
 const st=document.createElement('style');st.textContent='#dualv2{margin:7px 0}#dualv2 .dualstats{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:8px}#dualv2 .dualstats>div{border:1px solid #2c405c;background:#101d30;padding:9px;min-width:0}#dualv2 .dualstats small{display:block;color:#859cba;font-size:9px;margin:4px 0}#dualv2 .dualstats strong{font-size:16px;color:#70dcaa}#dualv2 .dualbar{display:flex;flex-wrap:wrap;gap:6px;padding:0 8px 8px;align-items:center}#v2info{color:#aabed7;font-size:10px}#dualv2 .dualcolumns{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px}#dualv2 .dualcolumns>div{min-width:0}#dualv2 .dualrows{max-height:180px;overflow-y:auto;margin-top:6px}#dualv2 .dualrow{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #253850;padding:8px 4px;align-items:center;font-size:10px}#dualv2 .dualrow small{color:#8ca2bf;display:block;margin-top:4px}#dualv2 .dualpositions{padding:7px 10px;border-top:1px solid #2b405b}#dualv2 button{font-size:10px}@media(max-width:650px){#dualv2 .dualstats{grid-template-columns:repeat(2,1fr)}#dualv2 .dualcolumns{grid-template-columns:1fr}#dualv2 .dualstats strong{font-size:14px}}';document.head.append(st);
 document.getElementById('v2loss').value=db.maxDailyLossPct;document.getElementById('v2loss').onchange=e=>{const v=Number(e.target.value);if(!Number.isFinite(v)||v<0.1||v>100){e.target.value=db.maxDailyLossPct;return}db.maxDailyLossPct=v;persist();display()};
 document.getElementById('v2trial').onclick=()=>{
  if(!confirm('Reset BOTH browser-local paper portfolios, including previous transaction history, and start a NEW 12-hour $10,000 simulation? Export the old ledgers first if you need them.'))return;
  localStorage.setItem('orbit-ai-v1-local-portfolio',JSON.stringify({version:1,cash:10000,realized:0,positions:{},ledger:[]}));
  db={version:2,established:{cash:8000,positions:{},ledger:[]},launch:{budget:2000,observations:[]},auto:true,maxDailyLossPct:5,dailyRisk:{},trial:{startedAt:Date.now(),endsAt:Date.now()+12*3600000,status:'RUNNING',initialCapital:10000}};
  persist();display();scan();
  alert('New 12-hour PAPER trial started. Keep this dashboard visible/active; closing or sleeping the browser prevents continuous monitoring. The old v1 panel may require a reload to show its reset balance.');
 };
 document.getElementById('v2start').onclick=()=>{if(db.trial&&Date.now()>=db.trial.endsAt){db.auto=false;display();alert('12-hour trial ended. Use RESET + START for a new experiment.');return}db.auto=!db.auto;persist();display();if(db.auto)scan()};
 document.getElementById('v2scan').onclick=scan;
 document.getElementById('v2export').onclick=()=>{let blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),paperOnly:true,...db},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='orbit-v2-dual-strategy.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)};
 display();scan();cycle=setInterval(()=>{if(db.auto&&!document.hidden){if(db.trial&&Date.now()>=db.trial.endsAt){db.auto=false;db.trial.status='COMPLETED';persist();display();return}scan()}},90000);
}
async function json(url){let r=await fetch(url);if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
function pairPick(arr,address){return (arr||[]).filter(p=>p.chainId==='solana'&&p.baseToken?.address===address&&Number(p.priceUsd)>0).sort((a,b)=>Number(b.liquidity?.usd||0)-Number(a.liquidity?.usd||0))[0]}
function candidate(p){let price=Number(p.priceUsd),liquidity=Number(p.liquidity?.usd||0),volume=Number(p.volume?.h24||0),change=Number(p.priceChange?.h24),buys=Number(p.txns?.h24?.buys||0),sells=Number(p.txns?.h24?.sells||0),age=Date.now()-Number(p.pairCreatedAt||0);
 return {id:p.baseToken.address,symbol:p.baseToken.symbol||'?',price,liquidity,volume,change:Number.isFinite(change)&&p.priceChange?.h24!=null?change:null,buys,sells,age,link:p.url,eligible:Number(p.pairCreatedAt)>0&&age>=86400000&&liquidity>=100000&&volume>=100000&&buys>=30&&sells>=10&&buys/sells>=1.1&&change>=-5&&change<=35};
}
async function scan(){if(scanning)return;scanning=true;errors=[];document.getElementById('v2info').textContent='Scanning limited public token discovery feeds…';try{
 const feeds=await Promise.allSettled([json('https://api.dexscreener.com/token-profiles/latest/v1'),json('https://api.dexscreener.com/token-boosts/top/v1'),json('https://api.dexscreener.com/token-boosts/latest/v1'),json('https://api.dexscreener.com/community-takeovers/latest/v1'),json('https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?include=base_token'),json('https://api.geckoterminal.com/api/v2/networks/solana/new_pools?include=base_token')]);
 const dexs=feeds.slice(0,4).flatMap(f=>f.status==='fulfilled'&&Array.isArray(f.value)?f.value:[]).filter(x=>x.chainId==='solana'&&x.tokenAddress).map(x=>x.tokenAddress);
 const gecko=feeds.slice(4).flatMap(f=>f.status==='fulfilled'&&Array.isArray(f.value?.data)?f.value.data:[]).map(x=>x.relationships?.base_token?.data?.id||'').filter(x=>x.startsWith('solana_')).map(x=>x.slice(7));
 const addresses=[...new Set([...gecko,...dexs])].slice(0,150);discoveryCount=addresses.length;
 errors.push(...feeds.map((f,i)=>f.status==='rejected'?'source '+(i+1)+' unavailable':null).filter(Boolean));
 if(!addresses.length)throw Error('No Solana token profiles returned');
 const union=[...new Set([...addresses,...Object.keys(db.established.positions)])],pairs=[];
 for(let i=0;i<union.length;i+=15)try{const part=union.slice(i,i+15),raw=await json('https://api.dexscreener.com/tokens/v1/solana/'+part.join(','));for(const id of part){const p=pairPick(raw,id);if(p)pairs.push(p)}}catch(e){errors.push(e.message)}
 const all=pairs.map(candidate),map=new Map(all.map(p=>[p.id,p]));results=addresses.map(a=>map.get(a)).filter(p=>p&&Number.isFinite(p.liquidity)&&p.liquidity>0).sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.liquidity-a.liquidity);recent=results.filter(p=>p.age>=0&&p.age<600000).sort((a,b)=>a.age-b.age);lastCheck=new Date();
 for(const p of recent){if(!db.launch.observations.some(o=>o.id===p.id)){db.launch.observations.push({id:p.id,symbol:p.symbol,firstObserved:lastCheck.toISOString(),observedAgeMinutes:Math.round(p.age/60000),price:p.price,liquidity:p.liquidity})}}db.launch.observations=db.launch.observations.slice(-200);
 if(db.trial&&Date.now()>=db.trial.endsAt){db.auto=false;db.trial.status='COMPLETED'}
 if(db.auto)execute(map);persist();
 if(!db.dailyRisk.locked)document.getElementById('v2info').textContent=results.length+' assets priced; '+results.filter(p=>p.eligible).length+' pass A filters; '+recent.length+' under 10 min'+(errors.length?'; partial feed':'')+'. Latest '+lastCheck.toLocaleTimeString();
}catch(e){document.getElementById('v2info').textContent='V2 scan failed: '+e.message}finally{scanning=false;display()}}
function equity(map){let value=db.established.cash;for(const [id,p] of Object.entries(db.established.positions)){const quote=map.get(id);if(!quote||!(quote.price>0))return null;value+=p.quantity*quote.price*.99*.995}return value}
function execute(map){
 const a=db.established,now=new Date(),day=now.toISOString().slice(0,10);
 for(const [id,pos] of Object.entries(a.positions)){const p=map.get(id);if(!p||!(p.price>0))continue;const fill=p.price*.99,net=pos.quantity*fill*.995,ret=(net/pos.cost-1)*100;
 if(ret>=20||ret<=-10){a.cash+=net;a.ledger.push({at:now.toISOString(),side:'SELL',id,symbol:pos.symbol,qty:pos.quantity,fill,fee:pos.quantity*fill*.005,cashFlow:net,pnl:net-pos.cost,trigger:ret>=20?'TAKE_PROFIT':'STOP_LOSS'});delete a.positions[id]}}
 const measured=equity(map);
 const dayRisk=db.dailyRisk;
 if(dayRisk.day!==day){dayRisk.day=day;dayRisk.startEquity=measured;dayRisk.locked=false}
 if(measured===null||dayRisk.startEquity===null){document.getElementById('v2info').textContent='Risk check unavailable: some positions have no quotes. Entries blocked.';return}
 const lossLimit=dayRisk.startEquity*db.maxDailyLossPct/100;
 if(dayRisk.startEquity-measured>=lossLimit)dayRisk.locked=true;
 if(dayRisk.locked){document.getElementById('v2info').textContent='DAILY LOSS LIMIT HIT: entries paused, exits remain active. Limit '+db.maxDailyLossPct+'% ('+usd(lossLimit)+').';return}
 const boughtToday=a.ledger.filter(x=>x.side==='BUY'&&x.at.startsWith(day)).length;
 if(boughtToday>=3||Object.keys(a.positions).length>=3||a.cash<50)return;
 const picks=results.filter(p=>p.eligible&&!a.positions[p.id]&&!a.ledger.some(x=>x.side==='BUY'&&x.id===p.id&&x.at.startsWith(day)));if(!picks.length)return;
 const p=picks[0],amount=50,fill=p.price*1.01,fee=amount*.005,qty=(amount-fee)/fill;
 if(!Number.isFinite(qty)||qty<=0)return;a.cash-=amount;a.positions[p.id]={symbol:p.symbol,quantity:qty,cost:amount};a.ledger.push({at:now.toISOString(),side:'BUY',id:p.id,symbol:p.symbol,qty,fill,fee,cashFlow:-amount,pnl:0,trigger:'RULE_PASS'});
}
function reasons(p){const a=[];if(!Number.isFinite(p.age)||p.age<86400000)a.push('POOL <24H');if(p.liquidity<100000)a.push('LIQ <$100K');if(p.volume<100000)a.push('VOL <$100K');if(p.buys<30)a.push('BUYS <30');if(p.sells<10)a.push('SELLS <10');if(p.sells===0||p.buys/p.sells<1.1)a.push('B/S <1.1');if(p.change===null||p.change< -5||p.change>35)a.push('CHANGE OUTSIDE -5%…+35%');return a}
function rejectSummary(){if(!results.length)return 'No priced candidates; discovery '+discoveryCount+' addresses. API availability may be limited.';const categories=new Map();for(const p of results)for(const why of reasons(p))categories.set(why,(categories.get(why)||0)+1);return '<div>Sources: DexScreener profiles / boosts / community + GeckoTerminal trending / new pools (best effort). '+results.length+' priced tokens, '+results.filter(p=>p.eligible).length+' eligible. Reasons overlap; totals are not additive.</div>'+[...categories].sort((a,b)=>b[1]-a[1]).map(([reason,n])=>'<div class="dualrow"><span>'+safe(reason)+'</span><strong>'+n+'</strong></div>').join('')}
function display(){const root=document.getElementById('dualv2');if(!root)return;const a=db.established;
 document.getElementById('v2start').textContent=db.auto?'PAUSE STRATEGY A':'RESUME STRATEGY A';
 const timer=document.getElementById('v2timer');if(db.trial){const left=Math.max(0,db.trial.endsAt-Date.now()),hr=Math.floor(left/3600000),min=Math.floor(left%3600000/60000);timer.textContent=left>0?'TRIAL '+hr+'h '+min+'m LEFT'+(db.auto?' · ACTIVE':' · PAUSED'):'12H TRIAL ENDED';}else timer.textContent='TRIAL NOT STARTED';document.getElementById('v2mode').textContent=db.auto?'AUTO PAPER ON':'OFF';
 document.getElementById('v2eligible').textContent=results.filter(p=>p.eligible).length+'/'+results.length;
 document.getElementById('v2cash').textContent='Cash '+usd(a.cash);
 document.getElementById('v2loss').value=db.maxDailyLossPct;
 const marks=Object.entries(a.positions).reduce((sum,[id,pos])=>{const p=results.find(x=>x.id===id);return sum+(p?pos.quantity*p.price:0)},a.cash);
 document.getElementById('v2equity').textContent=(Object.keys(a.positions).some(id=>!results.find(p=>p.id===id))?'≥ ':'')+usd(marks);
 document.getElementById('v2rejections').innerHTML=rejectSummary();
 document.getElementById('v2candidates').innerHTML=results.slice(0,8).map(p=>'<div class="dualrow"><div><b>'+safe(p.symbol)+'</b><small>LIQ '+usd(p.liquidity)+' · VOL '+usd(p.volume)+' · age '+Math.floor(p.age/3600000)+'h</small><small>'+safe(reasons(p).join(' · ')||'ALL ENTRY FILTERS PASS')+'</small></div><span class="'+(p.eligible?'green':'gold')+'">'+(p.eligible?'QUALIFIES':'SKIP')+'</span></div>').join('')||'<p class="note">No quotes yet.</p>';
 document.getElementById('v2new').innerHTML=recent.slice(0,8).map(p=>'<div class="dualrow"><b>'+safe(p.symbol)+'</b><span class="gold">'+Math.max(0,Math.round(p.age/60000))+' min · OBSERVE</span></div>').join('')||'<p class="note">No verified under-10-minute pools in this limited sample.</p>';
 document.getElementById('v2positions').innerHTML=Object.entries(a.positions).map(([id,p])=>'<div class="dualrow"><b>'+safe(p.symbol)+'</b><span>cost '+usd(p.cost)+' · auto-managed</span></div>').join('')||'<p class="note">No active V2 positions.</p>';
 document.getElementById('v2history').innerHTML=a.ledger.slice(-10).reverse().map(x=>'<div class="dualrow"><span>'+safe(x.side)+' '+safe(x.symbol)+' <small>'+safe(x.trigger)+' · '+safe(x.at)+'</small></span><span>'+usd(x.cashFlow)+'</span></div>').join('')||'<p class="note">No V2 fills yet.</p>';
}
setInterval(()=>{if(db.trial&&db.auto&&Date.now()>=db.trial.endsAt){db.auto=false;db.trial.status='COMPLETED';persist()}if(document.getElementById('dualv2'))display()},60000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ui);else ui();
})();