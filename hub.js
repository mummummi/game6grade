/* ── 우리 반 게임 교실 · 보상 시스템 (hub) ──
   모든 게임이 남기는 완료 기록(class-done, 자동 기록만)으로 경험치·레벨·배지·도감을 계산해요. */
(function(){
'use strict';
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const CAT={esc:{n:'방탈출',e:'🔐',xp:[60,100,150]},arc:{n:'계산 아케이드',e:'🎯',xp:[40,70,100]},sim:{n:'시뮬레이션',e:'🏪',xp:[40,70,100]},kid:{n:'처음 놀이터',e:'🌱',xp:[30,50,70]},new:{n:'새 장르',e:'🎲',xp:[40,70,100]},quiz:{n:'퀴즈 놀이터',e:'🎪',xp:[40,70,100]}};
const LVI={easy:0,normal:1,hard:2};
const AVATARS=['🐶','🐱','🐰','🐻','🐼','🦊','🐯','🦁','🐸','🐵','🐧','🐨','🦄','🐲','🐹','🦉'];
const ACCS=[{e:'',n:'없음',lv:1},{e:'🎀',n:'리본',lv:2},{e:'🧢',n:'모자',lv:3},{e:'🌸',n:'꽃',lv:4},{e:'🎩',n:'마술 모자',lv:5},{e:'🎓',n:'학사모',lv:7},{e:'⭐',n:'별',lv:8},{e:'👑',n:'왕관',lv:10},{e:'🔥',n:'불꽃',lv:12},{e:'🌈',n:'무지개',lv:15}];
const TITLES=[[1,'🌱 새싹 탐험가'],[3,'🎒 꼬마 모험가'],[5,'🗡️ 용감한 도전자'],[7,'🛡️ 지혜의 기사'],[9,'🔮 마법 박사'],[12,'🐉 전설의 영웅'],[15,'👑 게임 교실 마스터']];
const TIERS=[[1,'#9ccc65'],[3,'#4fc3f7'],[5,'#ba68c8'],[7,'#ffb74d'],[10,'#ff5252'],[13,'#ffd54f']];
const BADGES=[
 {id:'first',e:'👣',n:'첫 걸음',d:'게임을 하나 끝까지 완료했어요',t:s=>s.ndone>=1},
 {id:'esc1',e:'🔓',n:'첫 탈출',d:'방탈출을 하나 탈출했어요',t:s=>s.byCat.esc>=1},
 {id:'esc5',e:'🗝️',n:'탈출 전문가',d:'서로 다른 방탈출 5개 탈출',t:s=>s.byCat.esc>=5},
 {id:'esc10',e:'🏯',n:'탈출 마스터',d:'서로 다른 방탈출 10개 탈출',t:s=>s.byCat.esc>=10},
 {id:'hard1',e:'🔥',n:'어려움 도전자',d:'어려움 난이도를 하나 완료',t:s=>s.nhard>=1},
 {id:'hard5',e:'💎',n:'어려움 정복자',d:'어려움 난이도를 5개 완료',t:s=>s.nhard>=5},
 {id:'triple',e:'🥉',n:'완벽주의자',d:'한 게임을 쉬움·보통·어려움 모두 완료',t:s=>s.triple>=1},
 {id:'arc3',e:'🧮',n:'계산 왕',d:'계산 아케이드 3종을 모두 완료',t:s=>s.byCat.arc>=3},
 {id:'sim2',e:'🧑‍💼',n:'꼬마 사장님',d:'시뮬레이션 2개 완료',t:s=>s.byCat.sim>=2},
 {id:'new3',e:'🎲',n:'장르 탐험가',d:'이야기·보드게임·코딩 로봇을 모두 완료',t:s=>s.byCat.new>=3},
 {id:'quiz5',e:'🎪',n:'퀴즈 챔피언',d:'퀴즈 놀이터 5종을 모두 완료',t:s=>(s.byCat.quiz||0)>=5},
 {id:'allround',e:'🌟',n:'올라운더',d:'방탈출·아케이드·시뮬레이션·새 장르를 하나씩',t:s=>s.byCat.esc&&s.byCat.arc&&s.byCat.sim&&s.byCat.new},
 {id:'collector',e:'📚',n:'수집가',d:'게임 도감을 절반 이상 채웠어요',t:s=>s.collect>=s.total/2},
 {id:'lv5',e:'🏅',n:'레벨 5 달성',d:'레벨 5가 되었어요',t:s=>s.level>=5},
 {id:'lv10',e:'🏆',n:'레벨 10 달성',d:'레벨 10이 되었어요',t:s=>s.level>=10},
 {id:'mission7',e:'🎯',n:'미션 수행자',d:'오늘의 미션을 7번 완료',t:s=>s.missions>=7},
 {id:'praise',e:'💖',n:'칭찬 부자',d:'칭찬 포인트를 50점 넘게 받았어요',t:s=>s.earned>=50},
];
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const GAMES=(window.HUB_GAMES||[]);const GMAP={};GAMES.forEach(g=>GMAP[g.id]=g);
function profile(){return LS.get('hub-profile',null)}
function saveProfile(p){LS.set('hub-profile',p)}
function done(){const d=LS.get('class-done',{})||{};const out={};Object.entries(d).forEach(([k,v])=>{if(!v||v.how==='manual')return;const [id,lv]=k.split('@');if(!GMAP[id])return;out[id]=out[id]||{};out[id][lv||'normal']=v.at||''});return out}
function missions(){return LS.get('hub-missions',{})}
function points(){const p=LS.get('hub-points',{coupons:[],spent:[],sync:0});p.coupons=p.coupons||[];p.spent=p.spent||[];p.sync=p.sync||0;return p}
function pointBal(p){p=p||points();const got=p.coupons.reduce((a,c)=>a+c.amt,0)+p.sync;const sp=p.spent.reduce((a,s)=>a+s.cost,0);return{earned:got,spent:sp,bal:got-sp}}
const thr=L=>50*(L-1)*L;
function stats(){const D=done();let xp=0,ndone=0,nhard=0,triple=0;const byCat={esc:0,arc:0,sim:0,kid:0,new:0,quiz:0};const list=[];
  Object.entries(D).forEach(([id,lvs])=>{const g=GMAP[id];const c=CAT[g.cat]||CAT.new;byCat[g.cat]=(byCat[g.cat]||0)+1;const ks=Object.keys(lvs);ks.forEach(l=>{xp+=c.xp[LVI[l]??1];ndone++;if(l==='hard')nhard++;list.push({id,lv:l,at:lvs[l]})});if(ks.length>=3)triple++});
  const M=missions();const nm=Object.values(M).filter(m=>m&&m.done).length;xp+=nm*20;
  const pb=pointBal();xp+=Math.floor(pb.earned/2);
  let level=1;while(xp>=thr(level+1))level++;const cur=thr(level),nxt=thr(level+1);
  const s={xp,level,cur,nxt,prog:(xp-cur)/(nxt-cur),ndone,nhard,triple,byCat,missions:nm,earned:pb.earned,bal:pb.bal,collect:Object.keys(D).length,total:GAMES.filter(g=>g.cat!=='ext').length,done:D,recent:list.sort((a,b)=>(b.at||'').localeCompare(a.at||'')).slice(0,6)};
  s.badges=BADGES.filter(b=>b.t(s)).map(b=>b.id);s.titles=TITLES.filter(t=>level>=t[0]).map(t=>t[1]).concat(BADGES.filter(b=>s.badges.includes(b.id)).map(b=>b.e+' '+b.n));
  s.title=TITLES.filter(t=>level>=t[0]).pop()[1];return s}
function tier(level){return TIERS.filter(t=>level>=t[0]).pop()[1]}
function avatar(p,level,size){size=size||90;p=p||{};const a=AVATARS[p.av||0]||'🐶';const acc=(ACCS.find(x=>x.e===p.acc&&level>=x.lv)||{}).e||'';const col=tier(level);
  return `<span class="hub-av" style="--s:${size}px;--c:${col}"><span class="hub-av-e">${a}</span>${acc?`<span class="hub-av-a">${acc}</span>`:''}${level>=10?'<span class="hub-av-glow"></span>':''}<span class="hub-av-lv">Lv.${level}</span></span>`}
/* ── 코드 (설정 없이 쓰는 방식) ── */
const B36=n=>Math.max(0,Math.floor(n)).toString(36).toUpperCase();
function hsh(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h}
function chk(s){return (hsh('ourclass·'+s)%1296).toString(36).toUpperCase().padStart(2,'0')}
function resultCode(){const p=profile()||{};const s=stats();const f=[p.num||0,s.xp,s.level,s.ndone,s.byCat.esc,s.nhard,s.badges.length,s.missions,s.bal,p.av||0].map(B36).join('.');return f+'-'+chk(f)}
function decodeResult(code){code=String(code).trim().toUpperCase().replace(/\s/g,'');const [f,c]=code.split('-');if(!f||chk(f)!==c)return null;const v=f.split('.').map(x=>parseInt(x,36));if(v.length<10||v.some(isNaN))return null;
  return{num:v[0],xp:v[1],level:v[2],ndone:v[3],esc:v[4],hard:v[5],nbadges:v[6],missions:v[7],bal:v[8],av:v[9]}}
function couponCode(cls,num,amt,ser){const f=`${num}.${amt}.${B36(ser)}`;return `${num}-${amt}-${B36(ser)}-${chk((cls||'class')+f)}`}
function redeem(code){const p=profile();if(!p)return{ok:false,msg:'먼저 내 캐릭터를 만들어 주세요.'};const cfg=getCfg();code=String(code).trim().toUpperCase().replace(/\s/g,'');const m=code.split('-');if(m.length!==4)return{ok:false,msg:'쿠폰 번호가 올바르지 않아요.'};
  const [n,a,s,c]=m;if(chk((cfg.cls||'class')+`${n}.${a}.${s}`)!==c)return{ok:false,msg:'쿠폰 번호가 올바르지 않아요. 다시 확인해 주세요.'};if(+n!==+p.num)return{ok:false,msg:`이 쿠폰은 ${n}번 친구의 쿠폰이에요.`};
  const P=points();if(P.coupons.some(x=>x.code===code))return{ok:false,msg:'이미 사용한 쿠폰이에요.'};P.coupons.push({code,amt:+a,at:new Date().toISOString()});LS.set('hub-points',P);return{ok:true,amt:+a}}
/* ── 학급 연결 (구글 Apps Script, 선택) ── */
function getCfg(){const base=window.HUB_CONFIG||{};const own=LS.get('hub-cfg',{});return{url:own.url||base.url||'',cls:own.cls||base.cls||''}}
function setCfg(c){LS.set('hub-cfg',Object.assign(LS.get('hub-cfg',{}),c))}
function joinFromURL(){try{const q=new URLSearchParams(location.search).get('join');if(!q)return false;const j=JSON.parse(decodeURIComponent(escape(atob(q.replace(/-/g,'+').replace(/_/g,'/')))));if(j&&(j.u||j.c)){setCfg({url:j.u||'',cls:j.c||''});return true}}catch(e){}return false}
function joinLink(base,url,cls){const s=btoa(unescape(encodeURIComponent(JSON.stringify({u:url,c:cls})))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');return base+'?join='+s}
function summary(){const p=profile()||{};const s=stats();const P=points();return{name:p.name||'',num:+p.num||0,av:p.av||0,acc:p.acc||'',title:p.title||s.title,xp:s.xp,level:s.level,ndone:s.ndone,esc:s.byCat.esc,hard:s.nhard,badges:s.badges,missions:s.missions,bal:s.bal,spent:P.spent.slice(-30),collect:s.collect,total:s.total,recent:s.recent.map(r=>r.id+'@'+r.lv),grade:window.HUB_GRADE,ts:Date.now()}}
async function push(){const c=getCfg();const p=profile();if(!c.url||!p)return{ok:false,off:true};try{const r=await fetch(c.url,{method:'POST',body:JSON.stringify({a:'push',c:c.cls||'class',n:+p.num,d:summary()})});return await r.json()}catch(e){return{ok:false,err:String(e)}}}
async function pull(){const c=getCfg();if(!c.url)return null;try{const r=await fetch(c.url+(c.url.includes('?')?'&':'?')+'a=pull&c='+encodeURIComponent(c.cls||'class')+'&t='+Date.now());const j=await r.json();
  const p=profile();if(p&&j&&j.grants){const P=points();P.sync=+(j.grants[String(+p.num)]||0);LS.set('hub-points',P)}if(j&&j.cfg)LS.set('hub-classcfg',j.cfg);return j}catch(e){return null}}
async function post(body){const c=getCfg();if(!c.url)return{ok:false,off:true};try{const r=await fetch(c.url,{method:'POST',body:JSON.stringify(Object.assign({c:c.cls||'class'},body))});return await r.json()}catch(e){return{ok:false,err:String(e)}}}
/* ── 학급 설정 기본값 ── */
const DEF_MISSIONS=['친구 한 명을 진심으로 칭찬하기 💬','오늘 배운 것을 한 문장으로 말하기 📝','교실 바닥 쓰레기 3개 줍기 🧹','물 한 컵 마시고 스트레칭 1분 🧘','모르는 친구 도와주기 🤝','책 10쪽 읽기 📖','선생님께 질문 하나 하기 🙋','가족에게 고맙다고 말하기 💌','신발 정리하기 👟','오늘 기분을 그림으로 그리기 🎨'];
const DEF_SHOP=[{id:'s1',e:'🎵',n:'쉬는 시간 노래 신청',cost:20},{id:'s2',e:'💺',n:'자리 바꾸기 1회',cost:30},{id:'s3',e:'🍱',n:'급식 먼저 먹기',cost:40},{id:'s4',e:'📸',n:'선생님과 기념사진',cost:50},{id:'s5',e:'🎧',n:'오늘의 DJ',cost:30},{id:'s6',e:'📝',n:'숙제 1회 면제',cost:80}];
const DEF_QUEST={e:'🐉',n:'게으름 드래곤',goal:50,metric:'ndone',msg:'반 친구들이 모두 힘을 합쳐 게임 50개를 완료하면 드래곤을 물리칠 수 있어요!'};
function classCfg(){const c=LS.get('hub-classcfg',null)||{};return{missions:c.missions&&c.missions.length?c.missions:DEF_MISSIONS,shop:c.shop&&c.shop.length?c.shop:DEF_SHOP,quest:c.quest||DEF_QUEST,qprog:c.qprog,notice:c.notice||''}}
/* ── 화면 조각 ── */
const CSS=`.hub-av{position:relative;display:inline-flex;align-items:center;justify-content:center;width:var(--s);height:var(--s);border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3,#0003);border:calc(var(--s)*.06) solid var(--c);box-shadow:0 0 calc(var(--s)*.2) color-mix(in srgb,var(--c) 60%,transparent);flex:none}
.hub-av-e{font-size:calc(var(--s)*.6);line-height:1}.hub-av-a{position:absolute;top:calc(var(--s)*-.28);left:50%;transform:translateX(-50%) rotate(-8deg);font-size:calc(var(--s)*.38)}
.hub-av-lv{position:absolute;bottom:calc(var(--s)*-.14);left:50%;transform:translateX(-50%);background:var(--c);color:#14122a;font-family:Jua,sans-serif;font-size:max(11px,calc(var(--s)*.16));border-radius:999px;padding:0 .5em;white-space:nowrap}
.hub-av-glow{position:absolute;inset:-12%;border-radius:50%;border:3px dashed #ffd54f;animation:hubspin 8s linear infinite}@keyframes hubspin{to{transform:rotate(360deg)}}
.hub-bar{height:12px;background:#0006;border-radius:999px;overflow:hidden;border:1px solid #ffffff22}.hub-bar i{display:block;height:100%;background:linear-gradient(90deg,#ffd166,#ff8a5c);transition:width .6s}
.hub-card{display:flex;gap:16px;align-items:center;background:#ffffff10;border:2px solid #ffffff22;border-radius:22px;padding:14px 18px;margin:12px auto 18px;max-width:760px;text-align:left}
.hub-card .info{flex:1;min-width:0}.hub-card b.nm{font-size:22px}.hub-card .tt{opacity:.85;font-size:15px}.hub-card .btns{display:flex;flex-direction:column;gap:6px}
.hub-card a{text-decoration:none;color:inherit;background:#ffffff18;border:1px solid #ffffff33;border-radius:12px;padding:7px 12px;font-size:15px;white-space:nowrap;text-align:center}
.hub-lvup{position:fixed;inset:0;z-index:999;background:#000b;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;font-family:Jua,sans-serif;animation:hubfade .4s}
.hub-lvup .bx{background:#22264a;border:3px solid #ffd54f;border-radius:26px;padding:26px 34px;max-width:420px}.hub-lvup h2{font-size:36px;margin:10px 0;color:#ffd54f}@keyframes hubfade{from{opacity:0}}
@media(max-width:560px){.hub-card{flex-wrap:wrap}.hub-card .btns{flex-direction:row;width:100%}.hub-card .btns a{flex:1}}`;
function injectCSS(){if(document.getElementById('hubcss'))return;const s=document.createElement('style');s.id='hubcss';s.textContent=CSS;document.head.appendChild(s)}
function homeCard(el){injectCSS();const p=profile();const s=stats();
  if(!p){el.innerHTML=`<div class="hub-card"><span class="hub-av" style="--s:72px;--c:#9ccc65"><span class="hub-av-e">❔</span></span><div class="info"><b class="nm">나만의 캐릭터를 만들어 보세요!</b><div class="tt">게임을 깰 때마다 경험치가 쌓이고, 레벨업·배지·칭호를 얻어요.</div></div><div class="btns"><a href="me.html">✨ 캐릭터 만들기</a><a href="class.html">🏫 우리 반</a></div></div>`;return}
  el.innerHTML=`<div class="hub-card">${avatar(p,s.level,78)}<div class="info"><b class="nm">${esc(p.name)}</b> <span class="tt">${esc(p.title||s.title)}</span><div style="margin:6px 0 4px;font-size:14px">⭐ ${s.xp.toLocaleString()} XP · 다음 레벨까지 ${(s.nxt-s.xp).toLocaleString()} XP · 🏅 배지 ${s.badges.length} · 💖 ${s.bal}점</div><div class="hub-bar"><i style="width:${Math.round(s.prog*100)}%"></i></div></div><div class="btns"><a href="me.html">🧑‍🚀 내 캐릭터</a><a href="class.html">🏫 우리 반</a></div></div>`;
  const last=LS.get('hub-seen',{level:1,badges:[]});const nb=s.badges.filter(b=>!last.badges.includes(b));
  if(s.level>last.level||nb.length){const box=document.createElement('div');box.className='hub-lvup';box.innerHTML=`<div class="bx">${avatar(p,s.level,110)}<h2>${s.level>last.level?`🎉 레벨 업! Lv.${s.level}`:'🏅 새 배지!'}</h2>${s.level>last.level?`<div>${s.title}</div>`:''}${nb.length?`<div style="margin-top:10px;font-size:20px">${nb.map(id=>{const b=BADGES.find(x=>x.id===id);return b.e+' '+b.n}).join('<br>')}</div>`:''}<p style="opacity:.7">화면을 누르면 닫혀요</p></div>`;box.onclick=()=>box.remove();document.body.appendChild(box)}
  LS.set('hub-seen',{level:s.level,badges:s.badges});push()}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c])}
window.HUB={LS,CAT,AVATARS,ACCS,TITLES,BADGES,GAMES,GMAP,today,profile,saveProfile,done,stats,avatar,tier,missions,points,pointBal,resultCode,decodeResult,couponCode,redeem,getCfg,setCfg,joinFromURL,joinLink,summary,push,pull,post,classCfg,DEF_MISSIONS,DEF_SHOP,DEF_QUEST,homeCard,injectCSS,esc,thr,chk};
})();
