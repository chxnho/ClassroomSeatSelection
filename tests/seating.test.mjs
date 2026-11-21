import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const logic=/<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/.exec(html)[1];
const localization=/<script id="seat-language">([\s\S]*?)<\/script>/.exec(html)[1];
function application({lang="ko",male=4,female=4,mode='mf',cols=3,seed=1,reduced=false,constraints=[]}={}){
 let random=seed;const math=Object.create(Math);math.random=()=>((random=(Math.imul(random,1664525)+1013904223)>>>0)/4294967296);
 const stored=new Map(),timers=[];class DCLogic{constructor(){this.props={cheerOnSuccess:false};}setState(v){Object.assign(this.state,typeof v==='function'?v(this.state):v);}forceUpdate(){}}
 const document=Object.assign(new EventTarget(),{documentElement:{},querySelector:()=>null});
 const window={};
 vm.runInNewContext(localization,{window,document,location:{search:'?lang='+lang},URLSearchParams,Event});
 const Component=vm.runInNewContext(logic+'\nComponent',{window,document,DCLogic,Math:math,React:{createRef:()=>({current:null})},localStorage:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)},matchMedia:()=>({matches:reduced}),setInterval:(fn,ms)=>(timers.push({fn,ms}),timers.length),clearInterval(){},Audio:class{play(){return Promise.resolve();}}},{timeout:1000});
 const app=new Component();Object.assign(app.state,{students:[...Array.from({length:male},(_,i)=>({name:'M'+i,gender:'남'})),...Array.from({length:female},(_,i)=>({name:'F'+i,gender:'여'}))],mode,deskCols:cols,constraints});
 return {app,stored,timers,language:window.SeatLanguage,document};
}
const plain=x=>JSON.parse(JSON.stringify(x));
test('language changes preserve the roster, rules, drawn seats and editable values',()=>{
 const {app,language,document}=application({lang:'en'});
 app.componentDidMount();
 app.state.input='칠판 M\nBoard F';
 app.applyRoster();
 app.state.rosterName='Class {n}';
 app.state.constraints=[['칠판','Board','같이']];
 app.draw();
 const before=plain(app.state);
 for(const locale of language.locales){
  language.select(locale);
  const view=app.renderVals();
  assert.equal(document.documentElement.lang,locale);
  assert.ok(Object.values(language.words).every(text=>typeof text==='string'&&text.trim()));
  assert.equal(view.note,language.text('success',{n:app.state.lastTries}));
  assert.equal(view.constraintItems[0].op,language.words.together);
  assert.deepEqual(plain(app.state),before);
  const files=[];app.download=(name,text)=>files.push({name,text});
  app.exportRoster();app.exportConstraints();app.saveText();
  assert.deepEqual(JSON.parse(files[0].text),[['칠판','남'],['Board','여']]);
  assert.deepEqual(JSON.parse(files[1].text),[['칠판','Board','같이']]);
  assert.equal(files[2].name,language.text('chartFile',{name:'Class {n}'})+'.txt');
  assert.equal(files[2].text.split('\n')[0],language.words.board);
  assert.equal(files[2].text.split('\n').at(-1),language.words.back);
 }
 language.select('en-US');assert.equal(language.language,'id');
 assert.equal(application({lang:'unsupported'}).language.language,'ko');
});
test('all pairing modes and classroom widths preserve every synthetic student exactly once',()=>{
 for(const mode of ['mf','same','any'])for(const cols of [2,3,4])for(const [male,female]of [[4,4],[5,2],[0,7],[7,0],[1,1]])for(let seed=1;seed<=4;seed++){
  const {app}=application({mode,cols,male,female,seed}),seats=app.attempt(mode),plan=app.computePlan(mode);
  assert.deepEqual(Array.from(seats.flat(),s=>s.name).sort(),Array.from(app.state.students,s=>s.name).sort());assert.equal(seats.length,plan.rows*cols);assert.ok(seats.every(d=>d.length<=2));
  if(mode==='same')assert.ok(seats.every(d=>new Set(d.map(s=>s.gender)).size<=1));
  if(mode==='mf')assert.equal(seats.filter(d=>d.length===2&&d[0].gender!==d[1].gender).length,Math.min(male,female));
 }
});
test('draw, reshuffle and impossible constraints keep results and disclose unmet conditions',()=>{
 const {app}=application({mode:'any',constraints:[['M0','F0','같이'],['M0','F0']]});app.draw();assert.ok(app.state.lastViolations>0);assert.equal(app.state.noteKind,'error');assert.match(app.renderVals().note,/후보/);assert.doesNotMatch(app.renderVals().note,/최선|만족시킬 수 없어/);
 const names=Array.from(app.state.seats.flat(),s=>s.name).sort();app.draw();assert.deepEqual(Array.from(app.state.seats.flat(),s=>s.name).sort(),names);
});
test('roster and constraints round-trip without changing storage keys or file formats',()=>{
 const {app,stored}=application();app.componentDidMount();const students=plain(app.state.students);assert.deepEqual(plain(app.parseRoster(app.rosterToText(students))),students);
 app.state.rosterName='synthetic';app.state.constraints=[['M0','F0','같이']];app.saveSlot();const slot=JSON.parse(stored.get('jaripick.slots.v1')).synthetic;assert.deepEqual(Object.keys(slot).sort(),['constraints','students']);assert.deepEqual(slot.students,students);
 const files=[];app.download=(name,text)=>files.push({name,text});app.exportRoster();assert.deepEqual(plain(app.parseRoster(files.at(-1).text)),students);app.exportConstraints();assert.deepEqual(JSON.parse(files.at(-1).text),[['M0','F0','같이']]);app.draw();app.saveText();assert.match(files.at(-1).text,/칠판/);assert.ok(stored.has('jaripick.class.prevpairs.v1'));
});
test('reduced motion reveals immediately; normal reveal is bounded to 1.2 seconds',()=>{
 const reduced=application({reduced:true});reduced.app.draw();assert.equal(reduced.app.state.reveal,reduced.app.state.rows);assert.equal(reduced.timers.length,0);
 const normal=application({male:60,female:60,cols:2});normal.app.draw();assert.ok(normal.timers[0].ms*normal.app.state.rows<=1200.001);for(let i=0;i<normal.app.state.rows;i++)normal.timers[0].fn();assert.equal(normal.app.state.reveal,normal.app.state.rows);
});
test('formal title, accessible feedback and import/export controls remain available',()=>{
 assert.match(html,/<title>교실 자리 배치 시스템 · 배움길<\/title>/);assert.match(html,/role="status" aria-live="polite"/);
 for(const action of ['applyRoster','clearRoster','saveSlot','pickRosterFile','exportRoster','pickConstraintFile','exportConstraints','draw','saveImage','saveText'])assert.ok(html.includes('onClick="{{ '+action+' }}"'),action);
});
