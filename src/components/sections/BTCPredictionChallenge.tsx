"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { unlockAchievement } from "@/lib/achievements";

function playTone(f: number, d: number, t: OscillatorType = "sine", v = 0.1) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = f; o.type = t;
    g.gain.setValueAtTime(v, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d);
    o.start(); o.stop(ctx.currentTime + d); setTimeout(() => ctx.close(), d * 1200);
  } catch { /* noop */ }
}
function playUp()  { [440,554,659].forEach((f,i)=>setTimeout(()=>playTone(f,.15,"sine",.1),i*80)); }
function playDown(){ [440,349,262].forEach((f,i)=>setTimeout(()=>playTone(f,.15,"sawtooth",.08),i*80)); }
function playWin() { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,.18,"sine",.12),i*90)); }
function playLose(){ [300,220].forEach((f,i)=>setTimeout(()=>playTone(f,.2,"sawtooth",.08),i*110)); }

function confettiBurst(x: number, y: number) {
  const cv = document.createElement("canvas");
  cv.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none";
  document.body.appendChild(cv); cv.width = window.innerWidth; cv.height = window.innerHeight;
  const ctx = cv.getContext("2d")!;
  const C = ["#f0b90b","#10b981","#3b82f6","#8b5cf6","#ef4444","#fff","#facc15"];
  const ps = Array.from({length:150},()=>({ x, y, vx:(Math.random()-.5)*22, vy:-(Math.random()*18+4), c:C[~~(Math.random()*C.length)], w:Math.random()*10+4, h:Math.random()*5+3, r:Math.random()*Math.PI*2, rv:(Math.random()-.5)*.35, l:1 }));
  const draw=()=>{ ctx.clearRect(0,0,cv.width,cv.height); let a=false; ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.65;p.vx*=.97;p.l-=.013;p.r+=p.rv; if(p.l>0){a=true;ctx.save();ctx.globalAlpha=p.l;ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}}); if(a)requestAnimationFrame(draw); else document.body.removeChild(cv); };
  requestAnimationFrame(draw);
}

interface Candle { o: number; h: number; l: number; c: number; v: number; }
type Choice = "UP" | "DOWN";
interface Round { choice: Choice; aiChoice: Choice; aiConf: number; actual: Choice; pct: number; won: boolean; }
interface GS { candles: Candle[]; startIdx: number; hScore: number; aiScore: number; log: Round[]; usedIdxs: number[]; }

const SHOW_BEFORE = 14;
const SHOW_AFTER  = 6;
const ROUNDS      = 5;
const CANDLE_MS   = 2000; // 2s per candle = live feel

function fmt(n: number) { return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g," "); }

async function loadCandles(interval = "1m"): Promise<Candle[]> {
  try {
    const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=100`, { cache:"no-store", signal:AbortSignal.timeout(4000) });
    if (!r.ok) throw new Error();
    const d: unknown[][] = await r.json();
    return d.map(k=>({ o:+String(k[1]), h:+String(k[2]), l:+String(k[3]), c:+String(k[4]), v:+String(k[5]) }));
  } catch {
    let p=59400;
    return Array.from({length:100},()=>{ const o=p,ch=(Math.random()-.47)*220,c=Math.max(55000,o+ch); p=c; return {o,h:Math.max(o,c)+Math.random()*70,l:Math.min(o,c)-Math.random()*70,c,v:20+Math.random()*80}; });
  }
}

function aiDecide(candles: Candle[], idx: number): { choice: Choice; conf: number; lines: string[] } {
  if (idx<6) return {choice:"UP",conf:55,lines:["Scanning RSI...","Reading momentum...","Analyzing volume...","Computing signals...","Prediction locked."]};
  const slice=candles.slice(Math.max(0,idx-13),idx+1), closes=slice.map(c=>c.c);
  let g=0,l=0;
  for(let i=1;i<closes.length;i++){const d=closes[i]-closes[i-1];if(d>0)g+=d;else l-=d;}
  const n=closes.length-1||1, rsi=l===0?100:100-100/(1+(g/n)/(l/n));
  const mom=candles[idx].c-candles[Math.max(0,idx-4)].c;
  const vt=(slice.slice(-3).reduce((a,c)=>a+c.v,0)/3)/(slice.reduce((a,c)=>a+c.v,0)/slice.length||1);
  let b=0,br=0;
  if(rsi<40)b+=2; else if(rsi<48)b+=1; if(rsi>60)br+=2; else if(rsi>52)br+=1;
  if(mom>200)b+=2; else if(mom>50)b+=1; if(mom<-200)br+=2; else if(mom<-50)br+=1;
  if(vt>1.3&&mom>0)b+=1; if(vt>1.3&&mom<0)br+=1;
  const choice:Choice=b>=br?"UP":"DOWN", conf=Math.min(88,52+Math.abs(b-br)*10);
  return {choice,conf,lines:[
    `RSI(14): ${rsi.toFixed(1)} → ${rsi<40?"Oversold ↑":rsi>60?"Overbought ↓":"Neutre →"}`,
    `Momentum(5): ${mom>=0?"+":""}${mom.toFixed(0)} USDT`,
    `Volume: ${((vt-1)*100).toFixed(0)}% vs moyenne`,
    `Confluence: ${b} bullish · ${br} bearish`,
    `Prediction locked: ${choice==="UP"?"↑ UP":"↓ DOWN"} (${conf}%)`,
  ]};
}

function pickStart(candles: Candle[], used: number[]): number {
  const pool:number[]=[];
  for(let i=SHOW_BEFORE+2;i<candles.length-SHOW_AFTER-3;i++) if(!used.includes(i)) pool.push(i);
  return pool.length?pool[~~(Math.random()*pool.length)]:SHOW_BEFORE+5;
}

// ── Live Chart — DOM-direct, zero React re-renders ────────────────────────────
function LiveChart({ candles, startIdx, progress, decisionProgress }: {
  candles: Candle[]; startIdx: number; progress: number; decisionProgress: number | null;
}) {
  const clipRef = useRef<SVGRectElement>(null);
  const dotXRef = useRef<SVGCircleElement>(null);
  const TOTAL = SHOW_BEFORE + SHOW_AFTER;
  const W=700,H=158,VH=22,ML=52,MR=8,MT=6,MB=2;
  const IW=W-ML-MR, IH=H-MT-MB-VH-4;

  const first = startIdx - SHOW_BEFORE;
  const allC = candles.slice(Math.max(0,first), first+TOTAL+2);
  const visC = allC.slice(0, TOTAL);
  if (!visC.length) return null;

  const lo=Math.min(...allC.map(c=>c.l))*.9996, hi=Math.max(...allC.map(c=>c.h))*1.0004, rng=hi-lo||1;
  const px=(i:number)=>ML+((i+.5)/TOTAL)*IW;
  const py=(v:number)=>MT+IH-((v-lo)/rng)*IH;
  const cw=Math.max(3,(IW/TOTAL)*.48);

  // Full bezier path pre-drawn
  let linePts=`M${px(0)},${py(visC[0].c)}`;
  for(let i=1;i<visC.length;i++){const cpx=(px(i-1)+px(i))/2; linePts+=` C${cpx},${py(visC[i-1].c)} ${cpx},${py(visC[i].c)} ${px(i)},${py(visC[i].c)}`;}

  const ticks=[.25,.5,.75].map(r=>lo+r*rng);
  const up=visC[~~Math.min(progress,TOTAL-1)]?.c>=(visC[0]?.c||0);
  const decW=decisionProgress!==null?Math.min(IW+10,(decisionProgress/TOTAL)*IW):null;

  // Update clip + dot directly via DOM (60fps, no React overhead)
  useEffect(()=>{
    const clipW=Math.min(IW+10,(progress/TOTAL)*IW);
    clipRef.current?.setAttribute("width", String(clipW));

    // Dot position: interpolate between candles
    const floor=Math.min(~~progress, visC.length-2);
    const sub=progress-floor;
    const from=visC[floor]?.c||0, to=visC[floor+1]?.c||from;
    const interpY=py(from+sub*(to-from));
    const interpX=px(floor)+sub*(px(floor+1)-px(floor));
    dotXRef.current?.setAttribute("cx", String(interpX));
    dotXRef.current?.setAttribute("cy", String(interpY));
  });

  const lastVisible = visC[Math.min(~~progress, visC.length-1)];

  return (
    <svg viewBox={`0 0 ${W} ${H+VH}`} className="w-full" style={{height:185}} preserveAspectRatio="none">
      <defs>
        <filter id="cglive"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="calive" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up?"rgba(240,185,11,0.18)":"rgba(239,68,68,0.14)"}/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>
        <clipPath id="liveClip"><rect ref={clipRef} x={ML} y={0} width={0} height={H+VH}/></clipPath>
      </defs>

      {ticks.map((v,i)=>(
        <g key={i}>
          <line x1={ML} y1={py(v)} x2={W-MR} y2={py(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8"/>
          <text x={ML-3} y={py(v)+3} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize="7.5" fontFamily="monospace">{(v/1000).toFixed(1)}k</text>
        </g>
      ))}

      {visC.map((c,i)=>{
        const maxV=Math.max(...visC.map(x=>x.v))||1, vh=(c.v/maxV)*VH;
        return <rect key={`v${i}`} x={px(i)-cw/2} y={H-MB-vh} width={cw} height={vh} fill={c.c>=c.o?"rgba(240,185,11,0.2)":"rgba(239,68,68,0.16)"} rx="0.3"/>;
      })}

      {/* Decision marker */}
      {decW!==null&&(
        <>
          <line x1={ML+decW} y1={MT} x2={ML+decW} y2={H-MB-VH} stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeDasharray="3,2"/>
          <rect x={ML+decW-16} y={MT-1} width={32} height={11} rx="2" fill="rgba(255,255,255,0.08)"/>
          <text x={ML+decW} y={MT+7} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="6.5" fontFamily="monospace">BET</text>
        </>
      )}

      {/* Clipped: fill + line */}
      <g clipPath="url(#liveClip)">
        <path d={linePts+` L${px(visC.length-1)},${H-MB-VH} L${px(0)},${H-MB-VH} Z`} fill="url(#calive)"/>
        <path d={linePts} fill="none" stroke="#f0b90b" strokeWidth="2.3" filter="url(#cglive)" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Live pulsing dot */}
      <circle ref={dotXRef} cx={0} cy={0} r="4.5" fill="#f0b90b" filter="url(#cglive)">
        <animate attributeName="r" values="4.5;6.5;4.5" dur="0.9s" repeatCount="indefinite"/>
      </circle>

      {/* Current price label */}
      {lastVisible&&(
        <>
          <line x1={ML} y1={py(lastVisible.c)} x2={W-MR} y2={py(lastVisible.c)} stroke="rgba(240,185,11,0.3)" strokeWidth="0.7" strokeDasharray="3,2"/>
          <rect x={W-MR-52} y={py(lastVisible.c)-7} width={54} height={14} rx="2.5" fill="rgba(240,185,11,0.14)" stroke="rgba(240,185,11,0.45)" strokeWidth="0.5"/>
          <text x={W-MR-25} y={py(lastVisible.c)+3.5} textAnchor="middle" fill="#f0b90b" fontSize="7.5" fontFamily="monospace" fontWeight="bold">${fmt(lastVisible.c)}</text>
        </>
      )}
    </svg>
  );
}

function Timer({ seconds }: { seconds: number }) {
  const m=Math.floor(seconds/60).toString().padStart(2,"0"), s=(seconds%60).toString().padStart(2,"0");
  const c=seconds>90?"#10b981":seconds>45?"#f0b90b":"#ef4444";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"baseline",gap:3}}>
        <span style={{fontSize:28,fontWeight:900,fontFamily:"monospace",color:c,lineHeight:1}}>{m}</span>
        <span style={{fontSize:11,fontFamily:"monospace",color:"rgba(255,255,255,0.3)"}}>MIN</span>
        <span style={{fontSize:28,fontWeight:900,fontFamily:"monospace",color:c,lineHeight:1,marginLeft:4}}>{s}</span>
        <span style={{fontSize:11,fontFamily:"monospace",color:"rgba(255,255,255,0.3)"}}>SECS</span>
      </div>
      <div style={{width:60,height:2.5,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden",marginTop:3}}>
        <div style={{height:"100%",width:`${Math.min(100,(1-seconds/240)*100)}%`,background:c,transition:"width 1s linear",borderRadius:2}}/>
      </div>
    </div>
  );
}

type Phase = "intro"|"loading"|"live"|"decided"|"result"|"final";
const INIT_GS: GS = {candles:[],startIdx:0,hScore:0,aiScore:0,log:[],usedIdxs:[]};

export default function BTCPredictionChallenge() {
  const [phase, setPhase]         = useState<Phase>("intro");
  const [gs, setGs]               = useState<GS>(INIT_GS);
  const [progress, setProgress]   = useState(0);
  const [decisionProg, setDecisionProg] = useState<number|null>(null);
  const [hChoice, setHChoice]     = useState<Choice|null>(null);
  const [aiResult, setAiResult]   = useState<ReturnType<typeof aiDecide>|null>(null);
  const [timer, setTimer]         = useState(240);
  const [aiLines, setAiLines]     = useState<string[]>([]);
  const [aiStep, setAiStep]       = useState(0);
  const [round, setRound]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [timeframe, setTimeframe] = useState("1m");
  const [livePrice, setLivePrice] = useState(0);

  const rafRef   = useRef<number>(0);
  const startTs  = useRef<number>(0);
  const phaseRef = useRef(phase);
  const gsRef    = useRef(gs);
  phaseRef.current = phase;
  gsRef.current = gs;

  const TOTAL = SHOW_BEFORE + SHOW_AFTER;

  const startLoop = useCallback((fromProg = 0, maxProg = TOTAL) => {
    cancelAnimationFrame(rafRef.current);
    startTs.current = 0;
    const progAtStart = fromProg;
    const step = (ts: number) => {
      if (!startTs.current) startTs.current = ts;
      const elapsed = ts - startTs.current;
      const newProg = progAtStart + elapsed / CANDLE_MS;
      const clamped = Math.min(newProg, maxProg);
      setProgress(clamped);
      // Update live price via interpolation
      const g = gsRef.current;
      const base = g.startIdx - SHOW_BEFORE;
      const idx = base + Math.floor(clamped);
      const sub = clamped - Math.floor(clamped);
      const cur = g.candles[idx], nxt = g.candles[idx+1];
      if (cur && nxt) setLivePrice(cur.c + sub*(nxt.c-cur.c));
      else if (cur) setLivePrice(cur.c);
      if (clamped < maxProg) {
        rafRef.current = requestAnimationFrame(step);
      } else if (phaseRef.current === "decided") {
        // Reached end — compute result
        const gg = gsRef.current;
        const startPrice = gg.candles[gg.startIdx]?.c || 1;
        const endPrice   = gg.candles[gg.startIdx + SHOW_AFTER]?.c || startPrice;
        const pct = (endPrice - startPrice) / startPrice;
        const actual: Choice = pct >= 0 ? "UP" : "DOWN";
        const ai = aiDecide(gg.candles, gg.startIdx);
        const choice = hChoiceRef.current;
        const won = choice === actual;
        won ? (playWin(), confettiBurst(window.innerWidth/2, window.innerHeight*0.4)) : playLose();
        setGs(prev => ({
          ...prev,
          hScore: prev.hScore + (won?1:0),
          aiScore: prev.aiScore + (ai.choice===actual?1:0),
          log: [...prev.log, {choice:choice!, aiChoice:ai.choice, aiConf:ai.conf, actual, pct, won}],
        }));
        setTimeout(() => setPhase("result"), 100);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Need a ref for hChoice to avoid stale closure in RAF
  const hChoiceRef = useRef<Choice|null>(null);
  hChoiceRef.current = hChoice;

  useEffect(()=>{ if(phase!=="live") return; setTimer(240); const iv=setInterval(()=>setTimer(t=>t<=1?(clearInterval(iv),0):t-1),1000); return()=>clearInterval(iv); },[phase]);

  useEffect(()=>{
    if(phase!=="live") return;
    const h=(e:KeyboardEvent)=>{ if(e.key==="ArrowUp"||e.key==="u"||e.key==="U") decide("UP"); if(e.key==="ArrowDown"||e.key==="d"||e.key==="D") decide("DOWN"); };
    window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[phase]);

  const startGame = async (tf = timeframe) => {
    setLoading(true); cancelAnimationFrame(rafRef.current);
    const candles = await loadCandles(tf);
    const startIdx = pickStart(candles, []);
    const aiRes = aiDecide(candles, startIdx);
    setGs({candles, startIdx, hScore:0, aiScore:0, log:[], usedIdxs:[startIdx]});
    gsRef.current = {candles, startIdx, hScore:0, aiScore:0, log:[], usedIdxs:[startIdx]};
    setAiResult(aiRes); setHChoice(null); setDecisionProg(null);
    setAiLines([]); setAiStep(0); setProgress(0); setRound(0);
    setLivePrice(candles[startIdx-SHOW_BEFORE]?.c||59400);
    setLoading(false); setPhase("live");
    startLoop(0, TOTAL);
  };

  const decide = useCallback((ch: Choice) => {
    if (phaseRef.current !== "live") return;
    ch==="UP" ? playUp() : playDown();
    hChoiceRef.current = ch;
    setHChoice(ch);
    setDecisionProg(progress);
    setPhase("decided");
    if (aiResult) {
      let s=0; const iv=setInterval(()=>{ s++; setAiStep(s); setAiLines(aiResult.lines.slice(0,s)); if(s>=aiResult.lines.length)clearInterval(iv); },380);
    }
    startLoop(progress, TOTAL);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[progress, aiResult, startLoop]);

  const nextRound = async () => {
    const nr = round + 1; setRound(nr);
    if (nr >= ROUNDS) { setPhase("final"); unlockAchievement("TRADE_DONE"); return; }
    const newStart = pickStart(gs.candles, gs.usedIdxs);
    const aiRes = aiDecide(gs.candles, newStart);
    const newGs = {...gs, startIdx:newStart, usedIdxs:[...gs.usedIdxs, newStart]};
    setGs(newGs); gsRef.current = newGs;
    setAiResult(aiRes); setHChoice(null); setDecisionProg(null);
    setAiLines([]); setAiStep(0); setProgress(0);
    setLivePrice(gs.candles[newStart-SHOW_BEFORE]?.c||59400);
    setPhase("live"); startLoop(0, TOTAL);
  };

  const lastLog = gs.log[gs.log.length-1];
  const delta = gs.candles.length>0&&gs.startIdx>0 ? livePrice-(gs.candles[gs.startIdx-SHOW_BEFORE]?.c||livePrice) : 0;

  return (
    <section id="trade" className="relative py-20 px-4">
      <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 70% 50% at 50% 100%,rgba(240,185,11,0.04),transparent)"}}/>
      <div style={{maxWidth:800,margin:"0 auto",position:"relative",zIndex:1}}>

        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8}}>
            <div style={{height:1,width:36,background:"linear-gradient(90deg,transparent,rgba(240,185,11,.7))"}}/>
            <span style={{fontFamily:"monospace",fontSize:10,color:"#f0b90b",letterSpacing:4,textTransform:"uppercase"}}>Challenge Arena</span>
            <div style={{height:1,width:36,background:"linear-gradient(90deg,rgba(240,185,11,.7),transparent)"}}/>
          </div>
          <h2 style={{fontSize:"clamp(22px,4vw,38px)",fontWeight:900,color:"rgba(255,255,255,.92)",marginBottom:4}}>BTC Prediction Challenge</h2>
          <p style={{color:"rgba(255,255,255,.35)",fontSize:12,fontFamily:"monospace"}}>Courbe en direct · Décidez quand vous voulez · Comme Polymarket</p>
        </div>

        {phase==="intro"&&(
          <div style={{background:"rgba(12,12,18,.98)",border:"1px solid rgba(240,185,11,.2)",borderRadius:16,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{width:40,height:40,borderRadius:10,background:"#f0b90b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#000",flexShrink:0}}>₿</div>
              <div><div style={{fontSize:15,fontWeight:700,color:"rgba(255,255,255,.88)"}}>BTC vers le haut ou vers le bas</div><div style={{fontSize:10,color:"rgba(255,255,255,.35)",fontFamily:"monospace"}}>Binance · BTC/USDT · Live data</div></div>
              <div style={{marginLeft:"auto",display:"flex",gap:5}}>
                {(["1m","5m","15m","1h"] as const).map((tf,i)=>{ const labels=["1 min","5 min","15 min","1 h"]; const active=timeframe===tf; return <button key={tf} type="button" onClick={()=>setTimeframe(tf)} style={{cursor:"pointer",padding:"4px 9px",borderRadius:20,border:`1px solid ${active?"rgba(240,185,11,.4)":"rgba(255,255,255,.1)"}`,background:active?"rgba(240,185,11,.1)":"transparent",color:active?"#f0b90b":"rgba(255,255,255,.4)",fontSize:10,fontFamily:"monospace"}}>{labels[i]}</button>; })}
              </div>
            </div>
            <div style={{padding:"18px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[["📈","Courbe avance en direct","Elle ne s'arrête jamais — décidez pendant qu'elle bouge"],["⏱️","~4 minutes par manche","Décidez avant la fin ou la courbe révèle tout"],["🤖","Algo RSI vous affronte","RSI(14) + Momentum + Volume — données Binance"],["🏆",`${ROUNDS} manches`,"Score humain vs algorithme IA"]].map(([ic,t,d])=>(
                  <div key={t as string} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:10,padding:"11px"}}><div style={{fontSize:17,marginBottom:3}}>{ic}</div><div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.8)"}}>{t}</div><div style={{fontSize:9,color:"rgba(255,255,255,.35)",fontFamily:"monospace",marginTop:2}}>{d}</div></div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div style={{background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.25)",borderRadius:10,padding:"13px",textAlign:"center"}}><div style={{fontSize:21,fontWeight:900,color:"#10b981"}}>↑ UP</div><div style={{fontSize:10,color:"rgba(255,255,255,.4)",fontFamily:"monospace"}}>↑ ou U</div></div>
                <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"13px",textAlign:"center"}}><div style={{fontSize:21,fontWeight:900,color:"#ef4444"}}>↓ DOWN</div><div style={{fontSize:10,color:"rgba(255,255,255,.4)",fontFamily:"monospace"}}>↓ ou D</div></div>
              </div>
              <button type="button" onClick={()=>startGame()} disabled={loading} style={{cursor:"pointer",width:"100%",padding:"14px",borderRadius:10,fontWeight:900,fontSize:16,color:"#000",background:loading?"#888":"linear-gradient(135deg,#f0b90b,#f97316)",border:"none"}}>{loading?"⏳ Connexion Binance...":"▶ Lancer le challenge"}</button>
            </div>
          </div>
        )}

        {(phase==="live"||phase==="decided")&&gs.candles.length>0&&(
          <div style={{background:"rgba(10,10,15,.98)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{width:30,height:30,borderRadius:7,background:"#f0b90b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#000",flexShrink:0}}>₿</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.82)"}}>BTC/USDT — {timeframe} — {phase==="live"?"EN DIRECT ●":"RÉVÉLATION..."}</div><div style={{fontSize:9,color:"rgba(255,255,255,.3)",fontFamily:"monospace"}}>Manche {round+1}/{ROUNDS} · Vous {gs.hScore} — IA {gs.aiScore}</div></div>
              <div style={{display:"flex",gap:4}}>
                {Array.from({length:ROUNDS}).map((_,i)=>{ const h=gs.log[i],done=i<round; return <div key={i} style={{width:7,height:7,borderRadius:2,background:done?(h?.won?"#10b981":"#ef4444"):i===round?"#f0b90b":"rgba(255,255,255,.1)"}}/>; })}
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:10,padding:"10px 18px",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
              <div><div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,.3)",marginBottom:1}}>Prix de départ</div><div style={{fontSize:15,fontWeight:700,fontFamily:"monospace",color:"rgba(255,255,255,.45)"}}>${fmt(gs.candles[gs.startIdx]?.c||0)}</div></div>
              {phase==="live"?<Timer seconds={timer}/>:(
                <div style={{textAlign:"center"}}><div style={{fontSize:9,fontFamily:"monospace",color:"rgba(240,185,11,.8)",marginBottom:3}}>RÉVÉLATION</div><div style={{width:6,height:6,borderRadius:"50%",background:"#f0b90b",margin:"0 auto",animation:"btcPulse .6s infinite"}}/></div>
              )}
              <div style={{textAlign:"right"}}><div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,.3)",marginBottom:1}}>● LIVE</div><div style={{fontSize:18,fontWeight:700,fontFamily:"monospace",color:delta>=0?"#10b981":"#ef4444"}}>${fmt(livePrice)}&nbsp;<span style={{fontSize:10}}>{delta>=0?"▲":"▼"}{Math.abs(delta).toFixed(0)}</span></div></div>
            </div>

            <div style={{padding:"4px 12px 0",background:"rgba(5,5,9,.85)"}}>
              <LiveChart candles={gs.candles} startIdx={gs.startIdx} progress={Math.min(progress,TOTAL)} decisionProgress={decisionProg}/>
            </div>

            <div style={{display:"flex",gap:4,padding:"5px 12px",borderTop:"1px solid rgba(255,255,255,.04)"}}>
              {(["1m","5m","15m","1h"] as const).map((tf,i)=>{ const labels=["1 min","5 min","15 min","1 h"]; const active=timeframe===tf; return <button key={tf} type="button" style={{cursor:"default",padding:"3px 8px",borderRadius:20,border:`1px solid ${active?"rgba(240,185,11,.35)":"rgba(255,255,255,.07)"}`,background:active?"rgba(240,185,11,.08)":"transparent",color:active?"#f0b90b":"rgba(255,255,255,.28)",fontSize:9,fontFamily:"monospace"}}>{labels[i]}</button>; })}
              <span style={{marginLeft:"auto",fontFamily:"monospace",fontSize:9,color:"rgba(255,255,255,.2)",alignSelf:"center"}}>{phase==="live"?"Décidez →":"Attendez la fin..."}</span>
            </div>

            {phase==="live"&&(
              <div style={{padding:"10px 14px 14px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button type="button" onClick={()=>decide("UP")} style={{cursor:"pointer",background:"#10b981",borderRadius:10,padding:"15px 10px",border:"none",display:"flex",alignItems:"center",justifyContent:"space-between",color:"#000",fontWeight:900,fontSize:16,boxShadow:"0 4px 20px rgba(16,185,129,.3)"}}>
                  <span>↑ UP</span><div style={{textAlign:"right"}}><div style={{fontSize:17,fontWeight:900}}>35¢</div><div style={{fontSize:9,opacity:.7}}>si vous gagnez</div></div>
                </button>
                <button type="button" onClick={()=>decide("DOWN")} style={{cursor:"pointer",background:"rgba(24,24,32,.95)",borderRadius:10,padding:"15px 10px",border:"1px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"space-between",color:"rgba(255,255,255,.55)",fontWeight:700,fontSize:16}}>
                  <span>↓ DOWN</span><div style={{textAlign:"right"}}><div style={{fontSize:17,fontWeight:700}}>6¢</div><div style={{fontSize:9,opacity:.5}}>si vous gagnez</div></div>
                </button>
              </div>
            )}

            {phase==="decided"&&(
              <div style={{padding:"10px 14px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:hChoice==="UP"?"#10b981":"#ef4444"}}>Votre pari : {hChoice==="UP"?"↑ UP":"↓ DOWN"}</span>
                  <span style={{marginLeft:"auto",fontFamily:"monospace",fontSize:9,color:"rgba(255,255,255,.3)"}}>Révélation en cours...</span>
                </div>
                <div style={{background:"rgba(0,0,0,.55)",border:"1px solid rgba(139,92,246,.2)",borderRadius:10,padding:"10px 13px"}}>
                  {aiLines.map((line,i)=>(
                    <div key={i} style={{fontFamily:"monospace",fontSize:10,color:i===aiStep-1?"#00d4ff":"rgba(255,255,255,.4)",display:"flex",gap:6,marginBottom:2}}>
                      <span style={{color:"#8b5cf6"}}>›</span><span>{line}</span>
                      {i===aiStep-1&&<span style={{color:"#00d4ff",animation:"btcBlink .5s steps(1) infinite"}}>█</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {phase==="result"&&gs.candles.length>0&&(
          <div style={{background:"rgba(10,10,15,.98)",border:`1px solid ${lastLog?.won?"rgba(16,185,129,.3)":"rgba(239,68,68,.25)"}`,borderRadius:16,overflow:"hidden"}}>
            <div style={{background:"rgba(5,5,9,.9)",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"4px 12px 0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 2px 3px"}}>
                <span style={{fontSize:10,fontFamily:"monospace",color:"rgba(255,255,255,.55)",fontWeight:700}}>BTC/USDT · {timeframe}</span>
                <span style={{fontFamily:"monospace",fontSize:11,color:lastLog?.pct>=0?"#10b981":"#ef4444",fontWeight:700}}>{lastLog?.pct>=0?"▲":"▼"} {lastLog?.pct>=0?"+":""}{((lastLog?.pct||0)*100).toFixed(3)}%</span>
              </div>
              <LiveChart candles={gs.candles} startIdx={gs.startIdx} progress={TOTAL} decisionProgress={decisionProg}/>
            </div>
            <div style={{padding:"14px 18px"}}>
              <div style={{textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:40,marginBottom:5}}>{lastLog?.won?"✅":"❌"}</div>
                <div style={{fontSize:20,fontWeight:900,color:lastLog?.won?"#10b981":"#ef4444"}}>{lastLog?.won?"YOU WERE RIGHT !":"YOU WERE WRONG"}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div style={{background:"rgba(255,255,255,.04)",border:`1px solid ${lastLog?.won?"rgba(16,185,129,.2)":"rgba(239,68,68,.18)"}`,borderRadius:10,padding:"11px",textAlign:"center"}}>
                  <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,.3)",marginBottom:3}}>VOUS</div>
                  <div style={{fontSize:18,fontWeight:900,color:lastLog?.won?"#10b981":"#ef4444"}}>{hChoice==="UP"?"↑ UP":"↓ DOWN"}</div>
                  <div style={{fontSize:10,color:lastLog?.won?"#10b981":"#ef4444",marginTop:2}}>{lastLog?.won?"✓ Correct":"✗ Incorrect"}</div>
                </div>
                <div style={{background:"rgba(255,255,255,.04)",border:`1px solid ${lastLog?.aiChoice===lastLog?.actual?"rgba(0,212,255,.2)":"rgba(255,255,255,.08)"}`,borderRadius:10,padding:"11px",textAlign:"center"}}>
                  <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,.3)",marginBottom:3}}>YOANN AI · {lastLog?.aiConf}%</div>
                  <div style={{fontSize:18,fontWeight:900,color:"#00d4ff"}}>{lastLog?.aiChoice==="UP"?"↑ UP":"↓ DOWN"}</div>
                  <div style={{fontSize:10,color:lastLog?.aiChoice===lastLog?.actual?"#10b981":"#ef4444",marginTop:2}}>{lastLog?.aiChoice===lastLog?.actual?"✓ Correct":"✗ Incorrect"}</div>
                </div>
              </div>
              <button type="button" onClick={nextRound} style={{cursor:"pointer",width:"100%",padding:"13px",borderRadius:10,fontWeight:900,fontSize:15,color:"#000",background:"linear-gradient(135deg,#f0b90b,#f97316)",border:"none"}}>{round+1>=ROUNDS?"Voir le résultat final →":`Manche ${round+2}/${ROUNDS} →`}</button>
            </div>
          </div>
        )}

        {phase==="final"&&(()=>{
          const hAcc=Math.round(gs.hScore/ROUNDS*100), aiAcc=Math.round(gs.aiScore/ROUNDS*100), won2=gs.hScore>gs.aiScore;
          return (
            <div style={{background:"rgba(10,10,15,.98)",border:"1px solid rgba(255,255,255,.09)",borderRadius:16,overflow:"hidden"}}>
              <div style={{padding:"26px 22px",textAlign:"center",background:won2?"linear-gradient(135deg,rgba(16,185,129,.09),rgba(0,212,255,.04))":"linear-gradient(135deg,rgba(239,68,68,.07),rgba(251,146,60,.04))"}}>
                <div style={{fontSize:52,marginBottom:8}}>{won2?"🏆":gs.hScore===gs.aiScore?"🤝":"🤖"}</div>
                <div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,.3)",letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>CHALLENGE COMPLETE</div>
                <h3 style={{fontSize:22,fontWeight:900,color:"rgba(255,255,255,.92)",marginBottom:12}}>{won2?"Vous battez l'algorithme !":gs.hScore===gs.aiScore?"Match nul !":"L'IA vous domine"}</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,maxWidth:230,margin:"0 auto"}}>
                  <div style={{background:"rgba(255,255,255,.06)",borderRadius:10,padding:"10px"}}><div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,.3)",marginBottom:2}}>HUMAIN</div><div style={{fontSize:28,fontWeight:900,color:won2?"#10b981":"#ef4444"}}>{hAcc}%</div><div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,.3)"}}>{gs.hScore}/{ROUNDS}</div></div>
                  <div style={{background:"rgba(255,255,255,.06)",borderRadius:10,padding:"10px"}}><div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,.3)",marginBottom:2}}>YOANN AI</div><div style={{fontSize:28,fontWeight:900,color:"#00d4ff"}}>{aiAcc}%</div><div style={{fontSize:9,fontFamily:"monospace",color:"rgba(255,255,255,.3)"}}>{gs.aiScore}/{ROUNDS}</div></div>
                </div>
              </div>
              <div style={{padding:"14px 18px"}}>
                {gs.log.map((r,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"20px 80px 1fr 68px 52px",gap:6,alignItems:"center",padding:"4px 8px",marginBottom:3,borderRadius:7,background:r.won?"rgba(16,185,129,.05)":"rgba(239,68,68,.04)",border:`1px solid ${r.won?"rgba(16,185,129,.1)":"rgba(239,68,68,.09)"}`}}>
                    <span style={{fontFamily:"monospace",fontSize:9,color:"rgba(255,255,255,.25)"}}>#{i+1}</span>
                    <span style={{fontFamily:"monospace",fontSize:10,fontWeight:700,color:r.won?"#10b981":"#ef4444"}}>{r.won?"✓":"✗"} {r.choice}</span>
                    <div style={{height:2,background:"rgba(255,255,255,.06)",borderRadius:1,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,Math.abs(r.pct)*5000)}%`,background:r.pct>=0?"#10b981":"#ef4444"}}/></div>
                    <span style={{fontFamily:"monospace",fontSize:9,color:r.pct>=0?"#10b981":"#ef4444",textAlign:"right"}}>{r.pct>=0?"+":""}{(r.pct*100).toFixed(3)}%</span>
                    <span style={{fontFamily:"monospace",fontSize:9,color:"rgba(0,212,255,.55)",textAlign:"right"}}>IA:{r.aiChoice==="UP"?"↑":"↓"}{r.aiChoice===r.actual?"✓":"✗"}</span>
                  </div>
                ))}
                <div style={{display:"flex",gap:10,marginTop:12}}>
                  <button type="button" onClick={()=>startGame()} style={{cursor:"pointer",flex:1,padding:"12px",borderRadius:10,border:"1px solid rgba(255,255,255,.14)",background:"transparent",color:"rgba(255,255,255,.65)",fontWeight:700,fontSize:13}}>🔄 Rejouer</button>
                  <button type="button" onClick={()=>document.querySelector("#contact")?.scrollIntoView({behavior:"smooth"})} style={{cursor:"pointer",flex:1,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#f0b90b,#f97316)",color:"#000",fontWeight:900,fontSize:13}}>📩 Contacter Yoann</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      <style>{`@keyframes btcBlink{0%,100%{opacity:1}50%{opacity:0}}@keyframes btcPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.75)}}`}</style>
    </section>
  );
}
